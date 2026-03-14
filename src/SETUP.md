# Football Tournament Management — Setup Tutorial

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/download/) (v13+)

---

## 1. Install & Configure PostgreSQL

### Start PostgreSQL

```bash
brew services start postgresql@14
```

### Stop PostgreSQL

```bash
brew services stop postgresql@14
```

### Restart PostgreSQL

```bash
brew services restart postgresql@14
```

### Check PostgreSQL status

```bash
pg_lsclusters
```
You should see **Status: online** for cluster `14 main` on port **5433**.

---

## 2. Set Up the Database

### Initialize the database (first time only)

This creates the database `DB_FootballTournament`, all tables, triggers, and sample data.

**First, set the `postgres` user password to `1`** (one-time, matches `.env`):
```bash
sudo -u postgres psql -p 5433 -c "ALTER USER postgres WITH PASSWORD '1';"
```

Then initialize the database:
```bash
set -a
source .env
set +a
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" \
  -v admin_seed_email="$ADMIN_SEED_EMAIL" \
  -v admin_seed_password="$ADMIN_SEED_PASSWORD" \
  -f resources/initialize.sql
```

### Reset the database (wipe and re-seed)

```bash
set -a
source .env
set +a
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE IF EXISTS \"DB_FootballTournament\";"
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" \
  -v admin_seed_email="$ADMIN_SEED_EMAIL" \
  -v admin_seed_password="$ADMIN_SEED_PASSWORD" \
  -f resources/initialize.sql
```

### Connect to the database manually

```bash
set -a
source .env
set +a
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME"
```

---

## 3. Configure the App

Edit `.env` in this directory to match your PostgreSQL setup:

```env
PORT=3000

# Session
SESSION_SECRET="CodeOfDutySecrets"

# Database
DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="1"
DB_NAME="DB_FootballTournament"
DB_PORT=5433

# Password hashing
SALT_ROUNDS=10

# Seed admin for initialize.sql
ADMIN_SEED_EMAIL="admin@football.local"
ADMIN_SEED_PASSWORD="CHANGE_ME_ADMIN_PASSWORD"
```

---

## 4. Install Node.js Dependencies

```bash
npm install
```

---

## 5. Run the App

### Production mode

```bash
npm start
```

### Development mode (auto-reload on file changes)

```bash
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## 6. Default Test Accounts

| Role            | Email             | Password |
|-----------------|-------------------|----------|
| Admin (BTC)     | from `ADMIN_SEED_EMAIL` | from `ADMIN_SEED_PASSWORD` |
| User (Team manager) | user@user.com | `123`    |

---

## 7. Project Structure

```
src/
├── server.js          # Entry point
├── .env               # Environment variables
├── controllers/       # Route handlers
├── middlewares/       # Express middleware (auth, hbs, etc.)
├── models/            # Database query functions
├── routers/           # Route definitions
├── utils/database/    # PostgreSQL pool connection
├── views/             # Handlebars templates
├── public/            # Static assets (CSS, JS, images)
├── resources/
│   └── initialize.sql # Full DB schema + sample data
└── samples/           # Sample media files
```

---

## Quick Reference

| Task                     | Command                                                             |
|--------------------------|---------------------------------------------------------------------|
| Start DB                 | `brew services start postgresql@14`                                 |
| Stop DB                  | `brew services stop postgresql@14`                                  |
| Check DB status          | `pg_lsclusters`                                                     |
| Set postgres password    | `sudo -u postgres psql -p 5433 -c "ALTER USER postgres WITH PASSWORD '1';"` |
| Init DB (first time)     | `set -a && source .env && set +a && PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -v admin_seed_email="$ADMIN_SEED_EMAIL" -v admin_seed_password="$ADMIN_SEED_PASSWORD" -f resources/initialize.sql` |
| Reset DB                 | `set -a && source .env && set +a && PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE IF EXISTS \"DB_FootballTournament\";" && PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -v admin_seed_email="$ADMIN_SEED_EMAIL" -v admin_seed_password="$ADMIN_SEED_PASSWORD" -f resources/initialize.sql` |
| Connect DB               | `set -a && source .env && set +a && PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME"` |
| Install packages         | `npm install`                                                       |
| Start app                | `npm start`                                                         |
| Start app (dev)          | `npm run dev`                                                       |
| View app                 | http://localhost:3000                                               |

---

## 8. Review the Database

### Quick: dump all tables in one command

No need to list table names — this auto-discovers and dumps every table:

```bash
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament << 'EOF'
SELECT 'SELECT * FROM ' || table_name || ';'
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name
\gexec
EOF
```

> `\gexec` executes the query output as SQL — it discovers all tables dynamically from `information_schema`.

Or if you prefer an explicit list:

```bash
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament \
  -c "SELECT * FROM users;" \
  -c "SELECT * FROM tournaments;" \
  -c "SELECT * FROM formats;" \
  -c "SELECT * FROM teams;" \
  -c "SELECT * FROM teams_statistics;" \
  -c "SELECT * FROM players;" \
  -c "SELECT * FROM matches;" \
  -c "SELECT * FROM match_events;"
```

### Using `psql` (CLI)

Connect to the database:

```bash
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament
```

Useful commands inside `psql`:

| Command             | Description                        |
|---------------------|------------------------------------|
| `\dt`               | List all tables                    |
| `\d <table_name>`   | Show columns/schema of a table     |
| `\df`               | List all functions/triggers        |
| `\q`                | Quit psql                          |

Example queries:

```sql
-- View all users
SELECT * FROM users;

-- View all tournaments
SELECT * FROM tournaments;

-- View all teams with their tournament
SELECT t.name AS team, t.level, t.status, tn.name AS tournament
FROM teams t JOIN tournaments tn ON t.tournament_id = tn.id;

-- View match results
SELECT m.id, t1.name AS team1, t2.name AS team2,
       m.scores_1, m.scores_2, m.is_finished
FROM matches m
JOIN teams t1 ON m.team_id_1 = t1.id
JOIN teams t2 ON m.team_id_2 = t2.id;

-- View team statistics
SELECT t.name, ts.played, ts.wins, ts.draws, ts.losses, ts.score
FROM teams_statistics ts JOIN teams t ON ts.team_id = t.id
ORDER BY ts.score DESC;
```

### Beautify output

**Option 1 — Expanded (vertical) mode** — best for wide tables like `teams`, `matches`:

```bash
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament -c "\x auto" -c "SELECT * FROM teams;"
```

Each row is displayed vertically:
```
-[ RECORD 1 ]-+-------
id            | 6
name          | DOMINO TEAM
level         | Sơ cấp
status        | t
...
```

**Option 2 — Box borders** — cleaner table grid:

```bash
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -d DB_FootballTournament \
  --pset=border=2 \
  -c "SELECT id, name, level, status FROM teams;"
```

Output:
```
+----+-------------+---------------+--------+
| id |    name     |     level     | status |
+----+-------------+---------------+--------+
|  6 | DOMINO TEAM | Sơ cấp        | t      |
...
+----+-------------+---------------+--------+
```

**Option 3 — Set defaults in `~/.psqlrc`** so every psql session looks nice automatically:

```bash
echo "\x auto
\pset border 2
\pset null '(null)'" >> ~/.psqlrc
```

**Option 4 — `pgcli`** (best overall — colors, autocomplete, syntax highlighting):

```bash
# Install
pip install pgcli

# Run
pgcli -U postgres -h localhost -p 5433 -d DB_FootballTournament
```

### Using pgAdmin (GUI)

1. Download and install [pgAdmin](https://www.pgadmin.org/download/).
2. Open pgAdmin → **Add New Server**:
   - **Host**: `localhost`
   - **Port**: `5433`
   - **Username**: `postgres`
   - **Password**: *(your postgres password, default `1`)*
   - **Database**: `DB_FootballTournament`
3. Expand **Schemas → public → Tables** to browse all tables.
4. Right-click any table → **View/Edit Data → All Rows** to inspect records.

### Using DBeaver (GUI, free & cross-platform)

1. Download [DBeaver Community](https://dbeaver.io/download/).
2. New Connection → choose **PostgreSQL**.
3. Fill in the same host/port/user/password/database as above.
4. Browse tables in the **Database Navigator** panel.
