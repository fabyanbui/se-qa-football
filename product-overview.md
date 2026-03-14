# Product Overview — Football Tournament Management Web App

This is a **football tournament operations platform** (Node.js + Express + PostgreSQL + Handlebars SSR) for organizing a tournament end-to-end: setup, team registration, approvals, match operations, and public stats.

It is basically a 3-sided product: **organizer/admin**, **team managers**, and **spectators**.


## What is this app about?

A centralized website to run an amateur/semi-pro football league.

It supports tournament configuration, team onboarding, match tracking (goals/cards), and public pages like leaderboard, schedule, and player stats.


## Who uses this app?

| Role | Technical identity | Typical access |
|---|---|---|
| Spectator/Guest | Not logged in | Public pages |
| Team Manager (BQL) | Logged-in user, `privilege = 0` | Team and profile management |
| Tournament Organizer/Admin (BTC) | Logged-in admin, `privilege = 1` | All management + moderation tools |


## What each role wants to achieve

**Guest/Spectator**

- Follow tournament info, teams, standings, match details, and stats.
- Consume updates without creating an account.

**Team Manager**

- Register and manage their club/team profile.
- Manage roster (add/remove players, upload avatars/logo).
- Track approval status and participate in current tournament.

**Organizer/Admin**

- Create/edit tournament settings (dates, format, limits, branding).
- Approve/reject team registrations.
- Adjust match schedule and record match events (goals/cards).
- Monitor operations dashboards.


## Main features

- Authentication: register/login/logout, session-based auth, profile edit, password change.
- Tournament lifecycle: create (admin), configure format/limits, publish overview.
- Team lifecycle: team creation, owner edits, roster management, logo/profile submission.
- Moderation workflow: admin accepts/rejects teams.
- Match operations: admin edits matches and records goal/card events.
- Public insights: leaderboard, team stats, player stats, tournament summary metrics.
- Automation: background scheduler updates match status (played/finished) periodically.


## Backend, API, and database (developer lens)

- Architecture: **MVC-ish SSR** (`routers -> controllers -> models -> db utils`).
- API style: mostly server-rendered routes + some JSON endpoints for async actions (accept/reject, edits).
- Auth: Passport local strategy + express-session.
- Core tables: `users`, `tournaments`, `formats`, `teams`, `players`, `matches`, `match_events`, `teams_statistics`.
- Important DB triggers auto-maintain scores/stats/winner and team stats rows on approval status changes.
- Role model is DB-driven (`users.privilege` mapped to `user.isAdmin` in code).


## Notable product constraints / current gaps

- `forgot-password` flow is a stub.
- Ticket-management views/routes exist but are mostly not implemented.
- Some edit sub-pages are scaffolded UI.
- In current runtime data, `/tournament/matches` can crash when round data is missing (`matches is not iterable`), so schedule page stability depends on underlying match data integrity.
