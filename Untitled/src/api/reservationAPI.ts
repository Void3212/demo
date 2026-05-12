const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

export class ReservationAPI {
  static async createReservation(userId: string, data: {
    date: string;
    time: string;
    partySize: number;
    specialRequests?: string;
  }): Promise<Reservation> {
    const response = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create reservation');
    }

    return response.json();
  }

  static async getReservations(userId: string): Promise<Reservation[]> {
    const response = await fetch(`${API_URL}/reservations/user/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch reservations');
    }

    return response.json();
  }

  static async getAllReservations(): Promise<Reservation[]> {
    const response = await fetch(`${API_URL}/reservations`);

    if (!response.ok) {
      throw new Error('Failed to fetch reservations');
    }

    return response.json();
  }

  static async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation> {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update reservation');
    }

    return response.json();
  }

  static async deleteReservation(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete reservation');
    }
  }

  static async checkAvailability(date: string, time: string, partySize: number): Promise<boolean> {
    const response = await fetch(`${API_URL}/reservations/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time, partySize })
    });

    if (!response.ok) {
      throw new Error('Failed to check availability');
    }

    const data = await response.json();
    return data.available;
  }
}
