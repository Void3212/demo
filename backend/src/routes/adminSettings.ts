import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { AdminSettingsService } from '../services/AdminSettingsService.js';

export function createAdminSettingsRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const settingsService = new AdminSettingsService(db);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const settings = await settingsService.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      res.status(500).json({ error: 'Failed to fetch admin settings' });
    }
  });

  router.patch('/', async (req: Request, res: Response) => {
    try {
      const allowedKeys = [
        'maintenanceMode',
        'allowGuestCheckout',
        'emailNotifications',
        'liveAgentAvailable',
        'liveAgentName',
        'businessHours',
        'defaultCurrency',
      ];

      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedKeys.includes(key)) {
          updates[key] = value;
        }
      }

      const settings = await settingsService.updateSettings(updates as any);
      res.json(settings);
    } catch (error) {
      console.error('Error updating admin settings:', error);
      res.status(500).json({ error: 'Failed to update admin settings' });
    }
  });

  return router;
}
