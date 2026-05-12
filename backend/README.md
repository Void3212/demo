# Chillingan Backend - Reservation System

Node.js/Express backend with SQLite for the Chillingan restaurant reservation system.

## Setup

### 1. Install Dependencies

```bash
cd demo/backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default configuration:
- **PORT**: 3000
- **DATABASE_PATH**: ./data/chillingan.db
- **NODE_ENV**: development
- **FRONTEND_URL**: http://localhost:5174

### 3. Initialize Database

```bash
npm run db:init
```

This creates the SQLite database with the required tables:
- `users` - User accounts
- `reservations` - Restaurant reservations
- `orders` - Food orders

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Reservations

#### Create Reservation
```
POST /api/reservations
Content-Type: application/json

{
  "userId": "user123",
  "date": "2024-05-20",
  "time": "19:00",
  "partySize": 4,
  "specialRequests": "Window seat preferred"
}
```

#### Get All Reservations (Admin)
```
GET /api/reservations
```

#### Get User's Reservations
```
GET /api/reservations/user/:userId
```

#### Get Specific Reservation
```
GET /api/reservations/:id
```

#### Update Reservation
```
PATCH /api/reservations/:id
Content-Type: application/json

{
  "status": "confirmed",
  "partySize": 5
}
```

#### Delete Reservation
```
DELETE /api/reservations/:id
```

#### Check Availability
```
POST /api/reservations/check-availability
Content-Type: application/json

{
  "date": "2024-05-20",
  "time": "19:00",
  "partySize": 4
}
```

#### Health Check
```
GET /api/health
```

## Frontend Integration

The frontend should use the `ReservationAPI` class from `src/api/reservationAPI.ts`:

```typescript
import { ReservationAPI } from '@/api/reservationAPI';

// Create reservation
const reservation = await ReservationAPI.createReservation(userId, {
  date: '2024-05-20',
  time: '19:00',
  partySize: 4,
  specialRequests: 'Window seat'
});

// Get user reservations
const reservations = await ReservationAPI.getReservations(userId);

// Check availability
const available = await ReservationAPI.checkAvailability('2024-05-20', '19:00', 4);
```

## Database Schema

### reservations
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| userId | TEXT | Foreign key to users |
| date | TEXT | YYYY-MM-DD format |
| time | TEXT | HH:MM format |
| partySize | INTEGER | 1-20 |
| specialRequests | TEXT | Optional |
| status | TEXT | pending, confirmed, cancelled, completed |
| createdAt | DATETIME | Auto |
| updatedAt | DATETIME | Auto |

## Constraints

- **Max party size**: 20 people
- **Max people per time slot**: 30 people
- **Status values**: pending, confirmed, cancelled, completed

## Development

### File Structure
```
backend/
├── src/
│   ├── db/
│   │   └── init.ts          # Database initialization
│   ├── services/
│   │   └── ReservationService.ts  # Business logic
│   ├── routes/
│   │   └── reservations.ts   # API endpoints
│   └── server.ts            # Express server
├── data/
│   └── chillingan.db        # SQLite database (created on first run)
├── package.json
├── tsconfig.json
└── .env
```

### Environment Variables
- `PORT` - Server port (default: 3000)
- `DATABASE_PATH` - SQLite database path (default: ./data/chillingan.db)
- `NODE_ENV` - development or production
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5174)

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Database lock issues
The database file may be locked. Ensure only one server instance is running.

### CORS errors
Check that `FRONTEND_URL` in `.env` matches your frontend origin.

## Next Steps

1. Update frontend components to use `ReservationAPI` instead of localStorage
2. Implement user authentication endpoints
3. Add order management API endpoints
4. Set up proper error logging and monitoring
