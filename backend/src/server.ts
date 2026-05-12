import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init.js';
import { createReservationRoutes } from './routes/reservations.js';
import { createProductRoutes } from './routes/products.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// Middleware
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize database and start server
async function startServer() {
  try {
    const db = await initializeDatabase();
    console.log('✓ Database connected');

    // Register routes
    app.use('/api/reservations', createReservationRoutes(db));
    app.use('/api/products', createProductRoutes(db));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Frontend URL: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
