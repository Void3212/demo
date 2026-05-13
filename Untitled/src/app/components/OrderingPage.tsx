import { useEffect, useState } from "react";
import MobileOrdering from "../../imports/MobileOrdering";
import { useCart } from "./CartContext";
import { OrderAPI } from "../../api/orderAPI";
import OrderTracking from "./OrderTracking";
import { createOrder, type Order, type OrderItem } from "../data/orders";
import type { User } from "../data/users";

interface OrderingPageProps {
  onNavigateToReservation: () => void;
  user: User | null;
}

export default function OrderingPage({ onNavigateToReservation, user }: OrderingPageProps) {
  const { cartItems, itemCount, subtotal, deliveryFee, total, addToCart, updateQuantity, clearCart } = useCart();
  const [showCart, setShowCart] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [confirmedDeliveredOrderIds, setConfirmedDeliveredOrderIds] = useState<string[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecentOrders([]);
      return;
    }

    void fetchUserOrders();
    const interval = window.setInterval(() => {
      void fetchUserOrders();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const stored = window.localStorage.getItem("confirmedDeliveredOrderIds");
    if (stored) {
      try {
        setConfirmedDeliveredOrderIds(JSON.parse(stored));
      } catch {
        setConfirmedDeliveredOrderIds([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("confirmedDeliveredOrderIds", JSON.stringify(confirmedDeliveredOrderIds));
  }, [confirmedDeliveredOrderIds]);

  const fetchUserOrders = async () => {
    if (!user) return;

    setOrdersLoading(true);
    try {
      const userOrders = await OrderAPI.getOrdersByUser(user.id);
      setRecentOrders(
        userOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      setCheckoutMessage(
        err instanceof Error ? err.message : "Unable to fetch your order status right now.",
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleConfirmDelivered = async (orderId: string) => {
    if (!confirm('Confirm receipt of this delivered order?')) return;

    setConfirmedDeliveredOrderIds((prev) => [...prev, orderId]);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !user?.address) return;

    setIsSubmitting(true);
    setCheckoutMessage(null);

    try {
      const items: OrderItem[] = cartItems.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: item.product.price,
          category: item.product.category,
          imageUrl: item.product.imageUrl,
        },
        quantity: item.quantity,
      }));

      const order = createOrder(
        user.id,
        user.name,
        user.email,
        items,
        user.address,
        user.phone,
      );

      await OrderAPI.createOrder(order);
      clearCart();
      await fetchUserOrders();
      setCheckoutMessage(`Payment confirmed. Your order ${order.id} is pending review.`);
    } catch (err) {
      setCheckoutMessage(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#ff7a05]">Ordering</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Order for delivery</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Add menu items to your cart, then confirm checkout with the address saved on your account.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold text-slate-900">Delivery address</p>
              <p className="mt-1 text-base font-medium text-slate-900">
                {user?.address ?? "No address saved yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_0.95fr]">
          <div className="rounded-[32px] bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4 pb-4 sm:pb-6">
              <div>
                <p className="text-lg font-semibold text-slate-900">Menu</p>
                <p className="mt-1 text-sm text-slate-600">Tap any item to add it to your cart.</p>
              </div>
              <button
                type="button"
                onClick={onNavigateToReservation}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Reserve instead
              </button>
            </div>
            <MobileOrdering onAddToCart={addToCart} />
          </div>

          <aside className="rounded-[32px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff7a05]">Your cart</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCart((current) => !current)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {showCart ? "Hide" : "Show"}
              </button>
            </div>

            {showCart ? (
              <div className="mt-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    Your cart is empty. Add a meal to see the delivery estimate and total.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-4">
                          <img src={item.product.imageUrl} alt={item.product.name} className="h-20 w-20 rounded-2xl object-cover" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{item.product.name}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.product.description}</p>
                              </div>
                              <p className="text-sm font-semibold text-slate-900">₱{(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="h-9 w-9 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                −
                              </button>
                              <span className="min-w-[32px] text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="h-9 w-9 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Delivery fee</span>
                      <span className="font-semibold text-slate-900">₱{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Delivering to</p>
                  <p className="mt-2">{user?.address ?? "Update your profile address to continue"}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Estimated delivery in about 40 minutes once your order is confirmed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || !user?.address || isSubmitting}
                  className="w-full rounded-[28px] bg-[#ff7a05] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#e66b00] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? "Processing payment..."
                    : cartItems.length === 0
                    ? "Add items to checkout"
                    : user?.address
                    ? "Checkout now"
                    : "Enter delivery address"}
                </button>

                {checkoutMessage ? (
                  <div className="rounded-[28px] bg-slate-50 p-4 text-sm text-slate-700">
                    {checkoutMessage}
                  </div>
                ) : null}

                <div className="mt-6">
                  <OrderTracking
                    orders={recentOrders.filter(
                      (order) => !(order.status === "delivered" && confirmedDeliveredOrderIds.includes(order.id)),
                    )}
                    isLoading={ordersLoading}
                    onConfirmDelivered={handleConfirmDelivered}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] bg-slate-50 p-5 text-sm text-slate-600">
                Cart summary is hidden. Tap “Show” to review your order before checkout.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
