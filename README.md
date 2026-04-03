# 🚀 Workspace Attendance System (Clean Architecture)

A premium, out-of-the-box attendance tracking solution featuring a Flutter mobile hub and a React admin dashboard.

## ✨ Features
- **Mobile Hub**: Real-time proximity-based check-in/out with glassmorphism UI.
- **Admin Panel**: Sector management, broadcast logs, and detailed attendance analytics.
- **Out-of-Location Requests**: Submit entry requests with reasons when outside office radius.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, Prisma (PostgreSQL).
- **Frontend**: React (Vite).
- **Mobile**: Flutter (Dart).
- **Deployment**: Render-ready with automated database synchronization.

## 📦 Project Structure
- `backend/`: API services and Prisma schema.
- `admin-panel/`: Web-based administrative interface.
- `mobile_app/`: Flutter application for employees.
- `.github/`: CI/CD workflows for and builds.
- `render.yaml`: Automated deployment configuration.

## 🚀 Quick Start
1. **Backend**:
   - `cd backend && npm install`
   - Setup your `.env` based on `.env.example`.
   - `npx prisma db push --accept-data-loss`
   - `node server.js`
2. **Admin Panel**:
   - `cd admin-panel && npm install && npm run dev`
3. **Mobile App**:
   - `cd mobile_app && flutter run`

---
*Built with 💜 for Executive-level attendance management.*
