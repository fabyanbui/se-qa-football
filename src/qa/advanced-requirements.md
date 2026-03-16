# Advanced Requirements Documentation for QA

## 1) Document Purpose

This document defines an advanced, QA-focused requirement baseline for the Football Tournament Management system by synthesizing all PDF artifacts under `../docs` and reconciling them with the current implementation in `src/`.

It is intended to be the requirement source of truth for:

- QA scope definition
- Traceability and coverage planning
- Gap/risk identification
- Release-readiness conversations


## 2) Source Artifacts Used

| Source | Type | What was extracted for QA |
|---|---|---|
| `../docs/requirements/rup_ucspec.pdf` | Use-case specification (36 pages) | Use-case inventory (U001-U032), actor flows, pre/post-conditions, special requirements |
| `../docs/requirements/rup_vision_sp.pdf` | Vision document (12 pages) | Product feature list (18 features), stakeholder/user needs, NFR targets and constraints |
| `../docs/analysis and design/rup_sad.pdf` | Software architecture (27 pages) | Architectural components, constraints, quality ranges, deployment/implementation assumptions |
| `../docs/management/rup_sdpln_sp.dot.pdf` | Software development plan (14 pages) | Requirements management, risk management, project governance, deliverables |
| `../docs/management/WeeklyScrumMeetings.pdf` | Iteration evidence (18 pages) | Execution cadence, blockers, action-item tracking expectations, team process evidence |


## 3) Current Implementation Baseline (for Traceability)

Implementation evidence was mapped from current `src/`:

- Route surfaces: `routers/*.r.js`
- Access control and role gating: `utils/auth-helper.js`, `models/user.m.js`
- Auth behavior: `controllers/auth.c.js`
- Existing QA and requirement docs: `qa/*.md`, `docs/requirements/*.md`

Observed baseline summary:

- Core modules implemented: auth, profile, teams, tournament views/modifications, management dashboard.
- Route model includes legacy + explicit scoped tournament paths (`/tournament/:tournamentId/...`).
- Role model in code: `admin`, `tournament_organizer`, `team_manager`.
- Functional stubs/gaps still visible: forgot-password workflow, ticket workflows, team statistics detail page, match ticket edit page, social OAuth paths.


## 4) Actor and Role Mapping (Legacy -> Current)

| Legacy actor from PDFs | Current implementation equivalent | QA interpretation |
|---|---|---|
| Organizer / Admin | `admin`, `tournament_organizer` | Privileged mutation actor (tournament + match operations) |
| Club Representative / Team Manager | `team_manager` (and sometimes organizer/admin) | Own-team mutation actor |
| Spectator / Guest | Unauthenticated guest + authenticated regular user | Public read flows + account/profile flows |
| Referee / Commentator / Sponsor | Not first-class role in current auth model | Treat as external/domain stakeholders, not RBAC actors |


## 5) Advanced Functional Requirement Baseline (QA-Ready)

Status legend:

- **Implemented**
- **Partial**
- **Deferred**
- **Implemented with Risk** (present but stability/quality concerns exist)

### 5.1 Requirement Catalog

| Req ID | Requirement Statement (QA-normalized) | Legacy Source | Current Baseline | Status | QA Priority |
|---|---|---|---|---|---|
| AQR-FR-001 | The system shall allow account registration with server-side validation and duplicate-email protection. | Vision F1, UC U001 | `POST /register` | Implemented | P1 |
| AQR-FR-002 | The system shall authenticate users and establish session state, including remember-me behavior. | Vision F1, UC U002 | `POST /login`, session cookie handling | Implemented | P1 |
| AQR-FR-003 | The system shall terminate user sessions on logout. | UC U003 | `GET /logout` | Implemented | P1 |
| AQR-FR-004 | The system shall support complete password-recovery lifecycle (request, token, reset). | UC U002 alt flow | `GET /forgot-password` exists; `POST` is stub | Partial | P1 |
| AQR-FR-005 | The system shall enforce role-based access for private and admin/tournament operations. | Vision stakeholder model, SAD components | `checkAuthenticated`, `checkAdmin`, `checkTournamentStaff`, ownership checks | Implemented | P1 |
| AQR-FR-006 | The system shall support controlled admin account creation. | Vision governance intent | `POST /register/admin` | Implemented | P2 |
| AQR-FR-007 | The system shall allow tournament creation with core metadata and branding assets. | Vision F2, UC U007 | `/create`, `/create/info`, `/create/logo`, `/create/banner` | Implemented | P1 |
| AQR-FR-008 | The system shall present public tournament detail and overview information. | Vision F3, UC U004 | `/tournament/:tournamentId` and related views | Implemented with Risk | P1 |
| AQR-FR-009 | The system shall allow organizers to approve/reject participating teams. | UC U009 | `/modifications/teams/:teamId/accept|reject` | Implemented | P1 |
| AQR-FR-010 | The system shall support team enrollment/registration into tournaments. | UC U017, U026, Vision F9 | `/teams/:teamId/enroll-*` routes | Partial | P1 |
| AQR-FR-011 | The system shall allow organizers to adjust match schedule and match details. | Vision F4, UC U008 | `/modifications/matches` + match edit surfaces | Implemented | P1 |
| AQR-FR-012 | The system shall allow real-time match result handling (goals/cards/events). | Vision F5, UC U010 | `/matches/:id/edit/goals`, `/cards` | Implemented | P1 |
| AQR-FR-013 | The system shall support team profile creation/update and logo management. | Vision F12, UC U022 | Team create/edit/update-logo flows | Implemented | P1 |
| AQR-FR-014 | The system shall support player roster CRUD under team ownership controls. | Vision F10, UC U018-U021 | Add/remove player and avatar flows | Partial | P1 |
| AQR-FR-015 | The system shall provide team statistics details and statistical export capability. | Vision F13, UC U024 | `/teams/:teamId/statistics` route exists but page is not implemented | Partial | P2 |
| AQR-FR-016 | The system shall allow users to browse participating team profiles publicly. | UC U023, Vision F12 | `/teams`, `/teams/:teamId`, `/members` | Implemented | P2 |
| AQR-FR-017 | The system shall provide announcement board read/write capabilities. | Vision F8, UC U006/U011 | No dedicated complete announcement module | Deferred | P3 |
| AQR-FR-018 | The system shall support winner announcement workflow at tournament completion. | Vision F7, UC U012 | No explicit winner-announcement workflow endpoint | Deferred | P3 |
| AQR-FR-019 | The system shall provide tournament report generation/export workflow. | Vision F6, UC U005 | No explicit report-generation endpoint | Deferred | P3 |
| AQR-FR-020 | The system shall support spectator identity/profile model for ticket operations. | Vision F14, UC U025 | Generic account/profile exists; no dedicated spectator module | Partial | P2 |
| AQR-FR-021 | The system shall provide ticket inventory and ticket management workflows. | UC U013-U016, Vision F16/F17 | Ticket pages are placeholders/stubs | Deferred | P1 |
| AQR-FR-022 | The system shall provide spectator invoice lifecycle for ticket purchases. | UC U028-U030 | Not implemented | Deferred | P2 |
| AQR-FR-023 | The system shall provide best-player voting with anti-duplicate constraints. | Vision F15, UC U031 | Not implemented | Deferred | P2 |
| AQR-FR-024 | The system shall provide statistics access for tournament/team/player insights. | Vision F18, UC U032 | Tournament/team/player statistics routes present | Partial | P2 |
| AQR-FR-025 | The system shall provide communication tooling for team coordination. | Vision F11 | Not implemented in current code baseline | Deferred | P3 |


## 6) Non-Functional Requirement Baseline (QA-Operationalized)

| Req ID | NFR statement / target | Legacy source | Current baseline assessment | QA acceptance focus |
|---|---|---|---|---|
| AQR-NFR-001 | Passwords shall be protected using one-way hashing. | Vision 6.x, SAD 2.x | bcrypt in use | Verify no plaintext persistence |
| AQR-NFR-002 | Access control shall enforce role/ownership boundaries. | Vision stakeholder model, SAD components | Middleware + ownership checks exist | Negative authorization matrix |
| AQR-NFR-003 | System should maintain responsive UX (target <=2s page load baseline). | Vision 6.3 | Not benchmarked | Define measurable perf smoke budget |
| AQR-NFR-004 | Data operations should be performant (legacy target ~200ms avg I/O). | Vision 6.3 | Not benchmarked | DB/API profiling for critical paths |
| AQR-NFR-005 | Availability target should approach 99.9% uptime intent. | Vision 6.3/6.5 | No production-grade observability evidence | Basic health and resilience checks |
| AQR-NFR-006 | Browser compatibility should cover modern major browsers. | Vision 6.2 | No formal compatibility suite | Cross-browser smoke scenarios |
| AQR-NFR-007 | UI should remain usable across device classes. | Vision 6.2/6.5 | Responsive baseline exists, not formally validated | Responsive exploratory set |
| AQR-NFR-008 | Data integrity shall be preserved with relational constraints and triggers. | SAD + schema-driven behavior | Trigger-rich design, active in domain flows | Trigger-focused DB verification |
| AQR-NFR-009 | Security controls shall include anti-CSRF posture for state mutations. | Security best-practice implied | No explicit CSRF layer observed | Record as security gap requirement |
| AQR-NFR-010 | Session continuity and durability should be robust across restarts. | Vision reliability intent | Default in-memory session store | Document operational limitation |
| AQR-NFR-011 | Requirement/test artifacts shall remain traceable across lifecycle. | SDP 4.3.1 | Partial traceability exists in docs | Enforce explicit trace matrix updates |
| AQR-NFR-012 | Change/risk management shall be continuously governed during iterations. | SDP 4.3.3 + Scrum logs | Process evidence exists historically | Require per-iteration risk/log updates |


## 7) Process and Governance Requirements for QA

Derived from `rup_sdpln_sp.dot.pdf` and `WeeklyScrumMeetings.pdf`.

| Req ID | Process requirement | Why QA needs it | Evidence source |
|---|---|---|---|
| AQR-PR-001 | Requirement changes shall be captured and approved through controlled process. | Prevents test-case drift and stale acceptance criteria | SDP 4.3.1 |
| AQR-PR-002 | Risks shall be identified, tracked, and mitigated per iteration. | Enables risk-based test prioritization | SDP 4.3.3 |
| AQR-PR-003 | Weekly status, obstacles, and action items shall be documented. | Supports auditability and root-cause analysis of quality delays | Weekly Scrum logs |
| AQR-PR-004 | Test artifacts (plan/report) shall be explicit deliverables. | Ensures QA outputs are expected, not optional | SDP deliverables section |
| AQR-PR-005 | Role responsibilities shall be explicit for requirement/test ownership. | Clarifies accountability for defect triage and requirement interpretation | SDP roles/responsibilities |


## 8) Source-to-Requirement Traceability Summary

| Source PDF | Primary mapped requirement groups in this document |
|---|---|
| `rup_ucspec.pdf` | AQR-FR-001..AQR-FR-025 (especially use-case aligned functional behaviors and actor flows) |
| `rup_vision_sp.pdf` | AQR-FR-001..AQR-FR-025 feature priorities + AQR-NFR-001..AQR-NFR-010 |
| `rup_sad.pdf` | AQR-FR component alignment, AQR-NFR architectural constraints/integrity expectations |
| `rup_sdpln_sp.dot.pdf` | AQR-PR-001, AQR-PR-002, AQR-PR-004, AQR-PR-005 and AQR-NFR-011..012 |
| `WeeklyScrumMeetings.pdf` | AQR-PR-003 and process evidence expectations for ongoing QA governance |


## 9) Gap and Risk Register (Requirement-Centric)

### 9.1 High-impact functional gaps

- Password recovery is incomplete (`POST /forgot-password` is a stub).
- Ticket sales and invoice lifecycle are not implemented while legacy requirements specify them.
- Best-player voting and announcement/reporting workflows are not implemented.
- Team statistics detail route exists but is not implemented.

### 9.2 Quality and operational risks

- Some legacy NFR targets (performance/availability) are not benchmarked in current baseline.
- Security hardening requirements remain incomplete (e.g., CSRF).
- Session durability is limited by in-memory session storage.
- Requirement scope in legacy PDFs is broader than current implementation, creating expected traceability gaps that must be explicitly managed in QA reporting.


## 10) QA Prioritization Guidance from This Requirement Baseline

- **P1 first**: authentication/access control, tournament and team core workflows, match result handling, and critical deferred modules that impact release claims.
- **P2 next**: statistics quality, spectator-facing profile/consumption paths, non-functional smoke coverage.
- **P3**: deferred legacy features (tickets, voting, announcements, reporting) should remain tracked as backlog or non-goal scope unless explicitly re-activated.


## 11) Requirement Sign-off Criteria for QA Phase

This requirement baseline is considered QA-ready when:

- Every active release-scope feature maps to at least one `AQR-FR-*` requirement.
- Every deferred legacy requirement is explicitly marked and excluded from release scope by decision.
- Every critical requirement has measurable acceptance intent and test coverage mapping.
- Process requirements (`AQR-PR-*`) are applied in iteration reporting and defect triage.


## 12) Revision Note

Generated from all PDF artifacts under `../docs` and reconciled against current implementation baseline in `src/` on 2026-03-16.
