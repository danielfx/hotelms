# 🏨 HotelMS — Property Management System

Cloudbeds-style hotel PMS with 10 modules completed. Full-stack: **NestJS API** + **Next.js 14** frontend.

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis (optional — only needed for session blacklist)
- npm or pnpm

---

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE USER hotelms WITH PASSWORD 'hotelms_secret';
CREATE DATABASE hotelms OWNER hotelms;
\q
```

### 2. Backend (API)

```bash
cd apps/api

# Install dependencies
npm install

# Configure environment
cp .env .env.local
# Edit .env — update DATABASE_URL if needed

# Run database migrations
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start development server
npm run start:dev
```

API runs at: **http://localhost:3001/api/v1**
Swagger docs: **http://localhost:3001/api/docs**

### 3. Frontend (Web)

```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🔐 Demo Login

| Email | Password | Role |
|-------|----------|------|
| admin@hotelms.com | Admin1234! | Super Admin |
| manager@grandplaza.com | Admin1234! | General Manager |
| frontdesk@grandplaza.com | Admin1234! | Front Desk |
| housekeeper@grandplaza.com | Admin1234! | Housekeeper |
| accountant@grandplaza.com | Admin1234! | Accountant |

---

## 📁 Project Structure

```
hotelms-complete/
├── apps/
│   ├── api/                          # NestJS Backend (port 3001)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 20+ Prisma models
│   │   │   └── seed.ts               # Demo data (Grand Plaza Miami)
│   │   ├── src/
│   │   │   ├── common/               # Guards, Decorators, Filters
│   │   │   ├── prisma/               # PrismaService
│   │   │   └── modules/
│   │   │       ├── auth/             # JWT + refresh tokens
│   │   │       ├── users/            # User management
│   │   │       ├── rooms/            # Room inventory
│   │   │       ├── guests/           # Guest CRM
│   │   │       ├── reservations/     # Reservation engine
│   │   │       ├── folio/            # Billing
│   │   │       ├── night-audit/      # Night audit pipeline
│   │   │       ├── rates/            # Rate plans + pricing
│   │   │       ├── channels/         # OTA channel manager
│   │   │       ├── booking-engine/   # Public booking
│   │   │       ├── payments/         # Stripe integration
│   │   │       ├── guest-portal/     # Guest PWA backend
│   │   │       ├── communications/   # Email/SMS/WhatsApp
│   │   │       └── housekeeping/     # HK tasks + maintenance
│   │   ├── .env                      # Environment variables
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                          # Next.js 14 Frontend (port 3000)
│       ├── src/
│       │   ├── app/
│       │   │   ├── dashboard/        # Staff portal
│       │   │   │   ├── page.tsx      # Main dashboard
│       │   │   │   ├── rooms/        # Room management
│       │   │   │   ├── guests/       # Guest CRM
│       │   │   │   ├── reservations/ # Reservations list
│       │   │   │   ├── checkin/      # Check-in today
│       │   │   │   ├── folio/        # Billing & folio
│       │   │   │   ├── rates/        # Rate calendar
│       │   │   │   ├── channels/     # OTA channels
│       │   │   │   ├── housekeeping/ # HK board
│       │   │   │   └── communications/ # Guest messaging
│       │   │   ├── book/             # Public booking engine
│       │   │   │   ├── page.tsx      # Search
│       │   │   │   ├── rooms/        # Room selection
│       │   │   │   ├── checkout/     # Payment
│       │   │   │   └── confirmation/ # Success
│       │   │   ├── portal/           # Guest mobile portal
│       │   │   └── login/            # Auth
│       │   ├── components/layout/    # Sidebar + TopBar
│       │   └── lib/                  # API client + utils
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
```

---

## 🌐 Available Routes

### Staff Dashboard
| Route | Description |
|-------|-------------|
| `/dashboard` | KPI overview |
| `/dashboard/reservations` | All reservations |
| `/dashboard/checkin` | Today's arrivals & departures |
| `/dashboard/rooms` | Room inventory |
| `/dashboard/guests` | Guest CRM |
| `/dashboard/folio` | Billing & folio |
| `/dashboard/rates` | Rate calendar (14-day grid) |
| `/dashboard/channels` | OTA channel manager |
| `/dashboard/housekeeping` | HK board by floor |
| `/dashboard/communications` | Guest messaging inbox |

### Public
| Route | Description |
|-------|-------------|
| `/book` | Booking engine landing |
| `/book/rooms` | Room search results |
| `/book/checkout` | Guest details + payment |
| `/book/confirmation` | Booking confirmed |
| `/portal` | Guest mobile portal (use confirmation# + last name) |

---

## 🔌 API Endpoints

Base URL: `http://localhost:3001/api/v1`

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Rooms | `GET/POST /rooms`, `PATCH /rooms/:id`, `GET /rooms/availability` |
| Guests | `GET/POST /guests`, `POST /guests/:id/merge` |
| Reservations | `GET/POST /reservations`, `POST /reservations/:id/check-in`, `POST /reservations/:id/check-out` |
| Folio | `GET /folio/:id`, `POST /folio/:id/charges`, `POST /folio/:id/payments` |
| Night Audit | `POST /night-audit/run` |
| Rates | `GET /rates/plans`, `GET /rates/calendar`, `POST /rates/bulk-update` |
| Channels | `GET /channels`, `POST /channels/:id/sync`, `POST /channels/:id/pull-reservations` |
| Booking Engine | `POST /book/:slug/search`, `POST /book/:slug/reserve` |
| Payments | `POST /payments/intent`, `POST /payments/refund`, `GET /payments/stats` |
| Guest Portal | `POST /portal/auth`, `GET /portal/me`, `POST /portal/requests` |
| Communications | `GET /communications/inbox`, `POST /communications/bulk` |
| Housekeeping | `GET /housekeeping/tasks`, `POST /housekeeping/schedule/generate` |

---

## ⚙️ Environment Variables (apps/api/.env)

```env
DATABASE_URL="postgresql://hotelms:hotelms_secret@localhost:5432/hotelms"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-min-32-chars"
STRIPE_SECRET_KEY="sk_test_..."       # Optional for local testing
SENDGRID_API_KEY="SG.xxx"             # Optional
TWILIO_ACCOUNT_SID="ACxxx"            # Optional
TWILIO_AUTH_TOKEN="xxx"               # Optional
```

> **Note:** Stripe, SendGrid, and Twilio are in mock mode by default. The app works fully without these keys — they're commented out in the code with production-ready implementations.

---

## 🛠️ Troubleshooting

**Prisma migration error:** Run `npx prisma generate` first, then `npx prisma migrate dev`

**"Module not found" errors:** Make sure you're in the correct directory (`apps/api` or `apps/web`)

**Port conflict:** Change `PORT=3001` in `apps/api/.env` and `NEXT_PUBLIC_API_URL` in `apps/web/.env.local`

**Redis connection error:** Redis is optional. The app runs without it (sessions won't be blacklisted on logout)

---

## 📦 Completed Modules (10/24)

- ✅ M1 — Auth + Users + RBAC (13 roles)
- ✅ M2 — Rooms + Guests CRM
- ✅ M3 — Reservations + Check-in/out + Folio + Night Audit
- ✅ M4 — Rate Plans + Dynamic Pricing
- ✅ M5 — Channel Manager (8 OTAs: Booking.com, Expedia, Airbnb...)
- ✅ M6 — Public Booking Engine
- ✅ M7 — Stripe Payments
- ✅ M8 — Guest Experience Portal (PWA)
- ✅ M9 — Communications (Email/SMS/WhatsApp)
- ✅ M10 — Housekeeping + Maintenance

---

Built with Claude Sonnet · NestJS · Next.js 14 · PostgreSQL · Prisma · Tailwind CSS
