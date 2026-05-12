import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface AdminSettings {
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  emailNotifications: boolean;
  businessHours: string;
  defaultCurrency: string;
}

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  maintenanceMode: false,
  allowGuestCheckout: true,
  emailNotifications: true,
  businessHours: '10:00 - 22:00',
  defaultCurrency: 'PHP',
};

export class AdminSettingsService {
  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {}

  async getSettings(): Promise<AdminSettings> {
    const rows = (await this.db.all<{ key: string; value: string }>(
      'SELECT key, value FROM admin_settings',
    )) as unknown as { key: string; value: string }[];

    const settings: Record<string, any> = { ...DEFAULT_ADMIN_SETTINGS };
    for (const row of (rows || [])) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    return settings as AdminSettings;
  }

  async updateSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
    const insert = await this.db.prepare(
      'INSERT INTO admin_settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      await insert.run(key, JSON.stringify(value));
    }

    await insert.finalize();
    return this.getSettings();
  }

  async initializeDefaults(): Promise<void> {
    const settings = await this.getSettings();
    const insert = await this.db.prepare(
      'INSERT OR IGNORE INTO admin_settings(key, value) VALUES (?, ?)',
    );

    for (const [key, value] of Object.entries(DEFAULT_ADMIN_SETTINGS)) {
      if (settings[key as keyof AdminSettings] === undefined) {
        await insert.run(key, JSON.stringify(value));
      }
    }

    await insert.finalize();
  }
}
