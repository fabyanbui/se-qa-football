# API Requirements

## 1) Purpose

This document defines endpoint-level requirements for the Express application, including access control, request/response expectations, and implementation status.


## 2) Global API Requirements

### 2.1 Transport and Format

- HTTP over Express.js.
- Browser-facing APIs are mostly same-origin.
- Mutation endpoints primarily return JSON in shape:
  - `{"status":"success", ...}`
  - `{"status":"error", "message":"..."}`

### 2.2 Authentication / Authorization

- Session authentication via Passport Local strategy.
- Route guards:
  - `checkAuthenticated`: requires logged-in session.
  - `checkNotAuthenticated`: blocks authenticated users from auth pages.
  - `checkAdmin`: requires authenticated admin (`user.isAdmin === true`).
- Tournament-guarded route groups:
  - `/teams`, `/tournament`, `/management` require active tournament (`checkTournament`).

### 2.3 Error and Status Behavior

- Success statuses are typically 200.
- Validation/business errors return 400 in several endpoints.
- Some endpoints return generic JSON error without detailed code.
- Non-API page requests may redirect instead of returning JSON (middleware-driven behavior).


## 3) Endpoint Catalog

Legend:

- **Auth**: `Public`, `User`, `Admin`
- **Status**: `Implemented`, `Partial`, `Stub`


### 3.1 Home and Tournament Bootstrap

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/` | Public | - | Implemented | Render home page with global counters. |
| GET | `/about` | Public | - | Implemented | Render about page. |
| GET | `/create` | Admin | `checkAdmin`, `checkNoTournament` | Implemented | Render tournament creation page only when no active tournament exists. |
| POST | `/create/info` | Admin | `checkAdmin`, `checkNoTournament` | Implemented | Create tournament core data. |
| POST | `/create/logo` | Admin | `checkAdmin`, multer | Implemented | Upload tournament logo. |
| POST | `/create/banner` | Admin | `checkAdmin`, multer | Implemented | Upload tournament banner. |


### 3.2 Authentication

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/login` | Public | `checkNotAuthenticated` | Implemented | Render login page. |
| POST | `/login` | Public | `checkNotAuthenticated` | Implemented | Authenticate user and create session. |
| GET | `/register` | Public | `checkNotAuthenticated` | Implemented | Render register page. |
| POST | `/register` | Public | `checkNotAuthenticated` | Implemented | Create new account. |
| GET | `/logout` | User/Admin | - | Implemented | Logout current session. |
| GET | `/forgot-password` | Public | `checkNotAuthenticated` | Partial | Render forgot-password page. |
| POST | `/forgot-password` | Public | `checkNotAuthenticated` | Stub | Placeholder response; reset flow not implemented. |


### 3.3 Profile

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/profile` | User | `checkAuthenticated` | Implemented | Render current user profile. |
| POST | `/profile/edit` | User | `checkAuthenticated`, multer avatar | Implemented | Update profile data and avatar. |
| GET | `/profile/change-password` | User | `checkAuthenticated` | Implemented | Render change-password page. |
| POST | `/profile/change-password` | User | `checkAuthenticated` | Implemented | Validate and change password. |


### 3.4 Teams

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/teams` | Public* | `checkTournament` | Implemented | List current tournament teams (paginated). |
| GET | `/teams/create` | User | `checkTournament`, `checkAuthenticated` | Implemented | Render team creation page. |
| POST | `/teams/create-info` | User | `checkTournament`, `checkAuthenticated` | Implemented | Create team data. |
| POST | `/teams/:teamId/update-logo` | User | `checkTournament`, `checkAuthenticated`, multer | Implemented | Upload team logo (owner check in controller). |
| GET | `/teams/:teamId` | Public* | `checkTournament` | Implemented | Team details. |
| GET | `/teams/:teamId/members` | Public* | `checkTournament` | Implemented | Team members view. |
| GET | `/teams/:teamId/edit` | User | `checkTournament`, `checkAuthenticated` | Implemented | Team edit page (owner-only by controller rule). |
| POST | `/teams/:teamId/edit` | User | `checkTournament`, `checkAuthenticated`, multer | Implemented | Update team details (owner-only). |
| GET | `/teams/:teamId/edit/members` | User | `checkTournament`, `checkAuthenticated` | Implemented | Team member management page (owner-only). |
| POST | `/teams/:teamId/edit/members` | User | `checkTournament`, `checkAuthenticated` | Implemented | Add player to team (owner-only). |
| POST | `/teams/:teamId/edit/members/:playerId/avatar` | User | `checkTournament`, `checkAuthenticated`, multer | Implemented | Upload player avatar. |
| DELETE | `/teams/:teamId/edit/members/:playerId` | User | `checkTournament`, `checkAuthenticated` | Implemented | Remove player from team (owner-only). |
| DELETE | `/teams/:teamId/delete` | User | `checkTournament`, `checkAuthenticated` | Implemented | Delete team (owner-only). |
| GET | `/teams/:teamId/statistics` | Public* | `checkTournament` | Stub | Route exists; page currently not implemented. |

\* Public when active tournament exists; otherwise redirected by tournament guard.


### 3.5 Tournament Public and Admin Operations

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/tournament/` | Public | `checkTournament` | Partial | Tournament overview endpoint intended to provide dashboard (currently runtime SQL issue). |
| GET | `/tournament/teams` | Public | `checkTournament` | Implemented | Active teams list in tournament context. |
| GET | `/tournament/teams/leaderboard` | Public | `checkTournament` | Implemented | Ranked leaderboard page. |
| GET | `/tournament/matches` | Public | `checkTournament` | Implemented | Match schedules by round. |
| GET | `/tournament/matches/:id` | Public | `checkTournament` | Implemented | Match detail page. |
| GET | `/tournament/statistics` | Public | `checkTournament` | Implemented | Team statistics page. |
| GET | `/tournament/statistics/players` | Public | `checkTournament` | Implemented | Player statistics page. |
| GET | `/tournament/modifications` | Admin | `checkTournament`, `checkAdmin` | Implemented | Admin tournament settings hub. |
| GET | `/tournament/modifications/teams` | Admin | `checkTournament`, `checkAdmin` | Implemented | Team approval management. |
| GET | `/tournament/modifications/matches` | Admin | `checkTournament`, `checkAdmin` | Implemented | Match schedule management. |
| POST | `/tournament/modifications/info` | Admin | `checkTournament`, `checkAdmin` | Implemented | Update tournament info. |
| POST | `/tournament/modifications/logo` | Admin | `checkTournament`, `checkAdmin`, multer | Implemented | Update tournament logo image. |
| POST | `/tournament/modifications/banner` | Admin | `checkTournament`, `checkAdmin`, multer | Implemented | Update tournament banner image. |
| PUT | `/tournament/modifications/teams/:teamId/accept` | Admin | `checkTournament`, `checkAdmin` | Implemented | Accept team participation. |
| PUT | `/tournament/modifications/teams/:teamId/reject` | Admin | `checkTournament`, `checkAdmin` | Implemented | Reject team participation. |
| PUT | `/tournament/modifications/matches` | Admin | `checkTournament`, `checkAdmin` | Implemented | Batch update match schedule rows. |
| GET | `/tournament/matches/:id/edit` | Admin | `checkTournament`, `checkAdmin` | Implemented | Match goal/card edit page. |
| POST | `/tournament/matches/:id/edit/goals` | Admin | `checkTournament`, `checkAdmin` | Implemented | Add goal/own-goal event. |
| POST | `/tournament/matches/:id/edit/cards` | Admin | `checkTournament`, `checkAdmin` | Implemented | Add yellow/red card event. |
| GET | `/tournament/matches/:id/edit/players` | Admin | `checkTournament`, `checkAdmin` | Partial | Lineup-focused page exposed (save flow not complete). |
| GET | `/tournament/matches/:id/edit/tickets` | Admin | `checkTournament`, `checkAdmin` | Stub | Ticket edit page exists; not implemented. |


### 3.6 Management Workspace

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/management` | User | `checkTournament`, `checkAuthenticated` | Implemented | Team management dashboard for current user. |
| GET | `/management/tickets` | Admin | `checkTournament`, `checkAdmin` | Stub | Ticket management page placeholder. |


### 3.7 Utility / Internal

| Method | Path | Auth | Middleware | Status | Requirement |
|---|---|---|---|---|---|
| GET | `/test` | Public | - | Internal | Returns current `req.user` or "No user". |
| POST | `/test` | Public | - | Internal | Echoes request body. |


## 4) Key Request Contract Requirements (Write APIs)

### 4.1 `POST /login`

Required JSON body:

```json
{
  "email": "user@user.com",
  "password": "123",
  "remember": false
}
```

Response contract: JSON with `status` and `message`.


### 4.2 `POST /register`

Required JSON body:

```json
{
  "email": "new@domain.com",
  "password": "secret123",
  "retype": "secret123"
}
```


### 4.3 `POST /profile/edit`

Multipart payload:

- `data`: JSON string containing `fullname`, `birthday`, `phone`, `introduction`
- `avatar`: file (optional)


### 4.4 `POST /teams/create-info`

Required JSON keys:

- `name`
- `contactName`
- `contactPhone`
- `contactEmail`
- `level`
- optional: `introduction`, `profile`


### 4.5 `POST /teams/:teamId/edit/members`

Required JSON keys (UI behavior):

- `name`, `number`, `birthyear`, `positions`, `phone`

Returns:

```json
{ "status": "success", "playerId": 123 }
```


### 4.6 `PUT /tournament/modifications/matches`

Required JSON body:

```json
{
  "matches": [
    {
      "id": 42,
      "teamId1": 6,
      "teamId2": 7,
      "place": "Stadium",
      "date": "2024-01-24",
      "time": "07:00"
    }
  ]
}
```


### 4.7 `POST /tournament/matches/:id/edit/goals`

Required JSON keys:

- `matchId`, `teamId`, `playerId`, `time`, `isOwnGoal`


### 4.8 `POST /tournament/matches/:id/edit/cards`

Required JSON keys:

- `matchId`, `teamId`, `playerId`, `time`, `isRedCard`


## 5) API Gap and Improvement Requirements

1. Add server endpoints for OAuth links currently present in login/register UI.
2. Implement complete forgot-password flow (token issuance, verification, reset).
3. Implement ticket-related APIs for management and match ticket edit pages.
4. Add stricter, centralized request validation middleware for all mutation endpoints.
5. Add stable error-code taxonomy beyond `status: error`.
