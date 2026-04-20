# LilliputCry

A simple, beautiful baby feeding tracker for new mothers to log feeding sessions, track milk quantities, and monitor feeding patterns.

---

## Features

- Log each feeding session with:
  - Date & time of feeding
  - Milk prepared (ml)
  - Milk fed to baby (ml)
  - Waste amount (auto-calculated)
  - Optional notes
- Dashboard with today's stats (total feedings, total ml fed, average waste)
- Feeding history with relative timestamps
- Fully responsive — works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | ASP.NET Core 8 Web API (Minimal API) |
| Database | PostgreSQL via [Neon](https://neon.tech) (free tier) |
| ORM | Entity Framework Core 8 + Npgsql |

---

## Project Structure

```
TinyTrack/
├── README.md
├── frontend/          # Next.js app
└── backend/           # ASP.NET Core API
    └── TinyTrack.Api/
```

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- A free [Neon](https://neon.tech) PostgreSQL database

---

### 1. Backend Setup

```bash
cd backend/TinyTrack.Api

# Restore packages
dotnet restore

# Set your Neon connection string in appsettings.Development.json
# Replace the placeholder in ConnectionStrings:Neon

# Run EF Core migrations to create the database table
dotnet ef database update

# Start the API (runs on http://localhost:5000)
dotnet run
```

Swagger UI will be available at: `http://localhost:5000/swagger`

#### Neon Connection String Format

```
Host=ep-xxxx.us-east-2.aws.neon.tech;Database=tinytrack;Username=your_user;Password=your_password;SSL Mode=Require;Trust Server Certificate=true
```

Get this from your [Neon dashboard](https://console.neon.tech) under **Connection Details**.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file and set API URL
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000

# Start the dev server (runs on http://localhost:3000)
npm run dev
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/feeding-logs` | Get all feeding logs (newest first) |
| GET | `/api/feeding-logs/{id}` | Get a single feeding log |
| POST | `/api/feeding-logs` | Create a new feeding log |
| PUT | `/api/feeding-logs/{id}` | Update an existing feeding log |
| DELETE | `/api/feeding-logs/{id}` | Delete a feeding log |

### Example Request Body (POST/PUT)

```json
{
  "fedAt": "2024-01-15T10:30:00Z",
  "milkPrepared": 150.0,
  "milkFed": 120.0,
  "notes": "Baby was sleepy, stopped early"
}
```

---

## Database Schema

```sql
CREATE TABLE feeding_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    fed_at          TIMESTAMPTZ     NOT NULL,
    milk_prepared   NUMERIC(6,1)    NOT NULL,
    milk_fed        NUMERIC(6,1)    NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (`backend/TinyTrack.Api/appsettings.Development.json`)

```json
{
  "ConnectionStrings": {
    "Neon": "your-neon-connection-string-here"
  }
}
```

---

## Deployment

### Frontend — Vercel (recommended)
1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Set `NEXT_PUBLIC_API_URL` environment variable to your deployed API URL

### Backend — Railway / Render (recommended free options)
1. Push to GitHub
2. Import to [Railway](https://railway.app) or [Render](https://render.com)
3. Set `ConnectionStrings__Neon` environment variable

---

## Roadmap

- [ ] Baby profile (name, birth date, weight)
- [ ] Multiple babies support
- [ ] Charts & trends (weekly feeding patterns)
- [ ] Push notifications for feeding reminders
- [ ] Export data as CSV
- [ ] PWA support for mobile home screen install
- [ ] User authentication

---

## Contributing

This project is in its early stages. Feel free to open issues or pull requests!

---

## License

MIT
