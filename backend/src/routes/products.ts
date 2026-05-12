import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { ProductService } from '../services/ProductService.js';

export function createProductRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const productService = new ProductService(db);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const product = await productService.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, name, description, price, category, imageUrl, rating, visible } = req.body;

      if (!name || !description || typeof price !== 'number' || !category || !imageUrl || typeof rating !== 'number') {
        return res.status(400).json({ error: 'Missing required product fields' });
      }

      const productId = id || `prod-${Date.now()}`;

      const product = await productService.createProduct({
        id: productId,
        name,
        description,
        price,
        category,
        imageUrl,
        rating,
        visible: visible === 0 ? 0 : 1,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const updated = await productService.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const success = await productService.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  return router;
}
