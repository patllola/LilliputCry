# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Active development target: Mobile app only.** `/mobile` (Expo / React Native) is where all feature work is happening right now. `/frontend` (Next.js web) still exists and still builds, but it is **not** being actively developed — don't add web frontend features, pages, or screens unless the user explicitly asks for web work. When a design or feature request doesn't specify a platform, assume it means the mobile app. See `mobile/CLAUDE.md` for mobile-specific details (Expo SDK version, native build commands, known iOS build issues).

## IDE Setup

- **Backend** — developed in **JetBrains Rider**. Run/debug via Rider's run configurations. EF Core migrations use the .NET CLI commands below.
- **Mobile** — developed in whatever editor + `npx expo start` / Xcode / Android Studio for native builds. See `mobile/CLAUDE.md`.
- **Frontend** (inactive) — developed in **Visual Studio Code**, kept for reference only.

## Project Overview

**LilliputCry** is a baby feeding tracker app — a monorepo with an **Expo/React Native mobile app** (primary client), a **Next.js 14 web frontend** (inactive), and an **ASP.NET Core 8 backend**, backed by **PostgreSQL on Neon**.

> Previously named "TinyTrack". Some backend namespaces (`TinyTrack.Api`) still reference the old name — this is a known leftover.

Core features: user registration/login, feeding/sleep/pump/medication logging, milestone photo journal, baby profiles (multi-baby support), dashboard with live stats, profile management, admin panel with subscription management.

## Development Commands

### Mobile (`/mobile`)
```bash
cd mobile
npm install            # Install dependencies (runs patch-package automatically)
npx expo start         # Metro bundler
npx expo run:ios       # Build & run on iOS simulator
npx expo run:android   # Build & run on Android
```
See `mobile/CLAUDE.md` for environment setup, native build details, and known iOS build issues.

### Frontend (`/frontend`) — inactive, reference only
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

**Mobile** — create `mobile/.env.local` (see `mobile/CLAUDE.md`):
```
EXPO_PUBLIC_API_URL=http://localhost:7000
```

**Frontend** (inactive) — create `frontend/.env.local`:
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

### Mobile (`mobile/`)

Expo Router (file-based routing), Drawer nav wrapping a bottom Tab nav. See `mobile/CLAUDE.md` for the full structure, native build commands, and known iOS build issues. Quick map:

```
mobile/
├── app/
│   ├── (auth)/                 # login, register
│   └── (app)/
│       ├── (tabs)/             # Home, Dashboard, Log Feed, Profile (bottom tabs)
│       ├── milk-pump.tsx        # Drawer screens
│       ├── sleep.tsx
│       ├── milestone.tsx
│       ├── medications.tsx
│       ├── refer.tsx
│       └── admin.tsx           # admin-only, role-gated
├── src/
│   ├── api/index.ts            # All backend API calls (mirrors frontend/src/api/index.ts)
│   ├── components/              # Card, Button, FormField, ScreenContainer, MenuButton, etc.
│   ├── lib/
│   │   ├── auth.ts             # expo-secure-store: getStoredUser, storeUser, storeToken, clearAuth
│   │   └── babyContext.tsx     # BabyProvider — active baby state, AsyncStorage-persisted
│   └── types/                  # feeding, pump, sleep, milestone, baby, medication, user, admin
```

### Frontend (`frontend/`) — inactive, reference only

Next.js 14 App Router web client with the same feature set as mobile (feeding, sleep, pump, medications, milestones, babies), a sidebar layout instead of drawer/tabs. Not under active development — see git history if you need to resurrect it.

### Backend (`backend/LilliputCry.Api/`)

Organized by **feature folders** (vertical slice). Each feature has Models, Controllers, Services, and DTOs.

```
LilliputCry.Api/
├── Program.cs                  # DI, CORS, rate limiting, Swagger, auto-migration, JWT auth
├── Data/
│   └── AppDbContext.cs         # EF Core DbContext (snake_case naming)
│
├── Features/
│   ├── Users/                  # Auth (register/login/Google), profile, JWT issuance
│   ├── Babies/                 # Multi-baby profiles — Name, AvatarColor, DateOfBirth, Weight/HeightKg
│   ├── Feeding/                 # Feeding logs — milkPrepared/milkFed/wasteAmount, scoped by babyId
│   ├── Sleep/                   # Sleep logs — sleepStart/sleepEnd/durationMinutes/isNap
│   ├── Pump/                    # Pump sessions — leftAmount/rightAmount/totalAmount
│   ├── Medications/             # Medications — timeOfDay/repeatDaily/reminderEnabled/isDoneToday
│   ├── Milestones/               # Milestone photo journal — multipart image upload (Cloudinary)
│   └── Admin/                    # Admin stats + user/subscription management (role-gated)
│
└── Migrations/                  # EF Core migrations (auto-applied on startup)
```

All of Feeding/Sleep/Pump/Medications/Milestones expose an optional `babyId` (GUID) query param on GET and field on POST/PUT, resolved server-side via `BabyService.ResolveBabyIdAsync` — omitting it returns/creates across all of the user's babies.

### API Endpoints

**Auth**
```
POST  /api/auth/register   { fullName, email, password, phoneNumber? }
POST  /api/auth/login      { email, password }
POST  /api/auth/google     { idToken }
```

**User Profile**
```
GET   /api/users/GetMyProfile
PATCH /api/users/UpdateMyProfile  { fullName, email, profilePictureUrl?, phoneNumber?, country?, state?, city?, gender?, address? }
```

**Babies**
```
GET/POST      /api/babies                { name, avatarColor, dateOfBirth, weightKg?, heightCm? }
GET/PUT/DELETE /api/babies/{guid}
```

**Feeding / Sleep / Pump / Medications / Milestones** — all follow the same shape, each scoped by optional `babyId`:
```
GET    /api/feeding-logs?babyId=&page=1&pageSize=50   |  /api/sleep-logs  |  /api/pump-sessions  |  /api/medications  |  /api/milestones
POST   /api/feeding-logs   { fedAt, milkPrepared, milkFed, notes?, babyId? }
PUT    /api/feeding-logs/{guid}
DELETE /api/feeding-logs/{guid}
```
Medications additionally expose `PATCH /api/medications/{guid}/toggle-done` and `/toggle-reminder`. Milestones use `multipart/form-data` (achievedAt, note, image file, babyId?).

**Health**
```
GET  /health   → { status: "healthy", timestamp }
```

### Data Flow

```
Mobile (src/api/index.ts) → ASP.NET Core Controller → Service (validates + maps) → EF Core → PostgreSQL (Neon)
Frontend (src/api/index.ts, inactive) → Next.js proxy (/api/*) → same backend
```

### Authentication

- **Passwords:** Hashed with BCrypt (BCrypt.Net-Next 4.1)
- **Sessions:** JWT issued on login/register/Google sign-in. Mobile stores it in `expo-secure-store`; controllers use `[Authorize]` + `ClaimTypes.NameIdentifier` to resolve the current user — no hard-coded GUID.
- **Rate limiting:** 120 requests/minute per IP (fixed window)
- **Subscriptions:** `[RequireActiveSubscription]` filter gates most feature endpoints; Admin can activate/revoke via `/api/admin/users/{guid}/activate|revoke`

### Business Logic & Validation

- `milkPrepared` must be > 0
- `milkFed` must be ≥ 0 and ≤ `milkPrepared`
- `fedAt` cannot be more than 5 minutes in the future
- Email must be unique on registration
- `WasteAmount` is computed as `milkPrepared - milkFed`

## Known Issues / Future Work

- **Namespace mismatch:** Backend `.csproj` root namespace is still `TinyTrack.Api` (old project name)
- **Mobile lacks Baby/Medication UI parity with backend:** the mobile app didn't yet have a baby switcher or a Medications screen as of 2026-07-21 — check git history/commit messages for the current state before assuming this is still true
- **Web frontend is stale relative to backend:** since it's inactive, don't trust its feature set as a reference for what the backend supports — check the backend controllers directly
