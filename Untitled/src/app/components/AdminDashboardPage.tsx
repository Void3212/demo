import { useEffect, useMemo, useState } from "react";
import { type Product, type ProductCategory } from "../data/products";
import { type User, getUsers } from "../data/users";
import { useReservationUnits } from "../../hooks/useReservationUnits";
import { ReservationAPI, type Reservation, type WalkIn } from "../../api/reservationAPI";
import { AdminSettingsAPI, type AdminSettings } from "../../api/adminSettingsAPI";
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

interface AdminSettings {
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  emailNotifications: boolean;
  businessHours: string;
  defaultCurrency: string;
}

const navItems = [
  { key: "calendar", label: "Calendar" },
  { key: "schedule", label: "Reservations" },
  { key: "walkins", label: "Walk-ins" },
  { key: "onlineOrdering", label: "Online Ordering" },
  { key: "charts", label: "Charts" },
  { key: "history", label: "History" },
  { key: "users", label: "Users" },
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

export default function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const [activeSection, setActiveSection] = useState<typeof navItems[number]["key"]>("schedule");
  const [visibleProductIds, setVisibleProductIdsState] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "All">("All");
  const [newProduct, setNewProduct] = useState<EditableProduct>(emptyEditableProduct);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
    businessHours: "10:00 - 22:00",
    defaultCurrency: "PHP",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fetched = await AdminSettingsAPI.getSettings();
        setAdminSettings(fetched);
        localStorage.setItem("admin_settings", JSON.stringify(fetched));
      } catch (error) {
        console.error("Failed to load admin settings from backend:", error);
        try {
          const storedSettings = localStorage.getItem("admin_settings");
          if (storedSettings) {
            setAdminSettings(JSON.parse(storedSettings));
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
    } catch (error) {
      console.error("Failed to update admin settings on backend:", error);
      try {
        const next = { ...adminSettings, [key]: value } as AdminSettings;
        localStorage.setItem("admin_settings", JSON.stringify(next));
      } catch (innerError) {
        console.error("Failed to save admin settings locally:", innerError);
      }
    }
  };

  useEffect(() => {
    // Set all products as visible by default when they load from the backend
    if (productList.length > 0) {
      const visibleIds = productList.map(p => p.id);
      setVisibleProductIdsState(visibleIds);
    }
  }, [productList]);

  const productCount = productList.length;

  const visibleProducts = useMemo(
    () => productList.filter((product) => visibleProductIds.includes(product.id)),
    [productList, visibleProductIds],
  );

  const hiddenProducts = useMemo(
    () => productList.filter((product) => !visibleProductIds.includes(product.id)),
    [productList, visibleProductIds],
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
        setReservations(allReservations);
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

    loadReservations();
    loadWalkIns();
    setReservationUsers(getUsers());

    const refresh = () => {
      loadReservations();
      loadWalkIns();
    };

    const intervalId = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, []);

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

    try {
      await ReservationAPI.deleteWalkin(id);
      setWalkIns((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Failed to delete walk-in:', error);
      alert('Failed to cancel walk-in. Please try again.');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Cancel this reservation?')) return;

    try {
      const cancelledReservation = await ReservationAPI.cancelReservation(reservationId);
      setReservations((prev) => prev.map((reservation) => reservation.id === reservationId ? cancelledReservation : reservation));
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
      } else {
        await ReservationAPI.deleteReservation(entry.item.id);
        setReservations((prev) => prev.filter((reservation) => reservation.id !== entry.item.id));
      }
    } catch (error) {
      console.error('Failed to remove completed booking:', error);
      alert('Failed to remove this record. Please try again.');
    }
  };

  const filteredReservations = useMemo(
    () => reservations.filter((reservation) => reservation.serviceId === selectedUnitCategory),
    [reservations, selectedUnitCategory],
  );

  const calendarGroups = useMemo(() => {
    type CalendarEntry =
      | { kind: 'reservation'; item: Reservation }
      | { kind: 'walkin'; item: WalkIn };

    const groups = new Map<string, { date: string; time: string; entries: CalendarEntry[] }>();

    reservations.forEach((reservation) => {
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
  }, [reservations, walkIns]);

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
                  {item.label}
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
                    : activeSection === "charts"
                    ? "Performance Charts"
                    : activeSection === "history"
                    ? "Booking History"
                    : activeSection === "users"
                    ? "User Management"
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
                    : activeSection === "charts"
                    ? "Monitor booking performance, service usage, and walk-in activity across the business."
                    : activeSection === "history"
                    ? "Review past reservations and walk-in records in a single timeline."
                    : activeSection === "users"
                    ? "Manage user accounts, roles, and customer information."
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
                        const visible = visibleProductIds.includes(product.id);
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
                <div className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-6">
                  <p className="text-xl font-semibold text-slate-900">Recent Booking History</p>
                  <div className="mt-6 space-y-4">
                    {reservations.slice(0, 6).map((reservation) => (
                      <div key={reservation.id} className="rounded-[24px] border border-[#dbe2f0] bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{reservation.userName ?? reservation.userId}</p>
                            <p className="mt-1 text-xs text-slate-500">{reservation.date} · {reservation.time}</p>
                          </div>
                          <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#3730a3]">{reservation.status}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          {serviceLabelMap.get(reservation.serviceId ?? "") ?? reservation.serviceId ?? "Service"} · {reservation.unitName ?? reservation.unitId ?? "Unit"}
                        </p>
                      </div>
                    ))}
                    {walkIns.slice(0, 6).map((walkin) => (
                      <div key={walkin.id} className="rounded-[24px] border border-[#dbe2f0] bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{walkin.customerName}</p>
                            <p className="mt-1 text-xs text-slate-500">{walkin.date} · {walkin.startTime}</p>
                          </div>
                          <span className="rounded-full bg-[#e7f5f1] px-3 py-1 text-xs font-semibold text-[#166d3b]">Walk-in</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          {walkin.serviceName} · {walkin.unitName || "No unit selected"}
                        </p>
                      </div>
                    ))}
                    {reservations.length === 0 && walkIns.length === 0 && (
                      <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6 text-slate-600">
                        No booking history is available yet.
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
                      <p className="mt-2 text-sm text-slate-600">Review account roles, email, and registration details.</p>
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
                      <span className="text-sm font-semibold text-slate-700">Guest Checkout</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={adminSettings.allowGuestCheckout}
                          onChange={(e) => handleSettingChange("allowGuestCheckout", e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-[#1f5eff]"
                        />
                        <span className="text-sm text-slate-600">Allow customers to reserve without registering.</span>
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
                      <span className="text-sm font-semibold text-slate-700">Business Hours</span>
                      <input
                        value={adminSettings.businessHours}
                        onChange={(e) => handleSettingChange("businessHours", e.target.value)}
                        className="mt-2 rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                      />
                    </label>
                    <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
                      <span className="text-sm font-semibold text-slate-700">Default Currency</span>
                      <input
                        value={adminSettings.defaultCurrency}
                        onChange={(e) => handleSettingChange("defaultCurrency", e.target.value)}
                        className="mt-2 rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#1f5eff]/10"
                      />
                    </label>
                  </div>
                </div>
              </section>
            ) : (
              <>
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

                  <div className="space-y-6">
                    <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Reservations</p>
                          <p className="mt-2 text-sm text-slate-600">
                            Track reserved slots and the user who booked them.
                          </p>
                        </div>
                        <div className="rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#2a57a0]">
                          {filteredReservations.length} bookings
                        </div>
                      </div>

                      <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                          <thead className="bg-[#f8f6f3] text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Date</th>
                              <th className="px-4 py-3 font-semibold">Time</th>
                              <th className="px-4 py-3 font-semibold">Unit</th>
                              <th className="px-4 py-3 font-semibold">User</th>
                              <th className="px-4 py-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {filteredReservations.map((reservation) => (
                              <tr key={reservation.id}>
                                <td className="px-4 py-4 text-slate-700">{reservation.date}</td>
                                <td className="px-4 py-4 text-slate-700">{reservation.time}</td>
                                <td className="px-4 py-4 text-slate-700">{reservation.unitName ?? reservation.unitId ?? "—"}</td>
                                <td className="px-4 py-4 text-slate-700">
                                  <div className="font-semibold text-slate-900">
                                    {reservation.userName ?? reservationUsers.find((user) => user.id === reservation.userId)?.name ?? reservation.userId}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {reservationUsers.find((user) => user.id === reservation.userId)?.email ?? reservation.userId}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-slate-700">{reservation.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
