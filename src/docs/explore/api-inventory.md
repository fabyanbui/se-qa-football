# API Inventory

All Express HTTP routes found (method + path). Middleware notes in parentheses where present.

Root / home

- GET  /
- GET  /about
- GET  /create (checkAdmin, checkNoTournament)
- POST /create/info (checkAdmin, checkNoTournament)
- POST /create/logo (checkAdmin, file upload)
- POST /create/banner (checkAdmin, file upload)

Auth (mounted at /)

- GET  /login (checkNotAuthenticated)
- POST /login (checkNotAuthenticated)
- GET  /register (checkNotAuthenticated)
- POST /register (checkNotAuthenticated)
- GET  /logout
- GET  /forgot-password (checkNotAuthenticated)
- POST /forgot-password (checkNotAuthenticated)

Profile (/profile)

- GET  /profile (checkAuthenticated)
- POST /profile/edit (checkAuthenticated, file upload)
- GET  /profile/change-password (checkAuthenticated)
- POST /profile/change-password (checkAuthenticated)

Teams (/teams)

- GET    /teams
- GET    /teams/create (checkAuthenticated)
- POST   /teams/create-info (checkAuthenticated)
- POST   /teams/:teamId/update-logo (checkAuthenticated, file upload)
- GET    /teams/:teamId
- GET    /teams/:teamId/members
- GET    /teams/:teamId/edit (checkAuthenticated)
- POST   /teams/:teamId/edit (checkAuthenticated, file upload)
- GET    /teams/:teamId/edit/members (checkAuthenticated)
- DELETE /teams/:teamId/edit/members/:playerId (checkAuthenticated)
- POST   /teams/:teamId/edit/members (checkAuthenticated)
- POST   /teams/:teamId/edit/members/:playerId/avatar (checkAuthenticated, file upload)
- DELETE /teams/:teamId/delete (checkAuthenticated)
- GET    /teams/:teamId/statistics

Tournament (/tournament)

- GET  /tournament/
- GET  /tournament/teams
- GET  /tournament/teams/leaderboard
- GET  /tournament/matches
- GET  /tournament/matches/:id
- GET  /tournament/statistics
- GET  /tournament/statistics/players

Admin tournament modifications (checkAdmin)

- GET    /tournament/modifications
- GET    /tournament/modifications/teams
- GET    /tournament/modifications/matches
- POST   /tournament/modifications/info
- POST   /tournament/modifications/logo (file upload)
- POST   /tournament/modifications/banner (file upload)
- PUT    /tournament/modifications/teams/:teamId/accept
- PUT    /tournament/modifications/teams/:teamId/reject
- PUT    /tournament/modifications/matches

Match editing (admin)

- GET  /tournament/matches/:id/edit
- POST /tournament/matches/:id/edit/goals (checkAdmin)
- POST /tournament/matches/:id/edit/cards (checkAdmin)
- GET  /tournament/matches/:id/edit/players (checkAdmin)
- GET  /tournament/matches/:id/edit/tickets (checkAdmin — not implemented)

Management (/management)

- GET /management (checkAuthenticated)
- GET /management/tickets (checkAdmin)

Misc

- GET  /test
- POST /test

Fallback

- 404 handler (renders 404 page)

