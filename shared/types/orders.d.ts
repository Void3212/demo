export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled";
export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
}
export interface Order {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    deliveryAddress: string;
    specialInstructions: string;
    createdAt: string;
    updatedAt: string;
    trackingUpdates: TrackingUpdate[];
}
export interface TrackingUpdate {
    id: string;
    status: OrderStatus;
    message: string;
    timestamp: string;
}
export interface CreateOrderRequest {
    items: OrderItem[];
    total: number;
    deliveryAddress: string;
    specialInstructions: string;
}
export interface UpdateOrderStatusRequest {
    status: OrderStatus;
    message?: string;
}
//# sourceMappingURL=orders.d.ts.map