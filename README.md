# Greenview Society — Maintenance Tracker

A complaint tracking platform for apartment societies: residents raise and
follow complaints with photos, the admin office runs them through a
priority + status workflow with a full audit trail, and everyone stays in
the loop through a notice board and status-change emails.

```
society-maintenance-tracker/
├── backend/     Express API + Prisma + SQLite (swappable to Postgres)
├── frontend/    React + Vite + Tailwind
├── README.md    You are here
└── SYSTEM_DESIGN.md
```

---

## 1. Prerequisites

- Node.js 18 or later
- npm 9 or later
- (Optional) an SMTP account for real emails — Gmail App Passwords,
  Brevo, or Mailtrap all have free tiers. Without one, the app still
  runs fully; emails are just logged to the backend console instead
  of sent.

---

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # edit values as needed, see table below
npm install                # also runs `prisma generate`
npx prisma migrate dev --name init   # creates dev.db and applies the schema
npm run seed                # creates the first admin account
npm run dev                  # starts the API on http://localhost:4000
```

The seed script prints the admin login it created — by default:

```
admin@society.local / Admin@123
```

Change `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` before
seeding if you want different credentials.

### Backend environment variables (`backend/.env.example`)

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on (default `4000`) |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `DATABASE_URL` | `file:./dev.db` for SQLite, or a Postgres connection string |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `ADMIN_SIGNUP_CODE` | Anyone who registers with this code becomes an admin instead of a resident |
| `OVERDUE_THRESHOLD_DAYS` | Default overdue cutoff before the admin changes it via the app |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Any SMTP provider's free tier. Leave blank to run without email. |

**Switching to Postgres:** change `provider = "sqlite"` to
`provider = "postgresql"` in `backend/prisma/schema.prisma`, point
`DATABASE_URL` at your Postgres instance, then re-run
`npx prisma migrate dev`. No route or business-logic code changes are
needed — Prisma's client API is identical across databases.

---

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env      # VITE_API_URL should point at the backend
npm install
npm run dev                 # starts on http://localhost:5173
```

Open `http://localhost:5173`, register a resident account (or sign in
as the seeded admin), and you're in.

---

## 4. Database schema

| Table | Purpose |
|---|---|
| `User` | Residents and admins. `role` is `"resident"` or `"admin"`. |
| `Complaint` | One row per complaint: category, description, photo, current `status` and `priority`, ticket number (`SMT-0001`, ...). |
| `StatusHistory` | Append-only log — one row per status change, with actor, timestamp, and optional note. Never mutated or deleted, so a complaint's full history is always reconstructable. |
| `Notice` | Notice board posts, with an `important` flag for pinning + email fan-out. |
| `Config` | Single-row table holding the admin-editable overdue threshold (days). |

See `SYSTEM_DESIGN.md` for the reasoning behind this shape, especially
the history model and overdue detection.

---

## 5. API reference

All endpoints are under `/api` and (except register/login) require
`Authorization: Bearer <token>`.

### Auth
| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/api/auth/register` | anyone | `{ name, email, password, flatNumber?, adminCode? }` |
| POST | `/api/auth/login` | anyone | `{ email, password }` |
| GET | `/api/auth/me` | signed in | — |

### Complaints
| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/api/complaints` | resident | `multipart/form-data`: `category`, `description`, `photo?` |
| GET | `/api/complaints/mine` | resident | Own complaints, newest first, with history |
| GET | `/api/complaints` | admin | Query params: `category`, `status`, `from`, `to`. Overdue complaints sort to the top. |
| GET | `/api/complaints/:id` | owner or admin | Full detail + history |
| PATCH | `/api/complaints/:id/status` | admin | `{ status, note? }`. Emails the resident. Resolved complaints are locked. |
| PATCH | `/api/complaints/:id/priority` | admin | `{ priority }` |
| GET | `/api/complaints/meta/categories` | signed in | Returns the allowed category/status/priority enums |

### Notices
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/api/notices` | signed in | Important notices first, then newest |
| POST | `/api/notices` | admin | `{ title, body, important? }`. If `important`, emails every resident. |

### Dashboard & config
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/api/dashboard` | admin | Counts by status, by category, overdue count |
| GET | `/api/config` | admin | Current overdue threshold |
| PUT | `/api/config` | admin | `{ overdueThresholdDays }` |

Uploaded photos are served statically from `/uploads/<filename>`.

---

## 6. Deploying

This repo is two independently deployable apps.

- **Backend** → Render or Railway (both have Node.js + persistent disk
  free tiers). Set the environment variables from the table above,
  add a **Postgres** add-on for production (SQLite's file-based
  storage doesn't survive a redeploy on most platforms), and set the
  build/start commands to `npm install && npx prisma migrate deploy`
  and `npm start`.
- **Frontend** → Vercel or Render Static Site. Set `VITE_API_URL` to
  your deployed backend URL, build command `npm run build`, output
  directory `dist`.

Update `CLIENT_URL` on the backend to your deployed frontend origin so
CORS allows it.

---

## 7. Project structure notes

- `backend/uploads/` stores complaint photos on disk; in production
  behind an ephemeral filesystem (like most PaaS free tiers), swap
  this for an S3-compatible bucket — the `upload.js` middleware is the
  only file that would need to change.
- Passwords are hashed with bcrypt; never stored or logged in plain
  text.
- The frontend never talks to the database directly — every action
  goes through the API, which enforces role checks server-side (the
  UI hiding a button is a convenience, not the security boundary).
