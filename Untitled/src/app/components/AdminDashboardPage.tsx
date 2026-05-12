import { useEffect, useMemo, useState } from "react";
import { type Product, type ProductCategory } from "../data/products";
import { type User, getUsers } from "../data/users";
import { useReservationUnits } from "../../hooks/useReservationUnits";
import { ReservationAPI, type Reservation } from "../../api/reservationAPI";
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

  const { products: productList, addProduct, updateProduct: updateProductBackend, toggleVisibility, loading } = useProducts({ autoFetch: true });

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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationUsers, setReservationUsers] = useState<User[]>([]);

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

    loadReservations();
    setReservationUsers(getUsers());
  }, []);

  const filteredReservations = useMemo(
    () => reservations.filter((reservation) => reservation.serviceId === selectedUnitCategory),
    [reservations, selectedUnitCategory],
  );

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, { date: string; time: string; reservations: Reservation[] }>();

    filteredReservations.forEach((reservation) => {
      const date = reservation.date ?? "Unknown date";
      const time = reservation.time ?? "Unknown time";
      const key = `${date}||${time}`;
      const existing = groups.get(key);

      if (existing) {
        existing.reservations.push(reservation);
      } else {
        groups.set(key, { date, time, reservations: [reservation] });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  }, [filteredReservations]);

  const unitCategoryOptions = useMemo(
    () => unitCategories.map((category) => ({ id: category.id, label: category.label })),
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

  const handleSaveUnit = () => {
    if (!unitForm.name.trim() || !unitForm.imageUrl.trim()) {
      alert('Please add a unit name and image before saving.');
      return;
    }

    if (editingUnit) {
      updateUnit(editingUnit.id, {
        ...unitForm,
      });
      setEditingUnit(null);
    } else {
      addUnit({
        ...unitForm,
        id: `unit-${Date.now()}`,
      });
    }

    setUnitForm(emptyReservationUnit);
  };

  const handleEditUnit = (unit: ReservationUnit) => {
    setEditingUnit(unit);
    setUnitForm(unit);
  };

  const handleCancelUnitEdit = () => {
    setEditingUnit(null);
    setUnitForm(emptyReservationUnit);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (confirm('Remove this reservation unit?')) {
      deleteUnit(unitId);
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
                    : "Reservations"}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  {activeSection === "onlineOrdering"
                    ? "Publish customer products and manage which items are available for online ordering."
                    : activeSection === "calendar"
                    ? "Simple overview of all reserved slots for each date and time."
                    : "Track reserved rooms, guest counts, and booking windows for the function room and experience areas."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-[24px] bg-[#f5f7ff] px-4 py-3 text-sm font-semibold text-[#2b54a3]">
                  Mon 05/12
                </div>
                <button className="rounded-[24px] bg-[#1f5eff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1f5eff]/20">
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
                    calendarGroups.map(({ date, time, reservations: slotReservations }) => (
                      <div key={`${date}-${time}`} className="rounded-[32px] border border-[#ede2d0] bg-[#f9fafb] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{date}</p>
                            <p className="mt-1 text-xs text-slate-500">{time}</p>
                          </div>
                          <span className="rounded-full bg-[#e7f5f1] px-3 py-1 text-sm font-semibold text-[#166d3b]">
                            {slotReservations.length} reserved
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {slotReservations.map((reservation) => (
                            <div key={reservation.id} className="rounded-[24px] border border-[#dbe2f0] bg-white p-3 shadow-sm">
                              <p className="text-sm font-semibold text-slate-900">{reservation.userName ?? reservation.userId}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {reservation.unitName ?? reservation.unitId ?? "Unknown location"}
                              </p>
                              <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span>Party: {reservation.partySize ?? "—"}</span>
                                <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[#3730a3]">{reservation.status}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-6 text-slate-600">
                      No reservations found for the calendar overview.
                    </div>
                  )}
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
