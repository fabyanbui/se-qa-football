# Test Plan — Football Tournament Management System

## Objective

Verify that all implemented features of the Football Tournament Management System are correct, secure, and stable before deployment. This plan maps each system feature to the applicable test types, identifies known defects and gaps, and defines priorities and exit criteria for the test phase.

## References

| Document | Path |
|---|---|
| Test Strategy | `src/qa/test-strategy.md` |
| API Inventory | `src/docs/api-inventory.md` |
| Backend Structure | `src/docs/backend-structure.md` |
| Database Schema | `src/resources/initialize.sql` |
| Use-Case Specification | `docs/requirements/rup_ucspec.pdf` |

---

## Known Defects (Pre-existing Bugs)

The following bugs were discovered during exploration and **must be fixed before test execution** (they block the test suite):

| ID | Severity | Location | Description |
|---|---|---|---|
| BUG-01 | 🔴 Critical | `controllers/tournament.c.js:24` | `matches.reduce()` on empty array — crashes entire server process with unhandled exception when no matches exist |
| BUG-02 | 🔴 Critical | `utils/database/dbMatches.js:47–50` | SQL subquery missing alias in `getNumberOfOwnGoalsInTournament` → PostgreSQL syntax error crashes server |
| BUG-03 | 🔴 Critical | `utils/database/dbMatches.js:57–61` | SQL subquery missing alias in `getNumberOfCardsInTournament` → same crash as BUG-02 |
| BUG-04 | 🟡 Medium | `views/login.hbs`, `views/register.hbs` | "Login with Google/Facebook" buttons render but routes `/login/with-google` and `/login/with-facebook` are undefined → 404 |
| BUG-05 | 🟡 Medium | `controllers/auth.c.js:82` | `POST /forgot-password` returns raw stub text instead of a proper response or error |
| BUG-06 | 🟠 Low | `utils/auth-helper.js:27` | `checkOwnTeam` references undefined `teamDb` — dead code but would throw `ReferenceError` if invoked |

---

## Feature × Test Type Matrix

**Legend:** ✅ Applicable &nbsp;|&nbsp; — Not applicable / out of scope &nbsp;|&nbsp; ⚠️ Blocked by known bug

| Feature | Functional | Unit | Integration | API | UI | Security | Performance | DB |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Authentication** | | | | | | | | |
| User Registration (email + password) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Registration — duplicate email rejected | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| Registration — password mismatch rejected | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| User Login (JSON fetch, session cookie) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Login — wrong credentials returns 400 | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| Login — "Remember Me" extends cookie | ✅ | — | ✅ | ✅ | — | ✅ | — | — |
| User Logout | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Forgot Password page renders | ✅ | — | — | ✅ | ✅ | — | — | — |
| POST /forgot-password (stub — not implemented) | ⚠️ | — | — | ✅ | — | — | — | — |
| Redirect authenticated user away from /login, /register | — | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Social login buttons visible in UI | — | — | — | — | ✅ | — | — | — |
| **User Profile** | | | | | | | | |
| View own profile (requires login) | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Edit profile — fullname, birthday, phone, bio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Edit profile — empty fullname rejected (400) | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Edit profile — invalid date rejected (400) | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Edit profile — phone not 10 digits rejected (400) | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Edit profile — introduction > 300 chars rejected (400) | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Upload avatar (multipart file) | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Change password — success flow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Change password — new password < 6 chars rejected | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Change password — new equals old rejected | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Change password — wrong current password rejected | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Profile page requires authentication | — | — | ✅ | ✅ | ✅ | ✅ | — | — |
| **Team Management** | | | | | | | | |
| Browse all teams (paginated, 9/page) | ✅ | — | ✅ | ✅ | ✅ | — | ✅ | — |
| View team info (`/teams/:id`) | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| View team members (`/teams/:id/members`) | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| View team statistics (`/teams/:id/statistics`) | ✅ | — | ✅ | ✅ | ✅ | — | — | ✅ |
| Create team (requires login) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Edit team info (owner only) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Non-owner cannot edit team (security) | — | — | ✅ | ✅ | — | ✅ | — | — |
| Upload team logo | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Delete team (owner only) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Non-owner cannot delete team (security) | — | — | ✅ | ✅ | — | ✅ | — | — |
| Add player to team | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Remove player from team | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Upload player avatar | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Team/player pages require `checkTournament` | — | — | ✅ | ✅ | ✅ | ✅ | — | — |
| **Tournament — Public Views** | | | | | | | | |
| Tournament overview page *(blocked by BUG-01, BUG-02, BUG-03)* | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | — | ✅ | — |
| Tournament teams list | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| Teams leaderboard (sorted by points) | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Match schedule — default round 1 | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| Match schedule — query `?round=N` | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| Match detail page (`/tournament/matches/:id`) | ✅ | — | ✅ | ✅ | ✅ | — | — | ✅ |
| Team statistics page | ✅ | — | ✅ | ✅ | ✅ | — | — | ✅ |
| Player statistics page | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| **Tournament — Admin Modifications** | | | | | | | | |
| Admin modifications overview (requires admin) | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Non-admin redirected away from modifications | — | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Update tournament info (name, dates, location) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Upload tournament logo | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Upload tournament banner | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Accept team registration — success | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Accept team — no profile → error | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Accept team — already accepted → error | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| Reject team registration — success | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Reject team — already rejected → error | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| DB trigger: `teams_statistics` row created on team accept | — | — | ✅ | — | — | — | — | ✅ |
| DB trigger: `teams_statistics` row deleted on team reject | — | — | ✅ | — | — | — | — | ✅ |
| Edit match schedule (teams, date, time, place) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| **Match Event Editing (Admin)** | | | | | | | | |
| Match edit page renders (requires admin) | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Record goal — success | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Record goal — missing field → error | ✅ | ✅ | — | ✅ | — | — | — | — |
| DB trigger: goal → `matches.scores_*` incremented | — | — | ✅ | — | — | — | — | ✅ |
| DB trigger: goal → `teams_statistics.goals` incremented | — | — | ✅ | — | — | — | — | ✅ |
| DB trigger: goal → opponent `a_goals` incremented | — | — | ✅ | — | — | — | — | ✅ |
| Record own goal | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| DB trigger: own goal → `teams_statistics.own_goals` incremented | — | — | ✅ | — | — | — | — | ✅ |
| Record yellow card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Record red card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| DB trigger: yellow/red card → `teams_statistics.yellow/red_cards` incremented | — | — | ✅ | — | — | — | — | ✅ |
| DB trigger: match finished → wins/draws/losses updated | — | — | ✅ | — | — | — | — | ✅ |
| DB trigger: score change → `winner_id` updated | — | — | ✅ | — | — | — | — | ✅ |
| DB trigger: score change → leaderboard `score` (W×3 + D) updated | — | — | ✅ | — | — | — | — | ✅ |
| View player lineup for match (admin) | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Match edit tickets page renders (stub — not implemented) | ✅ | — | — | ✅ | ✅ | ✅ | — | — |
| **Management Dashboard** | | | | | | | | |
| My teams dashboard (`/management`) — requires login | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Ticket management page (`/management/tickets`) — requires admin | ✅ | — | — | ✅ | ✅ | ✅ | — | — |
| Non-admin redirected from ticket management | — | — | ✅ | ✅ | ✅ | ✅ | — | — |
| **Tournament Creation** | | | | | | | | |
| Create tournament — page renders (admin, no active tournament) | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| POST tournament info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Upload tournament logo at creation | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Upload tournament banner at creation | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| `checkNoTournament` — redirects to `/` if tournament exists | — | — | ✅ | ✅ | ✅ | ✅ | — | — |
| **Routing & General** | | | | | | | | |
| Home page (`/`) | ✅ | — | — | ✅ | ✅ | — | ✅ | — |
| About page (`/about`) | ✅ | — | — | ✅ | ✅ | — | — | — |
| 404 fallback for unknown routes | ✅ | — | — | ✅ | ✅ | — | — | — |
| `checkTournament` → redirect to `/create` if no tournament | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| node-schedule auto-marks matches played/finished | ✅ | ✅ | ✅ | — | — | — | — | ✅ |

---

## Test Prioritization

| Priority | Feature Group | Rationale |
|---|---|---|
| **P0 — Blocker** | BUG-01, BUG-02, BUG-03 (server crashes) | Must be fixed before any meaningful testing of the tournament module |
| **P1 — Critical** | Authentication, access-control guards, team ownership security | Security foundation; all other features depend on correct auth |
| **P1 — Critical** | Team CRUD + player management | Core user-facing workflow |
| **P2 — High** | Tournament public views (after bugs fixed), leaderboard, match schedule | Primary value delivered to end users |
| **P2 — High** | DB trigger correctness | Underpins all statistics; silent data corruption if triggers are wrong |
| **P2 — High** | Tournament admin modifications, match event recording | Core admin workflows |
| **P3 — Medium** | Profile management, file uploads | Secondary user experience |
| **P3 — Medium** | Management dashboard, tournament creation | Supporting admin workflows |
| **P4 — Low** | Forgot password, ticket management, social login | Not yet fully implemented |

---

## Input Validation Test Scenarios

Derived directly from controller source code:

| Feature | Field | Valid | Invalid (expect 400) |
|---|---|---|---|
| Register | `password` | any non-empty | empty |
| Register | `retype` | equals `password` | differs from `password` |
| Register | `email` | unique email | already registered email |
| Login | `email` | valid email format | empty, wrong format |
| Edit Profile | `fullname` | non-empty string | empty string |
| Edit Profile | `birthday` | valid date string or empty | non-parseable date string |
| Edit Profile | `phone` | exactly 10 digits or empty | 9 digits, 11 digits, non-numeric |
| Edit Profile | `introduction` | ≤ 300 characters | > 300 characters |
| Change Password | `newPassword` | ≥ 6 characters | < 6 characters |
| Change Password | `newPassword` | different from current | same as current password |
| Change Password | `password` | correct current password | wrong current password |
| Add Goal | `matchId`, `playerId`, `teamId`, `time` | all present | any one missing |
| Add Card | `matchId`, `playerId`, `teamId`, `time` | all present | any one missing |
| Accept Team | team `status` | `false` (not yet accepted) | `true` (already accepted) |
| Accept Team | team `profile` | non-null | null (no profile submitted) |

---

## Entry and Exit Criteria

### Entry Criteria
- BUG-01, BUG-02, BUG-03 are fixed and verified
- The application starts and serves HTTP 200 on `/`, `/tournament`, and `/teams`
- PostgreSQL is initialized with `resources/initialize.sql` and seeded with the reference fixture data (4 teams, 6 matches, seed users)
- All P1 features have been implemented and code-reviewed

### Exit Criteria
- All P1 and P2 test cases executed with zero open critical defects
- API test pass rate ≥ 95%
- All security access-control tests pass (unauthenticated and non-admin access blocked)
- All DB trigger tests pass (correct statistics after match events)
- No new P0/P1 defects introduced
