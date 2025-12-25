# Fleet Backend - Production Loss-Prevention Engine

## Overview

This is a production-grade backend for a Fleet Management & Telematics System focused on preventing monetary losses through real-time monitoring and intelligent detection engines.

## Tech Stack

- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Authentication:** JWT (jsonwebtoken + bcryptjs)
- **Real-Time:** Socket.IO
- **Validation:** Zod
- **Logging:** Winston

## Core Features

### Loss-Prevention Engines
1. **Fuel Theft Detection** - Engine state-aware detection
2. **Odometer Tampering Detection** - GPS vs Dashboard comparison
3. **Mileage Computation** - Accurate distance calculation
4. **Geofence Monitoring** - Boundary violation detection
5. **Alert System** - Real-time notifications

### GPS Provider Support
- **Millitrack API** - Production GPS data provider
- **Built-in Simulator** - Realistic simulation for development/demo

### Security Features
- JWT authentication with refresh tokens
- Role-based access control (Owner/Supervisor/Driver)
- Rate limiting on all endpoints
- Input validation with Zod schemas
- Structured logging

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration (env, logger, database)
│   ├── middleware/          # Express middleware (auth, error, rate limit, validation)
│   ├── modules/             # Business logic modules
│   │   └── auth/           # Authentication (✅ Complete)
│   ├── utils/               # Utilities (haversine, constants)
│   ├── app.ts               # Express app configuration
│   └── index.ts             # Server entry point with WebSocket
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
├── .env.example             # Environment template
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Quick Start

See [../docs/RUN_LOCAL.md](../docs/RUN_LOCAL.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Health
- `GET /health` - System health check

## Environment Variables

Required variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 chars)
- `PORT` - Server port (default: 4000)
- `GPS_PROVIDER` - `simulator` or `millitrack`

## Development Status

✅ **Completed:**
- TypeScript infrastructure
- Configuration & logging
- Database schema
- Authentication system
- Middleware layer
- WebSocket server (basic)

⏳ **In Progress:**
- Telemetry module
- Fuel theft detection engine
- Odometer tampering detection
- GPS provider abstraction
- Simulator implementation
- Alert system
- Remaining business modules

See [../docs/IMPLEMENTATION_ROADMAP.md](../docs/IMPLEMENTATION_ROADMAP.md) for detailed progress.

## Architecture

This system is designed as a **Loss-Prevention Engine**, not just a GPS tracker. The primary mission is to detect and prevent:

1. Diesel theft (engine off + fuel drop)
2. Fake mileage manipulation
3. Odometer tampering
4. Tyre theft
5. Route deviations
6. Unauthorized stops

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for complete system design.

## Database Schema

Key models:
- **User** - Authentication & authorization
- **Vehicle** - Fleet vehicles with IMEI tracking
- **Telemetry** - GPS data points
- **FuelEvent** - Fuel consumption/theft events with pattern detection
- **Alert** - System alerts with severity levels
- **Geofence** - Location boundaries (circle/polygon)
- **Trip** - Journey tracking
- **Tyre** - Tyre lifecycle management

## Security

- JWT tokens expire in 15 minutes (configurable)
- Refresh tokens for long-lived sessions
- Rate limiting: 100 req/15min (API), 5 req/15min (auth)
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- Structured error handling

## Logging

Logs are written to:
- Console (colorized)
- `logs/error.log` (errors only)
- `logs/all.log` (all levels)

## WebSocket Events

Real-time events (planned):
- `vehicle:update` - Vehicle position updates
- `alert:new` - New alert notifications
- `dashboard:update` - Dashboard metrics

## Testing

```bash
# Type check
npx tsc --noEmit

# Manual API testing
curl http://localhost:4000/health

# Database GUI
npx prisma studio
```

## Deployment

See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) (coming soon) for production deployment guide.

## License

Proprietary - Fleet Management System

## Support

For setup help, see [../docs/RUN_LOCAL.md](../docs/RUN_LOCAL.md)

---

**Version:** 2.0.0 (Complete Rebuild)  
**Status:** Foundation Complete - Core Modules In Progress

