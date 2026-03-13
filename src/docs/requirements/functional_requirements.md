# Functional Requirements

## 1) Scope and Conventions

This list captures **currently implemented or intentionally exposed** functional behavior in the current system baseline.

Priority levels:

- **P1**: Critical core flow
- **P2**: Important business support flow
- **P3**: Useful enhancement / currently partial


## 2) Requirements by Module

### 2.1 Authentication and Account

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-AUTH-001 | The system shall allow guest users to register with email and password. | Guest | P1 | `POST /register` creates account when fields are valid and email is not used. |
| FR-AUTH-002 | The system shall reject registration when required fields are missing or password confirmation does not match. | Guest | P1 | API returns error response with explanatory message. |
| FR-AUTH-003 | The system shall allow registered users to log in using email/password. | Guest/User/Admin | P1 | `POST /login` authenticates and creates session. |
| FR-AUTH-004 | The system shall support optional remember-me login behavior. | User/Admin | P2 | Login request with `remember=true` sets persistent session expiration. |
| FR-AUTH-005 | The system shall allow authenticated users to log out. | User/Admin | P1 | `GET /logout` ends current authenticated session. |
| FR-AUTH-006 | The system shall provide a forgot-password page endpoint. | Guest | P3 | `GET /forgot-password` renders screen; reset workflow is currently stubbed. |
| FR-AUTH-007 | The system shall block authenticated users from re-opening login/register pages. | User/Admin | P2 | `checkNotAuthenticated` redirects authenticated users away from auth pages. |


### 2.2 Profile Management

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-PRO-001 | The system shall allow authenticated users to view personal profile information. | User/Admin | P1 | `GET /profile` renders account details. |
| FR-PRO-002 | The system shall allow profile updates (name, birthday, phone, introduction). | User/Admin | P1 | `POST /profile/edit` updates persisted profile fields on valid input. |
| FR-PRO-003 | The system shall allow avatar upload from profile screen. | User/Admin | P2 | Multipart upload stores avatar image and links it to user profile. |
| FR-PRO-004 | The system shall allow authenticated users to change password by providing old and new password. | User/Admin | P1 | `POST /profile/change-password` validates and updates password hash. |


### 2.3 Team Lifecycle and Club Operations

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-TEAM-001 | The system shall show a paginated list of teams in the active tournament. | Guest/User/Admin | P1 | `GET /teams?page=N` returns team listing with pagination metadata. |
| FR-TEAM-002 | The system shall show team detail information. | Guest/User/Admin | P1 | `GET /teams/:teamId` renders contact, level, intro, and tabs. |
| FR-TEAM-003 | The system shall show team member listing. | Guest/User/Admin | P1 | `GET /teams/:teamId/members` displays players in selected team. |
| FR-TEAM-004 | The system shall allow authenticated users to create a new team for current tournament. | User/Admin | P1 | `POST /teams/create-info` creates team record with owner and contact data. |
| FR-TEAM-005 | The system shall allow team logo upload after creation. | Team Owner | P2 | `POST /teams/:teamId/update-logo` stores team logo file. |
| FR-TEAM-006 | The system shall allow team owners to edit team profile details. | Team Owner | P1 | `GET/POST /teams/:teamId/edit` accessible only for owner by controller checks. |
| FR-TEAM-007 | The system shall allow team owners to add members (players). | Team Owner | P1 | `POST /teams/:teamId/edit/members` inserts player record and returns player ID. |
| FR-TEAM-008 | The system shall allow team owners to upload player avatars. | Team Owner | P2 | `POST /teams/:teamId/edit/members/:playerId/avatar` stores player image. |
| FR-TEAM-009 | The system shall allow team owners to remove members from team roster. | Team Owner | P2 | `DELETE /teams/:teamId/edit/members/:playerId` unassigns/removes player-team linkage. |
| FR-TEAM-010 | The system shall allow team owners to delete their team. | Team Owner | P2 | `DELETE /teams/:teamId/delete` removes selected team. |
| FR-TEAM-011 | The system shall expose a team statistics route. | Guest/User/Admin | P3 | `GET /teams/:teamId/statistics` exists but currently renders "not implemented". |


### 2.4 Tournament Configuration and Governance

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-TMT-001 | The system shall allow admin to create tournament when no active tournament exists. | Admin | P1 | `GET /create` and `POST /create/info` available only with admin + no-active-tournament guard. |
| FR-TMT-002 | The system shall allow admin to upload tournament logo and banner. | Admin | P2 | `POST /create/logo` and `POST /create/banner` store branding images. |
| FR-TMT-003 | The system shall provide an admin modification hub for active tournament. | Admin | P1 | `GET /tournament/modifications` renders configurable sections. |
| FR-TMT-004 | The system shall allow admin to update tournament metadata. | Admin | P1 | `POST /tournament/modifications/info` persists updated tournament data. |
| FR-TMT-005 | The system shall allow admin to update tournament logo and banner in modification mode. | Admin | P2 | `POST /tournament/modifications/logo` and `/banner` handle file updates. |
| FR-TMT-006 | The system shall allow admin to approve or reject team participation requests. | Admin | P1 | `PUT /tournament/modifications/teams/:teamId/accept|reject` updates team status. |
| FR-TMT-007 | The system shall enforce active-team capacity when approving teams. | Admin | P1 | Approval fails when active team count reaches `tournament.maxTeams`. |
| FR-TMT-008 | The system shall allow admin to edit round-based match schedule data. | Admin | P1 | `PUT /tournament/modifications/matches` updates match pairings/date/time/place. |


### 2.5 Match Operations and Statistics

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-MCH-001 | The system shall display match list by round. | Guest/User/Admin | P1 | `GET /tournament/matches?round=N` groups matches by date and round. |
| FR-MCH-002 | The system shall display match detail with teams, score, players, and event information. | Guest/User/Admin | P1 | `GET /tournament/matches/:id` renders match summary page. |
| FR-MCH-003 | The system shall allow admin to open match edit workspace. | Admin | P1 | `GET /tournament/matches/:id/edit` shows goals/cards edit interface. |
| FR-MCH-004 | The system shall allow admin to add goal or own-goal events. | Admin | P1 | `POST /tournament/matches/:id/edit/goals` inserts event and returns status JSON. |
| FR-MCH-005 | The system shall allow admin to add yellow/red card events. | Admin | P1 | `POST /tournament/matches/:id/edit/cards` inserts event and returns status JSON. |
| FR-MCH-006 | The system shall provide lineup edit page for match context. | Admin | P2 | `GET /tournament/matches/:id/edit/players` renders lineup-oriented screen. |
| FR-MCH-007 | The system shall provide ticket edit page entry under match customization. | Admin | P3 | `GET /tournament/matches/:id/edit/tickets` currently displays "not implemented". |


### 2.6 Tournament Public Views and Rankings

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-PUB-001 | The system shall provide tournament teams listing. | Guest/User/Admin | P1 | `GET /tournament/teams` shows active teams and counts. |
| FR-PUB-002 | The system shall provide team leaderboard ranking. | Guest/User/Admin | P1 | `GET /tournament/teams/leaderboard` sorts by score and tie-break fields. |
| FR-PUB-003 | The system shall provide team-level statistics view. | Guest/User/Admin | P2 | `GET /tournament/statistics` renders team statistical aggregates. |
| FR-PUB-004 | The system shall provide player-level statistics ranking. | Guest/User/Admin | P1 | `GET /tournament/statistics/players` shows goal/card and special scoring stats. |
| FR-PUB-005 | The system shall provide tournament overview dashboard. | Guest/User/Admin | P1 | `GET /tournament/` is intended to render KPI dashboard (currently affected by runtime SQL issue). |


### 2.7 Management Workspace

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-MGT-001 | The system shall provide a management dashboard for authenticated users. | User/Admin | P1 | `GET /management` lists owner teams and actions. |
| FR-MGT-002 | The system shall provide a ticket management page for admin users. | Admin | P3 | `GET /management/tickets` exists and currently renders "not implemented". |


### 2.8 Access Control and Guards

| ID | Requirement | Actor | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-ACL-001 | The system shall restrict private routes to authenticated users. | System | P1 | `checkAuthenticated` redirects unauthenticated access to `/login`. |
| FR-ACL-002 | The system shall restrict admin-only operations to admin accounts. | System | P1 | `checkAdmin` redirects non-admin users to `/`. |
| FR-ACL-003 | The system shall guard tournament-dependent route groups by active tournament existence. | System | P1 | `checkTournament` applies to `/teams`, `/tournament`, `/management`. |
| FR-ACL-004 | The system shall enforce team owner checks for team edit/delete/member actions. | System | P1 | Controllers validate `team.ownerId == req.user.id` before mutation actions. |


## 3) Legacy Use-Case Traceability Snapshot

| Legacy UC | Legacy Name | Mapping to Current FR |
|---|---|---|
| U001 | Signup | FR-AUTH-001, FR-AUTH-002 |
| U002 | Login | FR-AUTH-003, FR-AUTH-004 |
| U003 | Logout | FR-AUTH-005 |
| U004 | Tournament Details | FR-PUB-001..FR-PUB-005 |
| U007 | Tournament Creation | FR-TMT-001, FR-TMT-002 |
| U008/U010 | Match adjustment/result handling | FR-MCH-003..FR-MCH-005, FR-TMT-008 |
| U009/U017/U026 | Team registration/participation | FR-TEAM-004..FR-TEAM-010, FR-TMT-006 |
| U018-U022 | Player roster management | FR-TEAM-007..FR-TEAM-009 |
| U013-U016/U027-U030 | Ticket workflows | Partially represented by stubs (FR-MCH-007, FR-MGT-002) |


## 4) Explicitly Partial or Deferred Functional Areas

- Password reset lifecycle (token/email) is not implemented.
- Ticket business module is not implemented.
- Team statistics detail page is exposed but not implemented.
- Match ticket edit page is exposed but not implemented.
- Tournament overview endpoint currently has runtime defect and requires SQL fix.
