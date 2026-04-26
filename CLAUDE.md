# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IDE Setup

- **Backend** — developed in **JetBrains Rider**. Run/debug via Rider's run configurations. EF Core migrations use the .NET CLI commands below.
- **Frontend** — developed in **Visual Studio Code**.

## Project Overview

**LilliputCry** is a baby feeding tracker app — a monorepo with a **Next.js 14 frontend** and an **ASP.NET Core 8 backend**, backed by **PostgreSQL on Neon**.

> Previously named "TinyTrack". Some backend namespaces (`TinyTrack.Api`) still reference the old name — this is a known leftover.

Core features: user registration/login, feeding log CRUD, dashboard with live stats and charts, profile management. A Sleep tracking feature is stubbed but not yet implemented.

## Development Commands

### Frontend (`/frontend`)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (`/backend/LilliputCry.Api`)
```bash
cd backend/LilliputCry.Api
dotnet restore                   # Restore NuGet packages
dotnet run                       # Dev server at http://localhost:7000
dotnet ef database update        # Apply EF Core migrations
dotnet ef migrations add <Name>  # Create a new migration
```

Swagger UI is available at `http://localhost:7000/swagger` in development.

## Environment Setup

**Frontend** — create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:7000
```

**Backend** — create `backend/LilliputCry.Api/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "Neon": "Host=...;Database=lilliputcry;Username=...;Password=...;SSL Mode=Require"
  },
  "AllowedOrigin": "http://localhost:3000"
}
```

## Architecture

### Frontend (`frontend/src/`)

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (wraps all pages with sidebar Header)
│   ├── page.tsx                # Dashboard (/)
│   ├── login/page.tsx          # Login (/login)
│   ├── register/page.tsx       # Register (/register)
│   ├── log/page.tsx            # Log feeding (/log)
│   └── log/[id]/page.tsx       # Edit feeding (/log/[id])
│
├── api/
│   └── index.ts                # All backend API calls (fetch-based client)
│
├── components/
│   ├── feeding/                # Domain components
│   │   ├── DashboardClient.tsx # Fetches logs, renders StatsBar + charts
│   │   ├── LogFeedClient.tsx   # Form + today's log list
│   │   ├── FeedingForm.tsx     # Create/edit feeding form
│   │   ├── FeedingList.tsx     # Logs grouped by date
│   │   ├── FeedingCard.tsx     # Single log card with edit/delete
│   │   ├── StatsBar.tsx        # 5 stat cards (today feedings, milk prepared, milk fed, waste %, last feeding)
│   │   └── charts/
│   │       ├── index.tsx                  # Renders all 3 charts
│   │       ├── DailyMilkIntakeChart.tsx   # Bar chart – daily intake
│   │       ├── WasteTrendChart.tsx        # Line chart – waste % trend
│   │       ├── FeedingsPerDayChart.tsx    # Bar chart – feedings per day
│   │       └── chartUtils.ts             # Aggregates log data by day of current week
│   │
│   ├── layout/
│   │   ├── Header.tsx          # Sidebar nav (logo, links, profile, logout)
│   │   ├── ProfileModal.tsx    # Modal for viewing/updating user profile
│   │   └── EmptyState.tsx      # Shown when no feeding logs exist
│   │
│   └── ui/                     # Generic primitives
│       ├── Button.tsx           # Variants: primary, secondary, danger, ghost
│       ├── Input.tsx            # Labeled input with error/hint
│       ├── Textarea.tsx
│       ├── Card.tsx             # CardHeader, CardTitle sub-components
│       └── Badge.tsx            # Color variants
│
├── lib/
│   ├── auth.ts                 # localStorage helpers: getStoredUser, storeUser, clearUser
│   └── utils.ts                # formatTime, formatDate, timeAgo, formatMl, wastePercent, cn
│
└── types/
    ├── feeding.ts              # FeedingLog, CreateFeedingLogPayload, UpdateFeedingLogPayload
    └── user.ts                 # UserProfile, AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload
```

**Config files:**
- `next.config.js` — rewrites `/api/*` → `${NEXT_PUBLIC_API_URL}/api/*`
- `tailwind.config.ts` — custom brand palette (purple/magenta + peach), custom border radii
- `tsconfig.json` — path alias `@/*` → `./src/*`, strict mode

**Key dependencies:** `recharts@3`, `date-fns@3`, `clsx`, `tailwind-merge`

### Backend (`backend/LilliputCry.Api/`)

Organized by **feature folders** (vertical slice). Each feature has Models, Controllers, Services, and DTOs.

```
LilliputCry.Api/
├── Program.cs                  # DI, CORS, rate limiting, Swagger, auto-migration
├── Data/
│   └── AppDbContext.cs         # EF Core DbContext (snake_case naming, Users + FeedingLogs)
│
├── Features/
│   ├── Users/
│   │   ├── Models/User.cs      # User entity
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs   # POST /api/auth/register, POST /api/auth/login
│   │   │   └── UserController.cs   # GET/PATCH /api/users/... (profile)
│   │   ├── Services/
│   │   │   ├── AuthService.cs      # RegisterAsync, LoginAsync (BCrypt)
│   │   │   └── UserService.cs      # GetProfileAsync, UpdateProfileAsync
│   │   └── DTOs/
│   │       ├── AuthDtos.cs         # LoginRequestDto, RegisterRequestDto, AuthResponseDto
│   │       └── UserDtos.cs         # UserProfileResponseDto, UpdateUserProfileDto
│   │
│   ├── Feeding/
│   │   ├── Models/FeedingLog.cs    # FeedingLog entity
│   │   ├── Controllers/FeedingController.cs  # Full CRUD under /api/feeding-logs
│   │   ├── Services/FeedingLogService.cs     # Business logic + validation
│   │   └── DTOs/FeedingLogDtos.cs           # Create/Update/Response DTOs
│   │
│   └── Sleep/                  # STUB — model exists, controller/service/DTOs not implemented
│       └── Model/SleepingLog.cs
│
└── Migrations/                 # EF Core migrations (auto-applied on startup)
    └── 20260405070927_InitialCreate.cs
```

### API Endpoints

**Auth**
```
POST  /api/auth/register   { fullName, email, password, phoneNumber? }
POST  /api/auth/login      { email, password }
```

**User Profile**
```
GET   /api/users/GetMyProfile
PATCH /api/users/UpdateMyProfile  { fullName, email, profilePictureUrl?, phoneNumber?, country?, state?, city?, gender?, address? }
```

**Feeding Logs**
```
GET    /api/feeding-logs?page=1&pageSize=50
GET    /api/feeding-logs/{guid}
POST   /api/feeding-logs          { fedAt, milkPrepared, milkFed, notes? }
PUT    /api/feeding-logs/{guid}   { fedAt?, milkPrepared?, milkFed?, notes? }
DELETE /api/feeding-logs/{guid}
```

**Health**
```
GET  /health   → { status: "healthy", timestamp }
```

### Data Flow

```
Frontend (src/api/index.ts) → Next.js proxy (/api/*) → ASP.NET Core Controller → Service (validates + maps) → EF Core → PostgreSQL (Neon)
```

### Authentication

- **Passwords:** Hashed with BCrypt (BCrypt.Net-Next 4.1)
- **Sessions:** User object stored in `localStorage` after login (no JWT yet — token field is always `null`)
- **User lookup:** UserController currently uses a hard-coded GUID (`00000000-0000-0000-0000-000000000001`) — proper JWT auth is a future task
- **Rate limiting:** 120 requests/minute per IP (fixed window)

### Database Schema

Two tables, managed entirely by EF Core migrations. All column names are snake_case.

**`users`**
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| guid_id | UUID UNIQUE | Default: gen_random_uuid() |
| full_name | VARCHAR(100) | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | BCrypt |
| profile_picture_url | VARCHAR(600) | nullable |
| phone_number, country, state, city, gender, address | VARCHAR | nullable |
| created_at, updated_at | TIMESTAMPTZ | |

**`feeding_logs`**
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| guid_id | UUID UNIQUE | Default: gen_random_uuid() |
| fed_at | TIMESTAMPTZ | Indexed |
| milk_prepared | NUMERIC(6,1) | ml |
| milk_fed | NUMERIC(6,1) | ml, ≤ milk_prepared |
| notes | TEXT | nullable |
| created_at, updated_at | TIMESTAMPTZ | |

### Business Logic & Validation

- `milkPrepared` must be > 0
- `milkFed` must be ≥ 0 and ≤ `milkPrepared`
- `fedAt` cannot be more than 5 minutes in the future
- Email must be unique on registration
- `WasteAmount` is computed as `milkPrepared - milkFed`

## Known Issues / Future Work

- **JWT auth not implemented:** Backend returns `token: null`; `UserController` uses a hard-coded GUID instead of extracting user from token claims
- **Sleep feature is a stub:** `SleepingLog` model exists but there are no DTOs, controller, or service for it
- **Namespace mismatch:** Backend `.csproj` root namespace is still `TinyTrack.Api` (old project name)
- **No multi-user isolation:** Feeding logs are not scoped to a user yet (missing `UserId` FK on `feeding_logs`)
