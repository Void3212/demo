import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  profileImage?: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export class UserService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const existing = await this.db.get<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [user.email.toLowerCase()]
    );

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const id = `user-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO users (id, email, password, name, phone, address, profileImage, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user.email.toLowerCase(),
        user.password,
        user.name,
        user.phone ?? null,
        user.address ?? null,
        user.profileImage ?? null,
        user.role,
        now,
        now,
      ]
    );

    return {
      id,
      ...user,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.get<User>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.get<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
  }
}
