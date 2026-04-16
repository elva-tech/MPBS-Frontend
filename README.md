# MPBS - Milk Procurement & BMC System

A comprehensive milk collection and verification system for Societies, BMC (Bulk Milk Cooler), and Admin users.

## Features

- **Society Portal**: Milk collection, verification tracking, and dashboard
- **BMC Portal**: Society milk verification and BMC dashboard
- **Admin Portal**: User management, notifications, and requests

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT

## Quick Start

### Option 1: Automatic Startup (Recommended)

Double-click `start.bat` or run:
```bash
./start.ps1
```

This will automatically:
1. Start the backend server on port 4000
2. Wait for backend to be ready
3. Start the frontend server on port 5173

### Option 2: Manual Startup

#### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 2. Setup Database

Make sure MongoDB is running on `mongodb://127.0.0.1:27017`

Seed the database:
```bash
cd backend
npm run seed
cd ..
```

#### 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Environment Variables

### Frontend (.env)
```
VITE_ENV=development
VITE_API_BASE=http://localhost:4000
```

### Backend (backend/.env)
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mpbs
JWT_SECRET=replace_with_strong_secret
CORS_ORIGIN=http://localhost:5173,http://localhost:5175
SOCIETY_FIXED_RATE=45
```

## Default Login Credentials

### Society User
- Username: `SOCIETY_001`
- Password: `password123`

### BMC User
- Username: `BMC_001`
- Password: `bmc123`

### Admin User
- Username: `admin`
- Password: `admin123`

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Backend Health Check: http://localhost:4000/health

## Troubleshooting

### Backend Connection Issues

If you see "fetch failed" errors:
1. Ensure MongoDB is running
2. Check if port 4000 is available
3. Use the `start.bat` script which handles startup sequence
4. The API now has built-in retry logic (3 attempts)
5. Verify backend health: `http://localhost:4000/health` should return `{"ok":true}`
6. If MongoDB starts late, backend now retries DB connection (defaults: 15 attempts, 2s delay)
7. Backend `npm run dev` now auto-restarts if startup fails (for example, DB still coming up)

Backend retry settings (optional, in `backend/.env`):
```env
DB_CONNECT_MAX_RETRIES=15
DB_CONNECT_RETRY_DELAY_MS=2000
DEV_RESTART_DELAY_MS=3000
```

### Port Already in Use

Kill existing processes:
```powershell
# Find process on port 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess

# Kill the process
Stop-Process -Id <ProcessId> -Force
```

## Project Structure

```
MPBS-Frontend/
├── backend/              # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── scripts/
│       └── seed.js
├── src/                  # React frontend
│   ├── modules/
│   │   ├── admin/
│   │   ├── bmc/
│   │   └── society/
│   └── utils/
│       └── api.js        # API client with retry logic
├── start.bat            # Windows startup script
└── start.ps1            # PowerShell startup script
```

## Development

```bash
# Run both servers concurrently
npm run dev:all

# Build frontend for production
npm run build

# Preview production build
npm run preview
```
