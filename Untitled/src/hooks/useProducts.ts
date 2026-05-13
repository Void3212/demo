import { useState, useEffect } from 'react';
import { type Product, isProductVisible } from '../app/data/products';
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from '../api/productAPI';

interface UseProductsOptions {
  autoFetch?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { autoFetch = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      setError(null);
      const newProduct = await createProduct(product);
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      setError(message);
      throw err;
    }
  };

  const updateProductData = async (id: string, updates: Partial<Product>) => {
    try {
      setError(null);
      const updated = await updateProduct(id, updates);
      setProducts(products.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      setError(message);
      throw err;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      setError(null);
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      setError(message);
      throw err;
    }
  };

  const toggleVisibility = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const currentlyVisible = isProductVisible(product);
    const nextVisible = currentlyVisible ? 0 : 1;

    try {
      await updateProductData(id, { visible: nextVisible });
    } catch (err) {
      console.error('Error toggling visibility:', err);
      throw err;
    }
  };

  const refetch = fetchProducts;

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct: updateProductData,
    deleteProduct: removeProduct,
    toggleVisibility,
    refetch,
  };
}
