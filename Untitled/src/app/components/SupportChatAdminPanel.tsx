import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminSettings } from "../../api/adminSettingsAPI";
import { SupportChatAPI } from "../../api/supportChatAPI";

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

const saveChatRequest = async (request: LiveChatRequest | null) => {
  if (!request) return;

  try {
    await SupportChatAPI.updateRequest(request.id, {
      status: request.status,
      customerMessages: request.customerMessages,
      adminMessages: request.adminMessages,
      requestedAt: request.requestedAt,
      updatedAt: request.updatedAt,
    });
  } catch (error) {
    console.error("Failed to save live chat request:", error);
  }
};

export default function SupportChatAdminPanel() {
  const [liveChatRequests, setLiveChatRequests] = useState<LiveChatRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [settings, setSettings] = useState(parseAdminSettings());
  const [newCustomerMessages, setNewCustomerMessages] = useState<Record<string, boolean>>({});
  const [removedRequestIds, setRemovedRequestIds] = useState<Record<string, boolean>>({});
  const [showNewRequestAlert, setShowNewRequestAlert] = useState(false);
  const [showNewCustomerReplyAlert, setShowNewCustomerReplyAlert] = useState(false);
  const previousCustomerMessageCountsRef = useRef<Record<string, number>>({});
  const previousWaitingCountRef = useRef(0);
  const isInitialRequestLoad = useRef(true);

  const selectedRequest = liveChatRequests.find((request) => request.id === selectedRequestId) ?? liveChatRequests[0] ?? null;
  const queueRequests = liveChatRequests.filter((request) => !removedRequestIds[request.id]);

  const loadLiveChatRequests = async () => {
    try {
      const requests = await SupportChatAPI.getRequests();
      const waitingCount = requests.filter((request) => request.status === "waiting").length;
      const messageCounts: Record<string, number> = {};

      if (!isInitialRequestLoad.current) {
        if (waitingCount > previousWaitingCountRef.current) {
          setShowNewRequestAlert(true);
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("New support request", {
              body: `You have ${waitingCount} waiting live support request${waitingCount === 1 ? "" : "s"}.`,
              icon: "/favicon.ico",
            });
          }
          window.setTimeout(() => setShowNewRequestAlert(false), 5000);
        }

        const selected = requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null;
        if (selected) {
          const previousCount = previousCustomerMessageCountsRef.current[selected.id] ?? 0;
          if (previousCount > 0 && selected.customerMessages.length > previousCount) {
            setNewCustomerMessages((prev) => ({ ...prev, [selected.id]: true }));
            setShowNewCustomerReplyAlert(true);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("New customer reply", {
                body: selected.customerMessages[selected.customerMessages.length - 1] || "A customer has replied.",
                icon: "/favicon.ico",
              });
            }
            window.setTimeout(() => setShowNewCustomerReplyAlert(false), 5000);
          }
        }
      }

      requests.forEach((request) => {
        messageCounts[request.id] = request.customerMessages.length;
      });
      previousCustomerMessageCountsRef.current = messageCounts;
      previousWaitingCountRef.current = waitingCount;
      isInitialRequestLoad.current = false;
      setLiveChatRequests(requests);

      if (!selectedRequestId && requests.length > 0) {
        setSelectedRequestId(requests[0].id);
      }
      if (selectedRequestId && !requests.find((request) => request.id === selectedRequestId)) {
        setSelectedRequestId(requests[0]?.id ?? null);
      }
    } catch (error) {
      console.error("Failed to load live chat requests:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((error) => console.error("Notification permission request failed:", error));
    }

    void loadLiveChatRequests();
    const interval = window.setInterval(() => {
      void loadLiveChatRequests();
    }, 3000);

    const handleSettingsUpdated = () => setSettings(parseAdminSettings());
    window.addEventListener("admin_settings_updated", handleSettingsUpdated);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("admin_settings_updated", handleSettingsUpdated);
    };
  }, [selectedRequestId]);

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    const nextRequest: LiveChatRequest = {
      ...selectedRequest,
      status: "connected",
      adminMessages: [
        ...selectedRequest.adminMessages,
        `Hi, I’m ${settings.liveAgentName} from Chillingan support. I’m here to help you directly.`,
      ],
      updatedAt: Date.now(),
    };
    await saveChatRequest(nextRequest);
    setLiveChatRequests((prev) => prev.map((request) => (request.id === nextRequest.id ? nextRequest : request)));
    setNewCustomerMessages((prev) => ({ ...prev, [nextRequest.id]: false }));
    setShowNewCustomerReplyAlert(false);
  };

  const handleSendAdminMessage = async () => {
    if (!selectedRequest || !adminMessage.trim()) return;
    const nextRequest: LiveChatRequest = {
      ...selectedRequest,
      status: "connected",
      adminMessages: [...selectedRequest.adminMessages, adminMessage.trim()],
      updatedAt: Date.now(),
    };
    await saveChatRequest(nextRequest);
    setLiveChatRequests((prev) => prev.map((request) => (request.id === nextRequest.id ? nextRequest : request)));
    setAdminMessage("");
    setNewCustomerMessages((prev) => ({ ...prev, [nextRequest.id]: false }));
    setShowNewCustomerReplyAlert(false);
  };

  const handleCloseRequest = async () => {
    if (!selectedRequest) return;
    const nextRequest: LiveChatRequest = {
      ...selectedRequest,
      status: "closed",
      updatedAt: Date.now(),
    };
    await saveChatRequest(nextRequest);
    setLiveChatRequests((prev) => prev.map((request) => (request.id === nextRequest.id ? nextRequest : request)));
    setNewCustomerMessages((prev) => ({ ...prev, [nextRequest.id]: false }));
    setShowNewCustomerReplyAlert(false);
  };

  const handleMarkDone = (requestId: string) => {
    setRemovedRequestIds((prev) => ({ ...prev, [requestId]: true }));
    setLiveChatRequests((prev) => {
      const nextRequests = prev.filter((request) => request.id !== requestId);
      if (selectedRequestId === requestId) {
        setSelectedRequestId(nextRequests[0]?.id ?? null);
      }
      return nextRequests;
    });
    setNewCustomerMessages((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
    setShowNewCustomerReplyAlert(false);
  };

  const getQueueButtonStyles = (request: LiveChatRequest) => {
    if (selectedRequestId === request.id) {
      return "block w-full rounded-[18px] border border-blue-500 bg-blue-50 px-4 py-3 text-left transition";
    }
    if (request.status === "connected") {
      return "block w-full rounded-[18px] border border-emerald-400 bg-emerald-50 px-4 py-3 text-left transition";
    }
    if (request.status === "closed") {
      return "block w-full rounded-[18px] border border-red-400 bg-red-50 px-4 py-3 text-left transition";
    }
    return "block w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300";
  };

  const conversation = useMemo(() => {
    if (!selectedRequest) return [] as { sender: "customer" | "admin"; text: string }[];
    const conversation: { sender: "customer" | "admin"; text: string }[] = [];
    const maxMessages = Math.max(selectedRequest.customerMessages.length, selectedRequest.adminMessages.length);

    for (let index = 0; index < maxMessages; index += 1) {
      if (selectedRequest.customerMessages[index] !== undefined) {
        conversation.push({ sender: "customer", text: selectedRequest.customerMessages[index] });
      }
      if (selectedRequest.adminMessages[index] !== undefined) {
        conversation.push({ sender: "admin", text: selectedRequest.adminMessages[index] });
      }
    }

    return conversation;
  }, [selectedRequest]);

  const requestLabel = selectedRequest
    ? selectedRequest.status === "waiting"
      ? "Pending live support request"
      : selectedRequest.status === "connected"
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
                <p className="text-2xl font-bold text-slate-900">{liveChatRequests.filter((request) => request.status === "connected").length}</p>
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
            <p className="mt-2 text-sm text-slate-600">{selectedRequest ? "Review the customer message and reply directly here." : "When a customer requests live support, the request will appear here."}</p>

            {showNewRequestAlert && (
              <div className="mt-4 rounded-[18px] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
                New support request received.
              </div>
            )}
            {showNewCustomerReplyAlert && selectedRequest && newCustomerMessages[selectedRequest.id] && (
              <div className="mt-4 rounded-[18px] bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 ring-1 ring-sky-200">
                New customer reply on the selected chat.
              </div>
            )}

            {liveChatRequests.length > 0 && (
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Request queue</p>
                <div className="mt-3 space-y-2">
                  {queueRequests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setNewCustomerMessages((prev) => ({ ...prev, [request.id]: false }));
                        setShowNewCustomerReplyAlert(false);
                      }}
                      className={getQueueButtonStyles(request)}>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-sm font-semibold ${request.status === "connected" ? "text-emerald-900" : request.status === "closed" ? "text-red-900" : "text-slate-900"}`}>
                          {request.status === "waiting" ? "Waiting" : request.status === "connected" ? "Connected" : "Closed"}
                        </span>
                        <span className={`text-xs font-semibold ${request.status === "connected" ? "text-emerald-700" : request.status === "closed" ? "text-red-700" : "text-slate-500"}`}>
                          {new Date(request.requestedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-sm text-slate-600 line-clamp-2 flex-1">{request.customerMessages[request.customerMessages.length - 1] ?? "No message yet"}</p>
                        {newCustomerMessages[request.id] && (
                          <span className="rounded-full bg-[#f97316] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            New
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedRequest ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] bg-[#f8fafc] p-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#475569]">Request details</p>
                  <p className="mt-3 text-sm text-slate-600">Requested {new Date(selectedRequest.requestedAt).toLocaleString()}.</p>
                  <p className="mt-2 text-sm text-slate-700">Status: <span className="font-semibold text-slate-900">{selectedRequest.status}</span></p>
                </div>

                <div className="max-h-[260px] overflow-y-auto rounded-[24px] border border-slate-200 bg-[#f7f7ff] p-4">
                  {conversation.length > 0 ? (
                  conversation.map((message, index) => (
                    <div key={index} className={`mb-3 flex ${message.sender === "customer" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] rounded-[28px] p-4 text-sm leading-6 shadow-sm ${
                        message.sender === "customer"
                          ? "bg-[#fff3f3] text-[#1f1f1f] rounded-tr-[28px] rounded-br-[28px] rounded-tl-[6px] rounded-bl-[28px]"
                          : "bg-[#e2f0ff] text-[#0f172a] rounded-tl-[28px] rounded-bl-[28px] rounded-br-[6px] rounded-tr-[28px]"
                      }`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {message.sender === "customer" ? "Customer" : "Admin"}
                        </p>
                        <p className="mt-2 break-words">{message.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No messages have been exchanged yet.</p>
                )}
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
                  disabled={!selectedRequest || selectedRequest.status === "closed"}
                  onClick={handleSendAdminMessage}
                  className="rounded-full bg-[#1f5eff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1648c2] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Send response
                </button>
                <button
                  type="button"
                  disabled={!selectedRequest || selectedRequest.status !== "waiting"}
                  onClick={handleAcceptRequest}
                  className="rounded-full border border-[#d1d5db] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Accept request
                </button>
                <button
                  type="button"
                  disabled={!selectedRequest || selectedRequest.status === "closed"}
                  onClick={handleCloseRequest}
                  className="rounded-full bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[#fecaca] disabled:cursor-not-allowed disabled:bg-slate-200"
                >
                  Close request
                </button>
                {selectedRequest?.status === "closed" && (
                  <button
                    type="button"
                    onClick={() => handleMarkDone(selectedRequest.id)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Mark as done
                  </button>
                )}
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
