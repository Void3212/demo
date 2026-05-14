const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export type LiveChatRequestStatus = 'waiting' | 'connected' | 'closed';

export interface LiveChatRequest {
  id: string;
  status: LiveChatRequestStatus;
  customerMessages: string[];
  adminMessages: string[];
  requestedAt: number;
  updatedAt: number;
}

export class SupportChatAPI {
  static async getOpenRequest(): Promise<LiveChatRequest | null> {
    const response = await fetch(`${API_URL}/support-chat/open`);
    if (!response.ok) {
      throw new Error('Failed to fetch open support chat request');
    }
    return response.json();
  }

  static async getRequestById(id: string): Promise<LiveChatRequest | null> {
    const response = await fetch(`${API_URL}/support-chat/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch support chat request');
    }
    return response.json();
  }

  static async getRequests(): Promise<LiveChatRequest[]> {
    const response = await fetch(`${API_URL}/support-chat`);
    if (!response.ok) {
      throw new Error('Failed to fetch support chat requests');
    }
    return response.json();
  }

  static async createRequest(request: LiveChatRequest): Promise<LiveChatRequest> {
    const response = await fetch(`${API_URL}/support-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create support chat request');
    }
    return response.json();
  }

  static async updateRequest(id: string, updates: Partial<Omit<LiveChatRequest, 'id'>>): Promise<LiveChatRequest> {
    const response = await fetch(`${API_URL}/support-chat/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update support chat request');
    }
    return response.json();
  }
}
