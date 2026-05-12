import { products, type Product } from "./products";

const STORAGE_KEY = "chillingan_online_ordering_visibility";
const STORAGE_PRODUCTS_KEY = "chillingan_online_ordering_products";

function parseStored<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") {
    return products;
  }

  const raw = window.localStorage.getItem(STORAGE_PRODUCTS_KEY);
  const parsed = parseStored<Product[]>(raw, products);

  if (!Array.isArray(parsed)) {
    return products;
  }

  return parsed.filter((item): item is Product =>
    typeof item?.id === "string" &&
    typeof item?.name === "string" &&
    typeof item?.description === "string" &&
    typeof item?.price === "number" &&
    typeof item?.category === "string" &&
    typeof item?.imageUrl === "string" &&
    typeof item?.rating === "number",
  );
}

export function saveProducts(updatedProducts: Product[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updatedProducts));
}

function getStoredIds(): string[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

export function getVisibleProductIds(): string[] {
  const stored = getStoredIds();
  if (stored && stored.length > 0) {
    return stored;
  }
  return products.map((product) => product.id);
}

export function setVisibleProductIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function isProductVisible(productId: string) {
  return getVisibleProductIds().includes(productId);
}

export function toggleProductVisibility(productId: string) {
  const visibleIds = new Set(getVisibleProductIds());
  if (visibleIds.has(productId)) {
    visibleIds.delete(productId);
  } else {
    visibleIds.add(productId);
  }
  const nextIds = Array.from(visibleIds);
  setVisibleProductIds(nextIds);
  return nextIds;
}
