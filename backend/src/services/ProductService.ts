import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: number;
  visible: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export class ProductService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  async createProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    await this.db.run(
      `INSERT INTO products (id, name, description, price, category, imageUrl, rating, visible, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.description,
        product.price,
        product.category,
        product.imageUrl,
        product.rating,
        product.visible,
        now,
        now,
      ]
    );

    return {
      ...product,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.db.get<Product>(`SELECT * FROM products WHERE id = ?`, [id]);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.db.all<Product[]>(`SELECT * FROM products ORDER BY name`);
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'createdAt') return;
      fields.push(`${key} = ?`);
      values.push(value);
    });

    if (fields.length === 0) {
      return this.getProduct(id);
    }

    const now = new Date().toISOString();
    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getProduct(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.db.run(`DELETE FROM products WHERE id = ?`, [id]);
    return (result.changes ?? 0) > 0;
  }
}
