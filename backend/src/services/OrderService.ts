import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type OrderStatus = "pending" | "accepted" | "rejected" | "shipped" | "delivered";

export interface OrderItem {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
  };
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  acceptedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;
  notes?: string;
}

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

// Ensure the data directory and file exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
}

function readOrders(): Order[] {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

export const OrderService = {
  createOrder(order: Order): Order {
    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);
    return order;
  },

  getOrders(): Order[] {
    return readOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getOrder(orderId: string): Order | null {
    const orders = readOrders();
    return orders.find((o) => o.id === orderId) || null;
  },

  getOrdersByUser(userId: string): Order[] {
    const orders = readOrders();
    return orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Order | null {
    const orders = readOrders();
    const index = orders.findIndex((o) => o.id === orderId);

    if (index === -1) return null;

    const order = orders[index];
    order.status = status;

    if (status === "accepted") {
      order.acceptedAt = new Date().toISOString();
      delete order.rejectionReason;
    } else if (status === "shipped") {
      order.shippedAt = new Date().toISOString();
    } else if (status === "delivered") {
      order.deliveredAt = new Date().toISOString();
    } else if (status === "rejected") {
      order.rejectionReason = rejectionReason || "No reason provided";
    }

    orders[index] = order;
    writeOrders(orders);
    return order;
  },

  deleteOrder(orderId: string): boolean {
    const orders = readOrders();
    const filtered = orders.filter((o) => o.id !== orderId);

    if (filtered.length === orders.length) return false;

    writeOrders(filtered);
    return true;
  },
};
