import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface WalkIn {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  unitId?: string;
  unitName?: string;
  serviceId: string;
  serviceName: string;
  paymentAmount: number;
  amountReceived: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'card' | 'gcash' | 'other';
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class WalkInService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  async createWalkIn(walkIn: Omit<WalkIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalkIn> {
    const id = `walkin-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO walkins (id, date, startTime, endTime, unitId, unitName, serviceId, serviceName, paymentAmount, amountReceived, changeAmount, paymentMethod, customerName, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        walkIn.date,
        walkIn.startTime,
        walkIn.endTime,
        walkIn.unitId ?? null,
        walkIn.unitName ?? null,
        walkIn.serviceId,
        walkIn.serviceName,
        walkIn.paymentAmount,
        walkIn.amountReceived,
        walkIn.changeAmount,
        walkIn.paymentMethod,
        walkIn.customerName ?? null,
        walkIn.notes ?? null,
        now,
        now,
      ]
    );

    return {
      id,
      ...walkIn,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAllWalkIns(): Promise<WalkIn[]> {
    return this.db.all<WalkIn[]>('SELECT * FROM walkins ORDER BY date, startTime');
  }

  async deleteWalkIn(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM walkins WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }

  async findOverlappingWalkIns(date: string, time: string): Promise<WalkIn[]> {
    const slotHour = Number(time.split(':')[0]);
    return this.db.all<WalkIn[]>(
      `SELECT * FROM walkins WHERE date = ? AND ? >= CAST(substr(startTime, 1, instr(startTime, ':') - 1) AS INTEGER) AND ? < CAST(substr(endTime, 1, instr(endTime, ':') - 1) AS INTEGER)`,
      [date, slotHour, slotHour]
    );
  }
}
