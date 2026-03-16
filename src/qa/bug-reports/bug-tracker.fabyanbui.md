# Advanced Bug Report Tracker — fabyanbui Commit Audit

Generated (UTC): `2026-03-15T17:55:21.201924+00:00`

## Scope and Method

- Audited all scoped commits using `git log --all` for confirmed aliases/emails.
- Correlated git evidence with Copilot session-history artifacts to improve bug accuracy.
- Classified each bug as `fixed` or `being_fixed` based on closure evidence.

**Author scope used:**
- `Bui Dinh Bao`
- `Bùi Đình Bảo`
- `21120201@student.hcmus.edu.vn`
- `112999623+fabyanbui@users.noreply.github.com`

**Copilot session-history sources:**
- `src/docs/session-work-summary.md`
- `src/qa/smoke/20260313_151500.md`
- `src/qa/smoke/20260313_154500.md`
- `src/qa/smoke-fix/20260313_151500.md`

## Audit Summary

| Metric | Value |
|---|---:|
| Scoped commits reviewed | 29 |
| Bug entries tracked | 7 |
| Fixed bugs | 6 |
| Being-fixed bugs | 1 |
| Commits linked to bug entries | 10 |
| Commit class: `bug-fix` | 8 |
| Commit class: `bug-investigation` | 2 |
| Commit class: `documentation` | 7 |
| Commit class: `feature-or-refactor` | 9 |
| Commit class: `merge` | 3 |

## Bug Tracker

| ID | Status | Severity | Title | Evidence commits |
|---|---|---|---|---|
| FAB-BUG-001 | `fixed` | critical | Tournament overview crash from invalid SQL aggregate subqueries | 4e03fc69 |
| FAB-BUG-002 | `fixed` | high | Team listing visibility and pagination boundary defects | 8cb8e9f9 |
| FAB-BUG-003 | `fixed` | medium | Database connection port mismatch across environment and setup docs | efd76e12 |
| FAB-BUG-004 | `fixed` | high | Admin bootstrap seed fragility and initialization safety gaps | 78f21427, 13d9966b |
| FAB-BUG-005 | `fixed` | medium | Match schedule display and match-state synchronization defects | fa5f15d2 |
| FAB-BUG-006 | `fixed` | medium | Role toggle and team-enrollment validation/feedback regressions in management flows | c19f52e7, bf3446ce |
| FAB-BUG-007 | `being_fixed` | medium | Smoke rerun still indicates unresolved tournament-path error context | fa041cec, c19f52e7, 3f80e125 |

### FAB-BUG-001 — Tournament overview crash from invalid SQL aggregate subqueries

- **Status:** `fixed`
- **Severity:** `critical`
- **Confidence:** `high`
- **Root cause:** Aggregate queries in getNumberOfOwnGoalsInTournament/getNumberOfCardsInTournament used FROM subqueries without aliases, causing PostgreSQL syntax error 42601 and crashing /tournament rendering.
- **Fix/progress summary:** Replaced invalid subquery pattern with direct JOIN + COALESCE SUM queries and normalized numeric return values.
- **Affected paths:**
  - `src/utils/database/dbMatches.js`
  - `src/controllers/tournament.c.js`
- **Evidence commits:**
  - `4e03fc69` — 2026-03-13 — fix: resolve /tournament crash by updating SQL queries for own goals and cards
- **Copilot history evidence:**
  - `qa/smoke/20260313_151500.md` (lines: 12, 15, 16)
  - `qa/smoke-fix/20260313_151500.md` (lines: 1, 5, 6, 9)
- **Verification notes:**
  - Current query implementation is JOIN-based in src/utils/database/dbMatches.js:51-73.
  - Smoke-fix artifact records successful validation without PostgreSQL syntax errors.

### FAB-BUG-002 — Team listing visibility and pagination boundary defects

- **Status:** `fixed`
- **Severity:** `high`
- **Confidence:** `high`
- **Root cause:** Team list logic used a narrower source and fragile page parsing, leading to visibility mismatch and unstable pagination behavior around invalid/out-of-range page values.
- **Fix/progress summary:** Switched listing flow to full team source, normalized page parsing with Number.parseInt, and added explicit page-range guard via maxPage.
- **Affected paths:**
  - `src/controllers/teams.c.js`
  - `src/models/team.m.js`
- **Evidence commits:**
  - `8cb8e9f9` — 2026-03-14 — feat: fix team data visibility issue and enhance pagination handling
- **Copilot history evidence:**
  - _(none)_
- **Verification notes:**
  - Current controller uses TeamModel.getAllTeams() and guarded pagination in src/controllers/teams.c.js:48-55.
  - TeamModel has reusable getAllTeams path in src/models/team.m.js:44-57.

### FAB-BUG-003 — Database connection port mismatch across environment and setup docs

- **Status:** `fixed`
- **Severity:** `medium`
- **Confidence:** `high`
- **Root cause:** Project configuration/documentation referenced a PostgreSQL port that did not match the intended local cluster setup, causing bootstrap/connectivity failures.
- **Fix/progress summary:** Standardized DB port usage to 5433 and aligned setup commands to host/port/password explicit invocations.
- **Affected paths:**
  - `src/.env`
  - `src/SETUP.md`
  - `src/AGENTS.md`
- **Evidence commits:**
  - `efd76e12` — 2026-02-25 — fix: update PostgreSQL port to 5433 in configuration and setup documentation
- **Copilot history evidence:**
  - _(none)_
- **Verification notes:**
  - Current env file sets DB_PORT=5433 in src/.env:11.
  - Setup docs remain aligned with port 5433 workflow.

### FAB-BUG-004 — Admin bootstrap seed fragility and initialization safety gaps

- **Status:** `fixed`
- **Severity:** `high`
- **Confidence:** `high`
- **Root cause:** Admin seeding depended on fragile assumptions and could fail silently/incorrectly when variables were missing or schema states varied, making bootstrap unreliable.
- **Fix/progress summary:** Added strict SQL init behavior (ON_ERROR_STOP), explicit seed variable guard table, and startup bootstrap repair logic (ensureSeedAdmin + compatibility helpers).
- **Affected paths:**
  - `src/resources/initialize.sql`
  - `src/server.js`
  - `src/utils/database/dbUsers.js`
  - `src/.env`
  - `src/SETUP.md`
  - `src/AGENTS.md`
- **Evidence commits:**
  - `78f21427` — 2026-03-14 — feat: enhance admin seeding process and ensure bootstrap safety net
  - `13d9966b` — 2026-03-14 — fix: update admin seed password and add database connection termination command
- **Copilot history evidence:**
  - _(none)_
- **Verification notes:**
  - Init script enforces seed variable path via seed_admin_guard in src/resources/initialize.sql:1019-1046.
  - Server bootstrap now runs seed/compatibility guards before listen in src/server.js:27-36.

### FAB-BUG-005 — Match schedule display and match-state synchronization defects

- **Status:** `fixed`
- **Severity:** `medium`
- **Confidence:** `medium`
- **Root cause:** Mismatch between template score keys and model fields, plus missing/weak match status progression logic, caused incorrect schedule rendering and stale played/finished states.
- **Fix/progress summary:** Aligned score bindings to scores1/scores2, normalized time rendering, and introduced recurring schedule-based status updates for matches.
- **Affected paths:**
  - `src/models/match.m.js`
  - `src/middlewares/node-schedule.mw.js`
  - `src/utils/database/dbMatches.js`
  - `src/views/tournament/matches.hbs`
  - `src/views/tournament/tournament.hbs`
- **Evidence commits:**
  - `fa5f15d2` — 2024-01-21 — Add recent schedules and fix bugs
- **Copilot history evidence:**
  - _(none)_
- **Verification notes:**
  - Score bindings use scores1/scores2 in src/views/tournament/matches.hbs:49 and src/views/tournament/tournament.hbs:96.
  - Match model trims time in src/models/match.m.js:21-26.
  - Scheduler executes periodic update flow in src/middlewares/node-schedule.mw.js:8-16.

### FAB-BUG-006 — Role toggle and team-enrollment validation/feedback regressions in management flows

- **Status:** `fixed`
- **Severity:** `medium`
- **Confidence:** `medium`
- **Root cause:** Management workflows had weak role-toggle input validation and less precise enrollment error/permission responses, causing fragile UX and role-management edge-case failures.
- **Fix/progress summary:** Added boolean toggle validation, protected role mutation rules, richer response payloads, and stricter tournament-selection checks for enrollment flows.
- **Affected paths:**
  - `src/controllers/management.c.js`
  - `src/controllers/teams.c.js`
  - `src/views/management/accounts.hbs`
  - `src/views/management/teams.hbs`
- **Evidence commits:**
  - `c19f52e7` — 2026-03-15 — Refactor tournament management views and update role toggles
  - `bf3446ce` — 2026-03-15 — feat: enhance account and team management with role-based visibility and search functionality
- **Copilot history evidence:**
  - `docs/session-work-summary.md` (lines: 31, 51, 68)
- **Verification notes:**
  - Role toggle validation and clearer errors present in src/controllers/management.c.js (putAccountRole block).
  - Enrollment flow now validates tournament selection and closed tournaments in src/controllers/teams.c.js:280-296.

### FAB-BUG-007 — Smoke rerun still indicates unresolved tournament-path error context

- **Status:** `being_fixed`
- **Severity:** `medium`
- **Confidence:** `low`
- **Root cause:** Follow-up smoke note records an error occurrence but without stack trace/context, so a complete closure artifact is missing even after related tournament/role refactors.
- **Fix/progress summary:** Ongoing hardening appears in subsequent refactor commits, but a final explicit smoke closure record for this rerun is not present in scoped artifacts.
- **Affected paths:**
  - `src/qa/smoke/20260313_154500.md`
  - `src/controllers/tournament.c.js`
  - `src/routers/tournament.r.js`
- **Evidence commits:**
  - `fa041cec` — 2026-03-13 — docs: add error log documentation for tournament functionality
  - `c19f52e7` — 2026-03-15 — Refactor tournament management views and update role toggles
  - `3f80e125` — 2026-03-15 — Implement role-based visibility and configuration for tournaments and teams
- **Copilot history evidence:**
  - `qa/smoke/20260313_154500.md` (lines: 1, 5)
  - `qa/smoke/20260313_151500.md` (lines: 5, 12)
- **Verification notes:**
  - Smoke rerun file has unresolved generic error note only.
  - Recommend capturing stack trace + repro after latest branch state to confirm closure.

## Full Reviewed Commit Inventory (All Scoped Commits)

| Date | Commit | Subject | Classification | Linked bug IDs |
|---|---|---|---|---|
| 2026-03-15 | `a8295cae` | feat: add referee management functionality including database schema, model, and UI integration | `feature-or-refactor` | — |
| 2026-03-15 | `c9327aaf` | Merge pull request #4 from fabyanbui/feat/3-roles-authorize | `merge` | — |
| 2026-03-15 | `bf3446ce` | feat: enhance account and team management with role-based visibility and search functionality | `bug-fix` | FAB-BUG-006 |
| 2026-03-15 | `3f80e125` | Implement role-based visibility and configuration for tournaments and teams | `bug-investigation` | FAB-BUG-007 |
| 2026-03-15 | `c19f52e7` | Refactor tournament management views and update role toggles | `bug-fix` | FAB-BUG-006, FAB-BUG-007 |
| 2026-03-14 | `93c551c7` | feat: implement account management and role assignment functionality | `feature-or-refactor` | — |
| 2026-03-14 | `13d9966b` | fix: update admin seed password and add database connection termination command | `bug-fix` | FAB-BUG-004 |
| 2026-03-14 | `74394c0b` | Merge pull request #3 from fabyanbui/redo-db | `merge` | — |
| 2026-03-14 | `78f21427` | feat: enhance admin seeding process and ensure bootstrap safety net | `bug-fix` | FAB-BUG-004 |
| 2026-03-14 | `56d42772` | feat: implement role-based access control and seeded admin functionality | `feature-or-refactor` | — |
| 2026-03-14 | `8cb8e9f9` | feat: fix team data visibility issue and enhance pagination handling | `bug-fix` | FAB-BUG-002 |
| 2026-03-13 | `165fb748` | feat: add comprehensive documentation for product overview, API inventory, backend structure, system entities, tech stack, and user roles | `feature-or-refactor` | — |
| 2026-03-13 | `fb3bed64` | feat: add initial smoke test documentation for tournament navigation | `documentation` | — |
| 2026-03-13 | `4e03fc69` | fix: resolve /tournament crash by updating SQL queries for own goals and cards | `bug-fix` | FAB-BUG-001 |
| 2026-03-13 | `fa041cec` | docs: add error log documentation for tournament functionality | `bug-investigation` | FAB-BUG-007 |
| 2026-03-13 | `9adb2941` | Merge pull request #1 from fabyanbui/develop | `merge` | — |
| 2026-03-13 | `2f447b63` | feat: add multiple new documentation files for various functionalities and processes | `documentation` | — |
| 2026-03-13 | `1772e698` | feat: add comprehensive documentation for API, functional, non-functional, system overview, validation rules, and operational requirements | `documentation` | — |
| 2026-03-13 | `0403aa62` | feat: add comprehensive test plan and strategy documentation for Football Tournament Management System | `documentation` | — |
| 2026-03-12 | `0c385079` | docs: Add API inventory, backend structure, system entities, tech stack, and user roles documentation | `documentation` | — |
| 2026-02-25 | `efd76e12` | fix: update PostgreSQL port to 5433 in configuration and setup documentation | `bug-fix` | FAB-BUG-003 |
| 2026-02-25 | `b07e9393` | chore: connect to the database after creation in the initialization script. | `feature-or-refactor` | — |
| 2026-02-25 | `02411adb` | docs: Add comprehensive documentation for AI agents and developer setup, and update server configuration. | `documentation` | — |
| 2024-01-21 | `0b7c1595` | Prepare for Match events | `feature-or-refactor` | — |
| 2024-01-21 | `11c74c57` | Complete match logs | `feature-or-refactor` | — |
| 2024-01-21 | `a29ae3b4` | Update auto generate events start match and finish match | `feature-or-refactor` | — |
| 2024-01-21 | `8157089d` | Counter on match details; Match Details | `feature-or-refactor` | — |
| 2024-01-21 | `fa5f15d2` | Add recent schedules and fix bugs | `bug-fix` | FAB-BUG-005 |
| 2024-01-19 | `465aa7f0` | Update readme.md | `documentation` | — |
