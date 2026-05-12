import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/chillingan.db');
const dataDir = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function initializeDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec('PRAGMA foreign_keys = ON');

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      profileImage TEXT,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const userInfo = await db.all<{ name: string }>(`PRAGMA table_info(users)`);
  const userColumns = userInfo.map((column) => column.name);
  if (!userColumns.includes('address')) {
    await db.exec(`ALTER TABLE users ADD COLUMN address TEXT`);
  }
  if (!userColumns.includes('profileImage')) {
    await db.exec(`ALTER TABLE users ADD COLUMN profileImage TEXT`);
  }
  if (!userColumns.includes('role')) {
    await db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin'))`);
  }

  await db.exec(`
    INSERT OR IGNORE INTO users (id, email, password, name, phone, address, profileImage, role, createdAt, updatedAt)
    VALUES ('admin-0001', 'admin@chillingan.com', 'admin123', 'Chillingan Admin', '0000000000', 'Chillingan HQ', NULL, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  // Create reservations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      partySize INTEGER NOT NULL CHECK(partySize > 0),
      unitId TEXT,
      unitName TEXT,
      serviceId TEXT,
      specialRequests TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const reservationInfo = await db.all<{ name: string }>(`PRAGMA table_info(reservations)`);
  const reservationColumns = reservationInfo.map((column) => column.name);
  if (!reservationColumns.includes('unitId')) {
    await db.exec(`ALTER TABLE reservations ADD COLUMN unitId TEXT`);
  }
  if (!reservationColumns.includes('unitName')) {
    await db.exec(`ALTER TABLE reservations ADD COLUMN unitName TEXT`);
  }
  if (!reservationColumns.includes('serviceId')) {
    await db.exec(`ALTER TABLE reservations ADD COLUMN serviceId TEXT`);
  }

  // Create orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      items TEXT NOT NULL,
      totalPrice REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      rating REAL NOT NULL,
      visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN (0, 1)),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create reservation_units table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reservation_units (
      id TEXT PRIMARY KEY,
      serviceId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create walk-ins table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS walkins (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      unitId TEXT,
      unitName TEXT,
      serviceId TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      paymentAmount REAL NOT NULL,
      amountReceived REAL NOT NULL,
      changeAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      customerName TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create admin_settings table for cross-browser admin configuration
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create indices for faster queries
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reservations_userId ON reservations(userId);
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_visible ON products(visible);
    CREATE INDEX IF NOT EXISTS idx_reservation_units_serviceId ON reservation_units(serviceId);
    CREATE INDEX IF NOT EXISTS idx_reservation_units_active ON reservation_units(active);
  `);

  await seedProducts(db);
  await seedReservationUnits(db);
  await initializeAdminSettings(db);

  console.log('✓ Database initialized successfully');
  return db;
}

async function initializeAdminSettings(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const row = await db.get<{ count: number }>(`SELECT COUNT(*) AS count FROM admin_settings`);
  if (row?.count && row.count > 0) {
    return;
  }

  const defaults = [
    { key: 'maintenanceMode', value: false },
    { key: 'allowGuestCheckout', value: true },
    { key: 'emailNotifications', value: true },
    { key: 'businessHours', value: '10:00 - 22:00' },
    { key: 'defaultCurrency', value: 'PHP' },
  ];

  const insert = await db.prepare('INSERT INTO admin_settings(key, value) VALUES (?, ?)');
  for (const item of defaults) {
    await insert.run(item.key, JSON.stringify(item.value));
  }
  await insert.finalize();
}

async function seedProducts(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const row = await db.get<{ count: number }>(`SELECT COUNT(*) AS count FROM products`);
  if (row?.count && row.count > 0) {
    return;
  }

  const products = [
    {
      id: 'prod-pork-sisig',
      name: 'Pork Sisig',
      description: 'Savory pork sisig with onions, chili, and calamansi, served sizzling hot.',
      price: 125,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Pork%20Sisig.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-chicken-sisig',
      name: 'Chicken Sisig',
      description: 'Tender chicken sisig seasoned with spices and served with rice.',
      price: 125,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Chicken%20Sisig.png',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-crispy-pork-kare-kare',
      name: 'Crispy Pork Kare Kare',
      description: 'Crispy pork with peanut kare-kare sauce served with bagoong and rice.',
      price: 245,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Crispy%20Pork%20Kare%20Kare.jpg',
      rating: 4.8,
      visible: 1,
    },
    {
      id: 'prod-oxtail-kare-kare',
      name: 'Oxtail Kare Kare',
      description: 'Hearty oxtail slow-cooked in rich peanut sauce with vegetables.',
      price: 245,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Oxtail%20Kare%20Kare.jpg',
      rating: 4.8,
      visible: 1,
    },
    {
      id: 'prod-beef-lengua',
      name: 'Beef Lengua',
      description: 'Succulent beef lengua in creamy sauce, served with rice.',
      price: 265,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Beef%20Lengua.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-salisbury-steak',
      name: 'Salisbury Steak',
      description: 'Grilled beef steak topped with gravy and served with vegetables.',
      price: 209,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Salisbury%20Steak.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-boneless-fried-chicken',
      name: 'Boneless Fried Chicken',
      description: 'Golden fried chicken fillet with crispy coating and sides.',
      price: 185,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Boneless%20Fried%20Chicken.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-creamy-beef-mushroom',
      name: 'Creamy Beef Mushroom',
      description: 'Beef slices in creamy mushroom sauce, served with rice.',
      price: 255,
      category: 'Sizzling Meal',
      imageUrl: '/src/assets/Creamy%20Beef%20Mushroom.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-pork-humba',
      name: 'Pork Humba',
      description: 'Sweet and savory pork humba with garlic and banana blossoms.',
      price: 175,
      category: 'Rice Bowl Meal',
      imageUrl: '/src/assets/Pork%20HUmba.png',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-bistek-tagalog',
      name: 'Bistek Tagalog',
      description: 'Classic Filipino beef steak marinated in soy and calamansi.',
      price: 195,
      category: 'Rice Bowl Meal',
      imageUrl: '/src/assets/Bistek%20Tagalot.png',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-lumpiang-shanghai',
      name: 'Lumpiang Shanghai',
      description: 'Crispy pork spring rolls served with sweet-spicy dipping sauce.',
      price: 155,
      category: 'Appetizers',
      imageUrl: '/src/assets/Lumpiang%20Shanghai.jpg',
      rating: 4.8,
      visible: 1,
    },
    {
      id: 'prod-pork-bbq',
      name: 'Pork BBQ',
      description: 'Skewered pork barbecue grilled to charred perfection, served with rice.',
      price: 155,
      category: 'Grilled',
      imageUrl: '/src/assets/Pork%20BBQ.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-chicken-bbq',
      name: 'Chicken BBQ',
      description: 'Smoky grilled chicken barbecue with rice and dipping sauce.',
      price: 125,
      category: 'Grilled',
      imageUrl: '/src/assets/Chicken%20BBQ.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-chicken-inasal-paa',
      name: 'Chicken Inasal Paa',
      description: 'Filipino-style grilled chicken leg quarter with atsara and rice.',
      price: 145,
      category: 'Grilled',
      imageUrl: '/src/assets/Chicken%20Inasal%20Paa.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-tuna-belly',
      name: 'Tuna Belly',
      description: 'Grilled tuna belly served with rice and a tangy dipping sauce.',
      price: 185,
      category: 'Grilled',
      imageUrl: '/src/assets/Tuna%20Belly.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-tuna-panga',
      name: 'Tuna Panga',
      description: 'Grilled tuna jaw with garlic and lemon, served with rice.',
      price: 225,
      category: 'Grilled',
      imageUrl: '/src/assets/TunaPanga.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-calamansi-juice',
      name: 'Calamansi Juice',
      description: 'Refreshing calamansi juice served chilled.',
      price: 60,
      category: 'Drinks',
      imageUrl: '/src/assets/Calamansi%20Juice.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-lemon-juice',
      name: 'Lemon Juice',
      description: 'Fresh lemon juice with just the right amount of sweetness.',
      price: 75,
      category: 'Drinks',
      imageUrl: '/src/assets/Lemon%20Juice.png',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-lemon-cucumber',
      name: 'Lemon Cucumber',
      description: 'Cool lemon-cucumber drink perfect for a hot day.',
      price: 90,
      category: 'Drinks',
      imageUrl: '/src/assets/Lemon%20Cucumber.png',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-iced-tea-pitcher',
      name: 'Iced Tea Pitcher',
      description: 'Large pitcher of iced tea for sharing.',
      price: 120,
      category: 'Drinks',
      imageUrl: '/src/assets/Iced%20Tea%20Pitcher.png',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-mango-shake',
      name: 'Mango Shake',
      description: 'Creamy mango shake made with fresh mangoes.',
      price: 90,
      category: 'Shakes',
      imageUrl: '/src/assets/Mango%20Shake.webp',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-avocado-shake',
      name: 'Avocado Shake',
      description: 'Rich avocado shake with a smooth, sweet finish.',
      price: 90,
      category: 'Shakes',
      imageUrl: '/src/assets/Avocado%20Shake.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-watermelon-shake',
      name: 'Watermelon Shake',
      description: 'Light watermelon shake perfect for refreshment.',
      price: 90,
      category: 'Shakes',
      imageUrl: '/src/assets/Watermelon%20Shake.webp',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-fruit-in-season',
      name: 'Fruit in Season',
      description: 'Seasonal fruit shake with dragon fruit and other fresh fruits.',
      price: 90,
      category: 'Shakes',
      imageUrl: '/src/assets/fruit%20in%20season%20shake.png',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-buffalo-wings',
      name: 'Buffalo Wings',
      description: 'Spicy buffalo wings served with ranch dip.',
      price: 209,
      category: 'Appetizers',
      imageUrl: '/src/assets/Buffalo%20wings.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-calamares',
      name: 'Calamares',
      description: 'Lightly fried calamari rings with garlic mayo.',
      price: 239,
      category: 'Appetizers',
      imageUrl: '/src/assets/Calamares.webp',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-chicken-skin',
      name: 'Chicken Skin',
      description: 'Crispy chicken skin bites seasoned to perfection.',
      price: 175,
      category: 'Appetizers',
      imageUrl: '/src/assets/chiken%20skin.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-crispy-isaw',
      name: 'Crispy Isaw',
      description: 'Deep-fried chicken isaw served crispy and savory.',
      price: 145,
      category: 'Appetizers',
      imageUrl: '/src/assets/crispy%20isaw.webp',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-crispy-chicken-neck',
      name: 'Crispy Chicken Neck',
      description: 'Crunchy chicken neck bites with a spicy dip.',
      price: 165,
      category: 'Appetizers',
      imageUrl: '/src/assets/crispy%20chicken%20neck.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-crispy-chicken-feet',
      name: 'Crispy Chicken Feet (Adidas)',
      description: 'Crispy chicken feet seasoned in special spices.',
      price: 105,
      category: 'Appetizers',
      imageUrl: '/src/assets/crispy%20chicken%20feet.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-kropek',
      name: 'Kropek',
      description: 'Crunchy prawn crackers, perfect for snacking.',
      price: 90,
      category: 'Appetizers',
      imageUrl: '/src/assets/kropek.jpg',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-fish-fingers',
      name: 'Fish Fingers',
      description: 'Golden fish fingers served with tartar sauce.',
      price: 225,
      category: 'Appetizers',
      imageUrl: '/src/assets/fish%20fingers.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-dynamite',
      name: 'Dynamite',
      description: 'Spicy dynamite rolls with cheese and seafood.',
      price: 145,
      category: 'Appetizers',
      imageUrl: '/src/assets/dynamite.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-sinigang-na-baboy',
      name: 'Sinigang Na Baboy',
      description: 'Sour tamarind soup with pork and vegetables.',
      price: 295,
      category: 'Soup',
      imageUrl: '/src/assets/sinigang%20na%20baboy.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-sinigang-na-hipon',
      name: 'Sinigang Na Hipon',
      description: 'Sinigang soup with shrimp and fresh vegetables.',
      price: 325,
      category: 'Soup',
      imageUrl: '/src/assets/sinigang%20na%20hipon.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-tinolang-malasugue',
      name: 'Tinolang Malasugue',
      description: 'Light ginger soup with malasugue fish.',
      price: 305,
      category: 'Soup',
      imageUrl: '/src/assets/tinolang%20malasugui.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-tinolang-manok',
      name: 'Tinolang Manok',
      description: 'Classic chicken ginger soup with vegetables.',
      price: 265,
      category: 'Soup',
      imageUrl: '/src/assets/tinolang%20manok.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-siki-soup',
      name: 'Siki',
      description: 'Rich local soup with mixed spices and meat.',
      price: 389,
      category: 'Soup',
      imageUrl: '/src/assets/siri.jpg',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-pork-adobo',
      name: 'Pork Adobo',
      description: 'Classic adobo with soy sauce, vinegar, and garlic.',
      price: 275,
      category: 'Pork',
      imageUrl: '/src/assets/pork%20adobo.webp',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-salt-and-pepper-spare-ribs',
      name: 'Salt and Pepper Spare Ribs',
      description: 'Crispy spare ribs seasoned with salt and pepper.',
      price: 275,
      category: 'Pork',
      imageUrl: '/src/assets/salt%20and%20pepper%20spare%20ribs.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-pork-bicol-express',
      name: 'Pork Bicol Express',
      description: 'Spicy pork stew with coconut milk and chili.',
      price: 265,
      category: 'Pork',
      imageUrl: '/src/assets/pork%20bicol%20expresse.webp',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-lechon-kawali',
      name: 'Lechon Kawali',
      description: 'Crispy pork belly served with liver sauce.',
      price: 350,
      category: 'Pork',
      imageUrl: '/src/assets/lechon%20kawali.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-grilled-liempo',
      name: 'Grilled Liempo',
      description: 'Grilled pork belly served with garlic rice.',
      price: 255,
      category: 'Pork',
      imageUrl: '/src/assets/grilled%20liempo.png',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-crispy-pata',
      name: 'Crispy Pata',
      description: 'Deep-fried pork leg with soy-vinegar dip.',
      price: 799,
      category: 'Pork',
      imageUrl: '/src/assets/crispy%20pata.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-chillingan-fried-chicken',
      name: 'Chillingan Fried Chicken',
      description: 'Crispy fried chicken served hot with rice.',
      price: 275,
      category: 'Chicken',
      imageUrl: '/src/assets/chillingan%20fried%20chicken.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-garlic-butter-chicken',
      name: 'Garlic Butter Chicken',
      description: 'Juicy chicken in garlic butter sauce.',
      price: 295,
      category: 'Chicken',
      imageUrl: '/src/assets/garlic%20butter%20chicken.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-chicken-parmesan',
      name: 'Chicken Parmesan',
      description: 'Breaded chicken with parmesan and tomato sauce.',
      price: 295,
      category: 'Chicken',
      imageUrl: '/src/assets/chiken%20parmesan.png',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-chicken-curry',
      name: 'Chicken Curry',
      description: 'Creamy chicken curry with spices and rice.',
      price: 285,
      category: 'Chicken',
      imageUrl: '/src/assets/chicken%20curry.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-chicken-fingers',
      name: 'Chicken Fingers',
      description: 'Crispy breaded chicken fingers with sauce.',
      price: 295,
      category: 'Chicken',
      imageUrl: '/src/assets/chicken%20fingers.webp',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-lechon-manok',
      name: 'Lechon Manok',
      description: 'Roasted chicken seasoned with herbs.',
      price: 240,
      category: 'Chicken',
      imageUrl: '/src/assets/lechon%20manok.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-stir-fry-beef-with-broccoli',
      name: 'Stir Fry Beef with Broccoli',
      description: 'Tender beef stir-fried with broccoli and savory sauce.',
      price: 355,
      category: 'Beef',
      imageUrl: '/src/assets/stir%20fry%20beef%20with%20brocolli.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-siki-beef',
      name: 'Siki',
      description: 'Savory beef dish with native spices.',
      price: 385,
      category: 'Beef',
      imageUrl: '/src/assets/siri.jpg',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-gambas',
      name: 'Gambas',
      description: 'Garlic shrimp sautéed in butter and herbs.',
      price: 295,
      category: 'Seafood',
      imageUrl: '/src/assets/gambas.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-garlic-buttered-shrimp',
      name: 'Garlic Buttered Shrimp',
      description: 'Shrimp sautéed with garlic butter sauce.',
      price: 305,
      category: 'Seafood',
      imageUrl: '/src/assets/garlic%20buttered%20shrimp.jpg',
      rating: 4.7,
      visible: 1,
    },
    {
      id: 'prod-kinilaw-na-malasugue',
      name: 'Kinilaw Na Malasugue/Tuna',
      description: 'Fresh ceviche-style malasugue or tuna.',
      price: 275,
      category: 'Seafood',
      imageUrl: '/src/assets/kinilaw%20na%20malasugue.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-steamed-pompano',
      name: 'Steamed Pompano in Sesame Oil',
      description: 'Steamed pompano flavored with sesame oil.',
      price: 375,
      category: 'Seafood',
      imageUrl: '/src/assets/steamed%20pompano%20in%20sesame%20oil.jpg',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-hito',
      name: 'Hito (Fried, Sugba, Gata)',
      description: 'Catfish served fried, grilled, or in gata sauce.',
      price: 400,
      category: 'Seafood',
      imageUrl: '/src/assets/hito.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-fish-fillet',
      name: 'Fish Fillet',
      description: 'Crispy fish fillet served with vegetables.',
      price: 265,
      category: 'Seafood',
      imageUrl: '/src/assets/fish%20fillet.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-vegetable-bicol-express',
      name: 'Vegetable Bicol Express',
      description: 'Vegetable stew in spicy coconut milk.',
      price: 185,
      category: 'Vegetables',
      imageUrl: '/src/assets/vegetable%20bicol%20express.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-chopsuey',
      name: 'Chopsuey',
      description: 'Stir-fried vegetables in savory sauce.',
      price: 205,
      category: 'Vegetables',
      imageUrl: '/src/assets/chop%20suey.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-pinakbet',
      name: 'Pinakbet (Pork, Chicken)',
      description: 'Mixed vegetables with bagoong and choice of meat.',
      price: 215,
      category: 'Vegetables',
      imageUrl: '/src/assets/pinakbet.png',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-ginisang-gulay',
      name: 'Ginisang Gulay',
      description: 'Sautéed vegetables lightly seasoned.',
      price: 185,
      category: 'Vegetables',
      imageUrl: '/src/assets/ginisang%20gulay.jpg',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-pancit-guisado',
      name: 'Pancit Guisado',
      description: 'Stir-fried noodles with vegetables and meat.',
      price: 199,
      category: 'Noodles/Pasta',
      imageUrl: '/src/assets/pancit%20guisado.jpg',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-bami',
      name: 'Bam-I',
      description: 'Mixed noodles with vegetables and meat.',
      price: 199,
      category: 'Noodles/Pasta',
      imageUrl: '/src/assets/bami.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-special-sotanghon',
      name: 'Special Sotanghon',
      description: 'Special thin noodle dish with chicken and vegetables.',
      price: 199,
      category: 'Noodles/Pasta',
      imageUrl: '/src/assets/special%20sotanghon.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-chicken-carbonara',
      name: 'Chicken Carbonara',
      description: 'Creamy carbonara pasta with chicken.',
      price: 269,
      category: 'Noodles/Pasta',
      imageUrl: '/src/assets/chicken%20carbonara.png',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-cheesy-spaghetti',
      name: 'Cheesy Spaghetti',
      description: 'Spaghetti in cheesy sauce with herbs.',
      price: 279,
      category: 'Noodles/Pasta',
      imageUrl: '/src/assets/cheesy%20spaghetti.webp',
      rating: 4.5,
      visible: 1,
    },
    {
      id: 'prod-steamed-rice',
      name: 'Steamed Rice',
      description: 'Perfectly steamed plain rice.',
      price: 20,
      category: 'Rice',
      imageUrl: '/src/assets/steamed%20rice.jpg',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-steamed-rice-platter',
      name: 'Steamed Rice in Platter',
      description: 'Large platter of steamed rice for sharing.',
      price: 120,
      category: 'Rice',
      imageUrl: '/src/assets/steamed%20rice%20in%20platter.jpg',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-java-rice',
      name: 'Java Rice',
      description: 'Aromatic Java rice with garlic and herbs.',
      price: 35,
      category: 'Rice',
      imageUrl: '/src/assets/java%20rice.webp',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-java-rice-platter',
      name: 'Java Rice Platter',
      description: 'Large platter of Java rice for a group.',
      price: 150,
      category: 'Rice',
      imageUrl: '/src/assets/java%20rice%20platter.jpg',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-coke-8oz',
      name: 'Coke 8oz',
      description: 'Chilled Coca-Cola in a small bottle.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Coke%208oz.jpg',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-royal-8oz',
      name: 'Royal 8oz',
      description: 'Royal Tru-Orange in a small bottle.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Royal%208oz.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-sprite-8oz',
      name: 'Sprite 8oz',
      description: 'Lemon-lime soda in a small bottle.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Sprite%208oz.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-coke-sakto',
      name: 'Coke Sakto',
      description: 'Coke served in a smaller bottle size.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Coke%20Sakto.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-sprite-sakto',
      name: 'Sprite Sakto',
      description: 'Sprite served in a smaller bottle size.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Sprite%20%20Sakto.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-royal-sakto',
      name: 'Royal Sakto',
      description: 'Royal Tru-Orange in a smaller bottle size.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Royal%20Sakto.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-coke-mismo',
      name: 'Coke Mismo',
      description: 'Coke served with ice and lemon.',
      price: 30,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/coke%20mismo.png',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-royal-mismo',
      name: 'Royal Mismo',
      description: 'Royal Tru-Orange served with ice.',
      price: 30,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Royal%20Mismo.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-sprite-mismo',
      name: 'Sprite Mismo',
      description: 'Sprite served with ice and lemon.',
      price: 30,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Sprite%20%20Sakto.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-coke-zero',
      name: 'Coke Zero',
      description: 'Zero-sugar Coca-Cola.',
      price: 85,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/coke%20zero.jpg',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-natures-spring',
      name: 'Natures Spring',
      description: 'Bottled mineral water.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/natures%20spring.png',
      rating: 4.0,
      visible: 1,
    },
    {
      id: 'prod-lemon-due',
      name: 'Lemon Due',
      description: 'Ready-to-drink lemon soda.',
      price: 100,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Lemon%20Due.png',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-mountain-dew',
      name: 'Mountain Dew',
      description: 'Citrus-flavored Mountain Dew soda.',
      price: 30,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/Mountain%20Dew.jpg',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-coke-litre',
      name: 'Coke Litre',
      description: 'One-litre Coke bottle for sharing.',
      price: 60,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/coke%20litro.png',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-coke-1-5',
      name: 'Coke 1.5',
      description: '1.5L Coke bottle.',
      price: 120,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/coke%201.5.png',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-sprite-1-5',
      name: 'Sprite 1.5',
      description: '1.5L Sprite bottle.',
      price: 120,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/sprite%201.5.webp',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-royal-1-5',
      name: 'Royal 1.5',
      description: '1.5L Royal Tru-Orange bottle.',
      price: 120,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/royal%201.5.webp',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-del-monte-juice-mango',
      name: 'Del Monte Juice (Mango)',
      description: 'Bottled mango juice.',
      price: 50,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/del%20monte%20juice%20mango.png',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-del-monte-juice-pineapple',
      name: 'Del Monte Juice (Pineapple)',
      description: 'Bottled pineapple juice.',
      price: 50,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/del%20monte%20juice%20pineapple.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-del-monte-juice-4-season',
      name: 'Del Monte Juice (4 Season)',
      description: 'Mixed fruit juice in a bottle.',
      price: 50,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/del%20monte%20juice%204%20season.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-c2-apple',
      name: 'C2 Apple',
      description: 'C2 green tea with apple flavor.',
      price: 20,
      category: 'Non-alcoholic Drinks',
      imageUrl: '/src/assets/c2%20apple.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-buko-juice',
      name: 'Buko Juice',
      description: 'Refreshing coconut juice.',
      price: 45,
      category: 'Fresh Fruit Juice',
      imageUrl: '/src/assets/buko%20juice.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-bottled-water',
      name: 'Bottled Water',
      description: 'Bottled drinking water.',
      price: 25,
      category: 'Other',
      imageUrl: '/src/assets/bottled%20water.png',
      rating: 4.0,
      visible: 1,
    },
    {
      id: 'prod-cali-can',
      name: 'Cali Can',
      description: 'Cali cola can drink.',
      price: 50,
      category: 'Other',
      imageUrl: '/src/assets/cali%20can.webp',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-tanduay-select',
      name: 'Tanduay Select',
      description: 'Premium Tanduay rum.',
      price: 200,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/tanduay%20select.webp',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-carlo-rossi-750ml',
      name: 'Carlo Rossi 750ml',
      description: 'Carlo Rossi red wine bottle.',
      price: 600,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/carlo%20rossi%20750ml.jpg',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-beringer',
      name: 'Beringer',
      description: 'Beringer wine bottle.',
      price: 1600,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/beringer.webp',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-alfonso-light-1l',
      name: 'Alfonso Light 1L',
      description: 'Alfonso Light beer 1L bottle.',
      price: 450,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/Alfonso%20Light%201L.webp',
      rating: 4.2,
      visible: 1,
    },
    {
      id: 'prod-jg-kinsey-700ml',
      name: 'JG Kinsey 700ml',
      description: 'JG Kinsey whiskey bottle.',
      price: 160,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/JG%20kinsey%20700%20ml.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-andy-player',
      name: 'Andy Player',
      description: 'Andy Player wine bottle.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/Andy%20Player.jpg',
      rating: 4.0,
      visible: 1,
    },
    {
      id: 'prod-smb-light',
      name: 'SMB Light',
      description: 'SMB Light beer.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/SMB%20Light.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-smb-flavored-beer',
      name: 'SMB Flavored Beer',
      description: 'Flavored beer from SMB.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/SMB%20Flavored%20Beer.jpg',
      rating: 4.0,
      visible: 1,
    },
    {
      id: 'prod-smb-pilsen',
      name: 'SMB Pilsen',
      description: 'SMB Pilsen beer.',
      price: 180,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/SMB%20Pilsen.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-smb-grande',
      name: 'SMB Grande',
      description: 'SMB Grande beer.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/smb%20grande.jpg',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-tanduay-ice',
      name: 'Tanduay Ice',
      description: 'Tanduay Ice alcoholic drink.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/tanduay%20ice.webp',
      rating: 4.0,
      visible: 1,
    },
    {
      id: 'prod-red-horse-stallion',
      name: 'Red Horse Stallion',
      description: 'Red Horse Stallion beer.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/red%20horse%20stallion.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-red-horse-500ml',
      name: 'Red Horse 500ml',
      description: 'Red Horse beer in 500ml bottle.',
      price: 95,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/red%20horse%20500%20ml.webp',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-red-horse-1-liter',
      name: 'Red Horse 1 Liter',
      description: 'Red Horse 1L beer bottle.',
      price: 180,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/red%20horse%201%20l.png',
      rating: 4.1,
      visible: 1,
    },
    {
      id: 'prod-mule',
      name: 'Mule',
      description: 'Refreshing mule cocktail.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/mule.webp',
      rating: 4.0,
      visible: 1,
    },
    {
      id: 'prod-fundador-super-special',
      name: 'Fundador Super Special',
      description: 'Premium Fundador cognac.',
      price: 550,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/fundador%20super%20special.webp',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-fundador-double-light',
      name: 'Fundador Double Light',
      description: 'Fundador double light cognac.',
      price: 650,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/fundador%20doublel%20ight.webp',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-fundador-light',
      name: 'Fundador Light',
      description: 'Fundador Light cognac bottle.',
      price: 750,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/fundador%20light.webp',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-fundador-solera',
      name: 'Fundador Solera',
      description: 'Fundador Solera cognac.',
      price: 650,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/fundador%20solera.webp',
      rating: 4.3,
      visible: 1,
    },
    {
      id: 'prod-mojito',
      name: 'Mojito',
      description: 'Classic mojito cocktail.',
      price: 80,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/mojitos.webp',
      rating: 4.4,
      visible: 1,
    },
    {
      id: 'prod-red-label',
      name: 'Red Label',
      description: 'Johnnie Walker Red Label whisky.',
      price: 1400,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/red%20label.webp',
      rating: 4.6,
      visible: 1,
    },
    {
      id: 'prod-black-label',
      name: 'Black Label',
      description: 'Johnnie Walker Black Label whisky.',
      price: 1600,
      category: 'Alcoholic Drinks',
      imageUrl: '/src/assets/black%20label.webp',
      rating: 4.7,
      visible: 1,
    },
  ];

  for (const product of products) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO products (id, name, description, price, category, imageUrl, rating, visible, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.description,
        product.price,
        product.category,
        product.imageUrl,
        product.rating,
        product.visible,
        now,
        now,
      ]
    );
  }

  console.log(`✓ Seeded ${products.length} menu products into the database`);
}

async function seedReservationUnits(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const row = await db.get<{ count: number }>(`SELECT COUNT(*) AS count FROM reservation_units`);
  if (row?.count && row.count > 0) {
    return;
  }

  const units = [
    {
      id: "billiard-1",
      serviceId: "billiard",
      name: "Table 1",
      description: "Corner table with soft lighting.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Table+1",
      active: 1,
    },
    {
      id: "billiard-2",
      serviceId: "billiard",
      name: "Table 2",
      description: "Center pool table with premium cues.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Table+2",
      active: 1,
    },
    {
      id: "billiard-3",
      serviceId: "billiard",
      name: "Table 3",
      description: "Large table with private seating.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Table+3",
      active: 1,
    },
    {
      id: "billiard-4",
      serviceId: "billiard",
      name: "Table 4",
      description: "Cozy table near the bar.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Table+4",
      active: 1,
    },
    {
      id: "karaoke-1",
      serviceId: "karaoke",
      name: "Room 1",
      description: "Private room for 8 guests.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Karaoke+1",
      active: 1,
    },
    {
      id: "karaoke-2",
      serviceId: "karaoke",
      name: "Room 2",
      description: "Stage lighting and sound system.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Karaoke+2",
      active: 1,
    },
    {
      id: "karaoke-3",
      serviceId: "karaoke",
      name: "Room 3",
      description: "Large seating lounge.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Karaoke+3",
      active: 1,
    },
    {
      id: "darts-1",
      serviceId: "darts",
      name: "Board 1",
      description: "Regulation electronic board.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Darts+1",
      active: 1,
    },
    {
      id: "darts-2",
      serviceId: "darts",
      name: "Board 2",
      description: "Premium scoring system.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Darts+2",
      active: 1,
    },
    {
      id: "darts-3",
      serviceId: "darts",
      name: "Board 3",
      description: "Cozy corner layout.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Darts+3",
      active: 1,
    },
    {
      id: "basketball-1",
      serviceId: "basketball",
      name: "Court 1",
      description: "Half-court with hoops.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Court+1",
      active: 1,
    },
    {
      id: "basketball-2",
      serviceId: "basketball",
      name: "Court 2",
      description: "Full-court arcade experience.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Court+2",
      active: 1,
    },
    {
      id: "function-1",
      serviceId: "function-room",
      name: "Function Room",
      description: "Private event room with seating.",
      imageUrl: "https://via.placeholder.com/320x220.png?text=Function+Room",
      active: 1,
    },
  ];

  for (const unit of units) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO reservation_units (id, serviceId, name, description, imageUrl, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unit.id,
        unit.serviceId,
        unit.name,
        unit.description,
        unit.imageUrl,
        unit.active,
        now,
        now,
      ]
    );
  }

  console.log(`✓ Seeded ${units.length} reservation units into the database`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization and seed complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export async function getDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  await db.exec('PRAGMA foreign_keys = ON');
  return db;
}
