# Validation Rules

## 1) Scope

This document consolidates validation and business-rule checks currently enforced across:

- Client-side forms (`src/views/**`)
- Controller/service logic (`src/controllers/**`, `src/models/**`, `src/utils/database/**`)
- Database constraints and triggers (`src/resources/initialize.sql`)


## 2) Rule Matrix

| Rule ID | Domain | Field / Context | Validation Rule | Enforcement Layer | Current Behavior |
|---|---|---|---|---|---|
| VR-AUTH-001 | Register | email, password, retype | All fields required | Client + Server | Missing fields return error message. |
| VR-AUTH-002 | Register | retype | `password === retype` | Client + Server | Mismatch rejected with explicit message. |
| VR-AUTH-003 | Register/Login | email | Email format should be valid | Client | Invalid email blocked before request. |
| VR-AUTH-004 | Register | email | Email must be unique | DB + Server | Duplicate insert handled as error ("Email already registered"). |
| VR-AUTH-005 | Login | credentials | Email/password must match stored account | Server | Invalid credentials return `status:error`. |
| VR-AUTH-006 | Change Password | newPassword | Minimum length = 6 | Server | Short password rejected. |
| VR-AUTH-007 | Change Password | newPassword | Must differ from current password | Server | Same-as-old rejected. |
| VR-AUTH-008 | Change Password | old password | Old password must be correct | Server | Wrong old password rejected. |
| VR-AUTH-009 | Forgot Password | reset request | Reset workflow should validate account and issue secure reset token | N/A (not implemented) | Endpoint is currently stubbed. |
| VR-PRO-001 | Profile | fullname | Required, non-empty | Client + Server | Empty fullname rejected. |
| VR-PRO-002 | Profile | fullname | Max length 50 | Client | >50 chars blocked by UI validation. |
| VR-PRO-003 | Profile | birthday | If provided, must be valid date | Client + Server | Invalid/future date rejected. |
| VR-PRO-004 | Profile | phone | If provided, exactly 10 digits | Client + Server | Invalid phone rejected. |
| VR-PRO-005 | Profile | introduction | Max length 300 | Client + Server | >300 chars rejected. |
| VR-PRO-006 | Profile | avatar upload | MIME type must be PNG/JPEG | Client (server-side limited) | UI blocks unsupported types; server accepts via multer storage. |
| VR-PRO-007 | Profile | avatar upload | Max file size 10 MB | Client | UI blocks oversized file. |
| VR-PRO-008 | Profile | avatar filename | Filename length <= 100 chars | Client | UI blocks long filename. |
| VR-TEAM-001 | Team Create/Edit | name | Required | UI + DB | Empty name blocked (and DB NOT NULL enforces). |
| VR-TEAM-002 | Team Create/Edit | contact_name | Required | UI + DB | Missing value rejected at form/DB level. |
| VR-TEAM-003 | Team Create/Edit | contact_phone | Required | UI + DB | Missing value rejected at form/DB level. |
| VR-TEAM-004 | Team Create/Edit | contact_email | Required | UI + DB | Missing value rejected at form/DB level. |
| VR-TEAM-005 | Team Create/Edit | level | Required selectable value | UI + DB | Value selected in predefined options. |
| VR-TEAM-006 | Team Mutation | ownership | User must own team to edit/delete | Server (controller checks) | Non-owner action is blocked via `next()/redirect`. |
| VR-TEAM-007 | Team Approval | profile link | Team must have profile to be accepted/rejected | Server | Missing profile throws error and returns `status:error`. |
| VR-TEAM-008 | Team Approval | capacity | Accepted teams must not exceed `maxTeams` | Server (`dbTeams.updateTeamStatus`) | Approval prevented when capacity reached. |
| VR-TEAM-009 | Team Statistics Route | teamId | Team must exist | Server | Missing team returns 404 path (`next()`). |
| VR-PLAYER-001 | Add Member | name, number, birthyear, positions, phone, avatar | All fields required in UI add-member flow | Client | Missing field blocks submission. |
| VR-PLAYER-002 | Add Member | team linkage | Player must be attached to target team | Server + DB FK | Insert uses teamId and persists relation. |
| VR-PLAYER-003 | Remove Member | authorization | Only team owner can remove member | Server | Non-owner blocked. |
| VR-PLAYER-004 | Avatar Upload | player existence | Player must exist before avatar upload | Server | Missing player path is rejected via `next()`. |
| VR-TMT-001 | Tournament Create/Update | name, timeStart, timeEnd, place, mapURL, format, maxTeams, nOfPlayers, rulesURL | Required input set | UI + Server | Form requires inputs; server persists posted payload. |
| VR-TMT-002 | Tournament Create/Update | formatId | Must reference valid format | DB FK | Invalid format ID rejected by FK constraint. |
| VR-TMT-003 | Tournament Date Logic | timeStart vs timeEnd | End should be after start | UI/Server (not enforced) | No explicit backend check in current code. |
| VR-TMT-004 | Tournament Active Guard | dependent routes | Active tournament must exist for `/teams`, `/tournament`, `/management` | Middleware | Redirect to `/create` when none is active. |
| VR-TMT-005 | Tournament Create Guard | admin create page | Creation page only when no active tournament exists | Middleware | Redirect to `/` when active tournament exists. |
| VR-MCH-001 | Match Event Add (Goal/Card) | matchId, playerId, teamId, time | All required | Client + Server | Missing fields rejected (`Invalid goal/card`). |
| VR-MCH-002 | Match Event Type | goal/card classification | Type must be one of allowed enum values | Server + DB CHECK | API maps to enum values; DB CHECK enforces allowed set. |
| VR-MCH-003 | Match Time Input | event time format | Expected format like `MMpSSs` | Client convention + DB string | No strict regex at server/DB; relies on UI convention. |
| VR-MCH-004 | Match Schedule Update | match rows payload | Must include `id, teamId1, teamId2, place, date, time` | Client + Server | Missing/invalid payload may fail in DB update. |
| VR-MCH-005 | Match Edit Authorization | edit endpoints | Only admin may edit goals/cards/schedule | Middleware | Non-admin redirected away. |
| VR-API-001 | Protected routes | authentication | Authenticated-only endpoints require session | Middleware | Unauthenticated requests redirected to `/login`. |
| VR-API-002 | Admin routes | authorization | Admin endpoints require admin privilege | Middleware | Non-admin redirected to `/`. |
| VR-DB-001 | Users | email | Unique constraint | DB | Duplicate user emails blocked. |
| VR-DB-002 | Match events | type | CHECK enum constraint | DB | Invalid event type rejected. |
| VR-DB-003 | Foreign keys | entity linkage | Teams, players, matches, events references must be valid | DB | FKs exist (many marked `NOT VALID` in schema dump). |
| VR-DB-004 | Trigger rule | team status -> stats row | `status` false→true inserts `teams_statistics`; true→false deletes | DB Trigger | Automatic. |
| VR-DB-005 | Trigger rule | goal event -> match score | Goal insert increments `scores_1`/`scores_2` | DB Trigger | Automatic. |
| VR-DB-006 | Trigger rule | events -> team stats | Goal/card/own-goal update team counters | DB Trigger | Automatic. |
| VR-DB-007 | Trigger rule | score change -> winner | Winner ID recalculated on score updates | DB Trigger | Automatic. |
| VR-DB-008 | Trigger rule | match finish -> wins/draws/losses | Set result stats and score points | DB Trigger | Automatic. |


## 3) Validation Gaps / Risk Notes

1. **OAuth links without backend**: login buttons for Google/Facebook exist in UI but corresponding server routes are not implemented.
2. **Forgot-password flow**: UI and route exist, but no token/email reset process is implemented.
3. **Server-side upload hardening**: MIME/size checks are mostly client-side; robust backend validation is recommended.
4. **Date logic**: no explicit backend rule currently enforces `timeStart <= timeEnd`.
5. **Event time format**: no strict server regex for `MMpSSs`; malformed strings could be inserted.
6. **FK quality**: many FKs are marked `NOT VALID` in schema snapshot; historical rows may bypass strict referential cleanup.
