import { useState, useEffect, useRef } from "react";
import AdminSide from "../../imports/AdminSide";
import { OrderAPI } from "../../api/orderAPI";
import OrderTracking from "./OrderTracking";
import { createOrder, type Order, type OrderItem } from "../data/orders";
import { type Product } from "../data/products";
import { type User } from "../data/users";

interface DesktopOrderingPageProps {
  onNavigateToReservation: () => void;
  onLogout: () => void;
  user: User | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 1052;
const CART_PANEL_WIDTH = 430;

export default function DesktopOrderingPage({ onNavigateToReservation, onLogout, user }: DesktopOrderingPageProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [scale, setScale] = useState(1);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!parentRef.current) return;
      const { width, height } = parentRef.current.getBoundingClientRect();
      setScale(Math.max(width / DESIGN_WIDTH, height / DESIGN_HEIGHT));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
      setCheckoutMessage(err instanceof Error ? err.message : "Unable to fetch your order status right now.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleReservationClick = () => {
    onNavigateToReservation();
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleItemQuantityChange = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
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
      setCartItems([]);
      await fetchUserOrders();
      setCheckoutMessage(`Payment confirmed. Your order ${order.id} is pending review.`);
    } catch (err) {
      setCheckoutMessage(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = cartItems.length > 0 ? 9 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div ref={parentRef} className="w-screen min-h-screen overflow-auto bg-gray-100 flex items-start justify-center py-8">
      <div
        className="relative overflow-hidden rounded-[30px] shadow-xl bg-[#f1e6d2]"
        style={{ width: `${(DESIGN_WIDTH + (isCartOpen ? CART_PANEL_WIDTH : 0)) * scale}px`, height: `${DESIGN_HEIGHT * scale}px` }}
      >
        <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div
            className="relative w-[1600px] h-[1052px] transition-all duration-300"
            style={{ transform: `translateX(${isCartOpen ? CART_PANEL_WIDTH : 0}px)` }}
          >
            <AdminSide onProductSelect={handleProductSelect} onCartClick={handleCartClick} onLogout={onLogout} user={user} />

            {!isCartOpen && (
              <button
                type="button"
                onClick={handleReservationClick}
                aria-label="Open reservation page"
                title="Go to reservation"
                className="absolute cursor-pointer rounded-3xl bg-transparent hover:bg-black/5 transition-colors"
                style={{ left: 605, top: 192, width: 899, height: 245 }}
              />
            )}
          </div>

          {isCartOpen && (
            <>
              <div className="absolute left-0 top-0 h-[1052px] w-[430px] bg-white shadow-[12px_0_40px_rgba(0,0,0,0.18)] border-r border-slate-200 z-40">
                <div className="flex h-full flex-col justify-between px-8 py-8">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">My Order</p>
                        <p className="mt-2 text-sm text-slate-500">Delivery address</p>
                        <p className="text-base font-semibold text-slate-900">{user?.address ?? "No delivery address saved"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCartOpen(false)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">Estimated delivery 40 mins</p>
                  </div>

                  <div className="space-y-4 overflow-y-auto pb-4">
                    {cartItems.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        No items in cart yet. Tap a product to add it.
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.product.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start gap-4">
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-20 w-20 rounded-2xl object-cover" />
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{item.product.name}</p>
                              <p className="mt-1 text-sm text-slate-500">{item.product.description}</p>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900">
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuantityChange(item.product.id, -1)}
                                    className="px-3 py-2 hover:bg-slate-100"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-2">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuantityChange(item.product.id, 1)}
                                    className="px-3 py-2 hover:bg-slate-100"
                                  >
                                    Add
                                  </button>
                                </div>
                                <span className="text-sm font-semibold">₱{(item.product.price * item.quantity).toFixed(0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4 border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Sub Total</span>
                      <span className="font-semibold text-slate-900">₱{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Delivery Fee</span>
                      <span className="font-semibold text-slate-900">₱{deliveryFee.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                      <span>Total</span>
                      <span>₱{total.toFixed(0)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={cartItems.length === 0 || !user?.address || isSubmitting}
                      className="w-full rounded-3xl bg-orange-500 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                      <OrderTracking orders={recentOrders} isLoading={ordersLoading} />
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
