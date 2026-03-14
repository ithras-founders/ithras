# Shared Primitives + Router/Service Refactor Rollout Plan

## Goal
Deliver a low-risk, high-reuse modernization across frontend and backend in four phases:
1. shared style tokens extraction,
2. primitive adoption in top-traffic screens,
3. thin-router/service-layer refactors for selected backend domains,
4. enforcement + documentation hardening.

This plan prioritizes modules with the highest cross-product reuse and the lowest auth/routing blast radius first, and requires every phase to land via reviewable PR slices.

## Prioritization Rules
- **Reuse first:** choose modules consumed by `core/frontend` and multiple `products/*/frontend` apps before niche features.
- **Risk-aware sequencing:** start with read-heavy flows and shared UI infrastructure; defer auth/session/routing pivots until stabilized patterns exist.
- **Slice discipline:** each phase ships as multiple, independently reviewable PRs with clear acceptance checks.

---

## Phase 1 — Shared Style Tokens Extraction

### Target modules
- `core/frontend/src/styles` (global variables, typography, spacing, color definitions)
- `core/frontend/src/components` base visual primitives that currently embed raw values
- `products/*/frontend/src` common shell/layout surfaces consuming repeated hard-coded values

### PR slices (reviewable)
1. **Token inventory + naming map PR:** raw value audit and canonical token naming.
2. **Token source-of-truth PR:** introduce token files and export mechanism (no behavior change).
3. **Consumer bridge PR:** update shared base components to read tokens while preserving existing visuals.
4. **Leaf cleanup PR(s):** replace duplicated hard-coded values in highest reuse screens.

### Acceptance checks
- Single source of truth for core color/spacing/typography primitives exists and is imported by shared components.
- No visual regressions on core shell/navigation/highest-traffic list/detail pages (spot-check screenshots in PRs).
- Hard-coded style literals reduced in targeted modules (documented before/after counts in PR notes).
- Token usage documented with migration examples for downstream product frontends.

### Rollback strategy
- Keep a compatibility layer mapping old constants to new tokens until phase completion.
- Revert leaf adoption PRs independently without removing token source-of-truth.
- Guard token rollout behind scoped imports to avoid global CSS breakage.

### Non-goals
- Full visual redesign or theme overhaul.
- Per-product bespoke token systems.
- Accessibility remediations beyond parity-level regressions.

---

## Phase 2 — Primitive Adoption in Top-Traffic Screens

### Target modules
- `core/frontend/src/components` primitives (Button, Input, Select, Card, Modal, Table, Badge, Tabs, Toast/Alert)
- Highest traffic screen modules in:
  - `products/general-feed/frontend`
  - `products/recruitment-lateral/frontend`
  - `products/profiles/*`
- Shared layout/navigation wrappers used across products

### PR slices (reviewable)
1. **Primitive hardening PR:** finalize API contracts, states, and accessibility basics for primitives.
2. **Screen tranche A PR:** migrate top-traffic read-heavy surfaces (feeds, listings, profile summary).
3. **Screen tranche B PR:** migrate form-heavy but low routing-risk surfaces (filters, edit sections).
4. **Cleanup PR:** remove deprecated component variants and duplicate style wrappers.

### Acceptance checks
- Targeted top-traffic screens render only approved primitives for core interactions.
- Primitive usage coverage reported for migrated screens (component usage diff in PR description).
- UI regressions addressed with before/after screenshots on changed screens.
- Deprecated local component forks removed or marked with explicit deprecation timeline.

### Rollback strategy
- Maintain adapter wrappers for old component signatures until each tranche is stable.
- Revert by screen tranche, not whole phase, to contain fallout.
- Preserve old CSS modules for one release cycle behind fallback imports.

### Non-goals
- Migrating every low-traffic admin/debug screen.
- Rewriting product-specific business logic inside views.
- Introducing new routing architecture.

---

## Phase 3 — Thin-Router / Service-Layer Refactors (Selected Backend Domains)

### Target modules
Prioritized by low auth/routing risk and high reuse:
1. `core/backend/app/routers` + `core/backend/app/services` for **read-dominant, shared** domains first (e.g., opportunities/feed/profile-read paths).
2. Product backend domains with repeated orchestration logic and low auth complexity:
   - `products/general-feed/backend`
   - `products/profiles/*` backend slices
   - `products/recruitment-lateral/backend` non-auth orchestration endpoints

### PR slices (reviewable)
1. **Pattern baseline PR:** define router/service contracts, error mapping, transaction boundary conventions.
2. **Domain slice PR(s):** one domain at a time moving orchestration out of routers into services.
3. **Cross-domain consistency PR:** unify shared validation/serialization/error helpers.
4. **Auth-adjacent follow-up PR:** only after read-domain patterns are proven and metrics are stable.

### Acceptance checks
- Target routers become thin: request parsing, auth check, and service invocation only.
- Business orchestration moves into testable service methods with unit coverage.
- Endpoint behavior parity maintained (status codes, response schema, auth gates).
- Structured logging/metrics preserved or improved at service boundaries.

### Rollback strategy
- Keep refactors domain-scoped; revert one domain PR without affecting others.
- Preserve old service-entry shim wrappers for one release when needed.
- Feature-flag risky refactors on endpoints with higher downstream coupling.

### Non-goals
- Replacing authentication/authorization systems.
- Broad database schema redesign.
- Event-driven architecture migration in this phase.

---

## Phase 4 — Enforcement + Documentation Hardening

### Target modules
- Frontend lint/config and conventions (token/primitive usage enforcement)
- Backend lint/static checks for router thinness and service boundary conventions
- `docs/` architecture guidance, migration playbooks, and onboarding references
- CI pipelines that gate new violations

### PR slices (reviewable)
1. **Frontend enforcement PR:** lint rules/codemods/checks preventing new raw tokens and primitive bypasses.
2. **Backend enforcement PR:** checks/templates to prevent fat-router regressions.
3. **Docs PR:** canonical architecture docs + migration cookbook + “how to add new module” examples.
4. **CI policy PR:** fail-on-new-violation thresholds and phased ratcheting strategy.

### Acceptance checks
- CI blocks newly introduced token/primitive/router-service violations.
- Architecture and migration docs cover both happy path and rollback procedures.
- PR templates/checklists require identification of slice scope, acceptance checks, and rollback notes.
- Teams can implement a new feature using documented primitives/services without pattern ambiguity.

### Rollback strategy
- Start in warn-only mode before fail-on-violation gates.
- Scope strict CI failures to changed files first, then ratchet to broader coverage.
- Temporarily allow documented waivers with expiration dates for blocked teams.

### Non-goals
- Immediate zero-debt mandate across all legacy modules.
- One-shot global enforcement without phased adoption.
- Replacing existing CI platform/toolchain.

---

## Cross-Phase Delivery Constraints
- Every phase must be split into reviewable PR slices (no mega-PRs).
- Each PR must include: affected modules, explicit acceptance checks, rollback notes, and non-goals.
- Sequence by **highest reuse + lowest auth/routing risk** before expanding to higher-risk domains.
- Do not begin the next phase until prior-phase acceptance checks are met and documented.
