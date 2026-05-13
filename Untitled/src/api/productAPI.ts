import { type Product } from '../app/data/products';

const defaultApiUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3001/api` : 'http://localhost:3001/api';
const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function fetchProduct(id: string): Promise<Product> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product ${id}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  try {
    const payload = {
      ...product,
      visible: product.visible === false ? 0 : 1, // Convert boolean to 0/1
    };
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Failed to create product: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  try {
    const payload = { ...updates } as Partial<Product>;
    if (payload.visible !== undefined) {
      payload.visible = payload.visible === false || payload.visible === 0 ? 0 : 1;
    }

    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update product ${id}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete product ${id}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}
