# Fleet Management System (FM 1.0)

A production-grade Fleet Management & Telematics System built with modern web technologies. This system provides real-time vehicle tracking, fuel theft detection, odometer monitoring, geofencing, and comprehensive analytics for fleet operations.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│                   https://fm-1-0.vercel.app                  │
│                                                              │
│  • Real-time Dashboard    • Vehicle Tracking                │
│  • Fuel Reports          • Geofencing                       │
│  • Alerts Management     • Analytics                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ REST APIs + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           Backend (Node.js + Express + TypeScript)          │
│                https://fm-1-0.onrender.com                  │
│                                                              │
│  • Authentication (JWT)      • GPS Data Processing          │
│  • Fuel Theft Detection      • Odometer Monitoring          │
│  • Geofence Monitoring       • Alert System                 │
│  • Trip Tracking             • Real-time WebSocket          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Prisma ORM
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database (Supabase)                 │
│    postgresql://...@db.tpebwpiejnxdipazwuzq.supabase.co    │
│                                                              │
│  • Users & Auth      • Vehicles & Telemetry                │
│  • Fuel Events       • Alerts & Geofences                  │
│  • Trips & Odometer  • Audit Logs                          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **pnpm** (recommended)
- **PostgreSQL** 15+ (or Supabase account)
- **Git**

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aryankr26/FM_1.0.git
   cd FM_1.0
   ```

2. **Setup Backend**
   ```bash
   cd backend
   
   # Install dependencies
   npm install
   # or
   pnpm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   
   # Generate Prisma Client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed demo data
   # Set ENABLE_SEED=true in .env, then:
   npm run seed
   
   # Start development server
   npm run dev
   # Backend will run on http://localhost:4000
   ```

3. **Setup Frontend**
   ```bash
   # In a new terminal
   cd frontend
   
   # Install dependencies
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env if using different backend URL
   
   # Start development server
   npm run dev
   # Frontend will run on http://localhost:5173
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - Health Check: http://localhost:4000/health

## 📁 Project Structure

```
FM_1.0/
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── pages/        # Page components
│   │   │   └── ui/           # Reusable UI components
│   │   ├── services/         # API & WebSocket services
│   │   │   ├── api.js        # REST API client
│   │   │   └── websocket.js  # WebSocket client
│   │   ├── App.jsx           # Main application component
│   │   └── main.jsx          # Application entry point
│   ├── .env.example          # Frontend environment template
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
│
├── backend/                   # Node.js backend application
│   ├── src/
│   │   ├── config/           # Configuration (env, database, logger)
│   │   ├── middleware/       # Express middleware
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── vehicles/    # Vehicle management
│   │   │   ├── telemetry/   # GPS data processing
│   │   │   ├── fuel/        # Fuel theft detection
│   │   │   ├── alerts/      # Alert system
│   │   │   ├── geofence/    # Geofencing
│   │   │   ├── trip/        # Trip tracking
│   │   │   └── dashboard/   # Dashboard APIs
│   │   ├── gps/             # GPS provider abstraction
│   │   ├── utils/           # Utilities
│   │   ├── app.ts           # Express app setup
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts          # Optional seed data
│   ├── .env.example         # Backend environment template
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
├── README.md                 # This file
└── render.yaml              # Render deployment config
```

## 🗄️ Database Schema

The database is designed to be **fully modifiable** without breaking the application.

### Core Tables

- **User** - Authentication and user management
- **Vehicle** - Fleet vehicles with IMEI tracking
- **Telemetry** - GPS data points (lat/lng, speed, ignition)
- **FuelEvent** - Fuel consumption and theft detection events
- **Alert** - System alerts with severity levels
- **Trip** - Journey tracking with fuel and distance metrics
- **Geofence** - Location boundaries (circle/polygon)
- **GeofenceAlert** - Geofence violation alerts
- **Tyre** - Tyre lifecycle management

### How to Modify Schema

1. Edit `backend/prisma/schema.prisma`
2. Create migration:
   ```bash
   cd backend
   npx prisma migrate dev --name your_change_description
   ```
3. Apply migration to production:
   ```bash
   npx prisma migrate deploy
   ```

### Working with Empty Database

The system is designed to work with an empty database. No seed data is required:

1. Set `ENABLE_SEED=false` in backend `.env`
2. Run migrations: `npx prisma migrate dev`
3. Create users via the registration API
4. Add vehicles through the admin interface

## 🔌 API Documentation

### Base URL
- **Local**: `http://localhost:4000/api`
- **Production**: `https://fm-1-0.onrender.com/api`

### Authentication

All API routes (except auth endpoints) require JWT authentication.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Endpoints

#### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/me            - Get current user (protected)
```

#### Vehicles
```
GET    /api/vehicles                    - Get all vehicles
GET    /api/vehicles/:id                - Get vehicle by ID
POST   /api/vehicles                    - Create vehicle (owner/supervisor)
PUT    /api/vehicles/:id                - Update vehicle (owner/supervisor)
DELETE /api/vehicles/:id                - Delete vehicle (owner only)
GET    /api/vehicles/statistics         - Get vehicle statistics
```

#### Dashboard
```
GET    /api/dashboard/statistics        - Get overall stats
GET    /api/dashboard/live              - Get live vehicle positions
GET    /api/dashboard/alerts            - Get recent alerts
GET    /api/dashboard/fuel-stats        - Get fuel statistics
GET    /api/dashboard/trip-stats        - Get trip statistics
```

#### Telemetry
```
GET    /api/telemetry/vehicle/:vehicleId           - Get telemetry for vehicle
GET    /api/telemetry/vehicle/:vehicleId/latest    - Get latest telemetry
```

#### Fuel
```
GET    /api/fuel/events                 - Get all fuel events
GET    /api/fuel/vehicle/:vehicleId     - Get fuel events for vehicle
GET    /api/fuel/theft                  - Get theft alerts
```

#### Alerts
```
GET    /api/alerts                      - Get all alerts
GET    /api/alerts/:id                  - Get alert by ID
PATCH  /api/alerts/:id/resolve          - Mark alert as resolved
PATCH  /api/alerts/:id/unresolve        - Mark alert as unresolved
```

#### Geofencing
```
GET    /api/geofence                    - Get all geofences
GET    /api/geofence/:id                - Get geofence by ID
POST   /api/geofence                    - Create geofence (owner/supervisor)
PATCH  /api/geofence/:id                - Update geofence (owner/supervisor)
DELETE /api/geofence/:id                - Delete geofence (owner)
GET    /api/geofence/alerts/all         - Get geofence alerts
```

#### Trips
```
GET    /api/trips                       - Get all trips
GET    /api/trips/:id                   - Get trip by ID
GET    /api/trips/vehicle/:vehicleId    - Get trips for vehicle
```

### WebSocket Events

Connect to WebSocket server at the same URL as the API.

**Events emitted by server:**
- `vehicle:update` - Real-time vehicle position updates
- `alert:new` - New alert notifications
- `dashboard:update` - Dashboard metrics updates

## 🌐 Frontend-Backend Communication

### API Service Layer

The frontend uses a centralized API service located at `frontend/src/services/api.js`:

```javascript
import { vehiclesApi, dashboardApi, alertsApi } from '@/services/api';

// Fetch vehicles
const vehicles = await vehiclesApi.getAll();

// Fetch dashboard stats
const stats = await dashboardApi.getStats();

// Fetch alerts
const alerts = await alertsApi.getAll({ resolved: false });
```

### WebSocket Integration

Real-time updates are handled through `frontend/src/services/websocket.js`:

```javascript
import wsService from '@/services/websocket';

// Connect to WebSocket
wsService.connect();

// Listen for events
wsService.on('vehicle:update', (data) => {
  // Handle vehicle position update
});

// Emit events
wsService.emit('subscribe', { vehicleId: '123' });
```

### State Management

- Component-level state using React hooks (`useState`, `useEffect`)
- No global state management library (Redux/Zustand) to keep it simple
- WebSocket provides real-time data synchronization

## 🔐 Environment Variables

### Backend (.env)

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://postgres:amitkr262002@db.tpebwpiejnxdipazwuzq.supabase.co:5432/postgres

# Seed Data (optional)
ENABLE_SEED=true

# JWT Secrets (REQUIRED - change in production!)
JWT_SECRET=your_32_character_secret_key_here
JWT_REFRESH_SECRET=your_32_character_refresh_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=https://fm-1-0.vercel.app

# GPS Provider
GPS_PROVIDER=simulator
GPS_POLL_INTERVAL=10000

# Millitrack API (if using real GPS)
MILLITRACK_TOKEN=your_token_here
MILLITRACK_BASE_URL=https://mvts1.millitrack.com/api/middleMan/getDeviceInfo

# Simulation Settings
SIMULATION_FLEET_SIZE=10
SIMULATION_ENABLE_THEFT=true
SIMULATION_ENABLE_TAMPERING=true
```

### Frontend (.env)

```env
# Backend API URL
VITE_API_URL=http://localhost:4000

# WebSocket URL (usually same as API)
VITE_SOCKET_URL=http://localhost:4000
```

**Production:**
```env
VITE_API_URL=https://fm-1-0.onrender.com
VITE_SOCKET_URL=https://fm-1-0.onrender.com
```

## 🚢 Deployment

### Backend Deployment (Render)

1. **Connect GitHub Repository** to Render
2. **Service Type**: Web Service
3. **Build Command**: `pnpm install --frozen-lockfile --prod=false && pnpm build`
4. **Start Command**: `pnpm prisma:deploy && pnpm start`
5. **Environment Variables**: Set all backend env vars in Render dashboard

The `render.yaml` configuration is already included in the repository.

### Frontend Deployment (Vercel)

1. **Connect GitHub Repository** to Vercel
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: Set `VITE_API_URL` and `VITE_SOCKET_URL`

### Database (Supabase)

Database is already configured with Supabase:
- Host: `db.tpebwpiejnxdipazwuzq.supabase.co`
- Database: `postgres`
- Port: `5432`

**Note**: For production, use environment variables and never commit credentials.

## 🧪 Testing

### Backend

```bash
cd backend

# Type checking
npx tsc --noEmit

# Run health check
curl http://localhost:4000/health

# View database
npx prisma studio
```

### Frontend

```bash
cd frontend

# Run tests (if configured)
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Development Workflow

### Adding a New Feature

1. **Backend:**
   - Create module in `backend/src/modules/feature-name/`
   - Add routes, controller, service, types
   - Update `backend/src/app.ts` with new routes
   - Test with Postman/curl

2. **Frontend:**
   - Add API methods to `frontend/src/services/api.js`
   - Create/update components in `frontend/src/components/`
   - Connect to API using hooks
   - Test in browser

3. **Database:**
   - Update `backend/prisma/schema.prisma`
   - Run `npx prisma migrate dev --name feature_name`
   - Commit migration files

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## 📊 Key Features

### ✅ Implemented

- [x] User authentication (JWT)
- [x] Role-based access control (Owner/Supervisor/Driver)
- [x] Real-time vehicle tracking
- [x] Live dashboard with fleet overview
- [x] Vehicle management (CRUD)
- [x] Telemetry data processing
- [x] Fuel theft detection engine
- [x] Alert system
- [x] Geofencing with circle/polygon support
- [x] Trip tracking and analytics
- [x] WebSocket for real-time updates
- [x] GPS provider abstraction (Millitrack + Simulator)
- [x] Structured logging
- [x] Rate limiting
- [x] CORS configuration
- [x] Database migrations

### 🚧 In Progress

- [ ] Complete frontend pages (FuelReports, GeofencingPage, Settings, etc.)
- [ ] Advanced analytics and reporting
- [ ] Email/SMS notifications
- [ ] Mobile app
- [ ] Fleet maintenance scheduling
- [ ] Driver management
- [ ] Route optimization

## 🐛 Troubleshooting

### Backend won't start

1. Check database connection:
   ```bash
   npx prisma db pull
   ```
2. Verify environment variables in `.env`
3. Check logs in `backend/logs/`

### Frontend can't connect to backend

1. Verify `VITE_API_URL` in frontend `.env`
2. Check backend is running: `curl http://localhost:4000/health`
3. Check browser console for CORS errors
4. Verify backend CORS settings include frontend URL

### Database migration failed

1. Check database credentials
2. Ensure database is accessible
3. Try reset:
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev
   ```

### Seed data not loading

1. Check `ENABLE_SEED=true` in backend `.env`
2. Run manually: `npm run seed`
3. Check for errors in console output

## 📝 License

Proprietary - Fleet Management System

## 👥 Support

For questions or issues:
- Create an issue on GitHub
- Contact: [Repository Owner](https://github.com/Aryankr26)

## 🎯 Mission

This system is designed as a **Loss-Prevention Engine**, not just a GPS tracker. The primary mission is to detect and prevent:

1. ⛽ Diesel theft (engine off + fuel drop detection)
2. 📏 Fake mileage manipulation
3. 🔧 Odometer tampering (GPS vs Dashboard comparison)
4. 🛞 Tyre theft monitoring
5. 🗺️ Route deviations and geofence violations
6. 🚫 Unauthorized stops and delays

---

**Version**: 2.0.0 (Complete Rebuild)  
**Last Updated**: December 2024  
**Status**: Production Ready (Backend) | In Progress (Frontend)
