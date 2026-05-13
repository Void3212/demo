import { Router, type Request, type Response } from "express";
import { OrderService, type Order, type OrderStatus } from "../services/OrderService";

const router = Router();

// POST /api/orders - Create a new order
router.post("/", (req: Request, res: Response) => {
  try {
    const order: Order = req.body;

    // Validate required fields
    if (!order.id || !order.userId || !order.customerName || !order.items || !order.deliveryAddress) {
      return res.status(400).json({ error: "Missing required order fields" });
    }

    const createdOrder = OrderService.createOrder(order);
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// GET /api/orders - Get all orders
router.get("/", (req: Request, res: Response) => {
  try {
    const orders = OrderService.getOrders();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/orders/:orderId - Get a single order
router.get("/:orderId", (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = OrderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// GET /api/orders/user/:userId - Get orders for a specific user
router.get("/user/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const orders = OrderService.getOrdersByUser(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

// PATCH /api/orders/:orderId/status - Update order status
router.patch("/:orderId/status", (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, rejectionReason } = req.body;

    // Validate status
    const validStatuses: OrderStatus[] = ["pending", "accepted", "rejected", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedOrder = OrderService.updateOrderStatus(orderId, status, rejectionReason);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// DELETE /api/orders/:orderId - Delete an order (admin only)
router.delete("/:orderId", (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const deleted = OrderService.deleteOrder(orderId);

    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
