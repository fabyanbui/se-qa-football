# System Overview

## 1) Purpose

This document defines the current product scope and operating context for the **Football Tournament Management Website**.  
It aligns legacy requirement intent (RUP Vision + Use-Case specs) with the **actual implementation** in the current codebase.


## 2) Reference Baseline

- Legacy requirement artifacts:
  - `docs/requirements/rup_vision_sp.pdf`
  - `docs/requirements/rup_ucspec.pdf`
- Implementation baseline:
  - Routes: `src/routers/*.r.js`
  - Controllers: `src/controllers/*.c.js`
  - Models/DB access: `src/models/*.m.js`, `src/utils/database/*.js`
  - Schema + triggers + seed: `src/resources/initialize.sql`
- UI baseline:
  - Handlebars views: `src/views/**`
  - Runtime exploration on `http://localhost:3000` with guest/user/admin flows


## 3) Product Vision (Current MVP Position)

The system provides a centralized web platform to:

- Publish and manage a football tournament
- Register and review participating teams
- Manage team rosters
- Manage match schedules and in-match events (goals/cards)
- Publish standings and statistics

Primary business value:

- Reduce manual coordination effort for organizers
- Give clubs a clear registration/management channel
- Give spectators a public portal for tournament information


## 4) Stakeholders and Roles

| Role | System Identity | Primary Goals |
|---|---|---|
| Guest / Spectator | Unauthenticated visitor | Browse public information (home, teams, public tournament pages) |
| Team Manager / Club Representative | Authenticated user (`privilege = 0`) | Create and manage own team, members, and profile presence |
| Organizer / Admin | Authenticated admin (`privilege = 1`) | Configure tournament, approve teams, edit matches and events |


## 5) Scope of Implemented Capabilities

### 5.1 Authentication and Account

- Account registration (`/register`)
- Login/logout with session (`/login`, `/logout`)
- Remember-me cookie behavior
- Profile editing + avatar upload
- Password change

### 5.2 Tournament Administration

- Create tournament (when no active tournament exists)
- Update tournament core info (name, dates, place, map, rules, format, team/player counts)
- Upload tournament logo and banner

### 5.3 Team and Player Management

- Team creation by authenticated users
- Team profile editing (owner-only)
- Team logo upload
- Team member add/remove (owner-only)
- Player avatar upload
- Team list/detail/member browsing

### 5.4 Approval and Match Operations (Admin)

- Team acceptance/rejection for current tournament
- Round-based match schedule adjustments
- Match event editing (goals/cards)
- Match lineup page (view/edit UI level)

### 5.5 Public Tournament Information

- Teams listing and leaderboard
- Matches listing and match details
- Team and player statistics pages

### 5.6 Data Automation in Database

- Trigger-driven updates for:
  - Team statistics creation/removal on approval status changes
  - Match scores from goal events
  - Team stats (goals/cards/own goals)
  - Played/result counters and winner assignment


## 6) Out-of-Scope / Partial Features (vs legacy RUP intent)

| Area | Legacy Intent | Current Status |
|---|---|---|
| Forgot password recovery | Password reset workflow | **Stub only** (`POST /forgot-password` returns placeholder) |
| Ticket sales/management | Ticket creation/sale/statistics workflows | **Not implemented** (UI stubs only) |
| Team statistics detail page | Detailed team stat screen | Route exists; page shows "not implemented" |
| Match ticket edit page | Edit ticket inventory per match | Route exists; page shows "not implemented" |
| OAuth login (Google/Facebook) | Third-party login | UI links exist, backend routes not implemented |


## 7) Core Business Workflows

### WF-01 Organizer Setup

1. Admin logs in.
2. If no active tournament, admin creates one.
3. Admin configures tournament details and branding assets.
4. Admin monitors registrations and operations via management/tournament modification screens.

### WF-02 Team Participation

1. User registers/logs in.
2. User creates team and uploads profile info/logo.
3. Admin reviews team profile and accepts/rejects.
4. Accepted teams appear as active participants and join leaderboard/stat pipelines.

### WF-03 Match Lifecycle

1. Admin adjusts schedule (date/time/place/team pairing).
2. During/after match, admin records goals and cards.
3. DB triggers update scores, standings, and statistics.
4. Public users consume updated views.

### WF-04 Public Consumption

1. Guest visits home/teams/tournament sections.
2. Guest views teams, match details, leaderboard, and player stats.


## 8) System Context and Architecture Summary

- **Architecture style:** SSR web app (Node.js + Express + Handlebars)
- **Persistence:** PostgreSQL via `pg` (raw SQL, no ORM)
- **Auth model:** Passport Local + session cookies
- **File storage:** local filesystem under `public/img/*`
- **Background process:** scheduler updates match `is_played` / `is_finished` every 5 minutes


## 9) Constraints and Assumptions

- One active tournament is expected at a time (`is_closed = false` selection logic).
- Tournament-dependent routes (`/teams`, `/tournament`, `/management`) are guarded by `checkTournament`.
- Admin role is derived from `users.privilege = 1`.
- Team ownership checks are implemented in controllers (not centralized middleware).
- Core UI language/content is Vietnamese.


## 10) Known Risks and Gaps

- Runtime defect observed: `GET /tournament` crashes due SQL syntax issue in `dbMatches.getNumberOfOwnGoalsInTournament()` (subquery alias missing).
- Session store is in-memory (`express-session` default), not production-grade.
- No CSRF protection layer is present.
- Upload validation is mostly client-side; server-side content checks are limited.
