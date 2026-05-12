export type ProductCategory =
  | "Sizzling Meal"
  | "Rice Bowl Meal"
  | "Grilled"
  | "Drinks"
  | "Appetizers"
  | "Soup"
  | "Pork"
  | "Chicken"
  | "Beef"
  | "Seafood"
  | "Vegetables"
  | "Noodles/Pasta"
  | "Rice"
  | "Non-alcoholic Drinks"
  | "Shakes"
  | "Fresh Fruit Juice"
  | "Other"
  | "Alcoholic Drinks";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  rating: number;
}

// Placeholder product data for the ordering home page.
// This mirrors the shape of a product table that can later be replaced
// with a MySQL-backed API or admin-managed product system.
export const products: Product[] = [
  {
    id: "prod-001",
    name: "Smoky BBQ Chicken",
    description: "Tender grilled chicken glazed in smoky BBQ sauce with a fresh side salad.",
    price: 39.0,
    category: "Grilled",
    imageUrl: "https://via.placeholder.com/260x190.png?text=BBQ+Chicken",
    rating: 4.9,
  },
  {
    id: "prod-002",
    name: "Classic Burger Meal",
    description: "A juicy beef burger with crispy fries and a house-made burger sauce.",
    price: 29.5,
    category: "Beef",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Classic+Burger",
    rating: 4.7,
  },
  {
    id: "prod-003",
    name: "Chili Fries",
    description: "Loaded fries topped with chili, cheese, and crunchy onions for sharing.",
    price: 19.99,
    category: "Appetizers",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Chili+Fries",
    rating: 4.8,
  },
  {
    id: "prod-004",
    name: "Tropical Fruit Bowl",
    description: "Fresh seasonal fruit with mint and honey drizzle, perfect for dessert.",
    price: 14.75,
    category: "Fresh Fruit Juice",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Fruit+Bowl",
    rating: 4.6,
  },
  {
    id: "prod-005",
    name: "Spicy Chicken Wrap",
    description: "Grilled chicken, fresh veggies, and spicy sauce wrapped in a warm tortilla.",
    price: 24.25,
    category: "Chicken",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Chicken+Wrap",
    rating: 4.8,
  },
  {
    id: "prod-006",
    name: "Mediterranean Salad",
    description: "Crisp greens with olives, feta, cucumber, and lemon-herb dressing.",
    price: 18.5,
    category: "Vegetables",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Mediterranean+Salad",
    rating: 4.7,
  },
  {
    id: "prod-007",
    name: "Honey Glazed Wings",
    description: "Crispy chicken wings glazed with honey and served with ranch dip.",
    price: 21.0,
    category: "Chicken",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Honey+Wings",
    rating: 4.9,
  },
  {
    id: "prod-008",
    name: "Loaded Nachos",
    description: "Corn chips piled high with cheese, jalapenos, beans, and salsa.",
    price: 22.75,
    category: "Appetizers",
    imageUrl: "https://via.placeholder.com/260x190.png?text=Loaded+Nachos",
    rating: 4.6,
  },
];
