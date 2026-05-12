import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { ReservationService } from '../services/ReservationService.js';

export function createReservationRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const reservationService = new ReservationService(db);

  // Create a new reservation
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { userId, date, time, partySize, specialRequests } = req.body;

      // Validation
      if (!userId || !date || !time || !partySize) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (partySize < 1 || partySize > 20) {
        return res.status(400).json({ error: 'Party size must be between 1 and 20' });
      }

      // Check availability
      const isAvailable = await reservationService.checkAvailability(date, time, partySize);
      if (!isAvailable) {
        return res.status(409).json({ error: 'No availability for this date and time' });
      }

      const reservation = await reservationService.createReservation({
        userId,
        date,
        time,
        partySize,
        specialRequests,
        status: 'pending'
      });

      res.status(201).json(reservation);
    } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({ error: 'Failed to create reservation' });
    }
  });

  // Get all reservations (admin only)
  router.get('/', async (req: Request, res: Response) => {
    try {
      const reservations = await reservationService.getAllReservations();
      res.json(reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  });

  // Get user's reservations
  router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const reservations = await reservationService.getUserReservations(userId);
      res.json(reservations);
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  });

  // Get a specific reservation
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reservation = await reservationService.getReservation(id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json(reservation);
    } catch (error) {
      console.error('Error fetching reservation:', error);
      res.status(500).json({ error: 'Failed to fetch reservation' });
    }
  });

  // Update a reservation
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const reservation = await reservationService.updateReservation(id, updates);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json(reservation);
    } catch (error) {
      console.error('Error updating reservation:', error);
      res.status(500).json({ error: 'Failed to update reservation' });
    }
  });

  // Cancel a reservation
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await reservationService.deleteReservation(id);

      if (!success) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json({ message: 'Reservation deleted' });
    } catch (error) {
      console.error('Error deleting reservation:', error);
      res.status(500).json({ error: 'Failed to delete reservation' });
    }
  });

  // Check availability
  router.post('/check-availability', async (req: Request, res: Response) => {
    try {
      const { date, time, partySize } = req.body;

      if (!date || !time || !partySize) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const isAvailable = await reservationService.checkAvailability(date, time, partySize);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  });

  return router;
}
