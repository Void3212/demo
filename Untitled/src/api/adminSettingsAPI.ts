const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AdminSettings {
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  emailNotifications: boolean;
  businessHours: string;
  defaultCurrency: string;
}

export class AdminSettingsAPI {
  static async getSettings(): Promise<AdminSettings> {
    const response = await fetch(`${API_URL}/admin-settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch admin settings');
    }

    return response.json();
  }

  static async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    const response = await fetch(`${API_URL}/admin-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update admin settings');
    }

    return response.json();
  }
}
