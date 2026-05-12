import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface Reservation {
  id: string;
  userId: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export class ReservationService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    const id = `res_${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO reservations (id, userId, date, time, partySize, specialRequests, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        reservation.userId,
        reservation.date,
        reservation.time,
        reservation.partySize,
        reservation.specialRequests || null,
        'pending',
        now,
        now
      ]
    );

    return {
      id,
      ...reservation,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
  }

  async getReservation(id: string): Promise<Reservation | null> {
    return this.db.get<Reservation>(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    return this.db.all<Reservation[]>(
      'SELECT * FROM reservations WHERE userId = ? ORDER BY date DESC, time DESC',
      [userId]
    );
  }

  async getAllReservations(): Promise<Reservation[]> {
    return this.db.all<Reservation[]>(
      'SELECT * FROM reservations ORDER BY date DESC, time DESC'
    );
  }

  async updateReservation(id: string, updates: Partial<Omit<Reservation, 'id' | 'createdAt'>>): Promise<Reservation | null> {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    if (fields.length <= 1) {
      return this.getReservation(id);
    }

    await this.db.run(
      `UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.getReservation(id);
  }

  async deleteReservation(id: string): Promise<boolean> {
    const result = await this.db.run(
      'DELETE FROM reservations WHERE id = ?',
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async getReservationsByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    return this.db.all<Reservation[]>(
      'SELECT * FROM reservations WHERE date BETWEEN ? AND ? ORDER BY date, time',
      [startDate, endDate]
    );
  }

  async checkAvailability(date: string, time: string, partySize: number): Promise<boolean> {
    // Simple availability check - max 30 people per time slot
    const result = await this.db.get<{ total: number }>(
      `SELECT SUM(partySize) as total FROM reservations 
       WHERE date = ? AND time = ? AND status != 'cancelled'`,
      [date, time]
    );

    const currentPartySize = result?.total ?? 0;
    return (currentPartySize + partySize) <= 30;
  }
}
