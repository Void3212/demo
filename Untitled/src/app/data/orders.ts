import type { Product } from "./products";

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

// Helper to create a new order
export function createOrder(
  userId: string,
  customerName: string,
  customerEmail: string,
  items: OrderItem[],
  deliveryAddress: string,
  customerPhone?: string,
): Order {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 9 : 0;
  const total = subtotal + deliveryFee;

  return {
    id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal,
    deliveryFee,
    total,
    deliveryAddress,
    status: "pending",
    createdAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
  };
}
