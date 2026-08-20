# TwishhSync: Professional Attendance Management System

TwishhSync is a professional-grade, full-stack attendance management system designed for industrial and corporate environments. It features biometric-ready authentication, spatial geofencing, and a high-performance reporting engine.

---

## 🚀 Production Architecture (Hosting)

The system is deployed using a **split-tier architecture** to maximize performance and security:

| Tier | Provider | Purpose |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com/) | Serves the React SPA via global Edge Network. |
| **Backend** | [Render](https://render.com/) | Hosts the Express API and background maintenance services. |
| **Database** | [Neon](https://neon.tech/) | Managed PostgreSQL instance with auto-scaling capabilities. |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React.js](https://reactjs.org/) (v18+) with [Vite](https://vitejs.dev/) for ultra-fast builds.
- **Styling**: Vanilla CSS with a **"Glassmorphism"** aesthetic and **TailwindCSS** for layout utilities.
- **Icons**: [Lucide-React](https://lucide.dev/) for a clean, industrial icon set.
- **Reporting**: 
    - [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) for dynamic PDF generation.
    - [SheetJS (XLSX)](https://sheetjs.com/) for complex Excel exports.

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (LTS)
- **Framework**: [Express.js](https://expressjs.com/) for a robust RESTful API.
- **ORM**: [Prisma](https://www.prisma.io/) (v5.22+) for type-safe database interactions and automated migrations.
- **Security**: 
    - **JWT (JSON Web Tokens)** for stateless session management.
    - **Helmet** & **CORS** for secure cross-domain communication.
    - **Bcrypt** for secure password hashing.

---

## 📂 System Design (Modular Refactoring)

The system follows **Clean Architecture** principles to ensure maintainability:

1. **Component Splitting**: Large views are broken down into smaller pieces in `frontend/src/components/reports/` (e.g., `StatsCards.jsx`, `AttendanceTable.jsx`).
2. **API Service Layer**: All backend communication is centralized in `frontend/src/api/services/`.
3. **Utility Logic**: Heavy computations like **PDF/Excel Exporting** are handled in `frontend/src/utils/reportExport.js`.

---

## 🛡️ Key System Engines

- **Strategic Maintenance Engine**: Located in `backend/services/maintenanceService.js`, handles Auto-Checkouts and end-of-day Absence generation.
- **Spatial Verification**: Uses IP and Geolocation checks to ensure employees are physically present at the office.
- **Smart Reporting Engine**: Automatically handles employee hire dates, company holidays, and individual weekly-offs.

---

## 🛡️ Security Features

- **Zero-Trust Auth**: JWT-based session management with Passkey (Biometric) support.
- **Input Validation**: Strict schema enforcement using **Zod**.
- **Hardened Middleware**: Includes `Helmet`, `XSS-Clean`, and `Express-Rate-Limit`.
- **Secure Cookies**: Configured for cross-domain hosting (`SameSite: None`, `Secure`).

---

## ⚙️ Deployment & Environment Variables

### Backend (Render)
```env
DATABASE_URL="postgres://user:pass@host/db?sslmode=require"
JWT_SECRET="your_secure_random_string"
FRONTEND_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### Frontend (Vercel)
```env
VITE_API_URL="https://your-backend.onrender.com/api"
```

---

## 🛠️ Local Development

1. **Install Dependencies**: `npm run install:all`
2. **Environment**: Copy `.env.example` to `.env` in both folders.
3. **Database**: `npm run prisma:generate`
4. **Run**: 
    - `npm run start:server` (Backend)
    - `npm run start:client` (Frontend)

---

Developed with a focus on security, scalability, and ease of deployment.
