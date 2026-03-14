# Database Redesign: Role-Based Access + Seeded Admin

## 1) Goal

This redesign upgrades the user/authorization data model to support:

- `admin` (login required)
- `tournament_organizer` (login required)
- `team_manager` (login required)
- `guest` (no login, read-only public pages)

It also provisions one bootstrap admin from environment variables during DB initialization.

## 2) Schema changes

The main changes are in `src/resources/initialize.sql`.

### New table: `roles`

- `id` (PK, identity)
- `code` (unique): `admin`, `tournament_organizer`, `team_manager`
- `name`
- `description`

### Updated table: `users`

Added columns:

- `role_id` (FK -> `roles.id`, default = `team_manager`)
- `created_by` (self-FK -> `users.id`, nullable)

Kept and constrained:

- `privilege` is preserved for backward compatibility with existing app logic.
- Constraint `users_role_privilege_check` enforces:
  - `admin` -> `privilege = 1`
  - `tournament_organizer` or `team_manager` -> `privilege = 0`

## 3) Seed data behavior

### Seeded admin (required env vars)

`initialize.sql` now reads:

- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

If either is missing, initialization fails fast with a clear error.

Password hashing is done in PostgreSQL using `pgcrypto` (`crypt(..., gen_salt('bf'))`), and `pgcrypto` is enabled by the script.

### Seeded role rows

`roles` is seeded with exactly these role codes:

- `admin`
- `tournament_organizer`
- `team_manager`

## 4) Environment configuration

Added to `src/.env`:

```env
ADMIN_SEED_EMAIL="admin@football.local"
ADMIN_SEED_PASSWORD="CHANGE_ME_ADMIN_PASSWORD"
```

Replace with your real bootstrap values before initializing.

## 5) Application integration

### User model + persistence

- `src/utils/database/dbUsers.js`
  - `createUser(email, password, options)` now supports role-aware creation.
  - Defaults to `team_manager`.
  - `ensureSeedAdmin(email, password)` bootstraps/repairs seeded admin on app startup.
- `src/models/user.m.js`
  - Maps `role_id` to role code.
  - Exposes:
    - `isAdmin`
    - `isTournamentOrganizer`
    - `canManageTournament`

### Authorization middleware

- `src/utils/auth-helper.js`
  - Added `checkTournamentStaff` (admin OR tournament organizer).

### Runtime bootstrap safety net

- `src/server.js` now calls `ensureSeedAdmin(...)` before listening.
- This repairs legacy bad seed rows (for example, admin rows with empty email) and ensures env-seeded admin credentials are usable.

### Route updates

- Tournament creation/modification routes now use `checkTournamentStaff`.
- Ticket management remains `admin` only.

## 6) Admin can create another admin

Added endpoint:

- `POST /register/admin` (admin-only)

Files:

- `src/routers/auth.r.js`
- `src/controllers/auth.c.js`

This endpoint creates a new user with role `admin` and records `created_by`.

## 7) Guest access

Public pages remain public (no login required), so guest users keep view-only access while write/management operations remain protected by authentication/role middleware.

## 8) How to initialize with env-based admin seed

From `src/`:

```bash
set -a
source .env
set +a
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" \
  -v admin_seed_email="$ADMIN_SEED_EMAIL" \
  -v admin_seed_password="$ADMIN_SEED_PASSWORD" \
  -f resources/initialize.sql
```

## 9) Quick verification SQL

```sql
SELECT u.id, u.email, r.code AS role, u.privilege, u.created_by
FROM users u
JOIN roles r ON r.id = u.role_id
ORDER BY u.id;
```

Expected:

- Exactly one bootstrap admin from env seed.
- Non-admin seeded users mapped to `team_manager`.
