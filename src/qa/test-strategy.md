# Test Strategy — Football Tournament Management System

## 1. System Overview

The Football Tournament Management System is a web application for organizing and tracking football tournaments. Administrators create and manage a single active tournament, schedule matches, accept/reject team registrations, and record live match events. Regular users register accounts, manage their own team, browse tournament information, and view statistics.

**Technology stack:**
| Layer | Technology |
|---|---|
| Frontend | Server-side rendered Handlebars (`.hbs`) templates + static HTML / CSS / Vanilla JS (Bootstrap 5) |
| Backend | Node.js + Express.js (MVC: routers → controllers → models) |
| Database | PostgreSQL via `node-postgres` (raw SQL, no ORM) with 8 auto-update triggers |
| Authentication | Passport.js local strategy + bcrypt; sessions via `express-session` (in-memory store) |
| File upload | multer (avatars, logos, banners saved to `public/`) |
| Scheduler | node-schedule (auto-marks matches as played/finished by date+time) |

**User roles:**

| Role | `privilege` | Capabilities |
|---|---|---|
| Guest | — | Browse public pages (home, about, teams, tournament, matches, statistics) |
| User | 0 | All guest actions + register/login, create/manage own team, view profile |
| Admin | 1 | All user actions + create tournament, accept/reject teams, edit matches and match events |

**Auth flow:** Login and Register are JSON fetch APIs (not traditional form POST). The server returns `{status, message}` and the client redirects on success.

**Known pre-existing bugs discovered during exploration:**
1. `controllers/tournament.c.js:24` — `matches.reduce()` on an empty array crashes the server process (unhandled exception, no try-catch, no initial value)
2. `utils/database/dbMatches.js:47–50` — `getNumberOfOwnGoalsInTournament` SQL subquery is missing a required alias → PostgreSQL error crashes server
3. `utils/database/dbMatches.js:57–61` — `getNumberOfCardsInTournament` same missing alias bug
4. `routers/auth.r.js` — `/login/with-google` and `/login/with-facebook` buttons render in the UI but the routes are not defined → 404 on click
5. `controllers/auth.c.js:82` — `POST /forgot-password` is not implemented; returns raw text
6. `utils/auth-helper.js:27` — `checkOwnTeam` middleware references undefined `teamDb`; it is never applied to any route but would throw if called

---

## 2. Test Scope

### In Scope
- Authentication: register, login, logout, session management, "remember me", access guards
- User profile: view, edit (fullname, birthday, phone, introduction, avatar upload), change password
- Team management: create, edit, delete, view; manage players (add/remove/avatar); upload logo
- Tournament public views: overview, teams list, leaderboard, match schedule (by round), match details, statistics (teams & players)
- Tournament admin: create tournament, update info, upload logo/banner, accept/reject team registrations, edit match schedule, record goals/cards/own goals, manage player lineup
- Management dashboard: user's own teams, admin ticket view (stub page)
- Role-based access control: all three guards (`checkAuthenticated`, `checkAdmin`, `checkNotAuthenticated`) and the `checkTournament` redirect
- Input validation and server-side error handling for all forms and JSON APIs
- DB trigger correctness (statistics auto-update on match events and status changes)
- 404 fallback page

### Out of Scope
- Ticket purchasing / sales (feature not implemented end-to-end)
- Email delivery for password reset
- Social OAuth login (Google, Facebook — routes not defined)
- Mobile / responsive layout testing
- Infrastructure, deployment pipeline, or load-balancing layer
- `GET /test` and `POST /test` debug endpoints

---

## 3. Test Levels

| Level | Description | Primary Scope |
|---|---|---|
| **Unit** | Test individual functions in isolation, with all I/O dependencies mocked | DB query helpers (`dbUsers`, `dbTeams`, `dbMatches`, `dbPlayers`, `dbTournaments`), model constructors and static methods, helper utilities (`auth-helper.js`, `tournament-helper.js`), input-validation logic in controllers |
| **Integration** | Test the interaction between controllers, models, and a real test database | Route → controller → model → DB → response; DB trigger behaviour after INSERT/UPDATE |
| **System (E2E)** | Test complete user flows through the running application in a browser | Full flows: register → login → create team → view tournament → admin accept team → record match event |
| **Acceptance** | Validate the system against the stated requirements and use cases | Use cases from `docs/requirements/rup_ucspec.pdf`; reviewed by stakeholders |

---

## 4. Test Types

| Test Type | Description |
|---|---|
| **Functional Testing** | Verify each feature works as specified: CRUD operations produce correct data, navigation leads to the right pages, state transitions (team approval, match played/finished) behave correctly. Covers both happy paths and expected error paths (e.g., duplicate email, wrong password). |
| **API Testing** | Validate every Express HTTP endpoint — method, path, request payload (JSON or multipart), HTTP status code, and response body. Includes boundary inputs, missing fields, and invalid data. Endpoints use JSON responses for mutating actions and HTML renders for GETs. |
| **UI Testing** | Verify page rendering (correct titles, data displayed), navigation links, form controls, toast/error messages, and redirection behaviour using browser automation (Playwright). Also tests that protected pages redirect unauthenticated users. |
| **Security Testing** | Test all three auth guards (`checkAuthenticated`, `checkAdmin`, `checkNotAuthenticated`) by accessing protected routes without or with insufficient credentials. Verify bcrypt password hashing, session isolation, and that team-ownership checks prevent users from editing other users' teams. |
| **Database Testing** | Verify SQL queries return correct data; test all 8 DB triggers: `teams_statistics` rows created/deleted on team status change, `matches.scores_*` updated on goal events, `teams_statistics.wins/draws/losses` updated on match finish, `winner_id` updated on score change. |
| **Regression Testing** | Re-run the full test suite after every code change to confirm no previously passing tests break. Especially critical after fixing the known bugs. |
| **Performance Testing** | Measure response time and throughput of the heaviest pages (tournament overview, leaderboard, statistics) which make multiple sequential DB queries. Identify N+1 query patterns in team/player loops. |
| **Usability Testing** | Manual/exploratory evaluation of UI clarity, form feedback (toast messages), navigation consistency, and Vietnamese-language content correctness. |

---

## 5. Automation Strategy

| Layer | Recommended Tool | What to Automate |
|---|---|---|
| Unit | Jest + mock for `db.pool.query` | DB helper functions, model constructors, controller validation logic, auth/tournament helpers |
| API (Integration) | Supertest + Jest + test DB | All 40+ routes: status codes, response shape, auth guards (unauthenticated, non-admin), validation errors |
| UI / E2E | Playwright | Critical flows: register, login, create team, browse tournament overview, admin accept team, record goal |
| DB Triggers | Jest + test DB | Insert match_event → assert teams_statistics updated; update match is_finished → assert wins/losses updated |
| CI | GitHub Actions | Unit + API tests on every push/PR; E2E tests on merge to `main` |

Manual testing is required for: file upload UX (logo, banner, avatar), toast message feedback timing, exploratory/edge-case sessions, and acceptance with stakeholders.

---

## 6. Test Environment

| Environment | Purpose | Configuration |
|---|---|---|
| **Local Development** | Unit and exploratory testing | Local PostgreSQL on port 5433; `.env` with `DB_*` and `SESSION_SECRET` |
| **Test / CI** | Automated API, integration, and E2E tests | Isolated PostgreSQL DB reset with `resources/initialize.sql` before each test suite; deterministic seed data |
| **Production (smoke)** | Verify deployment health | Read-only critical-path checks: login, home page, tournament overview; no writes |

**Setup for any test environment:**
```bash
# 1. Start PostgreSQL
# 2. Init/reset DB
PGPASSWORD=1 psql -U postgres -h localhost -p 5433 -f src/resources/initialize.sql
# 3. Install dependencies
npm install
# 4. Set .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, SESSION_SECRET, SALT_ROUNDS)
# 5. Start app
npm start
```

---

## 7. Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Server crashes on empty matches array** (`tournament.c.js:24`) | Entire server process dies; all routes become unreachable | **High** (happens whenever no matches exist) | Fix: add guard `if (matches.length === 0)` before `.reduce()`; add regression test |
| **SQL subquery alias bug** (`dbMatches.js:47–61`) | Tournament overview page crashes server | **High** (triggered on every `/tournament` visit) | Fix: add `AS t` alias to subqueries; add integration tests for both functions |
| **Social login 404** (`/login/with-google`, `/login/with-facebook`) | Users see 404 instead of error message | Medium | Implement routes or hide buttons; add UI test asserting graceful fallback |
| **`POST /forgot-password` stub** | Password recovery is non-functional | Medium | Implement or explicitly disable with a user-facing message; mark as known gap in tests |
| **Team ownership enforced in controller, not middleware** | Any authenticated user can potentially edit any team if ownership check in controller has a bug | **High** | Add explicit security tests: authenticated user B attempts to edit/delete user A's team |
| **`checkOwnTeam` middleware uses undefined `teamDb`** | Would throw a ReferenceError if called | Low (never applied to routes) | Remove the dead code or fix the reference; add lint rule for undefined variables |
| **In-memory session store** | Sessions lost on server restart break test continuity | Medium | Use `connect-pg-simple` in test environments; reset cookies between test suites |
| **Raw SQL — no ORM** | SQL injection risk if parameters are not properly bound; malformed queries crash the server | Medium | Verify all queries use parameterized placeholders (`$1`, `$2`); add security tests with special characters in inputs |
| **No existing test suite (zero coverage baseline)** | Any regression goes undetected | **High** | Prioritize fixing the 3 server-crash bugs first, then build API test baseline |
| **DB trigger side effects in tests** | Inserting a match_event in one test silently mutates `teams_statistics` affecting other tests | Medium | Wrap each test in a DB transaction that is rolled back; or re-seed the DB before each suite |
| **node-schedule auto-updates matches** | Scheduler may change `is_played`/`is_finished` during test runs | Low | Disable scheduler in the test environment or mock `node-schedule` |
