# TwishhSync: Workspace Attendance System

A high-density, zero-trust attendance management platform featuring spatial verification and biometric (Passkey) authentication.

## 🚀 Production Architecture

This system is optimized for a split-tier deployment:
- **Frontend**: React (Vite) deployed on **Vercel**.
- **Backend**: Node/Express API deployed on **Render**.
- **Database**: Managed **PostgreSQL** instance.

## 🛡️ Security Features

- **Zero-Trust Auth**: JWT-based session management with Passkey (Biometric) support.
- **Input Validation**: Strict schema enforcement using **Zod**.
- **Hardened Middleware**: 
    - `Helmet` for secure HTTP headers.
    - `XSS-Clean` for cross-site scripting protection.
    - `Express-Mongo-Sanitize` for injection prevention.
    - `Express-Rate-Limit` to mitigate brute-force attempts.
- **Cross-Domain Secure Cookies**: Pre-configured for split-domain hosting (`SameSite: None`, `Secure`).

## ⚙️ Deployment Configuration

### Backend (Render)
Set these environment variables in your Render Dashboard:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random string for token signing.
- `FRONTEND_URL`: Your Vercel deployment URL.
- `NODE_ENV`: `production`

### Frontend (Vercel)
Set this environment variable in your Vercel Dashboard:
- `VITE_API_URL`: Your Render Web Service URL (ending in `/api`).

## 🛠️ Local Development

1. **Install Dependencies**: `npm run install:all`
2. **Environment**: Copy `.env.example` to `.env` in both folders.
3. **Database**: `npm run prisma:generate`
4. **Run**: 
    - `npm run start:server` (Backend)
    - `npm run start:client` (Frontend)

---

Developed with a focus on security, scalability, and ease of deployment.
