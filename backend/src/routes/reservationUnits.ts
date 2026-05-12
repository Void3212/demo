import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { ReservationUnitService } from '../services/ReservationUnitService.js';

export function createReservationUnitRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const unitService = new ReservationUnitService(db);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const units = await unitService.getAllUnits();
      res.json(units);
    } catch (error) {
      console.error('Error fetching reservation units:', error);
      res.status(500).json({ error: 'Failed to fetch reservation units' });
    }
  });

  router.get('/service/:serviceId', async (req: Request, res: Response) => {
    try {
      const units = await unitService.getUnitsByService(req.params.serviceId);
      res.json(units);
    } catch (error) {
      console.error('Error fetching units by service:', error);
      res.status(500).json({ error: 'Failed to fetch units by service' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const unit = await unitService.getUnit(req.params.id);
      if (!unit) {
        return res.status(404).json({ error: 'Reservation unit not found' });
      }
      res.json(unit);
    } catch (error) {
      console.error('Error fetching reservation unit:', error);
      res.status(500).json({ error: 'Failed to fetch reservation unit' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, serviceId, name, description, imageUrl, active } = req.body;

      if (!id || !serviceId || !name || !description || !imageUrl) {
        return res.status(400).json({ error: 'Missing required reservation unit fields' });
      }

      const unitId = id || `unit-${Date.now()}`;

      const unit = await unitService.createUnit({
        id: unitId,
        serviceId,
        name,
        description,
        imageUrl,
        active: active === 0 ? 0 : 1,
      });

      res.status(201).json(unit);
    } catch (error) {
      console.error('Error creating reservation unit:', error);
      res.status(500).json({ error: 'Failed to create reservation unit' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const updated = await unitService.updateUnit(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Reservation unit not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating reservation unit:', error);
      res.status(500).json({ error: 'Failed to update reservation unit' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const success = await unitService.deleteUnit(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Reservation unit not found' });
      }
      res.json({ message: 'Reservation unit deleted' });
    } catch (error) {
      console.error('Error deleting reservation unit:', error);
      res.status(500).json({ error: 'Failed to delete reservation unit' });
    }
  });

  return router;
}