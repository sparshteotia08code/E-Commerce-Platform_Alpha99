# 🛍️ E-Commerce-Platform_Alpha99

A fully advanced, modern, and feature-rich full-stack e-commerce platform transformed from the legacy Adda94 project.

## 🚀 Key Features
- **Frontend**: React (Vite) + Redux Toolkit + Tailwind CSS + Recharts.
- **Backend**: Node.js + Express + Sequelize ORM (supporting PostgreSQL and SQLite fallback).
- **Caching**: Redis (with memory cache fallback).
- **Authentication**: JWT authentication, email verification, and social login simulation.
- **Payments**: Stripe Checkout and webhook billing processing.
- **Admin**: Sales statistics dashboard, product CRUD, inventory CSV import, and order status updates.
- **Recommendations**: Content-based recommendations and trending queues.
- **Containerization**: Fully Dockerized environments using Docker Compose.

---

## 📁 Directory Structure
```
alpha99/
├── docker-compose.yml    ← Service orchestrator (pg, redis, backend, frontend)
├── .gitignore
├── backend/
│   ├── package.json      ← Backend configuration & dependencies
│   ├── Dockerfile
│   ├── .env.example
│   └── src/              ← API server source (models, controllers, routes, config)
├── frontend/
│   ├── package.json      ← Frontend configuration & dependencies
│   ├── Dockerfile
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/              ← React application source
└── original/             ← Legacy static client code (for reference)
```

---

## 🛠️ Running Locally (Without Docker)

### 1. Start Backend API
```bash
cd backend
npm install
npm run dev
```
*Note: If no PostgreSQL or Redis is running, the backend will automatically generate a local `db.sqlite` database and run in-memory caching.*

### 2. Start Frontend React Client
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the client.

---

## 🐳 Running with Docker
Run the complete stack (Database, Cache, API, and Client) with:
```bash
docker-compose up --build
```
- Frontend Client: [http://localhost:3000](http://localhost:3000)
- Backend API Server: [http://localhost:5000](http://localhost:5000)
