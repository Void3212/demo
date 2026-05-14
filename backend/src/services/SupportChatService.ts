import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export type LiveChatRequestStatus = 'waiting' | 'connected' | 'closed';

export interface SupportChatRequest {
  id: string;
  status: LiveChatRequestStatus;
  customerMessages: string[];
  adminMessages: string[];
  requestedAt: number;
  updatedAt: number;
}

export class SupportChatService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  private parseRow(row: any): SupportChatRequest {
    return {
      id: row.id,
      status: row.status as LiveChatRequestStatus,
      customerMessages: JSON.parse(row.customer_messages),
      adminMessages: JSON.parse(row.admin_messages),
      requestedAt: Number(row.requested_at),
      updatedAt: Number(row.updated_at),
    };
  }

  async getRequests(): Promise<SupportChatRequest[]> {
    const rows = await this.db.all<any>(`SELECT * FROM support_chat_requests ORDER BY updated_at DESC`);
    return rows.map((row) => this.parseRow(row));
  }

  async getOpenRequest(): Promise<SupportChatRequest | null> {
    const row = await this.db.get<any>(
      `SELECT * FROM support_chat_requests WHERE status IN ('waiting','connected') ORDER BY updated_at DESC LIMIT 1`,
    );
    return row ? this.parseRow(row) : null;
  }

  async getRequestById(id: string): Promise<SupportChatRequest | null> {
    const row = await this.db.get<any>(`SELECT * FROM support_chat_requests WHERE id = ?`, id);
    return row ? this.parseRow(row) : null;
  }

  async createRequest(request: SupportChatRequest): Promise<SupportChatRequest> {
    await this.db.run(
      `INSERT INTO support_chat_requests (id, status, customer_messages, admin_messages, requested_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      request.id,
      request.status,
      JSON.stringify(request.customerMessages),
      JSON.stringify(request.adminMessages),
      request.requestedAt,
      request.updatedAt,
    );
    return request;
  }

  async updateRequest(id: string, updates: Partial<Omit<SupportChatRequest, 'id'>>): Promise<SupportChatRequest | null> {
    const request = await this.getRequestById(id);
    if (!request) return null;
    const nextRequest: SupportChatRequest = {
      ...request,
      ...updates,
      customerMessages: updates.customerMessages ?? request.customerMessages,
      adminMessages: updates.adminMessages ?? request.adminMessages,
      updatedAt: updates.updatedAt ?? Date.now(),
    };

    await this.db.run(
      `UPDATE support_chat_requests SET status = ?, customer_messages = ?, admin_messages = ?, requested_at = ?, updated_at = ? WHERE id = ?`,
      nextRequest.status,
      JSON.stringify(nextRequest.customerMessages),
      JSON.stringify(nextRequest.adminMessages),
      nextRequest.requestedAt,
      nextRequest.updatedAt,
      id,
    );

    return nextRequest;
  }
}
