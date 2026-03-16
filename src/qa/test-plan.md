# Test Plan — Football Tournament Management System (AQR-Aligned)

## 1) Objective

Provide an execution-ready QA plan that maps requirement baseline (`AQR-FR-*`, `AQR-NFR-*`, `AQR-PR-*`) to concrete test suites, entry/exit gates, and reporting outputs for release decisions.

## 2) References

| Document | Path |
|---|---|
| Advanced requirement baseline | `qa/advanced-requirements.md` |
| Test strategy | `qa/test-strategy.md` |
| Manual test assets | `qa/manual/**/*.xlsx` |
| Smoke execution history | `qa/smoke/*.md`, `qa/smoke-fix/*.md` |
| Defect tracking artifacts | `qa/bug-reports/*` |
| Database schema and seed | `resources/initialize.sql` |

## 3) Test Items and Execution Boundaries

### 3.1 In-Scope for Release Validation

- Implemented and partial requirements from `AQR-FR-*`.
- Security, integrity, and operational quality controls from `AQR-NFR-*`.
- QA governance obligations from `AQR-PR-*`.

### 3.2 Controlled Exclusions

Deferred requirements (`AQR-FR-017`, `018`, `019`, `021`, `022`, `023`, `025`) remain outside release pass/fail criteria, but must appear in risk and scope-exclusion reporting.

## 4) Suite Inventory

| Suite ID | Coverage Focus | Level/Type | Primary Evidence Source |
|---|---|---|---|
| SU-AUTH | Registration, login, logout, forgot-password baseline, admin registration | Functional/API/Security | `qa/manual/authentication/*.xlsx` |
| SU-RBAC | Auth guards, ownership checks, role boundaries | Security/Integration | `qa/manual/access-control/*.xlsx` |
| SU-PROFILE | Profile view/edit/change-password/avatar | Functional/API | `qa/manual/profile/*.xlsx` |
| SU-TEAMS-MGMT | Team create/edit/delete, players CRUD, logo/avatar upload | Functional/API/Integration | `qa/manual/teams-management/*.xlsx` |
| SU-TEAMS-PUBLIC | Team listing/details/members/statistics | Functional/UI | `qa/manual/teams-public/*.xlsx` |
| SU-TOURNAMENT-VIEW | Tournament overview, teams, leaderboard, matches, stats | Functional/UI | `qa/manual/tournament-overview/*.xlsx` |
| SU-TOURNAMENT-ADMIN | Tournament modifications and team approval/rejection | Functional/API/Integration | `qa/manual/tournament-modifications-admin/*.xlsx` |
| SU-MATCH-ADMIN | Match edit flows, goals/cards/players/tickets-tab behavior | Functional/API/DB | `qa/manual/match-management-admin/*.xlsx` |
| SU-MANAGEMENT | Management dashboard surfaces and permissions | Functional/Security | `qa/manual/management-dashboard/*.xlsx` |
| SU-INTEGRATIONS | Scheduler behavior, FK integrity, trigger-driven consistency | Integration/DB | `qa/manual/system-integrations/*.xlsx` |
| SU-RESILIENCE | Validation errors, API errors, authorization redirects, 404 handling | Negative/Resilience | `qa/manual/error-and-resilience/*.xlsx` |
| SU-NFR | Performance smoke, compatibility checks, session behavior, traceability quality | NFR/Operational | QA execution logs + summary report |
| SU-PROCESS | Requirement-change, risk, artifact and ownership governance checks | Process QA | Cycle report + defect/risk logs |
| SU-DEFERRED | Explicit deferred-scope verification and release exclusion reporting | Governance | Test summary + risk register |

## 5) Requirement Traceability Matrix

### 5.1 Functional Requirements (`AQR-FR-*`)

| Requirement ID | Baseline Status | Priority | Planned Suite(s) | Acceptance Intent |
|---|---|---|---|---|
| AQR-FR-001 | Implemented | P1 | SU-AUTH | Registration validates inputs and prevents duplicate email |
| AQR-FR-002 | Implemented | P1 | SU-AUTH | Authentication establishes valid session and remember-me behavior |
| AQR-FR-003 | Implemented | P1 | SU-AUTH | Logout terminates session and prevents access to protected pages |
| AQR-FR-004 | Partial | P1 | SU-AUTH, SU-RESILIENCE | Existing forgot-password behavior validated; missing reset lifecycle logged as gap |
| AQR-FR-005 | Implemented | P1 | SU-RBAC, SU-AUTH | Role-based and ownership restrictions enforced for all protected paths |
| AQR-FR-006 | Implemented | P2 | SU-AUTH, SU-RBAC | Controlled admin account creation is restricted to authorized role |
| AQR-FR-007 | Implemented | P1 | SU-TOURNAMENT-ADMIN | Tournament creation with metadata/logo/banner works end-to-end |
| AQR-FR-008 | Implemented with Risk | P1 | SU-TOURNAMENT-VIEW, SU-RESILIENCE | Tournament overview and related public views are stable and accurate |
| AQR-FR-009 | Implemented | P1 | SU-TOURNAMENT-ADMIN, SU-INTEGRATIONS | Team approve/reject flow works and preserves consistency |
| AQR-FR-010 | Partial | P1 | SU-TEAMS-MGMT, SU-TOURNAMENT-ADMIN | Team enrollment paths work for implemented routes; limitations documented |
| AQR-FR-011 | Implemented | P1 | SU-TOURNAMENT-ADMIN, SU-MATCH-ADMIN | Organizers can adjust schedule/match details with valid constraints |
| AQR-FR-012 | Implemented | P1 | SU-MATCH-ADMIN, SU-INTEGRATIONS | Goal/card/event updates persist and update match state correctly |
| AQR-FR-013 | Implemented | P1 | SU-TEAMS-MGMT | Team profile update and logo handling meet expected behavior |
| AQR-FR-014 | Partial | P1 | SU-TEAMS-MGMT, SU-RBAC | Player CRUD and ownership control validated; gaps explicitly tracked |
| AQR-FR-015 | Partial | P2 | SU-TEAMS-PUBLIC, SU-TOURNAMENT-VIEW | Team statistics details/limitations are transparent and test-evidenced |
| AQR-FR-016 | Implemented | P2 | SU-TEAMS-PUBLIC | Participating team profile browsing is correct and accessible |
| AQR-FR-017 | Deferred | P3 | SU-DEFERRED | Announcement workflows documented as excluded from release scope |
| AQR-FR-018 | Deferred | P3 | SU-DEFERRED | Winner announcement workflow documented as excluded from release scope |
| AQR-FR-019 | Deferred | P3 | SU-DEFERRED | Report export workflow documented as excluded from release scope |
| AQR-FR-020 | Partial | P2 | SU-PROFILE, SU-MANAGEMENT | Spectator-related profile assumptions validated within current model limits |
| AQR-FR-021 | Deferred | P1 | SU-DEFERRED | Ticket inventory/workflows explicitly marked deferred despite high business impact |
| AQR-FR-022 | Deferred | P2 | SU-DEFERRED | Invoice lifecycle remains excluded and tracked in risk register |
| AQR-FR-023 | Deferred | P2 | SU-DEFERRED | Best-player voting remains excluded and tracked in risk register |
| AQR-FR-024 | Partial | P2 | SU-TOURNAMENT-VIEW, SU-INTEGRATIONS | Tournament/team/player statistics are validated for implemented behavior |
| AQR-FR-025 | Deferred | P3 | SU-DEFERRED | Communication tooling excluded and tracked for future scope |

### 5.2 Non-Functional Requirements (`AQR-NFR-*`)

| Requirement ID | Planned Suite(s) | Acceptance Intent |
|---|---|---|
| AQR-NFR-001 | SU-AUTH, SU-RBAC | Password handling remains hashed and never exposed in plaintext |
| AQR-NFR-002 | SU-RBAC | Negative authorization matrix proves boundary enforcement |
| AQR-NFR-003 | SU-NFR | Critical page load smoke stays within agreed baseline budget |
| AQR-NFR-004 | SU-NFR, SU-INTEGRATIONS | Core data operations stay responsive for critical workflows |
| AQR-NFR-005 | SU-NFR | Availability assumptions validated through smoke/resilience checks |
| AQR-NFR-006 | SU-NFR | Modern browser smoke scenarios pass on core journeys |
| AQR-NFR-007 | SU-NFR | Responsive usability spot checks executed and documented |
| AQR-NFR-008 | SU-INTEGRATIONS | Trigger and relational integrity checks pass for core data paths |
| AQR-NFR-009 | SU-RBAC, SU-NFR | CSRF posture and mutation risks documented with mitigation status |
| AQR-NFR-010 | SU-NFR | Session durability limitation is tested and explicitly reported |
| AQR-NFR-011 | SU-PROCESS | Requirement-to-test traceability remains complete and current |
| AQR-NFR-012 | SU-PROCESS | Risk/change governance evidence is included in cycle output |

### 5.3 Process Requirements (`AQR-PR-*`)

| Requirement ID | Planned Suite(s) | Acceptance Intent |
|---|---|---|
| AQR-PR-001 | SU-PROCESS | Requirement changes are logged, approved, and reflected in test assets |
| AQR-PR-002 | SU-PROCESS | Risk log exists and is updated with mitigation decisions |
| AQR-PR-003 | SU-PROCESS | Weekly blockers/actions are captured for QA auditability |
| AQR-PR-004 | SU-PROCESS | Test plan/report are produced as mandatory deliverables |
| AQR-PR-005 | SU-PROCESS | Ownership for requirement interpretation and triage is explicit |

## 6) Execution Sequence

1. **Wave 0** — Environment readiness and smoke checks (`SU-AUTH`, `SU-TOURNAMENT-VIEW`, `SU-RESILIENCE` quick pass).
2. **Wave 1** — P1 core coverage (`SU-AUTH`, `SU-RBAC`, `SU-TEAMS-MGMT`, `SU-TOURNAMENT-ADMIN`, `SU-MATCH-ADMIN`, `SU-INTEGRATIONS`).
3. **Wave 2** — P2 and NFR coverage (`SU-TEAMS-PUBLIC`, `SU-PROFILE`, `SU-MANAGEMENT`, `SU-NFR`).
4. **Wave 3** — Deferred scope and governance closure (`SU-DEFERRED`, `SU-PROCESS`).

## 7) Defect Management and Triage

Defect record minimum fields:

- Defect ID, title, severity, impacted module
- Mapped `AQR-*` ID(s)
- Repro steps and evidence link
- Root cause category (functional, security, data integrity, NFR, process)
- Decision status (fix now, accepted risk, deferred)

Severity policy:

- Critical: release blocker (security breach, data corruption, P1 core flow break)
- High: major feature failure with no acceptable workaround
- Medium: partial behavior degradation with workaround
- Low: minor/cosmetic issue

## 8) Entry Criteria

- Scope and priority baseline confirmed from `qa/advanced-requirements.md`.
- Test environment and DB reset path are validated.
- Required test artifacts and ownership responsibilities are assigned.
- Blocking environment/setup defects are resolved.

## 9) Exit Criteria

- All P1 requirements executed with evidence and no open critical defects.
- P2 requirements executed or explicitly accepted as residual risk.
- NFR/PR obligations have evidence or approved exception rationale.
- Deferred requirements are explicitly listed as out-of-scope in final report.
- Final test summary includes requirement coverage, defect status, and go/no-go recommendation.

## 10) Deliverables

- Updated `qa/test-strategy.md`
- Updated `qa/test-plan.md`
- Cycle execution report (pass/fail by requirement and suite)
- Defect summary with severity trend and unresolved risks
- Scope exclusion appendix for deferred requirements
