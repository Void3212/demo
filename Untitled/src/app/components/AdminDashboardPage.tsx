import { useEffect, useMemo, useState } from "react";
import { type Product, type ProductCategory, isProductVisible } from "../data/products";
import type { User } from "../data/users";
import { useReservationUnits } from "../../hooks/useReservationUnits";
import { ReservationAPI, type Reservation, type WalkIn } from "../../api/reservationAPI";
import { AdminSettingsAPI, type AdminSettings } from "../../api/adminSettingsAPI";
import { UserAPI } from "../../api/userAPI";
import { OrderAPI, type Order, type OrderStatus } from "../../api/orderAPI";
import SupportChatAdminPanel from "./SupportChatAdminPanel";
import {
  type ReservationServiceCategory,
  type ReservationUnit,
} from "../data/reservationData";
import { useProducts } from "../../hooks/useProducts";

const imageImports = import.meta.glob("../../assets/*.{png,jpg,jpeg,webp}", {
  eager: true,
  as: "url",
}) as Record<string, string>;

const availableImages = Object.entries(imageImports)
  .map(([path, url]) => {
    const fileName = path.replace(/^.*[\\/]/, "").replace(/\.(png|jpg|jpeg)$/i, "");
    const label = fileName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { name: label, url };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

interface AdminDashboardPageProps {
  user: User;
  onLogout: () => void;
}

interface EditableProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  imageUrl: string;
}

const navItems = [
  { key: "calendar", label: "Calendar" },
  { key: "schedule", label: "Reservations" },
  { key: "walkins", label: "Walk-ins" },
  { key: "orders", label: "Orders" },
  { key: "onlineOrdering", label: "Online Ordering" },
  { key: "charts", label: "Charts" },
  { key: "history", label: "History" },
  { key: "users", label: "Users" },
  { key: "support", label: "Support" },
  { key: "settings", label: "Settings" },
] as const;

const productCategories: ProductCategory[] = [
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

const emptyEditableProduct: EditableProduct = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "Sizzling Meal",
  imageUrl: "",
};

const emptyReservationUnit: ReservationUnit = {
  id: "",
  serviceId: "billiard",
  name: "",
  description: "",
  imageUrl: "",
  active: true,
};

type HistoryStatus = 'completed' | 'cancelled';
type HistoryEntry =
  | { kind: 'reservation'; item: Reservation; status: HistoryStatus }
  | { kind: 'walkin'; item: WalkIn; status: HistoryStatus };

const HISTORY_STORAGE_KEY = 'admin_booking_history';

export default function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const [activeSection, setActiveSection] = useState<typeof navItems[number]["key"]>("schedule");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "All">("All");
  const [newProduct, setNewProduct] = useState<EditableProduct>(emptyEditableProduct);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSeenReservationsAt, setLastSeenReservationsAt] = useState<number>(() => {
    if (typeof window === 'undefined') return Date.now();
    const stored = window.localStorage.getItem('admin_last_seen_reservations');
    if (!stored) {
      const now = Date.now();
      window.localStorage.setItem('admin_last_seen_reservations', now.toString());
      return now;
    }
    return Number(stored) || Date.now();
  });
  const [lastSeenOrdersAt, setLastSeenOrdersAt] = useState<number>(() => {
    if (typeof window === 'undefined') return Date.now();
    const stored = window.localStorage.getItem('admin_last_seen_orders');
    if (!stored) {
      const now = Date.now();
      window.localStorage.setItem('admin_last_seen_orders', now.toString());
      return now;
    }
    return Number(stored) || Date.now();
  });
  const [historyRecords, setHistoryRecords] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [historyKindFilter, setHistoryKindFilter] = useState<'all' | 'reservation' | 'walkin'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | HistoryStatus>('all');
  const [historyServiceFilter, setHistoryServiceFilter] = useState<'all' | string>('all');
  const [newWalkIn, setNewWalkIn] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    unitId: '',
    unitName: '',
    serviceId: 'billiard',
    serviceName: 'Billiard',
    paymentAmount: 0,
    amountReceived: 0,
    changeAmount: 0,
    paymentMethod: 'cash' as const,
    customerName: '',
    notes: '',
  });

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const currentSlot = useMemo(
    () => `${currentTime.getHours().toString().padStart(2, '0')}:00`,
    [currentTime],
  );
  const currentDate = useMemo(
    () => currentTime.toISOString().split('T')[0],
    [currentTime],
  );
  const isTodaySelected = newWalkIn.date === currentDate;

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRecords));
    } catch {
      // ignore storage errors
    }
  }, [historyRecords]);

  const addHistoryRecord = (record: HistoryEntry) => {
    setHistoryRecords((prev) => [record, ...prev.filter((existing) => existing.item.id !== record.item.id || existing.kind !== record.kind)]);
  };

  const { products: productList, addProduct, updateProduct: updateProductBackend, toggleVisibility, loading } = useProducts({ autoFetch: true });

  const timeSlots = useMemo(
    () => Array.from({ length: 24 }, (_, index) => `${index.toString().padStart(2, "0")}:00`),
    []
  );

  const parseHour = (value: string) => Number(value.split(":")[0]);

  const timeRangesOverlap = (startA: number, endA: number, startB: number, endB: number) =>
    startA < endB && startB < endA;

  const hasTimeConflict = (
    date: string,
    unitId: string,
    startTime: string,
    endTime: string,
  ) => {
    if (!date || !unitId || !startTime || !endTime) {
      return false;
    }

    const startHour = parseHour(startTime);
    const endHour = parseHour(endTime);

    if (endHour <= startHour) {
      return false;
    }

    const reservationConflict = reservations.some((reservation) => {
      if (reservation.status === 'cancelled') return false;
      if (reservation.date !== date || reservation.unitId !== unitId) return false;
      const reservationStart = parseHour(reservation.time);
      const reservationEnd = reservationStart + 1;
      return timeRangesOverlap(startHour, endHour, reservationStart, reservationEnd);
    });

    const walkInConflict = walkIns.some((walkin) => {
      if (walkin.date !== date || walkin.unitId !== unitId) return false;
      const walkInStart = parseHour(walkin.startTime);
      const walkInEnd = parseHour(walkin.endTime);
      return timeRangesOverlap(startHour, endHour, walkInStart, walkInEnd);
    });

    return reservationConflict || walkInConflict;
  };

  const isStartTimeBlocked = (startTime: string) => {
    if (!newWalkIn.unitId) return false;
    if (parseHour(newWalkIn.endTime) <= parseHour(startTime)) return false;
    return hasTimeConflict(newWalkIn.date, newWalkIn.unitId, startTime, newWalkIn.endTime);
  };

  const isEndTimeBlocked = (endTime: string) =>
    Boolean(newWalkIn.unitId && hasTimeConflict(newWalkIn.date, newWalkIn.unitId, newWalkIn.startTime, endTime));

  const getSlotEndTime = (slot: string) => {
    const hour = parseHour(slot);
    const nextHour = hour + 1;
    return nextHour < 24 ? `${nextHour.toString().padStart(2, "0")}:00` : slot;
  };

  const getReservationBadgeStyles = (status: Reservation['status']) => {
    switch (status) {
      case 'cancelled':
        return 'bg-[#fee2e2] text-[#991b1b]';
      case 'confirmed':
        return 'bg-[#dcfce7] text-[#166534]';
      case 'completed':
        return 'bg-[#e0f2fe] text-[#035388]';
      default:
        return 'bg-[#eef2ff] text-[#3730a3]';
    }
  };

  const getReservationCardClasses = (status: Reservation['status']) =>
    status === 'cancelled'
      ? 'rounded-[24px] border border-[#fecaca] bg-[#fff1f2] p-3 shadow-sm'
      : 'rounded-[24px] border border-[#dbe2f0] bg-white p-3 shadow-sm';

  const isPastCalendarSlot = (date: string, time: string) => {
    if (!date || !time) return false;
    const compareDate = currentDate;
    if (date < compareDate) return true;
    if (date > compareDate) return false;
    return parseHour(time) < currentTime.getHours();
  };

  const isSlotBlocked = (slot: string) => {
    if (!newWalkIn.unitId || !newWalkIn.date) return true;
    const slotEnd = getSlotEndTime(slot);
    return hasTimeConflict(newWalkIn.date, newWalkIn.unitId, slot, slotEnd);
  };

  const isSlotInSelectedRange = (slot: string) => {
    const slotHour = parseHour(slot);
    const startHour = parseHour(newWalkIn.startTime);
    const endHour = parseHour(newWalkIn.endTime);
    return slotHour >= startHour && slotHour < endHour;
  };

  const canSelectEndSlot = (slot: string) => {
    if (!newWalkIn.unitId || parseHour(slot) <= parseHour(newWalkIn.startTime)) return false;
    return !hasTimeConflict(newWalkIn.date, newWalkIn.unitId, newWalkIn.startTime, slot);
  };

  const handleSlotClick = (slot: string) => {
    if (!newWalkIn.unitId) return;
    if (isSlotBlocked(slot)) return;

    const slotHour = parseHour(slot);
    const startHour = parseHour(newWalkIn.startTime);

    if (slotHour <= startHour || !canSelectEndSlot(slot)) {
      const nextTime = getSlotEndTime(slot);
      setNewWalkIn((current) => ({ ...current, startTime: slot, endTime: nextTime }));
      return;
    }

    setNewWalkIn((current) => ({ ...current, endTime: slot }));
  };

  const selectedTimeConflict = Boolean(
    newWalkIn.unitId &&
      (parseHour(newWalkIn.endTime) <= parseHour(newWalkIn.startTime) ||
        hasTimeConflict(newWalkIn.date, newWalkIn.unitId, newWalkIn.startTime, newWalkIn.endTime)),
  );

  useEffect(() => {
    if (!newWalkIn.unitId) {
      return;
    }

    if (isStartTimeBlocked(newWalkIn.startTime)) {
      const firstOpenSlot = timeSlots.find((slot) => !isStartTimeBlocked(slot));
      if (firstOpenSlot) {
        setNewWalkIn((current) => ({ ...current, startTime: firstOpenSlot }));
      }
    }
  }, [newWalkIn.unitId, newWalkIn.date, newWalkIn.endTime, reservations, walkIns]);

  const [reservationUsers, setReservationUsers] = useState<User[]>([]);
  const {
    units,
    serviceCategories: unitCategories,
    addUnit,
    updateUnit,
    deleteUnit,
  } = useReservationUnits();
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<ReservationServiceCategory["id"]>(unitCategories[0]?.id ?? "billiard");
  const [unitForm, setUnitForm] = useState<ReservationUnit>(emptyReservationUnit);
  const [editingUnit, setEditingUnit] = useState<ReservationUnit | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    allowGuestCheckout: true,
    emailNotifications: true,
    liveAgentAvailable: false,
    liveAgentName: "Lara",
    businessHours: "10:00 - 22:00",
    defaultCurrency: "PHP",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fetched = await AdminSettingsAPI.getSettings();
        setAdminSettings(fetched);
        localStorage.setItem("admin_settings", JSON.stringify(fetched));
        window.dispatchEvent(new Event("admin_settings_updated"));
      } catch (error) {
        console.error("Failed to load admin settings from backend:", error);
        try {
          const storedSettings = localStorage.getItem("admin_settings");
          if (storedSettings) {
            setAdminSettings(JSON.parse(storedSettings));
            window.dispatchEvent(new Event("admin_settings_updated"));
          }
        } catch (innerError) {
          console.error("Failed to load admin settings from localStorage:", innerError);
        }
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = async <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setAdminSettings((current) => ({ ...current, [key]: value } as AdminSettings));

    try {
      const nextSettings = await AdminSettingsAPI.updateSettings({ [key]: value });
      setAdminSettings(nextSettings);
      localStorage.setItem("admin_settings", JSON.stringify(nextSettings));
      window.dispatchEvent(new Event("admin_settings_updated"));
    } catch (error) {
      console.error("Failed to update admin settings on backend:", error);
      try {
        const next = { ...adminSettings, [key]: value } as AdminSettings;
        localStorage.setItem("admin_settings", JSON.stringify(next));
        window.dispatchEvent(new Event("admin_settings_updated"));
      } catch (innerError) {
        console.error("Failed to save admin settings locally:", innerError);
      }
    }
  };

  const productCount = productList.length;

  const visibleProducts = useMemo(
    () => productList.filter(isProductVisible),
    [productList],
  );

  const hiddenProducts = useMemo(
    () => productList.filter((product) => !isProductVisible(product)),
    [productList],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<ProductCategory | "All", number>();
    counts.set("All", productList.length);
    productCategories.forEach((category) => counts.set(category, 0));
    productList.forEach((product) => {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    });
    return counts;
  }, [productList]);

  const filteredProducts = useMemo(
    () =>
      categoryFilter === "All"
        ? productList
        : productList.filter((product) => product.category === categoryFilter),
    [productList, categoryFilter],
  );

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const allReservations = await ReservationAPI.getAllReservations();
        const active = allReservations.filter(
          (reservation) => reservation.status !== 'cancelled' && reservation.status !== 'completed',
        );
        const archived = allReservations.filter(
          (reservation) => reservation.status === 'cancelled' || reservation.status === 'completed',
        );

        setReservations(active);
        setHistoryRecords((prev) => {
          const merged = [...archived.map((reservation) => ({
            kind: 'reservation' as const,
            item: reservation,
            status: reservation.status === 'cancelled' ? 'cancelled' : 'completed',
          })), ...prev];
          const unique = Array.from(
            merged.reduce((map, record) => {
              const key = `${record.kind}:${record.item.id}`;
              if (!map.has(key)) {
                map.set(key, record);
              }
              return map;
            }, new Map<string, HistoryEntry>()),
          ).map(([, record]) => record);
          return unique;
        });
      } catch (error) {
        console.error('Failed to load reservations:', error);
      }
    };

    const loadWalkIns = async () => {
      try {
        const data = await ReservationAPI.getWalkins();
        setWalkIns(data);
      } catch (error) {
        console.error('Failed to load walk-ins:', error);
        setWalkIns([]);
      }
    };

    const loadOrders = async () => {
      try {
        const data = await OrderAPI.getAllOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
        setOrders([]);
      }
    };

    loadReservations();
    loadWalkIns();
    loadOrders();

    const loadUsers = async () => {
      try {
        const users = await UserAPI.getUsers();
        setReservationUsers(users);
      } catch (error) {
        console.error('Failed to load users for admin dashboard:', error);
        setReservationUsers([]);
      }
    };

    loadUsers();

    const refresh = () => {
      loadReservations();
      loadWalkIns();
      loadUsers();
      loadOrders();
    };

    const intervalId = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Refresh users when entering users section or on window focus
  useEffect(() => {
    const refreshUsers = async () => {
      try {
        const users = await UserAPI.getUsers();
        setReservationUsers(users);
      } catch (error) {
        console.error('Failed to refresh users:', error);
      }
    };

    if (activeSection === 'users') {
      refreshUsers();
    }

    if (activeSection === 'orders') {
      markOrdersSeen();
    }

    if (activeSection === 'schedule') {
      markReservationsSeen();
    }

    window.addEventListener('focus', refreshUsers);

    return () => {
      window.removeEventListener('focus', refreshUsers);
    };
  }, [activeSection]);

  const handleAddWalkIn = async () => {
    if (!newWalkIn.customerName.trim() || !newWalkIn.paymentAmount || !newWalkIn.amountReceived) {
      alert('Please enter customer name, payment amount, and the amount received.');
      return;
    }

    if (!newWalkIn.unitId) {
      alert('Please select a unit for the walk-in.');
      return;
    }

    if (newWalkIn.paymentMethod === 'cash' && newWalkIn.amountReceived < newWalkIn.paymentAmount) {
      alert('Cash received must be equal to or greater than the payment amount.');
      return;
    }

    if (parseHour(newWalkIn.endTime) <= parseHour(newWalkIn.startTime)) {
      alert('End time must be later than start time.');
      return;
    }

    if (hasTimeConflict(newWalkIn.date, newWalkIn.unitId, newWalkIn.startTime, newWalkIn.endTime)) {
      alert('The selected walk-in time conflicts with an existing reservation or walk-in. Please choose a different time.');
      return;
    }

    try {
      const createdWalkIn = await ReservationAPI.createWalkin({
        date: newWalkIn.date,
        startTime: newWalkIn.startTime,
        endTime: newWalkIn.endTime,
        unitId: newWalkIn.unitId,
        unitName: newWalkIn.unitName,
        serviceId: newWalkIn.serviceId,
        serviceName: newWalkIn.serviceName || unitCategories.find((cat) => cat.id === newWalkIn.serviceId)?.label || '',
        paymentAmount: newWalkIn.paymentAmount,
        amountReceived: newWalkIn.amountReceived,
        changeAmount: Math.max(0, newWalkIn.amountReceived - newWalkIn.paymentAmount),
        paymentMethod: newWalkIn.paymentMethod,
        customerName: newWalkIn.customerName,
        notes: newWalkIn.notes,
      });

      setWalkIns((prev) => [...prev, createdWalkIn]);
    } catch (error: any) {
      console.error('Failed to create walk-in:', error);
      alert(`Failed to record walk-in: ${error?.message || 'Please try again.'}`);
      return;
    }

    // Reset form
    setNewWalkIn({
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      unitId: '',
      unitName: '',
      serviceId: 'billiard',
      serviceName: '',
      paymentAmount: 0,
      amountReceived: 0,
      changeAmount: 0,
      paymentMethod: 'cash',
      customerName: '',
      notes: '',
    });
  };

  const handleDeleteWalkIn = async (id: string) => {
    if (!confirm('Cancel this walk-in record?')) return;

    const existingWalkIn = walkIns.find((walkin) => walkin.id === id);
    if (!existingWalkIn) return;

    try {
      await ReservationAPI.deleteWalkin(id);
      setWalkIns((prev) => prev.filter((w) => w.id !== id));
      addHistoryRecord({ kind: 'walkin', item: existingWalkIn, status: 'cancelled' });
    } catch (error) {
      console.error('Failed to delete walk-in:', error);
      alert('Failed to cancel walk-in. Please try again.');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Cancel this reservation?')) return;

    try {
      const cancelledReservation = await ReservationAPI.cancelReservation(reservationId);
      setReservations((prev) => prev.filter((reservation) => reservation.id !== reservationId));
      addHistoryRecord({ kind: 'reservation', item: cancelledReservation, status: 'cancelled' });
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      alert('Failed to cancel reservation. Please try again.');
    }
  };

  const handleConfirmDone = async (
    entry: { kind: 'reservation'; item: Reservation } | { kind: 'walkin'; item: WalkIn }
  ) => {
    if (!confirm('Mark this booking as done and remove it from the calendar?')) return;

    try {
      if (entry.kind === 'walkin') {
        await ReservationAPI.deleteWalkin(entry.item.id);
        setWalkIns((prev) => prev.filter((walkin) => walkin.id !== entry.item.id));
        addHistoryRecord({ kind: 'walkin', item: entry.item, status: 'completed' });
      } else {
        const finishedReservation =
          entry.item.status === 'cancelled'
            ? entry.item
            : await ReservationAPI.updateReservation(entry.item.id, { status: 'completed' });

        setReservations((prev) => prev.filter((reservation) => reservation.id !== entry.item.id));
        addHistoryRecord({
          kind: 'reservation',
          item: finishedReservation,
          status: finishedReservation.status === 'cancelled' ? 'cancelled' : 'completed',
        });
      }
    } catch (error) {
      console.error('Failed to remove completed booking:', error);
      alert('Failed to remove this record. Please try again.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, message?: string) => {
    try {
      const updatedOrder = await OrderAPI.updateOrderStatus(
        orderId,
        status,
        status === 'rejected' ? message : undefined,
      );
      setOrders(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const markReservationsSeen = () => {
    const now = Date.now();
    setLastSeenReservationsAt(now);
    window.localStorage.setItem('admin_last_seen_reservations', now.toString());
  };

  const markOrdersSeen = () => {
    const now = Date.now();
    setLastSeenOrdersAt(now);
    window.localStorage.setItem('admin_last_seen_orders', now.toString());
  };

  const filteredReservations = useMemo(
    () => reservations.filter((reservation) => reservation.serviceId === selectedUnitCategory),
    [reservations, selectedUnitCategory],
  );

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status !== 'cancelled' && reservation.status !== 'completed'),
    [reservations],
  );

  const newReservationsCount = useMemo(
    () => reservations.filter((reservation) => {
      const createdAt = new Date(reservation.createdAt).getTime();
      return createdAt > lastSeenReservationsAt;
    }).length,
    [reservations, lastSeenReservationsAt],
  );

  const newOrdersCount = useMemo(
    () => orders.filter((order) => {
      const createdAt = new Date(order.createdAt).getTime();
      return createdAt > lastSeenOrdersAt;
    }).length,
    [orders, lastSeenOrdersAt],
  );

  const filteredHistoryRecords = useMemo(
    () => historyRecords.filter((entry) => {
      if (historyKindFilter !== 'all' && entry.kind !== historyKindFilter) {
        return false;
      }
      if (historyStatusFilter !== 'all' && entry.status !== historyStatusFilter) {
        return false;
      }
      if (historyServiceFilter !== 'all' && entry.kind === 'reservation' && entry.item.serviceId !== historyServiceFilter) {
        return false;
      }
      return true;
    }),
    [historyRecords, historyKindFilter, historyStatusFilter, historyServiceFilter],
  );

  const historyGroups = useMemo(() => {
    const groups = new Map<string, { date: string; time: string; entries: HistoryEntry[] }>();

    filteredHistoryRecords.forEach((entry) => {
      const date = entry.item.date ?? 'Unknown date';
      const time = entry.kind === 'reservation' ? entry.item.time ?? 'Unknown time' : entry.item.startTime ?? 'Unknown time';
      const key = `${date}||${time}`;
      const existing = groups.get(key);

      if (existing) {
        existing.entries.push(entry);
      } else {
        groups.set(key, { date, time, entries: [entry] });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  }, [filteredHistoryRecords]);

  const calendarGroups = useMemo(() => {
    type CalendarEntry =
      | { kind: 'reservation'; item: Reservation }
      | { kind: 'walkin'; item: WalkIn };

    const groups = new Map<string, { date: string; time: string; entries: CalendarEntry[] }>();

    activeReservations.forEach((reservation) => {
      const date = reservation.date ?? "Unknown date";
      const time = reservation.time ?? "Unknown time";
      const key = `${date}||${time}`;
      const existing = groups.get(key);
      const entry: CalendarEntry = { kind: 'reservation', item: reservation };

      if (existing) {
        existing.entries.push(entry);
      } else {
        groups.set(key, { date, time, entries: [entry] });
      }
    });

    walkIns.forEach((walkin) => {
      const date = walkin.date ?? "Unknown date";
      const time = walkin.startTime ?? "Unknown time";
      const key = `${date}||${time}`;
      const existing = groups.get(key);
      const entry: CalendarEntry = { kind: 'walkin', item: walkin };

      if (existing) {
        existing.entries.push(entry);
      } else {
        groups.set(key, { date, time, entries: [entry] });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  }, [activeReservations, walkIns]);

  const unitCategoryOptions = useMemo(
    () => unitCategories.map((category) => ({ id: category.id, label: category.label })),
    [unitCategories]
  );

  const serviceLabelMap = useMemo(
    () => new Map(unitCategories.map((category) => [category.id, category.label])),
    [unitCategories]
  );

  const filteredUnits = useMemo(
    () => units.filter((unit) => unit.serviceId === selectedUnitCategory),
    [units, selectedUnitCategory]
  );

  const handleToggleVisibility = (productId: string) => {
    toggleVisibility(productId).catch(err => {
      console.error('Failed to toggle visibility:', err);
      alert('Failed to update product visibility. Please try again.');
    });
  };

  const handleUnitFormChange = (field: keyof ReservationUnit, value: string | boolean) => {
    setUnitForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.imageUrl.trim()) {
      alert('Please add a unit name and image before saving.');
      return;
    }

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, {
          ...unitForm,
        });
        setEditingUnit(null);
      } else {
        await addUnit({
          ...unitForm,
          id: `unit-${Date.now()}`,
        });
      }

      setUnitForm(emptyReservationUnit);
    } catch (error) {
      alert('Failed to save unit. Please try again.');
    }
  };

  const handleEditUnit = (unit: ReservationUnit) => {
    setEditingUnit(unit);
    setUnitForm(unit);
  };

  const handleCancelUnitEdit = () => {
    setEditingUnit(null);
    setUnitForm(emptyReservationUnit);
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (confirm('Remove this reservation unit?')) {
      try {
        await deleteUnit(unitId);
      } catch (error) {
        alert('Failed to delete unit. Please try again.');
      }
    }
  };

  const handleNewProductChange = (field: keyof EditableProduct, value: string) => {
    setNewProduct((current) => ({ ...current, [field]: value }));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      ...product,
      price: product.price.toString(),
    });
  };

  const handleEditingProductChange = (field: keyof EditableProduct, value: string) => {
    setEditingProduct((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price.trim()) {
      return;
    }

    try {
      await addProduct({
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: Number(newProduct.price) || 0,
        category: newProduct.category,
        imageUrl:
          newProduct.imageUrl.trim() ||
          `https://via.placeholder.com/260x190.png?text=${encodeURIComponent(newProduct.name.trim() || "New Product")}`,
        rating: 4.5,
        visible: true,
      });
      setNewProduct(emptyEditableProduct);
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) {
      return;
    }

    try {
      const currentProduct = productList.find(p => p.id === editingProduct.id);
      await updateProductBackend(editingProduct.id, {
        name: editingProduct.name.trim(),
        description: editingProduct.description.trim(),
        price: Number(editingProduct.price) || 0,
        category: editingProduct.category,
        imageUrl:
          editingProduct.imageUrl.trim() ||
          `https://via.placeholder.com/260x190.png?text=${encodeURIComponent(editingProduct.name.trim() || "Updated Product")}`,
        rating: currentProduct?.rating ?? 4.5,
      });
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f0e8] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1780px] gap-6 px-4 py-6 md:px-8">
        <aside className="flex w-full max-w-[250px] flex-col rounded-[36px] border border-[#f1e4d3] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.08)]">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#fde7d0] text-xl font-bold text-[#d04b16]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#3c4a33]">Chillingan</p>
                <p className="text-xl font-semibold text-slate-900">ADMIN</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Manage bookings, control the reservation schedule, and publish online ordering.
            </p>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => {
              const active = item.key === activeSection;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`flex w-full items-center justify-between rounded-[24px] px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "border border-[#f1d7bd] bg-[#fff7f1] text-slate-900 shadow-[0_8px_20px_rgba(248,189,143,0.25)]"
                      : "border border-transparent bg-[#f8f5f0] text-slate-700 hover:border-[#f1d7bd] hover:bg-[#fff7f1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.key === 'schedule' && newReservationsCount > 0 ? (
                      <span className="rounded-full bg-[#dc2626] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-[#dc2626]/40">
                        {newReservationsCount}
                      </span>
                    ) : null}
                    {item.key === 'orders' && newOrdersCount > 0 ? (
                      <span className="rounded-full bg-[#dc2626] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-[#dc2626]/40">
                        {newOrdersCount}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-400">›</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <button
              type="button"
              onClick={onLogout}
              className="mt-6 flex w-full items-center justify-center rounded-[30px] bg-[#f0f8f8] px-5 py-4 text-sm font-semibold text-[#18504b] transition hover:bg-[#daf0ed]"
            >
              Log Out
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="rounded-[40px] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[28px] font-bold uppercase tracking-[0.22em] text-[#1d3e5f]">
                  {activeSection === "onlineOrdering"
                    ? "Online Ordering"
                    : activeSection === "calendar"
                    ? "Calendar Overview"
                    : activeSection === "walkins"
                    ? "Walk-ins"
                    : activeSection === "orders"
                    ? "Orders"
                    : activeSection === "charts"
                    ? "Performance Charts"
                    : activeSection === "history"
                    ? "Booking History"
                    : activeSection === "users"
                    ? "Current Users"
                    : activeSection === "settings"
                    ? "Admin Settings"
                    : "Reservations"}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  {activeSection === "onlineOrdering"
                    ? "Publish customer products and manage which items are available for online ordering."
                    : activeSection === "calendar"
                    ? "Simple overview of all reserved slots for each date and time."
                    : activeSection === "walkins"
                    ? "Record same-day customers, payments, and table usage."
                    : activeSection === "orders"
                    ? "Manage online orders, update status, and track delivery progress."
                    : activeSection === "charts"
                    ? "Monitor booking performance, service usage, and walk-in activity across the business."
                    : activeSection === "history"
                    ? "Review past reservations and walk-in records in a single timeline."
                    : activeSection === "users"
                    ? "View all registered users and their account information."
                    : activeSection === "settings"
                    ? "Set administrative preferences and business-level application options."
                    : "Track reserved rooms, guest counts, and booking windows for the function room and experience areas."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-[24px] bg-[#f5f7ff] px-4 py-3 text-sm font-semibold text-[#2b54a3]">
                  Mon 05/12
                </div>
                <div className="rounded-[24px] bg-[#e8f1ff] px-4 py-3 text-sm font-semibold text-[#1d4ed8]">
                  Now {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection("walkins")}
                  className="rounded-[24px] bg-[#1f5eff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1f5eff]/20"
                >
                  Create
                </button>
                <div className="relative min-w-[220px]">
                  <input
                    type="search"
                    placeholder="Search everything"
                    className="w-full rounded-[28px] border border-[#e8e9ef] bg-[#fafbff] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                  />
                </div>
              </div>
            </div>

            {activeSection === "onlineOrdering" ? (
              <section className="mt-8 space-y-8">
                <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
                  <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Product Manager</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Add new items, edit title, price, description, and category for the customer menu.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span className="rounded-full bg-[#e7f5f1] px-4 py-2 text-sm font-semibold text-[#19634e]">
                          {visibleProducts.length} visible
                        </span>
                        <span className="rounded-full bg-[#fff1f0] px-4 py-2 text-sm font-semibold text-[#9c2b30]">
                          {hiddenProducts.length} hidden
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Product name
                        <input
                          value={editingProduct?.name ?? newProduct.name}
                          onChange={(event) =>
                            editingProduct
                              ? handleEditingProductChange("name", event.target.value)
                              : handleNewProductChange("name", event.target.value)
                          }
                          className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                          placeholder="Enter product title"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Price
                        <input
                          type="number"
                          value={editingProduct?.price ?? newProduct.price}
                          onChange={(event) =>
                            editingProduct
                              ? handleEditingProductChange("price", event.target.value)
                              : handleNewProductChange("price", event.target.value)
                          }
                          className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                          placeholder="0.00"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                        Description
                        <textarea
                          value={editingProduct?.description ?? newProduct.description}
                          onChange={(event) =>
                            editingProduct
                              ? handleEditingProductChange("description", event.target.value)
                              : handleNewProductChange("description", event.target.value)
                          }
                          className="mt-2 h-[120px] w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                          placeholder="Write a short product description"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Category
                        <select
                          value={editingProduct?.category ?? newProduct.category}
                          onChange={(event) =>
                            editingProduct
                              ? handleEditingProductChange("category", event.target.value)
                              : handleNewProductChange("category", event.target.value)
                          }
                          className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                        >
                          {productCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                        Image
                        <select
                          value={editingProduct?.imageUrl ?? newProduct.imageUrl}
                          onChange={(event) =>
                            editingProduct
                              ? handleEditingProductChange("imageUrl", event.target.value)
                              : handleNewProductChange("imageUrl", event.target.value)
                          }
                          className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                        >
                          <option value="">Select an image...</option>
                          {availableImages.map((image) => (
                            <option key={image.url} value={image.url}>
                              {image.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={editingProduct ? handleSaveEdit : handleAddProduct}
                        className="rounded-[24px] bg-[#1f5eff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1848cb]"
                      >
                        {editingProduct ? "Save product" : "Add product"}
                      </button>
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-[24px] border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-5">
                    <p className="text-sm font-semibold text-slate-700">Product catalog</p>
                    <p className="mt-2 text-sm text-slate-600">Edit visibility, category, and pricing for existing menu items.</p>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCategoryFilter("All")}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            categoryFilter === "All"
                              ? "bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20"
                              : "bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]"
                          }`}
                        >
                          All ({categoryCounts.get("All") ?? 0})
                        </button>
                        {productCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setCategoryFilter(category)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              categoryFilter === category
                                ? "bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20"
                                : "bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]"
                            }`}
                          >
                            {category} ({categoryCounts.get(category) ?? 0})
                          </button>
                        ))}
                      </div>
                      <div className="text-sm text-slate-500">
                        Showing {filteredProducts.length} items in {categoryFilter === "All" ? "all categories" : categoryFilter}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {filteredProducts.map((product) => {
                        const visible = isProductVisible(product);
                        return (
                          <div key={product.id} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-base font-semibold text-slate-900">{product.name}</p>
                                <p className="mt-1 text-sm text-slate-600">{product.description}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                  <span className="rounded-full bg-slate-100 px-3 py-1">Category: {product.category}</span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1">Price: ₱{product.price.toFixed(2)}</span>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visible ? "bg-[#e6f7ef] text-[#1f6b42]" : "bg-[#fff1f0] text-[#9f2b2b]"}`}>
                                    {visible ? "Visible" : "Hidden"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVisibility(product.id)}
                                  className={`rounded-[24px] px-4 py-2 text-sm font-semibold transition ${
                                    visible
                                      ? "bg-[#1f5eff] text-white hover:bg-[#1848cb]"
                                      : "bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]"
                                  }`}
                                >
                                  {visible ? "Hide" : "Show"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                  className="rounded-[24px] border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            ) : activeSection === "calendar" ? (
              <section className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {calendarGroups.length > 0 ? (
                    calendarGroups.map(({ date, time, entries }) => {
                      const highlightCurrent = date === currentDate && time === currentSlot;
                      const pastGroup = isPastCalendarSlot(date, time);
                      return (
                        <div
                          key={`${date}-${time}`}
                          className={`rounded-[32px] border p-5 ${
                            highlightCurrent
                              ? "border-[#2563eb] bg-[#dbeafe] shadow-[0_0_0_6px_rgba(37,99,235,0.18)]"
                              : pastGroup
                              ? "border-slate-300 bg-slate-100"
                              : "border-[#ede2d0] bg-[#f9fafb]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{date}</p>
                              <p className="mt-1 text-xs text-slate-500">{time}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {highlightCurrent && (
                                <span className="rounded-full bg-[#2563eb] px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-[#2563eb]/30">
                                  Now
                                </span>
                              )}
                              {pastGroup && !highlightCurrent && (
                                <span className="rounded-full bg-slate-800/10 px-3 py-1 text-xs font-semibold text-slate-700">
                                  Completed
                                </span>
                              )}
                              <span className="rounded-full bg-[#e7f5f1] px-3 py-1 text-sm font-semibold text-[#166d3b]">
                                {entries.length} entries
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {entries.map((entry) => {
                              if (entry.kind === 'walkin') {
                                const walkin = entry.item;
                                return (
                                  <div
                                    key={walkin.id}
                                    className={
                                      pastGroup
                                        ? 'rounded-[24px] border border-slate-300 bg-slate-100 p-3 shadow-sm'
                                        : 'rounded-[24px] border border-[#facc15] bg-[#fffbeb] p-3 shadow-sm'
                                    }
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">{walkin.customerName}</p>
                                        <p className="mt-1 text-xs text-slate-500">{walkin.unitName ?? walkin.unitId ?? 'Unknown location'}</p>
                                        <p className="mt-1 text-xs text-slate-500">{walkin.serviceName}</p>
                                      </div>
                                      <span className="rounded-full bg-[#fef3c7] px-2 py-1 text-xs font-semibold text-[#92400e]">Walk-in</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                      <span>{walkin.startTime} - {walkin.endTime}</span>
                                      <span>Paid ₱{walkin.paymentAmount}</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteWalkIn(walkin.id)}
                                        className="rounded-full bg-[#fecaca] px-3 py-2 text-xs font-semibold text-[#9f2a2c] hover:bg-[#fca5a5]"
                                      >
                                        Cancel walk-in
                                      </button>
                                      {pastGroup && (
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmDone(entry)}
                                          className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                                        >
                                          Confirmed done
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              const reservation = entry.item;
                              return (
                                <div
                                  key={reservation.id}
                                  className={
                                    pastGroup && reservation.status !== 'cancelled'
                                      ? 'rounded-[24px] border border-slate-300 bg-slate-100 p-3 shadow-sm'
                                      : getReservationCardClasses(reservation.status)
                                  }
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-slate-900">{reservation.userName ?? reservation.userId}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {reservation.unitName ?? reservation.unitId ?? 'Unknown location'}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {serviceLabelMap.get(reservation.serviceId ?? '') ?? reservation.serviceId ?? 'Unknown service'}
                                      </p>
                                      {reservation.specialRequests && (
                                        <p className="mt-2 text-xs text-slate-500">"{reservation.specialRequests}"</p>
                                      )}
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getReservationBadgeStyles(reservation.status)}`}>
                                      {reservation.status}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span>Party: {reservation.partySize ?? '—'}</span>
                                    <span>Created: {new Date(reservation.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {reservation.status !== 'cancelled' ? (
                                      pastGroup ? (
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmDone(entry)}
                                          className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                                        >
                                          Confirmed done
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleCancelReservation(reservation.id)}
                                          className="rounded-full bg-[#fecaca] px-3 py-2 text-xs font-semibold text-[#9f2a2c] hover:bg-[#fca5a5]"
                                        >
                                          Cancel reservation
                                        </button>
                                      )
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-[#fee2e2] px-3 py-2 text-xs font-semibold text-[#991b1b]">
                                          Cancelled
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmDone(entry)}
                                          className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                                        >
                                          Confirmed done
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6 text-slate-600">
                      No reservations found for the calendar overview.
                    </div>
                  )}
                </div>
              </section>
            ) : activeSection === "schedule" ? (
              <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">Reservations</p>
                      <p className="mt-2 text-sm text-slate-600">Manage upcoming reservations and update booking status.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#e7f5f1] px-4 py-2 text-sm font-semibold text-[#166d3b]">
                        {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
                      </span>
                      <span className="rounded-full bg-[#fff3cd] px-4 py-2 text-sm font-semibold text-[#856404]">
                        {reservations.filter((reservation) => reservation.status === 'pending').length} pending
                      </span>
                      <span className="rounded-full bg-[#d1ecf1] px-4 py-2 text-sm font-semibold text-[#0c5460]">
                        {reservations.filter((reservation) => reservation.status === 'confirmed').length} confirmed
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {unitCategoryOptions.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedUnitCategory(category.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          selectedUnitCategory === category.id
                            ? 'bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20'
                            : 'bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredReservations.length > 0 ? (
                    filteredReservations.map((reservation) => (
                      <div key={reservation.id} className="rounded-[32px] border border-[#ede2d0] bg-white p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-slate-900">{reservation.userName ?? reservation.userId}</h3>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getReservationBadgeStyles(reservation.status)}`}>
                                {reservation.status}
                              </span>
                            </div>
                            <div className="grid gap-2 text-sm text-slate-600 mb-4">
                              <p><strong>Unit:</strong> {reservation.unitName ?? reservation.unitId ?? 'Unknown unit'}</p>
                              <p><strong>Service:</strong> {serviceLabelMap.get(reservation.serviceId ?? '') ?? reservation.serviceId ?? 'Unknown service'}</p>
                              <p><strong>Date:</strong> {reservation.date}</p>
                              <p><strong>Time:</strong> {reservation.time}</p>
                              <p><strong>Party size:</strong> {reservation.partySize ?? '—'}</p>
                              {reservation.specialRequests && (
                                <p><strong>Notes:</strong> {reservation.specialRequests}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                            {reservation.status !== 'cancelled' && reservation.status !== 'completed' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  className="rounded-full bg-[#fecaca] px-4 py-2 text-sm font-semibold text-[#9f2a2c] hover:bg-[#fca5a5]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDone({ kind: 'reservation', item: reservation })}
                                  className="rounded-full bg-[#1f5eff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1848cb]"
                                >
                                  Mark Done
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConfirmDone({ kind: 'reservation', item: reservation })}
                                className="rounded-full bg-[#6b7280] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4b5563]"
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6 text-slate-600">
                      No reservations found for the selected category.
                    </div>
                  )}
                </div>
              </section>
            ) : activeSection === "walkins" ? (
              <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6">
                  <h2 className="text-2xl font-semibold text-slate-900">Create Walk-In Record</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Customer Name</label>
                      <input
                        type="text"
                        value={newWalkIn.customerName}
                        onChange={(e) => setNewWalkIn({...newWalkIn, customerName: e.target.value})}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ffdcc6]/70"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Date</label>
                      <input
                        type="date"
                        value={newWalkIn.date}
                        onChange={(e) => setNewWalkIn({...newWalkIn, date: e.target.value})}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ffdcc6]/70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Service</label>
                      <select
                        value={newWalkIn.serviceId}
                        onChange={(e) => {
                          const selected = unitCategories.find(cat => cat.id === e.target.value);
                          setNewWalkIn({...newWalkIn, serviceId: e.target.value, serviceName: selected?.label || ''});
                        }}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                      >
                        {unitCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Unit</label>
                      <select
                        value={newWalkIn.unitId}
                        onChange={(e) => {
                          const selected = units.find(u => u.id === e.target.value);
                          setNewWalkIn({...newWalkIn, unitId: e.target.value, unitName: selected?.name || ''});
                        }}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                      >
                        <option value="">Select unit</option>
                        {units.filter(u => u.serviceId === newWalkIn.serviceId).map((unit) => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">Choose your time frame</label>
                      <p className="mt-2 text-xs text-slate-500">
                        Click a slot to set the start time, then click a later slot to set the end time for the range.
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {timeSlots.map((slot) => {
                          const blocked = isSlotBlocked(slot);
                          const selected = isSlotInSelectedRange(slot);
                          const isStart = slot === newWalkIn.startTime;
                          const isEnd = slot === newWalkIn.endTime && parseHour(slot) > parseHour(newWalkIn.startTime);
                          const isCurrentSlot = isTodaySelected && slot === currentSlot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleSlotClick(slot)}
                              disabled={!newWalkIn.unitId || blocked}
                              className={
                                `rounded-[20px] border px-3 py-3 text-left text-sm font-semibold transition focus:outline-none ` +
                                (isCurrentSlot
                                  ? "border-[#1d4ed8] bg-[#c7d2fe] text-[#1f3d8f] shadow-[0_0_0_3px_rgba(59,130,246,0.18)]"
                                  : blocked
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : selected
                                  ? "border-[#1f5eff] bg-[#e8f0ff] text-[#1f3d8f]"
                                  : "border-slate-200 bg-white text-slate-900 hover:border-[#ffb57d] hover:bg-[#fff4e8]")
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{slot}</span>
                                {isCurrentSlot && (
                                  <span className="rounded-full bg-[#1d4ed8] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-[#1d4ed8]/40">Now</span>
                                )}
                                {isStart && <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-bold text-[#1d4ed8]">Start</span>}
                                {isEnd && <span className="rounded-full bg-[#d1fae5] px-2 py-0.5 text-[11px] font-bold text-[#065f46]">End</span>}
                              </div>
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                {blocked ? "Blocked" : selected ? "Selected" : "Open"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      {!newWalkIn.unitId && (
                        <p className="mt-2 text-xs text-slate-500">Select a unit to see availability for this date.</p>
                      )}
                      {newWalkIn.unitId && selectedTimeConflict && (
                        <p className="mt-2 text-xs text-red-700">
                          The selected time range overlaps an existing reservation or walk-in. Please adjust the start or end slot.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Start Time</label>
                        <select
                          value={newWalkIn.startTime}
                          onChange={(e) => setNewWalkIn({...newWalkIn, startTime: e.target.value})}
                          className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                        >
                          {timeSlots.map((slot) => {
                            const blocked = newWalkIn.unitId && isStartTimeBlocked(slot);
                            return (
                              <option key={slot} value={slot} disabled={blocked}>
                                {slot}{blocked ? " — blocked" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {newWalkIn.unitId && isStartTimeBlocked(newWalkIn.startTime) && (
                          <p className="mt-2 text-xs text-red-700">
                            This start time conflicts with an existing reservation or walk-in.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">End Time</label>
                        <select
                          value={newWalkIn.endTime}
                          onChange={(e) => setNewWalkIn({...newWalkIn, endTime: e.target.value})}
                          className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                        >
                          {timeSlots
                            .filter((slot) => parseHour(slot) > parseHour(newWalkIn.startTime))
                            .map((slot) => {
                              const blocked = newWalkIn.unitId && isEndTimeBlocked(slot);
                              return (
                                <option key={slot} value={slot} disabled={blocked}>
                                  {slot}{blocked ? " — blocked" : ""}
                                </option>
                              );
                            })}
                        </select>
                        {newWalkIn.unitId && selectedTimeConflict && (
                          <p className="mt-2 text-xs text-red-700">
                            The selected time range overlaps an existing reservation or walk-in. Please adjust the start or end time.
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Payment Amount (₱)</label>
                      <input
                        type="number"
                        value={newWalkIn.paymentAmount}
                        onChange={(e) => {
                          const paymentAmount = Number(e.target.value);
                          setNewWalkIn((current) => ({
                            ...current,
                            paymentAmount,
                            changeAmount: Math.max(0, current.amountReceived - paymentAmount),
                          }));
                        }}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Amount Received (₱)</label>
                      <input
                        type="number"
                        value={newWalkIn.amountReceived}
                        onChange={(e) => {
                          const amountReceived = Number(e.target.value);
                          setNewWalkIn((current) => ({
                            ...current,
                            amountReceived,
                            changeAmount: Math.max(0, amountReceived - current.paymentAmount),
                          }));
                        }}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Payment Method</label>
                      <select
                        value={newWalkIn.paymentMethod}
                        onChange={(e) => {
                          const method = e.target.value as WalkIn['paymentMethod'];
                          setNewWalkIn((current) => ({
                            ...current,
                            paymentMethod: method,
                            amountReceived: method === 'cash' ? current.amountReceived : current.paymentAmount,
                            changeAmount: Math.max(0, (method === 'cash' ? current.amountReceived : current.paymentAmount) - current.paymentAmount),
                          }));
                        }}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="gcash">GCash</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Change Due (₱)</label>
                      <input
                        type="number"
                        value={newWalkIn.changeAmount}
                        readOnly
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">Notes</label>
                      <textarea
                        value={newWalkIn.notes}
                        onChange={(e) => setNewWalkIn({...newWalkIn, notes: e.target.value})}
                        className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#ff7a05]"
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWalkIn}
                    disabled={
                      !newWalkIn.customerName.trim() ||
                      !newWalkIn.paymentAmount ||
                      !newWalkIn.amountReceived ||
                      !newWalkIn.unitId ||
                      selectedTimeConflict
                    }
                    className="mt-6 rounded-full bg-[#ff7a05] px-6 py-3 font-semibold text-white shadow-[0_10px_30px_rgba(255,122,5,0.16)] hover:bg-[#e64b12] disabled:cursor-not-allowed disabled:bg-[#f4b783]"
                  >
                    {selectedTimeConflict ? 'Fix overlapping time' : 'Record Walk-In'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-slate-900">Walk-In Records</h2>
                  <div className="grid gap-4">
                    {walkIns.length > 0 ? (
                      walkIns.map((walkin) => (
                        <div key={walkin.id} className="rounded-[32px] border border-[#ede2d0] bg-white p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">{walkin.customerName}</p>
                              <p className="mt-1 text-xs text-slate-500">{walkin.date} | {walkin.startTime} - {walkin.endTime}</p>
                              <p className="mt-2 text-sm text-slate-700">
                                <span className="font-semibold">{walkin.serviceName}</span>
                                {walkin.unitName && <span> - {walkin.unitName}</span>}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-3">
                                <span className="rounded-full bg-[#fff0e3] px-3 py-1 text-sm font-semibold text-[#b7501f]">
                                  Due ₱{walkin.paymentAmount}
                                </span>
                                <span className="rounded-full bg-[#f6f6ff] px-3 py-1 text-sm font-semibold text-[#3730a3]">
                                  Received ₱{walkin.amountReceived}
                                </span>
                                <span className="rounded-full bg-[#d4f8e8] px-3 py-1 text-sm font-semibold text-[#166d3b]">
                                  Change ₱{walkin.changeAmount}
                                </span>
                                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-sm font-semibold text-[#3730a3]">
                                  {walkin.paymentMethod}
                                </span>
                              </div>
                              {walkin.notes && <p className="mt-2 text-xs text-slate-500">Note: {walkin.notes}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteWalkIn(walkin.id)}
                              className="rounded-full bg-[#fecaca] px-4 py-2 text-sm font-semibold text-[#9f2a2c] hover:bg-[#fda8a8]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6 text-slate-600">
                        No walk-in records yet.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : activeSection === "charts" ? (
              <section className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                    <p className="text-sm font-semibold text-slate-700">Total Reservations</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">{reservations.length}</p>
                  </div>
                  <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                    <p className="text-sm font-semibold text-slate-700">Walk-In Visits</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">{walkIns.length}</p>
                  </div>
                  <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                    <p className="text-sm font-semibold text-slate-700">Active Units</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">{units.filter((unit) => unit.active).length}</p>
                  </div>
                  <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                    <p className="text-sm font-semibold text-slate-700">Customer Accounts</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">{reservationUsers.length}</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[32px] border border-[#ede2d0] bg-white p-6 shadow-sm">
                    <p className="text-base font-semibold text-slate-900">Reservations by Service</p>
                    <div className="mt-6 space-y-4">
                      {unitCategories.map((category) => {
                        const count = reservations.filter((reservation) => reservation.serviceId === category.id).length;
                        const percentage = reservations.length ? Math.round((count / reservations.length) * 100) : 0;
                        return (
                          <div key={category.id}>
                            <div className="flex items-center justify-between text-sm text-slate-700">
                              <span>{category.label}</span>
                              <span>{count}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edeef1]">
                              <div className="h-full rounded-full bg-[#1f5eff]" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-[#ede2d0] bg-white p-6 shadow-sm">
                    <p className="text-base font-semibold text-slate-900">Walk-Ins & Reservations Trend</p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Walk-Ins</p>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edeef1]">
                          <div className="h-full rounded-full bg-[#0f9d58]" style={{ width: `${Math.min(100, walkIns.length * 10)}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Upcoming Reservations</p>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edeef1]">
                          <div className="h-full rounded-full bg-[#1f5eff]" style={{ width: `${Math.min(100, reservations.length * 10)}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Active Units</p>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edeef1]">
                          <div className="h-full rounded-full bg-[#ff7a05]" style={{ width: `${Math.min(100, units.filter((unit) => unit.active).length * 10)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : activeSection === "history" ? (
                            <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2f0] bg-[#f9fafb] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">Booking History</p>
                      <p className="mt-2 text-sm text-slate-600">Review past reservation and walk-in records in a filterable timeline.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'reservation', 'walkin'].map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setHistoryKindFilter(kind as 'all' | 'reservation' | 'walkin')}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            historyKindFilter === kind
                              ? 'bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20'
                              : 'bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]'
                          }`}
                        >
                          {kind === 'all' ? 'All types' : kind === 'reservation' ? 'Reservations' : 'Walk-ins'}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'completed', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setHistoryStatusFilter(status as 'all' | HistoryStatus)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            historyStatusFilter === status
                              ? 'bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20'
                              : 'bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]'
                          }`}
                        >
                          {status === 'all' ? 'All statuses' : status === 'completed' ? 'Completed' : 'Cancelled'}
                        </button>
                      ))}
                    </div>
                    {historyKindFilter !== 'walkin' ? (
                      <div className="flex flex-wrap gap-2">
                        {[['all', 'All services'], ...Array.from(serviceLabelMap.entries())].map(([serviceId, label]) => (
                          <button
                            key={serviceId}
                            type="button"
                            onClick={() => setHistoryServiceFilter(serviceId)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              historyServiceFilter === serviceId
                                ? 'bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20'
                                : 'bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-6">
                    {historyGroups.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {historyGroups.map(({ date, time, entries }) => (
                          <div key={`${date}-${time}`} className="rounded-[32px] border border-[#ede2f0] bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{date}</p>
                                <p className="mt-1 text-xs text-slate-500">{time}</p>
                              </div>
                              <span className="rounded-full bg-[#e7f5f1] px-3 py-1 text-xs font-semibold text-[#166d3b]">
                                {entries.length} record{entries.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="mt-4 space-y-3">
                              {entries.map((entry) => (
                                <div key={entry.item.id} className="rounded-[24px] border border-[#dbe2f0] bg-[#f9fafb] p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {entry.kind === 'reservation'
                                          ? entry.item.userName ?? entry.item.userId
                                          : entry.item.customerName}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {entry.kind === 'reservation'
                                          ? serviceLabelMap.get(entry.item.serviceId ?? "") ?? entry.item.serviceId ?? "Service"
                                          : entry.item.serviceName}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        entry.status === 'completed'
                                          ? 'bg-[#dbeafe] text-[#1d4ed8]'
                                          : 'bg-[#fee2e2] text-[#991b1b]'
                                      }`}>
                                        {entry.status}
                                      </span>
                                      <p className="mt-2 text-xs text-slate-500">
                                        {entry.kind === 'reservation'
                                          ? entry.item.unitName ?? entry.item.unitId ?? 'Unit'
                                          : entry.item.unitName || 'Unit'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                                    <span>
                                      {entry.kind === 'reservation'
                                        ? `${entry.item.date} · ${entry.item.time}`
                                        : `${entry.item.date} · ${entry.item.startTime} - ${entry.item.endTime}`
                                      }
                                    </span>
                                    <span>{entry.kind === 'reservation' ? 'Reservation' : 'Walk-in'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[32px] border border-[#ede2f0] bg-[#fff7f2] p-6 text-slate-600">
                        No history records match the filter.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : activeSection === "users" ? (
              <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">Users</p>
                      <p className="mt-2 text-sm text-slate-600">View all registered users, their email addresses, and registration details.</p>
                    </div>
                    <div className="rounded-full bg-[#e7f5f1] px-4 py-2 text-sm font-semibold text-[#166d3b]">
                      {reservationUsers.length} users
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-[#f8f6f3] text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Name</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Role</th>
                          <th className="px-4 py-3 font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {reservationUsers.map((userRecord) => (
                          <tr key={userRecord.id}>
                            <td className="px-4 py-4 text-slate-700">{userRecord.name}</td>
                            <td className="px-4 py-4 text-slate-700">{userRecord.email}</td>
                            <td className="px-4 py-4 text-slate-700">{userRecord.role}</td>
                            <td className="px-4 py-4 text-slate-700">{new Date(userRecord.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : activeSection === "orders" ? (
              <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">Online Orders</p>
                      <p className="mt-2 text-sm text-slate-600">Manage online food orders, update status, and track delivery progress.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#e7f5f1] px-4 py-2 text-sm font-semibold text-[#166d3b]">
                        {orders.filter(o => o.status === 'pending').length} pending
                      </span>
                      <span className="rounded-full bg-[#fff3cd] px-4 py-2 text-sm font-semibold text-[#856404]">
                        {orders.filter(o => o.status === 'accepted').length} accepted
                      </span>
                      <span className="rounded-full bg-[#d1ecf1] px-4 py-2 text-sm font-semibold text-[#0c5460]">
                        {orders.filter(o => o.status === 'shipped').length} shipped
                      </span>
                      <span className="rounded-full bg-[#cce5ff] px-4 py-2 text-sm font-semibold text-[#004085]">
                        {orders.filter(o => o.status === 'delivered').length} delivered
                      </span>
                      <span className="rounded-full bg-[#f8d7da] px-4 py-2 text-sm font-semibold text-[#721c24]">
                        {orders.filter(o => o.status === 'rejected').length} rejected
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {orders.length === 0 ? (
                      <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6 text-center text-slate-600">
                        No orders yet.
                      </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="rounded-[32px] border border-[#ede2d0] bg-white p-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg font-semibold text-slate-900">Order #{order.id.slice(-8)}</h3>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  order.status === 'pending' ? 'bg-[#fff3cd] text-[#856404]' :
                                  order.status === 'accepted' ? 'bg-[#d1ecf1] text-[#0c5460]' :
                                  order.status === 'shipped' ? 'bg-[#cce5ff] text-[#004085]' :
                                  order.status === 'delivered' ? 'bg-[#d4edda] text-[#155724]' :
                                  order.status === 'rejected' ? 'bg-[#f8d7da] text-[#721c24]' :
                                  'bg-[#f8d7da] text-[#721c24]'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="grid gap-2 text-sm text-slate-600 mb-4">
                                <p><strong>Customer:</strong> {order.customerName} ({order.customerEmail})</p>
                                <p><strong>Phone:</strong> {order.customerPhone ?? 'N/A'}</p>
                                <p><strong>Address:</strong> {order.deliveryAddress}</p>
                                <p><strong>Ordered:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                                {order.notes && (
                                  <p><strong>Instructions:</strong> {order.notes}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-slate-900">Items:</h4>
                                {order.items.map((item, index) => (
                                  <div key={index} className="flex items-center gap-3 text-sm">
                                    <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 rounded object-cover" />
                                    <span className="flex-1">{item.product.name} × {item.quantity}</span>
                                    <span className="font-semibold">₱{(item.product.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="border-t pt-2 text-lg font-bold text-slate-900">
                                  Total: ₱{order.total.toFixed(2)}
                                </div>
                              </div>
                              {(order.acceptedAt || order.shippedAt || order.deliveredAt) && (
                                <div className="mt-4">
                                  <h4 className="font-semibold text-slate-900 mb-2">Tracking:</h4>
                                  <div className="space-y-1 text-xs text-slate-600">
                                    {order.acceptedAt && (
                                      <div>{new Date(order.acceptedAt).toLocaleString()}: Order accepted</div>
                                    )}
                                    {order.shippedAt && (
                                      <div>{new Date(order.shippedAt).toLocaleString()}: Order shipped</div>
                                    )}
                                    {order.deliveredAt && (
                                      <div>{new Date(order.deliveredAt).toLocaleString()}: Order delivered</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'accepted', 'Order accepted and being prepared')}
                                  className="rounded-full bg-[#28a745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#218838]"
                                >
                                  Accept Order
                                </button>
                              )}
                              {order.status === 'accepted' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'shipped', 'Order is now out for delivery')}
                                  className="rounded-full bg-[#007bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0056b3]"
                                >
                                  Mark Shipped
                                </button>
                              )}
                              {order.status === 'shipped' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'delivered', 'Order has been delivered')}
                                  className="rounded-full bg-[#17a2b8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#138496]"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            ) : activeSection === "support" ? (
              <SupportChatAdminPanel />
            ) : activeSection === "settings" ? (
              <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                  <p className="text-xl font-semibold text-slate-900">Application Settings</p>
                  <p className="mt-2 text-sm text-slate-600">Update admin preferences and business operating options.</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
                      <span className="text-sm font-semibold text-slate-700">Maintenance Mode</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={adminSettings.maintenanceMode}
                          onChange={(e) => handleSettingChange("maintenanceMode", e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-[#1f5eff]"
                        />
                        <span className="text-sm text-slate-600">Prevent new reservations while maintenance is enabled.</span>
                      </div>
                    </label>
                    <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
                      <span className="text-sm font-semibold text-slate-700">Email Notifications</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={adminSettings.emailNotifications}
                          onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-[#1f5eff]"
                        />
                        <span className="text-sm text-slate-600">Send email alerts for new reservations.</span>
                      </div>
                    </label>
                    <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
                      <span className="text-sm font-semibold text-slate-700">Live employee chat</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={adminSettings.liveAgentAvailable}
                          onChange={(e) => handleSettingChange("liveAgentAvailable", e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-[#1f5eff]"
                        />
                        <span className="text-sm text-slate-600">Allow customers to request a live agent from the support widget.</span>
                      </div>
                    </label>
                    <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
                      <span className="text-sm font-semibold text-slate-700">Live agent name</span>
                      <input
                        value={adminSettings.liveAgentName}
                        onChange={(e) => handleSettingChange("liveAgentName", e.target.value)}
                        className="mt-2 rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-8 rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-xl font-semibold text-slate-900">Reservation Unit Settings</p>
                    <p className="text-sm text-slate-600">Adjust available table/room categories and unit assignments used by reservations.</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {unitCategoryOptions.map((category) => {
                    const isSelected = category.id === selectedUnitCategory;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedUnitCategory(category.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isSelected
                            ? "bg-[#1f5eff] text-white shadow-sm shadow-[#1f5eff]/20"
                            : "bg-[#f3f4f6] text-slate-700 hover:bg-[#e5e7eb]"
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-6">
                    <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Reservation units</p>
                          <p className="mt-2 text-sm text-slate-600">
                            Manage available units for the selected experience category.
                          </p>
                        </div>
                        <span className="rounded-full bg-[#fff1f0] px-4 py-2 text-sm font-semibold text-[#9c2b30]">
                          {filteredUnits.length} units
                        </span>
                      </div>

                      <div className="mt-6 grid gap-4">
                        {filteredUnits.map((unit) => (
                          <div key={unit.id} className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
                            <div className="flex items-center gap-4">
                              <img src={unit.imageUrl} alt={unit.name} className="h-20 w-28 rounded-3xl object-cover" />
                              <div>
                                <p className="text-base font-semibold text-slate-900">{unit.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{unit.description}</p>
                                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  unit.active ? "bg-[#e6f7ef] text-[#166d3b]" : "bg-[#fff1f0] text-[#9c2b2b]"
                                }`}>
                                  {unit.active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 justify-end">
                              <button
                                type="button"
                                onClick={() => handleEditUnit(unit)}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUnit(unit.id)}
                                className="rounded-full border border-[#f3d4d0] bg-[#fff1f0] px-4 py-2 text-sm font-semibold text-[#ad2f2f] hover:bg-[#f9d3d0]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                      <p className="text-sm font-semibold text-slate-700">Add / edit unit</p>
                      <p className="mt-2 text-sm text-slate-600">
                        Update descriptions, pictures, and availability for this service category.
                      </p>

                      <div className="mt-6 grid gap-4">
                        <label className="block text-sm font-semibold text-slate-700">
                          Unit name
                          <input
                            value={unitForm.name}
                            onChange={(event) => handleUnitFormChange("name", event.target.value)}
                            className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                            placeholder="Table 5, Room 2, Court B"
                          />
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">
                          Description
                          <textarea
                            value={unitForm.description}
                            onChange={(event) => handleUnitFormChange("description", event.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                            placeholder="Describe the unit and its perks"
                          />
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">
                          Category
                          <select
                            value={unitForm.serviceId}
                            onChange={(event) => handleUnitFormChange("serviceId", event.target.value)}
                            className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                          >
                            {unitCategoryOptions.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">
                          Image
                          <select
                            value={unitForm.imageUrl}
                            onChange={(event) => handleUnitFormChange("imageUrl", event.target.value)}
                            className="mt-2 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                          >
                            <option value="">Select an image...</option>
                            {availableImages.map((image) => (
                              <option key={image.url} value={image.url}>
                                {image.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={unitForm.active}
                            onChange={(event) => handleUnitFormChange("active", event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-[#1f5eff]"
                          />
                          Active unit
                        </label>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleSaveUnit}
                            className="rounded-[24px] bg-[#1f5eff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1848cb]"
                          >
                            {editingUnit ? "Save unit" : "Add unit"}
                          </button>
                          {editingUnit && (
                            <button
                              type="button"
                              onClick={handleCancelUnitEdit}
                              className="rounded-[24px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            ) : activeSection === "migration" ? (
              <section className="mt-8 space-y-6">
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                  <p className="text-xl font-semibold text-slate-900">Data Migration</p>
                  <p className="mt-2 text-sm text-slate-600">Migrate data from local storage to the database.</p>
                </div>
              </section>
            ) : (
              <></>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
