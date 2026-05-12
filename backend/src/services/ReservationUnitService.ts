import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface ReservationUnit {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  imageUrl: string;
  active: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export class ReservationUnitService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  async createUnit(unit: Omit<ReservationUnit, 'createdAt' | 'updatedAt'>): Promise<ReservationUnit> {
    const now = new Date().toISOString();
    await this.db.run(
      `INSERT INTO reservation_units (id, serviceId, name, description, imageUrl, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unit.id,
        unit.serviceId,
        unit.name,
        unit.description,
        unit.imageUrl,
        unit.active,
        now,
        now,
      ]
    );

    return {
      ...unit,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getUnit(id: string): Promise<ReservationUnit | null> {
    return (await this.db.get<ReservationUnit>(`SELECT * FROM reservation_units WHERE id = ?`, [id])) || null;
  }

  async getAllUnits(): Promise<ReservationUnit[]> {
    return this.db.all<ReservationUnit[]>(`SELECT * FROM reservation_units ORDER BY serviceId, name`);
  }

  async getUnitsByService(serviceId: string): Promise<ReservationUnit[]> {
    return this.db.all<ReservationUnit[]>(`SELECT * FROM reservation_units WHERE serviceId = ? AND active = 1 ORDER BY name`, [serviceId]);
  }

  async updateUnit(id: string, updates: Partial<Omit<ReservationUnit, 'id' | 'createdAt'>>): Promise<ReservationUnit | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'createdAt') return;
      fields.push(`${key} = ?`);
      values.push(value);
    });

    if (fields.length === 0) {
      return this.getUnit(id);
    }

    const now = new Date().toISOString();
    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.db.run(`UPDATE reservation_units SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getUnit(id);
  }

  async deleteUnit(id: string): Promise<boolean> {
    const result = await this.db.run(`DELETE FROM reservation_units WHERE id = ?`, [id]);
    return (result.changes ?? 0) > 0;
  }
}