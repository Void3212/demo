import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { SupportChatService } from '../services/SupportChatService.js';

export function createSupportChatRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const supportChatService = new SupportChatService(db);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const requests = await supportChatService.getRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching support chat requests:', error);
      res.status(500).json({ error: 'Failed to fetch support chat requests' });
    }
  });

  router.get('/open', async (req: Request, res: Response) => {
    try {
      const request = await supportChatService.getOpenRequest();
      res.json(request);
    } catch (error) {
      console.error('Error fetching open support chat request:', error);
      res.status(500).json({ error: 'Failed to fetch open support chat request' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const request = await supportChatService.getRequestById(req.params.id);
      if (!request) {
        res.status(404).json({ error: 'Support chat request not found' });
        return;
      }
      res.json(request);
    } catch (error) {
      console.error('Error fetching support chat request:', error);
      res.status(500).json({ error: 'Failed to fetch support chat request' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, status, customerMessages, adminMessages, requestedAt, updatedAt } = req.body;
      if (!id || !status || !Array.isArray(customerMessages) || !Array.isArray(adminMessages) || !requestedAt || !updatedAt) {
        res.status(400).json({ error: 'Invalid support chat request payload' });
        return;
      }

      const request = await supportChatService.createRequest({
        id,
        status,
        customerMessages,
        adminMessages,
        requestedAt,
        updatedAt,
      });
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating support chat request:', error);
      res.status(500).json({ error: 'Failed to create support chat request' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const updates: any = {};
      if (req.body.status) updates.status = req.body.status;
      if (req.body.customerMessages) updates.customerMessages = req.body.customerMessages;
      if (req.body.adminMessages) updates.adminMessages = req.body.adminMessages;
      if (req.body.requestedAt) updates.requestedAt = req.body.requestedAt;
      if (req.body.updatedAt) updates.updatedAt = req.body.updatedAt;

      const request = await supportChatService.updateRequest(req.params.id, updates);
      if (!request) {
        res.status(404).json({ error: 'Support chat request not found' });
        return;
      }
      res.json(request);
    } catch (error) {
      console.error('Error updating support chat request:', error);
      res.status(500).json({ error: 'Failed to update support chat request' });
    }
  });

  return router;
}
