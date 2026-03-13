# Non-Functional Requirements

## 1) Purpose

This document defines quality attributes, operational constraints, and implementation expectations for the current Football Tournament Management system baseline.


## 2) Requirement Matrix

| ID | Category | Requirement Statement | Target / Acceptance Criteria | Current Status |
|---|---|---|---|---|
| NFR-SEC-001 | Security | Passwords shall be stored using one-way hashing. | All stored passwords use bcrypt hash (no plain text storage). | **Implemented** |
| NFR-SEC-002 | Security | Authentication shall use server-side session management. | Authenticated requests rely on Passport session; unauthorized users are redirected from protected pages. | **Implemented** |
| NFR-SEC-003 | Security | Role-based access shall protect admin-only actions. | Admin-only endpoints must pass `checkAdmin` middleware. | **Implemented** |
| NFR-SEC-004 | Security | Team ownership authorization shall protect team mutation APIs. | Non-owners cannot edit/delete team/member resources. | **Implemented (controller-level)** |
| NFR-SEC-005 | Security | Cookie protection shall minimize client-side script access. | Session cookie configured with `httpOnly=true`. | **Implemented** |
| NFR-SEC-006 | Security | Cross-site request forgery protection should be enforced. | CSRF token validation for state-changing requests. | **Gap** |
| NFR-SEC-007 | Security | Uploaded files shall be constrained by type and size server-side. | Reject unsupported types and oversized payloads at backend middleware. | **Partial (mostly client-side)** |
| NFR-SEC-008 | Security | Credentials and secrets shall be externalized via environment variables. | `SESSION_SECRET`, DB credentials, and salt rounds loaded from `.env`. | **Implemented** |
| NFR-PERF-001 | Performance | Core pages should remain responsive under normal class-project load. | Typical page responses should be perceived as interactive (<3s under normal load). | **Partial / unbenchmarked** |
| NFR-PERF-002 | Performance | List pages should control payload size where relevant. | Team listing uses pagination (`/teams?page=N`). | **Implemented** |
| NFR-PERF-003 | Performance | Database round-trips should be minimized for dashboard endpoints. | Prefer joined/aggregated queries over N+1 patterns. | **Gap (N+1 patterns exist)** |
| NFR-REL-001 | Reliability | Match lifecycle state should be regularly synchronized with time. | Scheduled job updates `is_played` and `is_finished` every 5 minutes. | **Implemented** |
| NFR-REL-002 | Reliability | Data integrity for standings/statistics shall be automatic and consistent. | Trigger-based updates keep match/team statistics synchronized. | **Implemented** |
| NFR-REL-003 | Reliability | Public tournament overview endpoint shall be stable. | `GET /tournament/` should not crash server. | **Gap (runtime SQL defect observed)** |
| NFR-REL-004 | Reliability | Service should degrade gracefully on recoverable API errors. | APIs return structured error JSON and avoid process termination. | **Partial** |
| NFR-AVAIL-001 | Availability | Session continuity should persist across application restarts in production mode. | External session store (e.g., Redis/Postgres-backed store). | **Gap (memory store only)** |
| NFR-MAIN-001 | Maintainability | Project shall maintain modular separation by route/controller/model/db layers. | Codebase follows `*.r.js`, `*.c.js`, `*.m.js`, `db*.js` conventions. | **Implemented** |
| NFR-MAIN-002 | Maintainability | Authorization checks should be centralized to avoid duplication. | Ownership checks extracted to middleware/helper and reused. | **Gap (inline checks repeated)** |
| NFR-MAIN-003 | Maintainability | Error handling should be standardized and explicit. | Consistent response schema + meaningful status/message patterns. | **Partial** |
| NFR-OBS-001 | Observability | Application should provide structured logging for diagnostics. | Log levels, structured entries, request correlation ID. | **Gap** |
| NFR-OBS-002 | Observability | Operational health checks should be available. | Dedicated endpoint for readiness/liveness. | **Gap** |
| NFR-UX-001 | Usability | UI should provide clear feedback for form actions. | Toast/error messages for form validation and API result. | **Implemented** |
| NFR-UX-002 | Usability | UI should support key workflows on desktop and responsive layouts. | Navbar collapse + responsive page structures in templates. | **Implemented (basic)** |
| NFR-UX-003 | Usability | Public and management navigation should remain role-consistent. | Guest sees login/register; authenticated users see profile/management/logout. | **Implemented** |
| NFR-COMP-001 | Compatibility | System should run on Node.js + PostgreSQL environment documented in setup guide. | Verified with project setup conventions and environment variables. | **Implemented** |
| NFR-COMP-002 | Compatibility | Browser compatibility should cover modern Chromium/Firefox/Safari equivalents. | UI uses standard HTML/CSS/vanilla JS + Bootstrap patterns. | **Expected / not formally tested** |
| NFR-DATA-001 | Data Integrity | Database shall enforce entity relations between tournaments, teams, matches, players, and events. | FK constraints present for core links. | **Implemented (many FKs marked NOT VALID)** |
| NFR-DATA-002 | Data Integrity | Event type taxonomy shall be constrained. | `match_events.type` restricted to allowed values by CHECK constraint. | **Implemented** |
| NFR-DATA-003 | Data Integrity | Business metrics (wins/draws/losses/score/winner) shall be derived consistently. | Trigger logic updates standings and winner fields. | **Implemented** |


## 3) Operational Constraints

- Deployment model is single Node.js process (`npm start`) with local file storage.
- No built-in CI/CD, no container manifest in current baseline.
- Image assets are stored under `public/img/*`; no object-storage abstraction layer.
- Language/content is primarily Vietnamese; localization framework is not implemented.


## 4) Key Technical Risks (Non-Functional)

1. **Stability risk:** `GET /tournament/` currently triggers a PostgreSQL syntax error in one aggregate query.
2. **Security risk:** no CSRF protection for state-changing actions.
3. **Session durability risk:** in-memory session store loses all sessions on restart.
4. **Maintainability risk:** repeated ownership checks in controllers increase drift risk.
5. **Observability risk:** no structured logs/health endpoints for production diagnostics.


## 5) Recommended Non-Functional Backlog

- Add server-side upload file type/size enforcement in multer middleware.
- Add CSRF protection for POST/PUT/DELETE requests.
- Migrate session store to persistent backend.
- Standardize API error contract with explicit error codes.
- Add structured logging + health endpoint.
- Fix tournament overview SQL issue and add regression checks.
