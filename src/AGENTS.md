# AGENTS.md — Football Tournament Management

This file provides context for AI agents (GitHub Copilot, etc.) working in this repository.

---

## Project Overview

A **Node.js/Express** web app for managing football tournaments. Features include:
- Tournament creation and management
- Team registration and approval
- Match scheduling and live scoring
- Player management
- User authentication (admin vs. regular user)

**Stack:** Node.js · Express · PostgreSQL · Handlebars (HBS) · Passport.js · bcrypt

---

## Environment Setup

> Full setup guide: [`SETUP.md`](./SETUP.md)

### Prerequisites
- Node.js v16+
- PostgreSQL v13+

### Quick Start

```bash
# 1. Start PostgreSQL
brew services start postgresql@14

# 2. Set postgres password (first time only)
sudo -u postgres psql -p 5433 -c "ALTER USER postgres WITH PASSWORD '1';"

# 3. Init database (first time only)
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -f resources/initialize.sql

# 4. Install dependencies
npm install

# 5. Start app
npm start
# → http://localhost:3000
```

> **After a PC restart**, only steps 1 and 5 are needed.

### Environment Variables (`.env`)

```env
PORT=3000
SESSION_SECRET="CodeOfDutySecrets"
DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="1"
DB_NAME="DB_FootballTournament"
DB_PORT=5433
SALT_ROUNDS=10
```

### Database Management

| Task         | Command |
|--------------|---------|
| Start DB     | `brew services start postgresql@14` |
| Set password (first time) | `sudo -u postgres psql -p 5433 -c "ALTER USER postgres WITH PASSWORD '1';"` |
| Init DB      | `PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -f resources/initialize.sql` |
| Reset DB     | `PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -c "DROP DATABASE IF EXISTS \"DB_FootballTournament\";" && PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -f resources/initialize.sql` |
| Connect DB   | `PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament` |
| Dump all tables | See below |

Dump all tables dynamically:
```bash
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament << 'EOF'
SELECT 'SELECT * FROM ' || table_name || ';'
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name
\gexec
EOF
```

### Test Accounts

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@admin.com   | `123`    |
| User  | user@user.com     | `123`    |

---

## Project Structure

```
src/
├── server.js               # Entry point — Express app setup, server listen
├── .env                    # Environment variables (DB, session, port)
├── controllers/            # Business logic per feature
│   ├── auth.c.js           # Login, logout, register
│   ├── home.c.js           # Homepage
│   ├── management.c.js     # Admin: tournament/match management
│   ├── profile.c.js        # User profile
│   ├── teams.c.js          # Team registration and management
│   └── tournament.c.js     # Tournament detail and viewing
├── routers/                # Express route definitions
│   ├── index.r.js          # Mounts all routers
│   ├── auth.r.js
│   ├── home.r.js
│   ├── management.r.js
│   ├── profile.r.js
│   ├── teams.r.js
│   └── tournament.r.js
├── middlewares/            # Express middleware
│   ├── passport.mw.js      # Passport.js auth setup
│   ├── hbs/hbs.mw.js       # Handlebars engine setup
│   ├── favicon.mw.js
│   └── node-schedule.mw.js # Scheduled jobs
├── models/                 # DB query functions (pg pool)
│   ├── user.m.js
│   ├── tournament.m.js
│   ├── team.m.js
│   ├── match.m.js
│   └── player.m.js
├── utils/
│   ├── database/
│   │   ├── db-config.js    # PostgreSQL pool (reads from .env)
│   │   └── db*.js          # Per-entity query helpers
│   ├── auth-helper.js
│   ├── tournament-helper.js
│   └── multer/             # File upload config
├── views/                  # Handlebars (.hbs) templates
├── public/                 # Static files (CSS, JS, images)
├── resources/
│   └── initialize.sql      # Full DB schema + seed data
└── samples/                # Sample images for dev/testing
```

---

## Database Schema

8 tables in PostgreSQL database `DB_FootballTournament`:

| Table              | Description |
|--------------------|-------------|
| `users`            | Accounts — `privilege`: 0=user, 1=admin |
| `tournaments`      | Tournament info, format, dates, location |
| `formats`          | Tournament formats (round-robin, knockout, group stage) |
| `teams`            | Teams per tournament — `status`: approved or not |
| `teams_statistics` | Auto-updated stats (wins, draws, losses, goals, cards) |
| `players`          | Players belonging to teams |
| `matches`          | Scheduled matches with scores and status flags |
| `match_events`     | In-match events: `goal`, `own_goal`, `red_card`, `yellow_card`, `start`, `end` |

Key relationships:
- `teams.tournament_id` → `tournaments.id`
- `matches.team_id_1/2` → `teams.id`
- `match_events.match_id` → `matches.id`
- `match_events.player_id` → `players.id`
- `teams_statistics.team_id` → `teams.id` (auto-managed by DB triggers)

---

## Key Conventions

- **File naming:** `<name>.<type>.js` — e.g. `auth.c.js` (controller), `auth.r.js` (router), `user.m.js` (model)
- **Auth:** Passport.js local strategy; sessions via `express-session`
- **DB access:** All queries go through `utils/database/db-config.js` pool — never create new connections directly
- **Uploads:** Handled by `multer`; stored under `public/`
- **Templates:** Handlebars (`.hbs`) in `views/`; layouts and partials supported via `express-handlebars`
- **Scheduled jobs:** `node-schedule` in `middlewares/node-schedule.mw.js`
