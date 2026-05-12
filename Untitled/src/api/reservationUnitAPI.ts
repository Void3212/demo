const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

export class ReservationUnitAPI {
  static async getAllUnits(): Promise<ReservationUnit[]> {
    const response = await fetch(`${API_URL}/reservation-units`);
    if (!response.ok) {
      throw new Error('Failed to fetch reservation units');
    }
    return response.json();
  }

  static async getUnitsByService(serviceId: string): Promise<ReservationUnit[]> {
    const response = await fetch(`${API_URL}/reservation-units/service/${serviceId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch units by service');
    }
    return response.json();
  }

  static async getUnit(id: string): Promise<ReservationUnit> {
    const response = await fetch(`${API_URL}/reservation-units/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch reservation unit');
    }
    return response.json();
  }

  static async createUnit(unit: Omit<ReservationUnit, 'createdAt' | 'updatedAt'>): Promise<ReservationUnit> {
    const response = await fetch(`${API_URL}/reservation-units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unit),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create reservation unit');
    }
    return response.json();
  }

  static async updateUnit(id: string, updates: Partial<ReservationUnit>): Promise<ReservationUnit> {
    const response = await fetch(`${API_URL}/reservation-units/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update reservation unit');
    }
    return response.json();
  }

  static async deleteUnit(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/reservation-units/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete reservation unit');
    }
  }
}