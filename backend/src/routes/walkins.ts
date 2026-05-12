import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { WalkInService } from '../services/WalkInService.js';

export function createWalkInRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const walkInService = new WalkInService(db);

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { date, startTime, endTime, unitId, unitName, serviceId, serviceName, paymentAmount, amountReceived, changeAmount, paymentMethod, customerName, notes } = req.body;
      if (!date || !startTime || !endTime || !serviceId || !serviceName || paymentAmount === undefined || amountReceived === undefined || changeAmount === undefined || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required walk-in fields' });
      }

      const walkIn = await walkInService.createWalkIn({
        date,
        startTime,
        endTime,
        unitId,
        unitName,
        serviceId,
        serviceName,
        paymentAmount,
        amountReceived,
        changeAmount,
        paymentMethod,
        customerName,
        notes,
      });

      res.status(201).json(walkIn);
    } catch (error) {
      console.error('Error creating walk-in:', error);
      res.status(500).json({ error: 'Failed to create walk-in' });
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const walkIns = await walkInService.getAllWalkIns();
      res.json(walkIns);
    } catch (error) {
      console.error('Error fetching walk-ins:', error);
      res.status(500).json({ error: 'Failed to fetch walk-ins' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const success = await walkInService.deleteWalkIn(req.params.id);
      if (!success) return res.status(404).json({ error: 'Walk-in not found' });
      res.json({ message: 'Walk-in deleted' });
    } catch (error) {
      console.error('Error deleting walk-in:', error);
      res.status(500).json({ error: 'Failed to delete walk-in' });
    }
  });

  return router;
}
