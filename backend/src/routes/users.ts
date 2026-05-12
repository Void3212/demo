import { Router, Request, Response } from 'express';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { UserService } from '../services/UserService.js';

export function createUserRoutes(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const router = Router();
  const userService = new UserService(db);

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, address, profileImage } = req.body;
      if (!name || !email || !password || !phone || !address || profileImage === undefined) {
        return res.status(400).json({ error: 'Missing required fields for registration' });
      }

      const user = await userService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        address: address.trim(),
        profileImage,
        role: 'customer',
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error registering user:', error);
      const message = error instanceof Error ? error.message : 'Failed to register user';
      res.status(400).json({ error: message });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const user = await userService.validateCredentials(email.trim(), password);
      res.json(user);
    } catch (error) {
      console.error('Error logging in user:', error);
      const message = error instanceof Error ? error.message : 'Failed to log in';
      res.status(401).json({ error: message });
    }
  });

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  return router;
}
