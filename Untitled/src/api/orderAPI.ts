import type { Order, OrderStatus } from "../app/data/orders";

const API_BASE = "http://localhost:3001";

export const OrderAPI = {
  /**
   * Create a new order
   */
  async createOrder(order: Order): Promise<Order> {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Fetch all orders (admin only)
   */
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Fetch a single order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    rejectionReason?: string,
  ): Promise<Order> {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Fetch orders by user ID
   */
  async getOrdersByUser(userId: string): Promise<Order[]> {
    const response = await fetch(`${API_BASE}/api/orders/user/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user orders: ${response.statusText}`);
    }

    return response.json();
  },
};
