# DwellGo — Property Rental Platform

An Airbnb-style property rental platform built with React, Node.js/Express, SQLite (via Prisma), and JWT authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express |
| Database | SQLite via Prisma ORM |
| Auth | JWT (httpOnly cookie) |
| File Storage | AWS S3 (or local fallback) |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+

### 1. Clone the repository

```bash
git clone <repo-url>
cd DwellGo
```

### 2. Install dependencies

```bash
# Backend
cd api
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure environment variables

**`api/.env`**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=4000

# Optional: AWS S3 for photo uploads
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...
```

**`client/.env`**
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 4. Set up the database

```bash
cd api
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the servers

```bash
# Terminal 1 — Backend (port 4000)
cd api
npm start

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Test Accounts

| Role | Email | Password | Capabilities |
|---|---|---|---|
| **Admin** | `admin@dwellgo.com` | `Admin@123` | Full dashboard access, manage users/places/bookings/reviews |
| **Host** | `host1@dwellgo.com` | `Host@123` | Create listings, approve bookings, view earnings |
| **Host** | `host2@dwellgo.com` | `Host@123` | Create listings, approve bookings |
| **Guest** | `guest1@dwellgo.com` | `Guest@123` | Browse, book, pay, review (after completed stay) |
| **Guest** | `guest2@dwellgo.com` | `Guest@123` | Browse, book, pay, review (after completed stay) |

---

## Role System

DwellGo uses an Airbnb-style role model:

- **USER** — default role for all registered users
- **ADMIN** — platform administrator (set manually in DB)
- **isHost: true** — a USER can also be a host (manage listings)

A single account can be both a guest (book places) and a host (list places), just like Airbnb.

---

## Key Features

### Guest
- Browse and search listings (filter by location, price, dates)
- Book a place (PENDING → APPROVED → CONFIRMED → COMPLETED)
- Pay for confirmed bookings
- Leave reviews only after a completed stay
- Wishlist management
- Real-time chat with host

### Host
- Create and manage property listings
- Set pricing (nightly rate, cleaning fee, service fee)
- Approve or reject incoming booking requests
- View earnings and booking history
- Receive and reply to guest reviews

### Admin
- Dashboard with platform statistics (users, hosts, places, bookings, revenue)
- Manage all users (view, ban)
- Manage all listings (view, delete)
- Manage all bookings (view, cancel)
- Delete any review

---

## Booking Workflow

```
PENDING  →  APPROVED (host approves)  →  CONFIRMED (guest pays)  →  COMPLETED (after checkout date)
                                                                              ↓
                                                              Guest can now leave a review
```

Cancellation is possible at PENDING or APPROVED stages.

---

## API Endpoints (Summary)

### Auth
- `POST /api/login` — login
- `POST /api/register` — register (role always assigned as USER)
- `POST /api/logout` — logout
- `GET /api/profile` — get current user

### Places
- `GET /api/places` — list all places (public)
- `GET /api/places/:id` — place detail (public)
- `POST /api/places` — create listing (host only)
- `PUT /api/places` — update listing (host only, own listing)
- `DELETE /api/places/:id` — delete listing (host only, own listing)
- `GET /api/places/user/all` — get own listings (host only)

### Bookings
- `POST /api/bookings` — create booking (guest only)
- `GET /api/bookings/guest` — guest's bookings
- `GET /api/bookings/host` — host's incoming bookings
- `POST /api/bookings/:id/approve` — approve booking (host only)
- `POST /api/bookings/:id/cancel` — cancel booking
- `POST /api/bookings/:id/pay` — pay for booking (guest only)

### Reviews
- `GET /api/places/:id/reviews` — get reviews for a place (public)
- `POST /api/places/:id/reviews` — post a review (requires completed booking)
- `PUT /api/user-reviews/:id` — edit own review
- `DELETE /api/user-reviews/:id` — delete own review (or admin)

### Admin
- `GET /api/admin/stats` — platform statistics (admin only)
- `GET /api/admin/users` — all users (admin only)
- `GET /api/admin/places` — all places (admin only)
- `GET /api/admin/bookings` — all bookings (admin only)
- `DELETE /api/admin/users/:id` — delete user (admin only)
- `DELETE /api/admin/places/:id` — delete place (admin only)

---

## Security

- Passwords hashed with bcrypt
- JWT stored in httpOnly cookie (not accessible via JS)
- Role escalation blocked — `role=ADMIN` in registration body is ignored
- Admins cannot create bookings or listings
- Guests cannot approve bookings or access host routes
- Non-hosts cannot create listings (enforced at middleware level)
- Reviews require a completed booking (enforced at API level)
- Overlapping bookings for the same place are rejected

---

## Project Structure

```
DwellGo/
├── api/                    # Express backend
│   ├── controllers/        # Route handlers
│   ├── middlewares/        # Auth guards (requireAuth, requireHost, requireAdmin)
│   ├── routes/             # Express routers
│   ├── validators/         # Request validation schemas
│   ├── prisma/
│   │   ├── schema.prisma   # DB schema
│   │   └── seed.js         # Seed data
│   └── index.js            # Entry point
│
└── client/                 # React frontend
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── contexts/       # React context (User, Theme, Search)
    │   ├── pages/          # Page components
    │   └── App.jsx         # Routes and providers
    └── vite.config.js
```
