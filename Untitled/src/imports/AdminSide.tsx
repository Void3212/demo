import { useEffect, useState, useRef, type KeyboardEvent, type CSSProperties } from "react";
import { type Product, type ProductCategory } from "../app/data/products";
import { type Order } from "../app/data/orders";
import { type User, updateUser } from "../app/data/users";
import { useProducts } from "../hooks/useProducts";
import svgPaths from "./svg-r6inbo3h4b";
import imgRectangle7 from "figma:asset/a76334811a63b21fc5eabd96235b2ab8f1b863a0.png";
import imgRectangle12 from "figma:asset/b521ae4a6207cfb461308caad9f953831d7824c9.png";
import imgChillinganHeader from "figma:asset/cc4233f9bd38641a5ac2903d4f8eb6294ec92106.png";
import imgShoppingCart1 from "figma:asset/70246941f1086280a283485a466f03ee58610e97.png";

type SidebarIconName = "comment" | "home" | "user" | "heart";

const SIDEBAR_ICON_TOP: Record<SidebarIconName, number> = {
  comment: 272,
  home: 399,
  user: 526,
  heart: 653,
};

type DesktopCategoryName = ProductCategory;

const CATEGORY_LABELS: DesktopCategoryName[] = [
  "Sizzling Meal",
  "Rice Bowl Meal",
  "Grilled",
  "Drinks",
  "Appetizers",
  "Soup",
  "Pork",
  "Chicken",
  "Beef",
  "Seafood",
  "Vegetables",
  "Noodles/Pasta",
  "Rice",
  "Non-alcoholic Drinks",
  "Shakes",
  "Fresh Fruit Juice",
  "Other",
  "Alcoholic Drinks",
];

function DesktopProductCard({ product, onProductSelect }: { product: Product; onProductSelect?: (product: Product) => void }) {
  return (
    <button
      type="button"
      onClick={() => onProductSelect?.(product)}
      className="w-full text-left bg-transparent p-0 text-inherit"
    >
      <div className="h-[153px] w-full overflow-hidden rounded-[20px] bg-[#d9d9d9] shadow-sm transition-transform duration-200 hover:-translate-y-1">
        <img alt={product.name} src={product.imageUrl} className="h-full w-full object-cover" />
      </div>
      <div className="mt-[14px] px-[12px]">
        <p className="text-[20px] font-semibold text-[#1f1f1f]">{product.name}</p>
        <p className="mt-[6px] text-[13px] leading-[1.5] text-[#6b6b6b] h-[42px] overflow-hidden">{product.description}</p>
        <p className="mt-[8px] text-[18px] font-semibold text-[#d51d1d]">₱{product.price.toFixed(2)}</p>
      </div>
    </button>
  );
}

function Sidebar({ activeIcon }: { activeIcon: SidebarIconName }) {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[#ff7a05] h-[1052px] left-0 top-0 w-[118px]" />
      <div className="absolute bg-[#bfa643] h-[62px] left-[108px] w-[10px]" style={{ top: SIDEBAR_ICON_TOP[activeIcon] }} />
    </div>
  );
}

function SupportChatPanel() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "agent", text: "Hey! I’m Chillingan support. Tell me if you want recommendations, an ingredient swap, or a booking note." },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveAgent, setIsLiveAgent] = useState(false);
  const [liveAgentName] = useState("Lara");

  const getBotResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (/employee|human|real|person|agent/.test(lower)) {
      return "I’m connecting you to a live employee now. Please hold while I transfer your chat.";
    }
    if (/order|platter|booking|reservation/.test(lower)) {
      return "Sure — I can help with that. What date and time would you like for your booking or order?";
    }
    if (/pickup|pickup time|pickup/.test(lower)) {
      return "Got it. We can have your order ready for pickup at your chosen time. Need help with directions or parking?";
    }
    if (/sauce|sauces|extra/.test(lower)) {
      return "Absolutely — extra sauces are available. How many sauce packs would you like to add?";
    }
    if (/status|confirm|check/.test(lower)) {
      return "I’m checking that for you. One moment please while I verify the details.";
    }
    return "Thanks! I’m reviewing your request and will update you shortly. If you want, type 'agent' to chat with a real employee.";
  };

  const queueBotResponse = (text: string) => {
    const response = getBotResponse(text);
    setIsTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "agent", text: response }]);
      setIsTyping(false);
      if (/employee|human|real|person|agent/.test(text.toLowerCase())) {
        window.setTimeout(() => {
          setIsLiveAgent(true);
          setMessages((prev) => [
            ...prev,
            { sender: "agent", text: `Hi, this is ${liveAgentName} from Chillingan support. I’m here to help you directly.` },
          ]);
        }, 1200);
      }
    }, 900);
  };

  const handleSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
    setChatInput("");
    queueBotResponse(trimmed);
  };

  const handleQuickReply = (reply: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: reply }]);
    queueBotResponse(reply);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute left-[850px] top-[156px] z-[60] h-[700px] w-[600px] rounded-[50px] bg-white/95 p-[36px] shadow-[0_35px_110px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-md pointer-events-auto">
      <div className="absolute -left-[100px] top-[40px] h-[180px] w-[180px] rounded-full bg-[#fce7e4] blur-[80px]" />
      <div className="relative z-10 space-y-[22px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-[54px] w-[54px] overflow-hidden rounded-full bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] ring-1 ring-[#ffffff70]">
              <img src={imgChillinganHeader} alt="Chillingan logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-['DM_Sans:Bold',sans-serif] text-[28px] font-bold text-[#1f1f1f]">Chillingan Support</p>
              <p className="mt-2 text-[14px] text-[#6b6b6b]">Here for questions, event requests, or order customizations.</p>
            </div>
          </div>
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#f63131] text-white text-[20px] shadow-[0_10px_30px_rgba(246,60,60,0.18)]">
            ?
          </div>
        </div>

        <div className="grid gap-[14px]">
          <div className="rounded-[36px] bg-[#fdf5f3] p-[20px] shadow-[0_8px_24px_rgba(246,60,60,0.08)]">
            <p className="text-[16px] font-semibold text-[#333]">Need something special?</p>
            <p className="mt-2 text-[14px] text-[#5f5f5f]">We can help with group orders, event bookings, or menu customizations. Start with a quick prompt below.</p>
          </div>
          <div className="flex gap-[10px] flex-wrap">
            {[
              { label: "Menu guidance", value: "I need menu guidance" },
              { label: "Party order", value: "I want to book a party order" },
              { label: "Contact employee", value: "Please connect me to a live employee" },
            ].map((reply) => (
              <button
                key={reply.label}
                type="button"
                onClick={() => handleQuickReply(reply.value)}
                className="rounded-full bg-[#ffe4d9] px-[16px] py-[10px] text-[13px] font-medium text-[#b9402f] transition hover:bg-[#ffd6c0]"
              >
                {reply.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[362px] overflow-y-auto pr-3 space-y-[16px] rounded-[40px] border border-[#f1e0dc] bg-[#fff8f6] p-[20px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-[30px] p-[18px] ${message.sender === "agent" ? "bg-[#fff3f3] text-[#292929]" : "ml-auto max-w-[78%] bg-[#f1e6d2] text-[#242424]"}`}
            >
              <p className="text-[15px] leading-[1.6]">{message.text}</p>
            </div>
          ))}
          {isTyping && (
            <div className="rounded-[30px] bg-[#fff3f3] p-[18px] text-[15px] text-[#5c5c5c]">
              <p className="leading-[1.6]">Chillingan is typing...</p>
            </div>
          )}
        </div>

        <div className="rounded-[36px] bg-[#fff0ee] p-[18px] text-[13px] text-[#6b4c42] ring-1 ring-[#ffddd8]">
          {isLiveAgent ?
            `A live employee (${liveAgentName}) is now connected. They’ll help you finish your request.` :
            "Support available 8am–10pm daily. Quick replies are ready whenever you are."
          }
        </div>
        <div className="flex items-center gap-[14px] rounded-[32px] border border-[#f0d7d0] bg-[#fffaf7] p-[12px] shadow-[0_18px_40px_rgba(241,154,135,0.08)]">
          <input
            type="text"
            placeholder="Send a message to Chillingan..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-[54px] flex-1 rounded-[28px] border border-[#f1d9d3] bg-[#fff7f3] px-[22px] text-[15px] text-[#4a4a4a] outline-none focus:border-[#f63131] focus:ring-2 focus:ring-[#f63131]/20"
          />
          <button
            type="button"
            onClick={handleSend}
            className="h-[54px] rounded-[28px] bg-[#f63131] px-[26px] text-[15px] font-semibold text-white transition hover:bg-[#d01d1d]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatSidebarInfo() {
  return (
    <div className="absolute left-[220px] top-[540px] z-[50] w-[520px] rounded-[40px] border border-[#f4d8d2] bg-[#fff6f3] p-[28px] shadow-[0_28px_70px_rgba(238,142,109,0.12)] pointer-events-auto">
      <p className="text-[18px] font-semibold text-[#2d2d2d]">Need help planning your BBQ?</p>
      <p className="mt-3 text-[15px] leading-[1.8] text-[#5f5f5f]">Ask us about party bundles, extra sauces, or any custom requests. Chillingan support is ready to handle your event order.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#fde3dc] px-[14px] py-[8px] text-[13px] font-semibold text-[#c54535]">Group orders</span>
        <span className="rounded-full bg-[#fde3dc] px-[14px] py-[8px] text-[13px] font-semibold text-[#c54535]">Special sauces</span>
        <span className="rounded-full bg-[#fde3dc] px-[14px] py-[8px] text-[13px] font-semibold text-[#c54535]">Pickup help</span>
      </div>
    </div>
  );
}

function ProfilePanel({ profileForm, onChange, onSave, status, user, deliveredOrders }: { profileForm: ProfileFormState; onChange: (field: keyof ProfileFormState, value: string) => void; onSave: () => void; status: string | null; user?: User | null; deliveredOrders?: Order[] }) {
  return (
    <div className="absolute left-1/2 top-[120px] z-[60] grid min-h-[640px] max-h-[calc(100vh-120px)] w-[min(1080px,calc(100vw-140px))] -translate-x-1/2 grid-cols-1 gap-5 overflow-hidden rounded-[50px] bg-[#eef7ff]/95 p-[28px] shadow-[0_35px_110px_rgba(0,0,0,0.18)] ring-1 ring-[#dfe7ff]/70 border border-[#d8e4ff] backdrop-blur-md sm:grid-cols-[360px_1fr]">
      <div className="relative overflow-y-auto max-h-full rounded-[40px] bg-[#f5f8ff] p-[24px] shadow-[0_20px_60px_rgba(20,64,122,0.08)] ring-1 ring-white/20">
        <div className="absolute -left-[60px] top-[20px] h-[150px] w-[150px] rounded-full bg-[#dbeafe] blur-[90px]" />
        <div className="relative z-10 space-y-5">
          <div className="space-y-2">
            <p className="text-[18px] font-semibold text-[#1f1f1f]">Delivered order history</p>
            <p className="text-[14px] leading-[1.8] text-[#5f677f]">Review your delivered orders and what was included in each delivery.</p>
          </div>

          {deliveredOrders && deliveredOrders.length > 0 ? (
            <div className="space-y-4">
              {deliveredOrders.map((order) => (
                <div key={order.id} className="rounded-[24px] border border-[#dfe7ff] bg-white p-[18px] shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[15px] font-semibold text-[#0f172a]">Order {order.id}</p>
                      <p className="mt-1 text-[13px] text-[#64748b]">
                        {order.items.map((item) => `${item.quantity}× ${item.product.name}`).join(", ")}
                      </p>
                    </div>
                    {order.deliveredAt ? (
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f172a]">
                        Delivered {new Date(order.deliveredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[13px] text-[#475569]">Total paid: ₱{order.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-[#dfe7ff] bg-white p-[20px] text-[#475569] shadow-sm">
              <p className="text-[15px] font-semibold text-[#0f172a]">No delivered orders yet</p>
              <p className="mt-3 text-[14px] leading-[1.75]">Delivered orders will appear here once they are confirmed.</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[40px] bg-white p-[30px] shadow-[0_20px_60px_rgba(20,64,122,0.08)] ring-1 ring-[#e2e8f0]/70">
        <div className="absolute -left-[80px] top-[24px] h-[170px] w-[170px] rounded-full bg-[#dbeafe] blur-[80px]" />
        <div className="relative z-10 space-y-[28px] max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          <div className="space-y-3 text-center sm:text-left">
            <p className="text-[28px] font-bold text-[#0f172a]">Your Profile</p>
            <p className="text-[14px] text-[#64748b]">Update your name, contact details, and profile image for a more personal ordering experience.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Saved spots", value: "2" },
              { label: "Weekly orders", value: "3" },
              { label: "Favorite", value: "BBQ platter" },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-[16px]">
                <p className="text-[18px] font-semibold text-[#0f172a]">{item.value}</p>
                <p className="mt-1 text-[13px] text-[#64748b]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="h-[120px] w-full overflow-hidden rounded-[30px] bg-[#f5f5f5] border border-[#e2e8f0]">
              {user?.profileImage || profileForm.profileImage ? (
                <img
                  alt={user?.name ? `${user.name} avatar` : "Profile"}
                  src={user?.profileImage ?? profileForm.profileImage ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[28px] font-semibold text-[#7a7a7a]">{profileForm.name.charAt(0).toUpperCase() || "U"}</div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[15px] font-semibold text-[#0f172a]">Profile image URL</p>
              <input
                value={profileForm.profileImage}
                onChange={(event) => onChange("profileImage", event.target.value)}
                className="h-[46px] w-full rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-[18px] text-[15px] text-[#0f172a] outline-none focus:border-[#d51d1d] focus:ring-2 focus:ring-[#d51d1d]/20"
                placeholder="Paste image URL"
              />
            </div>
          </div>

          <div className="grid gap-[18px]">
            <label className="space-y-2 text-[14px] text-[#334155]">
              <span className="font-semibold text-[#0f172a]">Full name</span>
              <input
                value={profileForm.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="h-[54px] w-full rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] px-[20px] text-[15px] text-[#0f172a] outline-none focus:border-[#d51d1d] focus:ring-2 focus:ring-[#d51d1d]/20"
                placeholder="Your name"
              />
            </label>
            <label className="space-y-2 text-[14px] text-[#334155]">
              <span className="font-semibold text-[#0f172a]">Email address</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => onChange("email", event.target.value)}
                className="h-[54px] w-full rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] px-[20px] text-[15px] text-[#0f172a] outline-none focus:border-[#d51d1d] focus:ring-2 focus:ring-[#d51d1d]/20"
                placeholder="you@example.com"
              />
            </label>
            <label className="space-y-2 text-[14px] text-[#334155]">
              <span className="font-semibold text-[#0f172a]">Phone number</span>
              <input
                value={profileForm.phone}
                onChange={(event) => onChange("phone", event.target.value)}
                className="h-[54px] w-full rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] px-[20px] text-[15px] text-[#0f172a] outline-none focus:border-[#d51d1d] focus:ring-2 focus:ring-[#d51d1d]/20"
                placeholder="123-456-7890"
              />
            </label>
            <label className="space-y-2 text-[14px] text-[#334155]">
              <span className="font-semibold text-[#0f172a]">Delivery address</span>
              <textarea
                value={profileForm.address}
                onChange={(event) => onChange("address", event.target.value)}
                className="h-[120px] w-full resize-none rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] px-[20px] py-[16px] text-[15px] text-[#0f172a] outline-none focus:border-[#d51d1d] focus:ring-2 focus:ring-[#d51d1d]/20"
                placeholder="Street, city, zip code"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {status ? <p className="text-[14px] text-[#2f803a]">{status}</p> : <p className="text-[14px] text-[#64748b]">Keep your contact details up to date for faster orders.</p>}
            </div>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-[56px] items-center justify-center rounded-full bg-[#d51d1d] px-8 text-[15px] font-semibold text-white transition hover:bg-[#b32727]"
            >
              Save profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioPanel() {
  const socialLinks = [
    { label: "Facebook", href: "https://facebook.com/ChillinganRestogrill", style: "bg-[#1877f2] hover:bg-[#145dbf]" },
    { label: "Instagram", href: "https://instagram.com/ChillinganRestogrill", style: "bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90" },
    { label: "TikTok", href: "https://tiktok.com/@ChillinganRestogrill", style: "bg-black hover:bg-[#111]" },
  ];

  return (
    <div
      className="absolute left-[220px] top-[145px] z-[60] grid h-[700px] min-w-[980px] grid-cols-[380px_1fr] gap-5"
      style={{ width: "min(1240px, calc(100vw - 260px))" }}
    >
      <div className="relative overflow-hidden rounded-[40px] bg-[#111111] p-[26px] shadow-[0_40px_120px_rgba(0,0,0,0.24)] ring-1 ring-white/10">
        <div className="absolute -left-[90px] top-[20px] h-[180px] w-[180px] rounded-full bg-[#ff2f56]/20 blur-[80px]" />
        <p className="text-[20px] font-semibold text-white">Chillingan Social</p>
        <p className="mt-3 text-[14px] text-[#bcbcbc]">Keep up with our latest promos, menu drops, and local updates across every channel.</p>

        <div className="mt-8 space-y-4">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={`${link.style} inline-flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-sm font-semibold text-white transition`}
            >
              <span>{link.label}</span>
              <span className="text-[13px] opacity-90">Visit</span>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-[22px]">
          <p className="text-[15px] font-semibold text-white">Platform stats</p>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Likes", value: "1.2K" },
              { label: "Followers", value: "1.2K" },
              { label: "Reviews", value: "2" },
            ].map((item) => (
              <div key={item.label} className="rounded-[22px] bg-white/5 px-4 py-3 text-[14px] text-[#d7d7d7]">
                <p className="font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-[#b8b8b8]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[32px] bg-white/5 p-[22px] text-[14px] text-[#d8d8d8]">
          <p className="font-semibold text-white">Quick info</p>
          <ul className="mt-3 space-y-3 text-[#c2c2c2]">
            <li>📍 Purok 15, Sayre Highway, Bagontaas, Valencia, Philippines, 8709</li>
            <li>🕒 Always open</li>
            <li>⭐ Barbecue Restaurant · Family dining · Sports bar</li>
          </ul>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[40px] bg-[#0f0f0f] p-[32px] shadow-[0_40px_120px_rgba(0,0,0,0.28)] ring-1 ring-white/10">
        <div className="absolute -right-[100px] top-[20px] h-[220px] w-[220px] rounded-full bg-[#f7c948]/15 blur-[100px]" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[32px] font-bold text-white">Chillingan Restogrill</p>
            <p className="mt-2 text-[14px] text-[#bcbcbc]">Restaurant and Sports Bar</p>
          </div>
          <div className="rounded-[22px] bg-[#ffffff0d] px-4 py-2 text-[13px] font-semibold text-[#f7c948]">Local favorite</div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Likes", value: "1.2K" },
            { label: "Followers", value: "1.2K" },
            { label: "Reviews", value: "2" },
          ].map((item) => (
            <div key={item.label} className="rounded-[28px] bg-white/5 p-[20px]">
              <p className="text-[28px] font-bold text-white">{item.value}</p>
              <p className="mt-2 text-[13px] text-[#b8b8b8]">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-[24px] text-[#d4d4d4]">
          <p className="text-[16px] font-semibold text-white">About</p>
          <p className="mt-3 text-[14px] leading-[1.8] text-[#b8b8b8]">
            Offers affordable, quality food and a place to CHILL and dine with your family and friends.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[24px] bg-white/5 px-4 py-4 text-[14px] text-[#cfcfcf]">Lives in Valencia, Bukidnon</div>
          <div className="rounded-[24px] bg-white/5 px-4 py-4 text-[14px] text-[#cfcfcf]">Always open</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {["Barbecue Restaurant", "Family dining", "Sports bar"].map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-[#dfdfdf]">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute h-[245px] left-[605px] top-[192px] w-[433.5px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 433.5 245">
        <g id="Group 2">
          <path d={svgPaths.p14c1a940} fill="var(--fill-0, #FF7A05)" id="Rectangle 9" opacity="0.85" />
          <path d={svgPaths.p22cd400} fill="var(--fill-0, #F94B4B)" id="Rectangle 8" opacity="0.85" />
          <g id="Group 1">
            <circle cx="376" cy="230" fill="var(--fill-0, white)" id="Ellipse 1" r="5" />
            <circle cx="391" cy="230" fill="var(--fill-0, #D5D0D0)" id="Ellipse 2" r="5" />
            <circle cx="406" cy="230" fill="var(--fill-0, #D4D0D0)" id="Ellipse 3" r="5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute left-[376px] size-[45px] top-[603px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
        <g id="Group 5">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
          <path d={svgPaths.pd27c300} fill="var(--fill-0, #D82015)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute left-[1449px] size-[45px] top-[886px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
        <g id="Group 5">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
          <path d={svgPaths.pd27c300} fill="var(--fill-0, #D82015)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-[1100px] top-[874px]">
      <div className="absolute left-[1100px] size-[45px] top-[886px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
        </svg>
      </div>
      <div className="absolute inset-[85.36%_30%_12.56%_68.46%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0005 21.8754">
          <path d={svgPaths.p26f3c680} fill="var(--fill-0, #D82015)" id="Vector" />
        </svg>
      </div>
      <div className="absolute h-[153px] left-[1238px] rounded-[20px] top-[874px] w-[266px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <Group7 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-[736px] top-[874px]">
      <div className="absolute left-[736px] size-[45px] top-[886px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
        </svg>
      </div>
      <div className="absolute inset-[85.36%_52.47%_12.56%_45.99%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0005 21.8754">
          <path d={svgPaths.p26f3c680} fill="var(--fill-0, #D82015)" id="Vector" />
        </svg>
      </div>
      <div className="absolute h-[153px] left-[889px] rounded-[20px] top-[874px] w-[266px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <img alt="" className="absolute h-[260.78%] left-[-3.21%] max-w-none top-[-150.07%] w-full" src={imgRectangle7} />
          </div>
        </div>
      </div>
      <Group6 />
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute contents left-[376px] top-[874px]">
      <div className="absolute left-[376px] size-[45px] top-[886px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
        </svg>
      </div>
      <div className="absolute inset-[85.36%_74.69%_12.56%_23.77%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0005 21.8754">
          <path d={svgPaths.p26f3c680} fill="var(--fill-0, #D82015)" id="Vector" />
        </svg>
      </div>
      <div className="absolute h-[153px] left-[525px] rounded-[20px] top-[874px] w-[266px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <img alt="" className="absolute h-[260.78%] left-[-0.1%] max-w-none top-[-151.93%] w-full" src={imgRectangle7} />
          </div>
        </div>
      </div>
      <Group5 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute left-[1449px] size-[45px] top-[603px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
        <g id="Group 5">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
          <path d={svgPaths.pd27c300} fill="var(--fill-0, #D82015)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents left-[1100px] top-[591px]">
      <div className="absolute left-[1100px] size-[45px] top-[603px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
        </svg>
      </div>
      <div className="absolute inset-[58.46%_30%_39.46%_68.46%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0005 21.8754">
          <path d={svgPaths.p26f3c680} fill="var(--fill-0, #D82015)" id="Vector" />
        </svg>
      </div>
      <div className="absolute h-[153px] left-[1238px] rounded-[20px] top-[591px] w-[266px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <img alt="" className="absolute h-[260.78%] left-[0.1%] max-w-none top-[-167.73%] w-full" src={imgRectangle7} />
          </div>
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium leading-[normal] left-[1251px] text-[24px] text-black top-[761px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        Barbeque
      </p>
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[1442px] text-[24px] text-black top-[761px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        P 39
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium leading-[normal] left-[1250px] text-[#797575] text-[20px] top-[798px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>{`Fast-Food `}</p>
      <Group9 />
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute contents left-[736px] top-[591px]">
      <div className="absolute left-[736px] size-[45px] top-[603px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
          <circle cx="22.5" cy="22.5" fill="var(--fill-0, white)" fillOpacity="0.7" id="Ellipse 4" r="22.5" />
        </svg>
      </div>
      <div className="absolute inset-[58.46%_52.47%_39.46%_45.99%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0005 21.8754">
          <path d={svgPaths.p26f3c680} fill="var(--fill-0, #D82015)" id="Vector" />
        </svg>
      </div>
      <div className="absolute h-[153px] left-[889px] rounded-[20px] top-[591px] w-[266px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium leading-[normal] left-[902px] text-[24px] text-black top-[761px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        Fried Chicken
      </p>
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[1093px] text-[24px] text-black top-[761px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        P 39
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium leading-[normal] left-[901px] text-[#797575] text-[20px] top-[798px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>{`Fast-Food `}</p>
      <Group8 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[1235px] top-[81px]">
      <div className="absolute bg-[#ff7a05] h-[56px] left-[1235px] rounded-[20px] top-[81px] w-[223px]" />
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute contents left-[1235px] top-[81px]">
      <Group3 />
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[1258px] text-[20px] text-white top-[94px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        View Cart
      </p>
    </div>
  );
}

function Frame({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (value: string) => void }) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-[521px]">
      <div className="h-[40px] relative rounded-[40px] shrink-0 w-[521px]" data-name="searchBox">
        <div aria-hidden="true" className="absolute border border-[#f5f5f5] border-solid inset-[-0.5px] pointer-events-none rounded-[40.5px]" />
        <div className="-translate-y-1/2 absolute left-[8px] overflow-clip size-[24px] top-1/2" data-name="icon/search">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector" />
          </svg>
          <div className="absolute inset-[12.5%_29.17%_29.17%_12.5%]" data-name="Vector">
            <div className="absolute inset-[-5.36%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.5 15.5">
                <path d={svgPaths.p30ddac70} id="Vector" stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-[62.5%_12.5%_12.5%_62.5%]" data-name="Vector">
            <div className="absolute inset-[-12.5%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.5 7.5">
                <path d="M6.75 6.75L0.75 0.75" id="Vector" stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
        <input
          type="search"
          aria-label="Search food items"
          placeholder="Search everything"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="absolute inset-y-0 left-[48px] right-[20px] rounded-[20px] bg-transparent border-none px-0 py-0 text-[25px] text-[#8e8e8e] outline-none"
        />
      </div>
    </div>
  );
}

function Frame1({ searchQuery, setSearchQuery, user }: { searchQuery: string; setSearchQuery: (value: string) => void; user?: User | null }) {
  return (
    <div className="absolute bg-[#fff3f3] content-stretch flex gap-[182px] h-[76px] items-center justify-center left-[217px] top-[69px] w-[981px]">
      <Frame searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="flex h-[30px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "21" } as CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[30px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 1">
                <line id="Line 2" stroke="var(--stroke-0, #DDDDDD)" x2="30" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-[40px] w-[40px] rounded-full overflow-hidden border border-[#f5f5f5] bg-white shadow-sm shadow-slate-200" data-name="Avatar">
        {user?.profileImage ? (
          <img alt={`${user.name} avatar`} className="h-full w-full object-cover" src={user.profileImage} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm font-semibold text-slate-700">
            {user?.name.charAt(0).toUpperCase() ?? "U"}
          </div>
        )}
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[0.01%_0_0_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 44.9998">
        <g id="Group">
          <path d={svgPaths.p2dcd6e00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[0_16.67%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.0013 45.0014">
        <g id="Group">
          <path d={svgPaths.p150d9600} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p22e48a80} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string;
}

function CategorySelector({ selectedCategory, onSelectCategory }: { selectedCategory: DesktopCategoryName; onSelectCategory: (cat: DesktopCategoryName) => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);

  const updateScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      if (scrollWidth <= clientWidth) {
        setThumbLeft(0);
        setThumbWidth(100);
      } else {
        const visibleRatio = clientWidth / scrollWidth;
        const newWidth = Math.max(visibleRatio * 100, 12);
        const newLeft = Math.min((scrollLeft / (scrollWidth - clientWidth)) * (100 - newWidth), 100 - newWidth);
        setThumbLeft(newLeft);
        setThumbWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    updateScroll();
    window.addEventListener("resize", updateScroll);
    return () => window.removeEventListener("resize", updateScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 420;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScroll, 300);
    }
  };

  return (
    <div className="absolute left-[232px] top-[460px] h-[100px] w-[1300px] flex items-center gap-3 z-50">
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`flex-shrink-0 flex h-[42px] w-[42px] items-center justify-center rounded-full transition-all duration-200 ${
          canScrollLeft
            ? 'bg-[#d51d1d] text-white hover:bg-[#c41515] shadow-md'
            : 'bg-[#ececec] text-[#999] cursor-not-allowed'
        }`}
      >
        <span className="text-lg">&lt;</span>
      </button>

      <div className="flex-1 min-w-0 w-full">
        <div
          ref={scrollContainerRef}
          onScroll={updateScroll}
          className="w-full flex overflow-x-auto overflow-y-hidden scrollbar-transparent scroll-smooth"
        >
          <div className="flex gap-3 px-2 py-2 min-w-min">
            {CATEGORY_LABELS.map((label) => {
              const isActive = selectedCategory === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectCategory(label)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-[14px] font-['DM_Sans:Medium',sans-serif] font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#d51d1d] text-white shadow-[0_10px_25px_rgba(213,29,29,0.18)]'
                      : 'bg-white border border-[#e8e8e8] text-[#333] hover:border-[#d51d1d] hover:text-[#d51d1d]'
                  }`}
                  style={{ fontVariationSettings: "'opsz' 14" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-[#f3f3f3]">
          <div
            className="h-full rounded-full bg-[#d51d1d] transition-all duration-200"
            style={{ width: `${thumbWidth}%`, marginLeft: `${thumbLeft}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`flex-shrink-0 flex h-[42px] w-[42px] items-center justify-center rounded-full transition-all duration-200 ${
          canScrollRight
            ? 'bg-[#d51d1d] text-white hover:bg-[#c41515]'
            : 'bg-[#ececec] text-[#999] cursor-not-allowed'
        }`}
      >
        <span className="text-lg">&gt;</span>
      </button>
    </div>
  );
}

export default function AdminSide({ onProductSelect, onCartClick, onLogout, user, deliveredOrders }: { onProductSelect?: (product: Product) => void; onCartClick?: () => void; onLogout?: () => void; user?: User | null; deliveredOrders?: Order[] }) {
  const [activeSidebarIcon, setActiveSidebarIcon] = useState<SidebarIconName>("home");
  const [selectedCategory, setSelectedCategory] = useState<DesktopCategoryName>("Sizzling Meal");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUser, setProfileUser] = useState<User | null>(user ?? null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    profileImage: user?.profileImage ?? "",
  });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const { products: storedProducts, loading } = useProducts({ autoFetch: true });
  
  const isChatActive = activeSidebarIcon === "comment";
  const isProfileActive = activeSidebarIcon === "user";
  const isPortfolioActive = activeSidebarIcon === "heart";
  const isHomeActive = activeSidebarIcon === "home";
  
  const filteredProducts = storedProducts
    .filter((product) => product.visible !== false)
    .filter(
      (product) =>
        product.category === selectedCategory &&
        (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );

  useEffect(() => {
    if (user) {
      setProfileUser(user);
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage ?? "",
      });
    }
  }, [user]);

  const handleProfileChange = (field: keyof ProfileFormState, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
    setProfileStatus(null);
  };

  const handleSaveProfile = () => {
    if (!profileUser) return;

    const updatedUser: User = {
      ...profileUser,
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      address: profileForm.address,
      profileImage: profileForm.profileImage.trim() || null,
    };

    updateUser(updatedUser);
    setProfileUser(updatedUser);
    setProfileStatus("Profile updated successfully.");
  };

  return (
    <div className="bg-[#f1e6d2] relative size-full" data-name="ADMIN SIDE">
      <Sidebar activeIcon={activeSidebarIcon} />
      {isChatActive && (
        <div className="absolute inset-y-0 right-0 left-[118px] z-40 pointer-events-auto" />
      )}
      {isChatActive ? (
        <>
          <SupportChatPanel />
          <ChatSidebarInfo />
        </>
      ) : isPortfolioActive ? (
        <PortfolioPanel />
      ) : isProfileActive ? (
        <ProfilePanel profileForm={profileForm} onChange={handleProfileChange} onSave={handleSaveProfile} status={profileStatus} user={profileUser} deliveredOrders={deliveredOrders} />
      ) : (
        <>
          <CategorySelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <div className="absolute flex h-[245px] items-center justify-center left-[605px] top-[192px] w-[899px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[245px] relative rounded-[20px] w-[899px]">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
              <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
              <div className="absolute inset-0 overflow-hidden rounded-[20px]">
                <img alt="" className="absolute h-[559.67%] left-[-1.72%] max-w-none top-[-325.25%] w-[101.68%]" src={imgRectangle7} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Group2 />
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[706px] text-[36px] text-white top-[332px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        Services
      </p>
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[687px] text-[40px] text-black top-[280px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        Our Other
      </p>
      <div className="absolute flex h-[5px] items-center justify-center left-[232px] top-[548px] w-[1272px]">
        <div className="-scale-y-100 flex-none">
          <div className="bg-[#d9d9d9] h-[5px] w-[1272px]" />
        </div>
      </div>
      <div className="absolute left-[165px] top-[591px] h-[450px] w-[1340px] overflow-y-auto overflow-x-hidden pr-4 scrollbar-transparent">
        <div className="grid h-full grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <DesktopProductCard key={product.id} product={product} onProductSelect={onProductSelect} />
          ))}
        </div>
      </div>
      <Frame1 searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={profileUser} />
        </>
      )}
      <button
        type="button"
        onClick={() => setActiveSidebarIcon("heart")}
        aria-pressed={activeSidebarIcon === "heart"}
        className={
          "absolute left-[34px] overflow-clip size-[45px] top-[653px] transition-all duration-200 " +
          (activeSidebarIcon === "heart" ? "bg-white/15 rounded-full" : "")
        }
        data-name="heart"
      >
        <div className="absolute inset-[7.99%_-0.02%_4.11%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45.0182 39.555">
            <path d={svgPaths.p3de2ea00} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setActiveSidebarIcon("home")}
        aria-pressed={activeSidebarIcon === "home"}
        className={
          "absolute left-[34px] overflow-clip size-[45px] top-[399px] transition-all duration-200 " +
          (activeSidebarIcon === "home" ? "bg-white/15 rounded-full" : "")
        }
        data-name="home"
      >
        <Group />
      </button>
      <button
        type="button"
        onClick={() => setActiveSidebarIcon("user")}
        aria-pressed={activeSidebarIcon === "user"}
        className={
          "absolute left-[34px] overflow-clip size-[45px] top-[526px] transition-all duration-200 " +
          (activeSidebarIcon === "user" ? "bg-white/15 rounded-full" : "")
        }
        data-name="user"
      >
        <Group1 />
      </button>
      <button
        type="button"
        onClick={() => setActiveSidebarIcon("comment")}
        aria-pressed={activeSidebarIcon === "comment"}
        className={
          "absolute left-[34px] overflow-clip size-[45px] top-[272px] transition-all duration-200 " +
          (activeSidebarIcon === "comment" ? "bg-white/15 rounded-full" : "")
        }
        data-name="comment"
      >
        <div className="absolute inset-[-0.09%_0_0_0]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44.9981 45.0413">
            <path d={svgPaths.p21db3ec0} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_41.67%_54.17%_33.33%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.25 5.625">
            <path d={svgPaths.p56cac70} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[33.33%] left-[33.33%] right-1/4 top-[54.17%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.75 5.625">
            <path d={svgPaths.p1b45d800} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </button>
      <div
        className={isHomeActive || isChatActive ? "absolute h-[368px] top-[145px] w-[552px]" : "hidden"}
        style={{ left: isChatActive ? 180 : 120 }}
        data-name="Chillingan Header"
      >
        <img alt="" className="absolute inset-0 max-w-none mix-blend-darken object-cover pointer-events-none size-full" src={imgChillinganHeader} />
      </div>
      <div className={!isHomeActive ? "hidden" : "absolute right-[60px] top-[80px] flex items-center gap-3"}>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-[56px] items-center justify-center rounded-full border border-white/20 bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-200 transition hover:bg-slate-100"
          >
            Logout
          </button>
        )}
        <button
          type="button"
          onClick={() => onCartClick?.()}
          className="flex h-[56px] min-w-[170px] items-center gap-3 rounded-full bg-[#ff7a05] px-4 py-2 text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:scale-[1.02]"
          data-name="shopping cart 1"
        >
          <div className="relative h-[40px] w-[40px] flex-none rounded-full bg-white/20">
            <img alt="" className="h-full w-full object-cover" src={imgShoppingCart1} />
          </div>
          <span className="font-semibold text-sm">View Cart</span>
        </button>
      </div>
    </div>
  );
}