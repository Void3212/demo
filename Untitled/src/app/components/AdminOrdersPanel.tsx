import { useState, useEffect } from "react";
import type { Order, OrderStatus } from "../data/orders";
import { OrderAPI } from "../../api/orderAPI";

interface AdminOrdersPanelProps {
  onNavigateToOrders?: () => void;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  accepted: "bg-blue-100 text-blue-800 border border-blue-300",
  rejected: "bg-red-100 text-red-800 border border-red-300",
  shipped: "bg-purple-100 text-purple-800 border border-purple-300",
  delivered: "bg-green-100 text-green-800 border border-green-300",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function AdminOrdersPanel({ onNavigateToOrders }: AdminOrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [previousPendingCount, setPreviousPendingCount] = useState(0);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await OrderAPI.getOrders();
      const newPendingCount = data.filter((o) => o.status === "pending").length;

      // Check for new pending orders
      if (newPendingCount > previousPendingCount && previousPendingCount > 0) {
        setShowNewOrderAlert(true);
        // Play notification sound if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Order Received!', {
            body: `You have ${newPendingCount} pending order${newPendingCount === 1 ? '' : 's'}`,
            icon: '/favicon.ico'
          });
        }
        // Auto-hide alert after 5 seconds
        setTimeout(() => setShowNewOrderAlert(false), 5000);
      }

      setPreviousPendingCount(newPendingCount);
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    try {
      await OrderAPI.updateOrderStatus(order.id, "accepted");
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "accepted", acceptedAt: new Date().toISOString() } : o))
      );
      setSelectedOrder((prev) => (prev?.id === order.id ? { ...order, status: "accepted" } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept order");
    }
  };

  const handleRejectOrder = (order: Order) => {
    setOrderToReject(order);
    setShowRejectionModal(true);
  };

  const handleStatusUpdate = async (order: Order, status: OrderStatus) => {
    try {
      await OrderAPI.updateOrderStatus(order.id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status } : o))
      );
      setSelectedOrder((prev) => (prev?.id === order.id ? { ...order, status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update order to ${status}`);
    }
  };

  const submitRejection = async () => {
    if (!orderToReject || !rejectionReason.trim()) return;

    try {
      await OrderAPI.updateOrderStatus(orderToReject.id, "rejected", rejectionReason);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderToReject.id ? { ...o, status: "rejected", rejectionReason } : o
        )
      );
      setSelectedOrder((prev) => (prev?.id === orderToReject.id ? { ...orderToReject, status: "rejected", rejectionReason } : prev));
      setShowRejectionModal(false);
      setRejectionReason("");
      setOrderToReject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject order");
    }
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const acceptedCount = orders.filter((o) => o.status === "accepted").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const rejectedCount = orders.filter((o) => o.status === "rejected").length;

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="rounded-[32px] bg-white px-6 py-6 shadow-sm sm:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#ff7a05]">Orders</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Incoming orders</h1>
            <p className="mt-2 text-sm text-slate-600">
              View incoming customer orders, accept or reject them, and track order progress.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="rounded-[28px] bg-orange-50 border border-orange-200 px-4 py-3">
              <p className="text-sm font-semibold text-orange-900">{pendingCount} pending order{pendingCount === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-[28px] bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showNewOrderAlert && (
          <div className="mb-6 rounded-[28px] bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <span className="font-semibold">New order received!</span>
            </div>
            <button
              onClick={() => setShowNewOrderAlert(false)}
              className="text-green-600 hover:text-green-800 font-semibold"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-[20px] bg-yellow-50 border border-yellow-200 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
            <p className="text-sm text-yellow-700">Pending</p>
          </div>
          <div className="rounded-[20px] bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">{acceptedCount}</p>
            <p className="text-sm text-blue-700">Accepted</p>
          </div>
          <div className="rounded-[20px] bg-purple-50 border border-purple-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-900">{shippedCount}</p>
            <p className="text-sm text-purple-700">Shipped</p>
          </div>
          <div className="rounded-[20px] bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-900">{deliveredCount}</p>
            <p className="text-sm text-green-700">Delivered</p>
          </div>
          <div className="rounded-[20px] bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
            <p className="text-sm text-red-700">Rejected</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filterStatus === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {(["pending", "accepted", "rejected", "shipped", "delivered"] as OrderStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filterStatus === status
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        {loading && !orders.length ? (
          <div className="text-center py-12 text-slate-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="text-slate-600">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-[28px] border border-slate-200 bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  className="w-full p-4 text-left hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-slate-900">{order.id}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>
                          <span className="font-medium">{order.customerName}</span>
                          {order.customerEmail && ` • ${order.customerEmail}`}
                        </p>
                        <p className="mt-1">{order.items.length} item{order.items.length === 1 ? "" : "s"} • ₱{order.total.toFixed(2)}</p>
                        <p className="mt-1 text-slate-500">Ordered: {new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">₱{order.total.toFixed(2)}</p>
                      <p className="text-sm text-slate-500 mt-1">{expandedOrderId === order.id ? "▲" : "▼"}</p>
                    </div>
                  </div>
                </button>

                {expandedOrderId === order.id && (
                  <div className="border-t border-slate-200 px-4 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase">Delivery Address</p>
                        <p className="mt-1 font-medium text-slate-900">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase">Estimated Delivery</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {order.acceptedAt && (
                        <div>
                          <p className="text-slate-500 text-xs font-semibold uppercase">Accepted At</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {new Date(order.acceptedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {order.shippedAt && (
                        <div>
                          <p className="text-slate-500 text-xs font-semibold uppercase">Shipped At</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {new Date(order.shippedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div>
                          <p className="text-slate-500 text-xs font-semibold uppercase">Delivered At</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {new Date(order.deliveredAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase mb-3">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">
                              {item.product.name} × {item.quantity}
                            </span>
                            <span className="font-semibold text-slate-900">₱{(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] bg-white border border-slate-200 p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-semibold text-slate-900">₱{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Delivery Fee</span>
                        <span className="font-semibold text-slate-900">₱{order.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-semibold">
                        <span className="text-slate-900">Total</span>
                        <span className="text-slate-900">₱{order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {order.rejectionReason && (
                      <div className="rounded-[20px] bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                        <p className="font-semibold mb-1">Rejection Reason:</p>
                        <p>{order.rejectionReason}</p>
                      </div>
                    )}

                    {order.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAcceptOrder(order)}
                          className="flex-1 rounded-[20px] bg-green-500 hover:bg-green-600 text-white font-semibold py-3 transition"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleRejectOrder(order)}
                          className="flex-1 rounded-[20px] bg-red-500 hover:bg-red-600 text-white font-semibold py-3 transition"
                        >
                          Reject Order
                        </button>
                      </div>
                    )}

                    {order.status === "accepted" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatusUpdate(order, "shipped")}
                          className="flex-1 rounded-[20px] bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 transition"
                        >
                          Mark as Shipped
                        </button>
                      </div>
                    )}

                    {order.status === "shipped" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatusUpdate(order, "delivered")}
                          className="flex-1 rounded-[20px] bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 transition"
                        >
                          Mark as Delivered
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showRejectionModal && orderToReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-[32px] bg-white p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Reject Order</h2>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to reject order <span className="font-semibold">{orderToReject.id}</span>?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection (e.g., Item unavailable, Cannot deliver to this address)"
              className="w-full rounded-[20px] border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason("");
                  setOrderToReject(null);
                }}
                className="flex-1 rounded-[20px] border border-slate-200 px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={!rejectionReason.trim()}
                className="flex-1 rounded-[20px] bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-semibold py-3 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
