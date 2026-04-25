# TwishhSync: Workspace Attendance System

A high-density, zero-trust attendance management platform featuring spatial verification and biometric (Passkey) authentication.

## Project Structure

This repository is organized into three primary tiers:

- **[frontend/](file:///c:/Users/palpp/Downloads/Attendance%20System%20Web/frontend)**: React (Vite) application with a modular architectural design.
- **[backend/](file:///c:/Users/palpp/Downloads/Attendance%20System%20Web/backend)**: Node/Express API powered by Prisma and SQLite.
- **[database/](file:///c:/Users/palpp/Downloads/Attendance%20System%20Web/database)**: Centralized data layer containing the Prisma schema and the SQLite (`dev.db`) file.

## Local Setup

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
From the root directory, install dependencies for both the frontend and backend:
```bash
npm run install:all
```

### 3. Environment Configuration
Copy the template files and fill in your local secrets:
- `frontend/.env.example` -> `frontend/.env`
- `backend/.env.example` -> `backend/.env`

### 4. Database Initialization
Ensure the Prisma client is generated from the centralized schema:
```bash
npm run prisma:generate
```

### 5. Running the Application
To start the services individually from the root:
- Backend: `npm run start:server`
- Frontend: `npm run start:client`

## Deployment

The architecture is designed for modular deployment:
- **Frontend**: Can be deployed as a static site (e.g., Vercel, Netlify) using the `npm run build` command.
- **Backend**: Can be deployed to any Node.js hosting provider (e.g., Railway, Render). Ensure the `DATABASE_URL` and `JWT_SECRET` variables are properly configured in the production environment.
