# Test Strategy — Football Tournament Management System (AQR-Aligned)

## 1) Purpose

This strategy defines how QA will verify release readiness for the Football Tournament Management system using `qa/advanced-requirements.md` as the requirement baseline.

Primary objectives:

- Ensure every release-scope requirement has explicit, testable coverage.
- Prioritize testing by business risk and requirement criticality.
- Make deferred functionality visible as managed exclusions, not silent gaps.
- Establish repeatable quality gates for go/no-go decisions.

## 2) Requirement Baseline and Scope Model

### 2.1 Baseline Source

Requirement source of truth: `qa/advanced-requirements.md`

- Functional requirements: `AQR-FR-001..AQR-FR-025`
- Non-functional requirements: `AQR-NFR-001..AQR-NFR-012`
- Process/governance requirements: `AQR-PR-001..AQR-PR-005`

### 2.2 Scope Decision Rules

- `Implemented` and `Implemented with Risk`: full functional + regression coverage required.
- `Partial`: coverage required for implemented behavior plus explicit gap validation.
- `Deferred`: excluded from release pass criteria, but tracked in risk/backlog reporting.

### 2.3 Release-Scope by Priority

| Scope Bucket | Included Requirement IDs | Strategy |
|---|---|---|
| P1 Critical | FR-001, 002, 003, 004, 005, 007, 008, 009, 010, 011, 012, 013, 014, 021 | Deep negative-path and security-first coverage; must be fully triaged before sign-off |
| P2 High | FR-006, 015, 016, 020, 022, 023, 024 | Validate current behavior, partial implementations, and visible limitations |
| P3 Controlled Backlog | FR-017, 018, 019, 025 | Track as deferred scope with explicit exclusion statements in reporting |
| NFR Core | NFR-001..012 | Security, integrity, performance smoke, compatibility, traceability, governance checks |
| QA Process | PR-001..005 | Enforce change/risk/test artifact governance during execution and reporting |

Deferred requirements with higher business urgency (`FR-021`, `FR-022`, `FR-023`) remain excluded from release pass criteria unless product scope is explicitly reactivated.

## 3) Risk-Based Test Approach

| Risk Area | Related AQR IDs | Why High Risk | Test Emphasis |
|---|---|---|---|
| Authentication and authorization boundaries | FR-001..006, NFR-001, NFR-002 | Security and access failures impact all modules | Negative access matrix, session behavior, role/ownership checks |
| Tournament and match core operations | FR-007..014 | Core product value and frequent user/admin flows | End-to-end flow validation, state transitions, data consistency |
| Statistics integrity and triggers | FR-012, FR-015, FR-024, NFR-008 | Silent data corruption risk | DB trigger-focused integration checks and reconciliation checks |
| Partial/deferred business flows | FR-004, FR-010, FR-015, FR-020..023 | Scope ambiguity and release expectation mismatch | Explicit gap tests and documented non-goals |
| Operational quality controls | NFR-003..007, NFR-010..012, PR-001..005 | Performance, reliability, and governance can fail late | Smoke budgets, resilience checks, artifact audits |

## 4) Coverage Architecture

### 4.1 Coverage Dimensions

- Requirement coverage: each test artifact links to one or more `AQR-*` IDs.
- Surface coverage: route/controller/model/database trigger/view alignment.
- Risk coverage: every high-risk area has targeted negative and resilience scenarios.
- Lifecycle coverage: smoke, feature, regression, and release-signoff evidence.

### 4.2 Traceability Standard

Each test case/suite must include:

- Test ID
- Mapped `AQR-*` requirement ID(s)
- Module/route surface
- Test level and type
- Priority (`P1/P2/P3`)
- Evidence link (manual sheet, smoke report, or automated result)
- Defect linkage (if failed)

## 5) Test Levels and Test Types

| Level/Type | Strategy |
|---|---|
| Functional | Validate end-user and admin workflows against `AQR-FR-*` statements, including positive and negative paths |
| API/Controller | Validate request contracts, HTTP status behavior, and error messaging for route actions |
| Integration (DB + business logic) | Validate controller/model/DB interaction and trigger side effects |
| Security/RBAC | Validate `checkAuthenticated`, `checkNotAuthenticated`, `checkAdmin`, `checkTournamentStaff`, ownership checks |
| UI/System | Validate critical navigation/rendering/flow continuity across key pages |
| NFR Smoke | Validate baseline responsiveness, compatibility checks, and resilience assumptions |
| Process QA | Validate requirement changes, risk log updates, traceability updates, and deliverable completeness (`AQR-PR-*`) |

## 6) Execution Model

| Wave | Focus | Exit Gate |
|---|---|---|
| Wave 0: Environment + Smoke | App boot, DB seed/reset integrity, core routes reachable | Environment is stable and smoke blockers resolved |
| Wave 1: P1 Functional + Security | Auth, RBAC, tournament/team/match core operations | No open critical defects on P1 coverage |
| Wave 2: P2 + NFR | Partial features, stats quality, NFR smoke and compatibility checks | P2 behavior validated with accepted residual risks |
| Wave 3: Deferred Governance | Deferred scope confirmation and reporting | Deferred list acknowledged and approved by stakeholders |

## 7) Environment and Test Data Strategy

### 7.1 Environment Baseline

- Stack: Node.js + Express + PostgreSQL + Handlebars.
- Sessions: in-memory session store (operational limitation documented in reports).
- Scheduler: `node-schedule` job runs periodically; tests must control timing-sensitive checks.

### 7.2 Data Management Rules

- Use resettable seeded database baseline from `resources/initialize.sql`.
- Keep deterministic role coverage (`admin`, `tournament_organizer`, `team_manager`).
- Maintain dedicated edge-case data for partial/deferred behavior verification.
- For trigger-sensitive validation, snapshot relevant rows before/after event actions.

## 8) Tooling Strategy

Current-state execution assets:

- Manual suites: `qa/manual/**/*.xlsx`
- Smoke reports: `qa/smoke/*.md` and `qa/smoke-fix/*.md`
- Defect tracking artifacts: `qa/bug-reports/*`

Automation roadmap (incremental):

- API/integration baseline for P1 routes.
- DB integrity checks for trigger-heavy flows.
- UI smoke for core user/admin journeys.

## 9) Defect and Triage Strategy

Defects are classified by release risk:

- Critical: security breaches, data corruption, blocking core P1 flow.
- High: major functional failure without practical workaround.
- Medium: partial degradation with workaround.
- Low: cosmetic/documentation/localized non-blocking issues.

Triage rules:

- Every defect must map to impacted `AQR-*` IDs.
- Deferred-scope findings are tracked separately from release blockers.
- Reopened defects require regression evidence updates.

## 10) Quality Gates (Entry/Exit Criteria)

### Entry Criteria

- Requirement baseline (`qa/advanced-requirements.md`) is stable for the cycle.
- Environment and DB seed/reset procedures are validated.
- Scope classification (Implemented/Partial/Deferred) is frozen for the cycle.

### Exit Criteria

- 100% of P1 requirements have executed test evidence and approved outcomes.
- P2 requirements are executed or explicitly accepted as residual risk.
- NFR and PR obligations have execution evidence (or approved exceptions).
- Deferred items are explicitly documented as out-of-scope for release.

## 11) Governance and Reporting

Per cycle, QA publishes:

- Updated `qa/test-strategy.md` (this document)
- Updated `qa/test-plan.md` with traceability and execution planning
- Execution report (pass/fail by requirement and priority)
- Defect summary with severity trend and unresolved-risk statement

This governance directly supports `AQR-PR-001..005` and `AQR-NFR-011..012`.
