import { useEffect, useMemo, useState } from "react";
import type { AdminSettings } from "../../api/adminSettingsAPI";

const LIVE_CHAT_STORAGE_KEY = "chillingan_live_chat_request";
const ADMIN_SETTINGS_STORAGE_KEY = "admin_settings";

type LiveChatRequestStatus = "waiting" | "connected" | "closed";

interface LiveChatRequest {
  id: string;
  status: LiveChatRequestStatus;
  customerMessages: string[];
  adminMessages: string[];
  requestedAt: number;
  updatedAt: number;
}

const parseAdminSettings = (): Pick<AdminSettings, "liveAgentAvailable" | "liveAgentName"> => {
  if (typeof window === "undefined") {
    return { liveAgentAvailable: false, liveAgentName: "Lara" };
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
    if (!raw) return { liveAgentAvailable: false, liveAgentName: "Lara" };
    const settings = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      liveAgentAvailable: Boolean(settings.liveAgentAvailable),
      liveAgentName: settings.liveAgentName || "Lara",
    };
  } catch {
    return { liveAgentAvailable: false, liveAgentName: "Lara" };
  }
};

const loadStoredChatRequest = (): LiveChatRequest | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LiveChatRequest;
  } catch {
    return null;
  }
};

const saveChatRequest = (request: LiveChatRequest | null) => {
  if (typeof window === "undefined") return;
  if (!request) {
    window.localStorage.removeItem(LIVE_CHAT_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(LIVE_CHAT_STORAGE_KEY, JSON.stringify(request));
};

export default function SupportChatAdminPanel() {
  const [liveChatRequest, setLiveChatRequest] = useState<LiveChatRequest | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [settings, setSettings] = useState(parseAdminSettings());

  useEffect(() => {
    setLiveChatRequest(loadStoredChatRequest());

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === LIVE_CHAT_STORAGE_KEY) {
        setLiveChatRequest(event.newValue ? (JSON.parse(event.newValue) as LiveChatRequest) : null);
      }
      if (event.key === ADMIN_SETTINGS_STORAGE_KEY) {
        setSettings(parseAdminSettings());
      }
    };

    const handleSettingsUpdated = () => setSettings(parseAdminSettings());

    window.addEventListener("storage", handleStorage);
    window.addEventListener("admin_settings_updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("admin_settings_updated", handleSettingsUpdated);
    };
  }, []);

  const handleAcceptRequest = () => {
    if (!liveChatRequest) return;
    const nextRequest: LiveChatRequest = {
      ...liveChatRequest,
      status: "connected",
      adminMessages: [
        ...liveChatRequest.adminMessages,
        `Hi, I’m ${settings.liveAgentName} from Chillingan support. I’m here to help you directly.`,
      ],
      updatedAt: Date.now(),
    };
    saveChatRequest(nextRequest);
    setLiveChatRequest(nextRequest);
  };

  const handleSendAdminMessage = () => {
    if (!liveChatRequest || !adminMessage.trim()) return;
    const nextRequest: LiveChatRequest = {
      ...liveChatRequest,
      status: liveChatRequest.status === "closed" ? "connected" : liveChatRequest.status,
      adminMessages: [...liveChatRequest.adminMessages, adminMessage.trim()],
      updatedAt: Date.now(),
    };
    saveChatRequest(nextRequest);
    setLiveChatRequest(nextRequest);
    setAdminMessage("");
  };

  const handleCloseRequest = () => {
    if (!liveChatRequest) return;
    const nextRequest: LiveChatRequest = {
      ...liveChatRequest,
      status: "closed",
      updatedAt: Date.now(),
    };
    saveChatRequest(nextRequest);
    setLiveChatRequest(nextRequest);
  };

  const conversation = useMemo(() => {
    if (!liveChatRequest) return [] as { sender: "customer" | "admin"; text: string }[];
    const customer = liveChatRequest.customerMessages.map((text) => ({ sender: "customer" as const, text }));
    const admin = liveChatRequest.adminMessages.map((text) => ({ sender: "admin" as const, text }));
    return [...customer, ...admin];
  }, [liveChatRequest]);

  const requestLabel = liveChatRequest
    ? liveChatRequest.status === "waiting"
      ? "Pending live support request"
      : liveChatRequest.status === "connected"
        ? "Active live chat"
        : "Closed live support session"
    : "No live support requests yet";

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold text-slate-900">Live chat support</p>
            <p className="mt-2 text-sm text-slate-600">Manage live customer chat requests and respond from the admin dashboard.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            {settings.liveAgentAvailable ? `Live agent available: ${settings.liveAgentName}` : "Live agent offline"}
          </span>
        </div>

        {/* Support Statistics Dashboard */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Today's Chats</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
              </div>
              <div className="rounded-full bg-white/80 p-3">
                <svg className="h-6 w-6 text-[#0369a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-gradient-to-br from-[#fef3c7] to-[#fde68a] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Avg Response Time</p>
                <p className="text-2xl font-bold text-slate-900">2.3m</p>
              </div>
              <div className="rounded-full bg-white/80 p-3">
                <svg className="h-6 w-6 text-[#92400e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Satisfaction Rate</p>
                <p className="text-2xl font-bold text-slate-900">94%</p>
              </div>
              <div className="rounded-full bg-white/80 p-3">
                <svg className="h-6 w-6 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-gradient-to-br from-[#fce7f3] to-[#fbcfe8] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Active Now</p>
                <p className="text-2xl font-bold text-slate-900">{liveChatRequest ? "1" : "0"}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3">
                <svg className="h-6 w-6 text-[#be185d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-700">{requestLabel}</p>
            <p className="mt-2 text-sm text-slate-600">{liveChatRequest ? "Review the customer message and reply directly here." : "When a customer requests live support, the request will appear here."}</p>

            {liveChatRequest ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] bg-[#f8fafc] p-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#475569]">Request details</p>
                  <p className="mt-3 text-sm text-slate-600">Requested {new Date(liveChatRequest.requestedAt).toLocaleString()}.</p>
                  <p className="mt-2 text-sm text-slate-700">Status: <span className="font-semibold text-slate-900">{liveChatRequest.status}</span></p>
                </div>

                <div className="max-h-[260px] overflow-y-auto rounded-[24px] border border-slate-200 bg-[#f7f7ff] p-4">
                  {conversation.map((message, index) => (
                    <div key={index} className={`rounded-2xl p-3 ${message.sender === "customer" ? "bg-[#fff3f3] text-[#1f1f1f]" : "bg-[#e2f0ff] text-[#0f172a]"}`}>
                      <p className="text-sm leading-6">{message.text}</p>
                    </div>
                  ))}
                  {conversation.length === 0 && <p className="text-sm text-slate-500">No messages have been exchanged yet.</p>}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                No live chat request is waiting right now. Customers can request a live employee from the support widget while browsing.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">Send response</p>
                <p className="mt-2 text-sm text-slate-600">Send a message directly to the support chat session.</p>
              </div>
              <textarea
                rows={6}
                value={adminMessage}
                onChange={(event) => setAdminMessage(event.target.value)}
                placeholder="Write your response here..."
                className="mt-4 w-full rounded-[20px] border border-slate-200 bg-[#f8fafc] p-4 text-sm text-slate-900 outline-none transition focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!liveChatRequest}
                  onClick={handleSendAdminMessage}
                  className="rounded-full bg-[#1f5eff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1648c2] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Send response
                </button>
                <button
                  type="button"
                  disabled={!liveChatRequest || liveChatRequest.status === "connected"}
                  onClick={handleAcceptRequest}
                  className="rounded-full border border-[#d1d5db] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Accept request
                </button>
                <button
                  type="button"
                  disabled={!liveChatRequest}
                  onClick={handleCloseRequest}
                  className="rounded-full bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[#fecaca] disabled:cursor-not-allowed disabled:bg-slate-200"
                >
                  Close request
                </button>
              </div>
            </div>

            {/* Quick Response Templates */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">Quick responses</p>
                <p className="mt-2 text-sm text-slate-600">Use these templates to respond faster to common questions.</p>
              </div>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setAdminMessage("Thank you for reaching out! I'm here to help. Could you please provide more details about your question?")}
                  className="w-full rounded-[16px] border border-slate-200 bg-[#f8fafc] p-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                >
                  <p className="font-semibold">Greeting & Request Details</p>
                  <p className="mt-1 text-xs text-slate-500">Thank you for reaching out! I'm here to help...</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminMessage("I understand your concern. Let me check our system and get back to you with the most accurate information.")}
                  className="w-full rounded-[16px] border border-slate-200 bg-[#f8fafc] p-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                >
                  <p className="font-semibold">Checking System</p>
                  <p className="mt-1 text-xs text-slate-500">I understand your concern. Let me check...</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminMessage("Great question! Here's what you need to know: [Insert detailed response here]")}
                  className="w-full rounded-[16px] border border-slate-200 bg-[#f8fafc] p-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                >
                  <p className="font-semibold">Providing Information</p>
                  <p className="mt-1 text-xs text-slate-500">Great question! Here's what you need...</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Guidelines and Recent Activity */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#e0f2fe] p-2">
                <svg className="h-5 w-5 text-[#0369a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Support guidelines</p>
                <p className="text-sm text-slate-600">Best practices for customer support</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-[16px] bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-slate-900">Be empathetic</p>
                <p className="mt-1 text-sm text-slate-600">Always acknowledge customer feelings and show understanding of their situation.</p>
              </div>
              <div className="rounded-[16px] bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-slate-900">Stay professional</p>
                <p className="mt-1 text-sm text-slate-600">Maintain a friendly and professional tone throughout the conversation.</p>
              </div>
              <div className="rounded-[16px] bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-slate-900">Be concise</p>
                <p className="mt-1 text-sm text-slate-600">Provide clear, direct answers without unnecessary information.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#fef3c7] p-2">
                <svg className="h-5 w-5 text-[#92400e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Recent activity</p>
                <p className="text-sm text-slate-600">Latest support interactions</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-[16px] bg-[#f8fafc] p-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Chat session completed</p>
                  <p className="text-xs text-slate-500">2 hours ago • Customer satisfied</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[16px] bg-[#f8fafc] p-3">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">New support request</p>
                  <p className="text-xs text-slate-500">4 hours ago • Order inquiry</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[16px] bg-[#f8fafc] p-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Chat transferred</p>
                  <p className="text-xs text-slate-500">6 hours ago • Technical issue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
