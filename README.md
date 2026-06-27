# KU Demo Student Portal

**A fully functional demonstration university student portal for UniElection blockchain election platform integration.**

![Stack](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Stack](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)
![Stack](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Stack](https://img.shields.io/badge/Redis-7-red?logo=redis)
![Stack](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![Stack](https://img.shields.io/badge/Prisma-5-teal?logo=prisma)
![Stack](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)

---

## Overview

The KU Demo Student Portal is a **fictional demonstration environment** built to showcase the integration capabilities of the UniElection blockchain election platform. It simulates a modern university ERP/student portal with comprehensive modules for academics, finance, library, hostel management, student services, messaging, and — most importantly — student elections.

**⚠️ Important**: This is NOT an official recreation of any real university's portal. All names, student records, and academic data are fictional.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Docker Compose                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Frontend    │  │   Backend    │  │   UniElection      │  │
│  │  Next.js 15  │──│   NestJS     │──│   (Mock/Real)      │  │
│  │  Port: 3000  │  │   Port: 3001 │  │   External API     │  │
│  └──────────────┘  └──────┬───────┘  └───────────────────┘  │
│                           │                                   │
│              ┌────────────┼────────────┐                     │
│              │            │            │                      │
│         ┌────▼───┐  ┌────▼───┐                               │
│         │Postgres│  │ Redis  │                               │
│         │  :5432 │  │ :6379  │                               │
│         └────────┘  └────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 18, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, React Query, React Hook Form, Zustand |
| **Backend** | NestJS 10, TypeScript, Prisma ORM, PostgreSQL, Redis, JWT, Passport |
| **Infrastructure** | Docker Compose, PostgreSQL 16, Redis 7 |

---

## Quick Start

### Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Node.js 20+ (for local development without Docker)
- PostgreSQL 16 (if running without Docker)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd uni_portal_demo

# Copy environment files
cp .env.example .env
cp docker/.env.example docker/.env

# Start all services
docker compose -f docker/docker-compose.yml up -d

# Wait for services to be healthy, then seed the database
docker compose -f docker/docker-compose.yml exec backend npx prisma db seed

# Access the portal
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
# Swagger Docs: http://localhost:3001/api/docs
```

### Option 2: Local Development

```bash
# ── Backend ──
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
# Backend running on http://localhost:3001

# ── Frontend (new terminal) ──
cd frontend
npm install
npm run dev
# Frontend running on http://localhost:3000
```

---

## Demo Credentials

### Student
| Field | Value |
|-------|-------|
| Admission Number | `P100/1234/2023` |
| Password | `password123` |
| Name | Jane Wanjiku |
| Programme | BSc Computer Science |

### Administrator
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

### Staff
| Field | Value |
|-------|-------|
| Username | `staff1` |
| Password | `staff123` |

---

## Features

### Student Portal

| Module | Features |
|--------|----------|
| **Dashboard** | Welcome card, semester info, academic status, registered units, fees, elections, library, hostel, announcements, quick links |
| **Profile** | Personal info, academic records, fee summary, CGPA chart |
| **Academics** | Semester registration, unit registration, results, transcript, exam card, attendance, CGPA history, graduation progress |
| **Finance** | Fee statement, payment history, invoices, receipts, scholarships, HELB status, payment simulation |
| **Library** | Borrowed books, due dates, fines, reservations, digital resources |
| **Hostel** | Room allocation, roommates, maintenance requests, hostel payments |
| **Services** | Leave applications, clearance, appointments, counselling, deferment, transfer |
| **Notifications** | Announcements, notification center, read/unread tracking |
| **Messaging** | Inbox, compose, sent messages, support tickets |

### 🗳️ Student Elections (UniElection Integration)

| Feature | Description |
|---------|-------------|
| **Current Elections** | Active elections with candidate cards and voting interface |
| **Upcoming Elections** | Countdown timer, candidate previews |
| **Past Elections** | Results with pie/bar charts, winner display |
| **Vote History** | Complete voting record with transaction hashes |
| **Election Rules** | Eligibility criteria, code of conduct, appeals process |
| **Integration Modes** | Mock API / Iframe Embed / React SDK |

### Admin Panel

| Section | Capabilities |
|---------|-------------|
| **Dashboard** | Stats, charts, recent activity |
| **Students** | CRUD, search, pagination |
| **Courses** | Full management |
| **Elections** | Visibility control, results, candidate management |
| **Branding** | University name, colors, logo, fonts, dark/light mode |
| **Logs** | Audit logs, integration logs with filtering |
| **Settings** | SSO, API keys, JWT secrets, system configuration |

---

## UniElection Integration

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│  Student │     │  KU Portal   │     │   UniElection    │
│  Browser │     │   Backend    │     │    Backend       │
└────┬─────┘     └──────┬───────┘     └────────┬─────────┘
     │                   │                       │
     │ 1. Login          │                       │
     │──────────────────>│                       │
     │                   │                       │
     │ 2. Portal JWT     │                       │
     │<──────────────────│                       │
     │                   │                       │
     │ 3. Navigate to    │                       │
     │    Elections      │                       │
     │──────────────────>│                       │
     │                   │                       │
     │                   │ 4. POST /api/         │
     │                   │    integration/       │
     │                   │    auth/exchange      │
     │                   │──────────────────────>│
     │                   │                       │
     │                   │ 5. Voting JWT         │
     │                   │<──────────────────────│
     │                   │                       │
     │ 6. Voting JWT     │                       │
     │<──────────────────│                       │
     │                   │                       │
     │ 7. Cast Vote      │                       │
     │ (iframe/SDK/mock) │                       │
     │───────────────────────────────────────────>│
     │                   │                       │
     │ 8. Transaction    │                       │
     │    Hash           │                       │
     │<───────────────────────────────────────────│
```

### Integration Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| **Mock API** | Portal simulates the UniElection backend locally | Development, demos, testing |
| **Iframe Embed** | UniElection voting UI embedded via iframe | Production with UniElection-hosted UI |
| **React SDK** | UniElection React components integrated natively | Production with custom UI |

### Integration Testing Page

Visit `/elections/integration-test` as a logged-in student to access the developer testing dashboard:

- **JWT Inspector**: Decode and inspect portal and voting JWTs
- **Token Exchange**: Test the JWT exchange flow with latency measurement
- **Event Log**: Real-time log of all integration events
- **postMessage Monitor**: Listen for iframe postMessage events
- **Connectivity Test**: Ping UniElection endpoints
- **Mock Configuration**: Customize mock responses (errors, latency)
- **Auth Flow Diagram**: Visual step-by-step authentication flow

### API Endpoints (UniElection Bridge)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/integration/auth/exchange` | Exchange portal JWT for voting JWT |
| `GET` | `/api/integration/auth/verify` | Verify voting JWT |
| `GET` | `/api/integration/config` | Get integration settings |
| `GET` | `/api/integration/logs` | Get integration logs |
| `POST` | `/api/integration/test/connectivity` | Test UniElection connectivity |
| `POST` | `/api/integration/mock/toggle` | Toggle integration mode |

---

## Database

### Schema Overview

The database uses PostgreSQL with Prisma ORM. Key tables:

- **30+ tables** across all modules
- **Core**: User, Student, Faculty, School, Department, Programme, Course, Semester
- **Academic**: StudentCourse, ExamCard, AcademicRecord, Transcript
- **Finance**: Invoice, Payment, Scholarship, FeeStatement
- **Library**: Book, BorrowRecord, Reservation, DigitalResource
- **Hostel**: Hostel, Room, Allocation, MaintenanceRequest
- **Services**: LeaveApplication, DefermentRequest, Clearance, Appointment, etc.
- **Elections**: Election, Candidate, VoteRecord, ElectionPermission
- **Integration**: IntegrationConfig, IntegrationLog, AuditLog
- **Messaging**: Message, SupportTicket, Notification, Announcement

### Seed Data

The seed script generates realistic demo data:
- **1,000 students** with Kenyan names, varied programmes and fee statuses
- **200 courses** across 15 departments and 8 schools
- **4 semesters** of academic history
- **100 invoices** and **500 payments**
- **50 books**, **200 borrow records**
- **4 hostels**, **100 rooms**, **300 allocations**
- **5 elections** with candidates, vote records, and results
- **30 announcements**, **200+ notifications**

---

## Project Structure

```
uni_portal_demo/
├── frontend/                          # Next.js 15 Application
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── (dashboard)/          # Authenticated dashboard routes
│   │   │   │   ├── dashboard/        # Main dashboard
│   │   │   │   ├── profile/          # Student profile
│   │   │   │   ├── academics/        # Academic module
│   │   │   │   ├── finance/          # Finance module
│   │   │   │   ├── library/          # Library module
│   │   │   │   ├── hostel/           # Hostel module
│   │   │   │   ├── services/         # Student services
│   │   │   │   ├── elections/        # Election integration
│   │   │   │   ├── notifications/    # Notifications
│   │   │   │   └── messages/         # Messaging
│   │   │   ├── admin/                # Admin panel
│   │   │   └── login/                # Authentication
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   └── layout/              # Sidebar, Header, DashboardShell
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/                      # Utilities, API client, Auth
│   │   └── stores/                   # Zustand stores
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                           # NestJS Application
│   ├── src/
│   │   ├── modules/                  # Feature modules
│   │   │   ├── auth/                 # JWT authentication
│   │   │   ├── students/             # Student management
│   │   │   ├── academics/            # Academic records
│   │   │   ├── finance/              # Financial operations
│   │   │   ├── library/              # Library management
│   │   │   ├── hostel/               # Hostel management
│   │   │   ├── services/             # Student services
│   │   │   ├── notifications/        # Notifications
│   │   │   ├── messaging/            # Messaging
│   │   │   ├── elections/            # Elections + UniElection bridge
│   │   │   │   └── strategies/       # Mock, Iframe, SDK strategies
│   │   │   ├── admin/                # Admin management
│   │   │   └── branding/             # Portal branding
│   │   ├── common/                   # Guards, decorators, filters
│   │   └── database/                 # Prisma service, Redis module
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   └── seeds/seed.ts             # Seed script
│   └── package.json
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
│
├── .env.example
└── README.md
```

---

## API Documentation

Full Swagger documentation is available at `http://localhost:3001/api/docs` when the backend is running.

### Key API Groups

- **Auth** (`/api/auth`) - Login, refresh, profile
- **Students** (`/api/students`) - Profile, dashboard stats
- **Academics** (`/api/academics`) - Courses, results, transcript, exam cards
- **Finance** (`/api/finance`) - Statements, payments, invoices, scholarships
- **Library** (`/api/library`) - Borrowed books, fines, resources
- **Hostel** (`/api/hostel`) - Allocation, maintenance, payments
- **Services** (`/api/services`) - Leave, clearance, appointments
- **Notifications** (`/api/notifications`) - Notifications, announcements, preferences
- **Messaging** (`/api/messages`) - Inbox, compose, support tickets
- **Elections** (`/api/elections`) - Elections, candidates, voting, results
- **Integration** (`/api/integration`) - JWT exchange, config, logs
- **Admin** (`/api/admin`) - Full CRUD management
- **Branding** (`/api/branding`) - Portal branding

---

## Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#1e3a5f` | Primary brand, sidebar, headers |
| Royal Blue | `#0d47a1` | Secondary elements, links |
| Gold | `#d4a843` | Accent, elections highlight, CTAs |
| Light Gray | `#f8f9fa` | Backgrounds, cards |
| White | `#ffffff` | Cards, content areas |

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, tracking-tight
- **Body**: Regular, leading-relaxed

---

## Security

- JWT-based authentication with configurable expiration
- Role-Based Access Control (STUDENT, ADMIN, STAFF)
- Rate limiting via `@nestjs/throttler`
- Helmet security headers
- CORS configuration
- Input validation via `class-validator` and Zod
- Password hashing with bcrypt (12 rounds)
- Audit logging for all admin actions
- CSRF protection ready

---

## Replacing Mock Backend with Real ERP

The architecture uses the **Repository Pattern** in the NestJS service layer. To integrate with a real university ERP:

1. Replace the Prisma service calls in each module's service with API calls to the real ERP
2. Update the authentication module to validate against the real identity provider
3. Update the UniElection integration config with real endpoints and credentials
4. Switch `INTEGRATION_MODE` from `mock` to `iframe` or `sdk`

The strategy pattern in the elections module allows swapping the mock election backend for real UniElection integration without changing any frontend code.

---

## License

This project is for demonstration purposes only. It is NOT an official university system.

---

## Disclaimer

This is a **fictional demonstration environment**. All student names, admission numbers, academic records, financial data, and election results are computer-generated and entirely fictional. The portal does not represent any real university and exists solely to demonstrate UniElection blockchain election platform integration capabilities.
