import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { type Product, type ProductCategory } from "../data/products";
import { type User } from "../data/users";
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

const roomCategories = [
  { label: "Function Room", color: "bg-[#eff6ff] text-[#1f4fcc]" },
  { label: "Billiard", color: "bg-[#fff1f0] text-[#b22222]" },
  { label: "Darts", color: "bg-[#fff7e6] text-[#b57309]" },
  { label: "Karaoke", color: "bg-[#f1f6ec] text-[#3d6d36]" },
  { label: "Restobar", color: "bg-[#eef5ff] text-[#2a57a0]" },
  { label: "Basketball Arcade", color: "bg-[#f3f1ff] text-[#473f99]" },
];

const times = [
  "9:00",
  "9:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
];

const navItems = [
  { key: "schedule", label: "Dashboard" },
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

export default function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const [activeSection, setActiveSection] = useState<typeof navItems[number]["key"]>("schedule");
  const [visibleProductIds, setVisibleProductIdsState] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "All">("All");
  const [newProduct, setNewProduct] = useState<EditableProduct>(emptyEditableProduct);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);

  const { products: productList, addProduct, updateProduct: updateProductBackend, deleteProduct, toggleVisibility, loading } = useProducts({ autoFetch: true });

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

  const handleToggleVisibility = (productId: string) => {
    toggleVisibility(productId).catch(err => {
      console.error('Failed to toggle visibility:', err);
      alert('Failed to update product visibility. Please try again.');
    });
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
                  {activeSection === "onlineOrdering" ? "Online Ordering" : "Reservation Schedule"}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  {activeSection === "onlineOrdering"
                    ? "Publish customer products and manage which items are available for online ordering."
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
            ) : (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {roomCategories.map((room) => (
                    <span key={room.label} className={`rounded-full px-4 py-2 text-sm font-semibold ${room.color}`}>
                      {room.label}
                    </span>
                  ))}
                </div>

                <div className="mt-8 overflow-hidden rounded-[32px] border border-[#ede2d0] bg-[#fff7f2] p-5">
                  <div className="grid grid-cols-8 gap-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {times.map((time) => (
                      <div key={time} className="rounded-[18px] bg-[#faf7f3] px-3 py-4 text-center">
                        {time}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-12 gap-3 text-sm text-slate-700">
                    <div className="col-span-3 rounded-[32px] bg-[#ffe6e0] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#b33c2f]">Alice</p>
                      <p className="mt-2 text-sm text-slate-600">People: 2</p>
                    </div>
                    <div className="col-span-2 rounded-[32px] bg-[#e8f1ff] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#2555a8]">Bella</p>
                      <p className="mt-2 text-sm text-slate-600">People: 4</p>
                    </div>
                    <div className="col-span-2 rounded-[32px] bg-[#fde9d8] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#8d4e1b]">Anna</p>
                      <p className="mt-2 text-sm text-slate-600">People: 2</p>
                    </div>
                    <div className="col-span-3 rounded-[32px] bg-[#e6f4ea] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#2f6740]">Corbin</p>
                      <p className="mt-2 text-sm text-slate-600">People: 1</p>
                    </div>
                    <div className="col-span-2 rounded-[32px] bg-[#fff1f8] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#a83477]">Elisa</p>
                      <p className="mt-2 text-sm text-slate-600">People: 3</p>
                    </div>
                    <div className="col-span-2 rounded-[32px] bg-[#f5f7ff] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#3b5aa0]">Rory</p>
                      <p className="mt-2 text-sm text-slate-600">People: 3</p>
                    </div>
                    <div className="col-span-3 rounded-[32px] bg-[#fff6e4] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#ad620d]">David</p>
                      <p className="mt-2 text-sm text-slate-600">People: 3</p>
                    </div>
                    <div className="col-span-3 rounded-[32px] bg-[#f4e7ff] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#593d8b]">Mary</p>
                      <p className="mt-2 text-sm text-slate-600">People: 3</p>
                    </div>
                    <div className="col-span-2 rounded-[32px] bg-[#eaf7ed] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#2f6e39]">Zane</p>
                      <p className="mt-2 text-sm text-slate-600">People: 2</p>
                    </div>
                    <div className="col-span-2 rounded-[32px] bg-[#fef2f8] p-4 shadow-sm">
                      <p className="text-base font-semibold text-[#a02d5f]">Elsa</p>
                      <p className="mt-2 text-sm text-slate-600">People: 2</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[32px] border border-[#e9e2da] bg-[#fff9f6] p-5">
                  <p className="text-sm font-semibold text-slate-700">Legend</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#ffb87a]" /> Pending
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#7dd1ff]" /> Reserved
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#ffed93]" /> Waiting payment
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#b6e8ab]" /> Cleared
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#f8c6d2]" /> Cancelled
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
