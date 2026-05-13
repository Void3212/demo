import type { Order } from "../data/orders";

interface OrderTrackingProps {
  orders: Order[];
  isLoading?: boolean;
  onConfirmDelivered?: (orderId: string) => Promise<void>;
}

const statusStyles: Record<Order["status"], string> = {
  pending: "bg-orange-50 text-orange-800",
  accepted: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  shipped: "bg-sky-50 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-900",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function OrderTracking({ orders, isLoading, onConfirmDelivered }: OrderTrackingProps) {
  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Loading your orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">No orders yet</p>
        <p className="mt-2">Place an order to track its status here once it is received by the kitchen.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-slate-700">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff7a05]">Order status</p>
        <p className="mt-2 text-sm text-slate-600">Track your recent deliveries and see whether they are pending, accepted, rejected or on the way.</p>
      </div>

      <div className="space-y-4">
        {orders.slice(0, 3).map((order) => (
          <div key={order.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Order {order.id}</p>
                <p className="mt-1 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Total</p>
                <p>₱{order.total.toFixed(2)}</p>
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Delivery to</p>
                <p>{order.deliveryAddress}</p>
              </div>
            </div>

            {order.rejectionReason ? (
              <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Rejected reason</p>
                <p className="mt-1">{order.rejectionReason}</p>
              </div>
            ) : null}

            {order.status === 'delivered' && onConfirmDelivered ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onConfirmDelivered(order.id)}
                  className="rounded-full bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b91c1c]"
                >
                  Confirm received
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
