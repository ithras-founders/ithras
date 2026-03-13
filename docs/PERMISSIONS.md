# Ithras Permissions Reference

Admin-facing reference for page-level and feature-level access control.

---

## 1. Role Definitions

| Role | Description | Source |
|------|-------------|--------|
| SYSTEM_ADMIN | Full system access | `003_rbac_tables.py` |
| INSTITUTION_ADMIN | Institution-scoped administration | `003_rbac_tables.py` |
| PLACEMENT_TEAM | Placement operations | `003_rbac_tables.py` |
| PLACEMENT_ADMIN | Placement team with user management rights | `003_rbac_tables.py` |
| CANDIDATE | Student enrolled in a program | `003_rbac_tables.py` |
| PROFESSIONAL | Lateral job seeker without institution | `022_professional_role.py` |
| RECRUITER | Company recruiter | `003_rbac_tables.py` |
| FACULTY_OBSERVER | Read-only governance access | `003_rbac_tables.py` |
| ALUMNI | Read-only placement cycle access (DB); UI treats as restricted | `003_rbac_tables.py` |
| GENERAL | Default/general user (no special permissions) | `types.js`, `seed_data` |
| INVESTOR | Investor role | `types.js` |

---

## 2. Public Users

**Definition**: `(CANDIDATE or PROFESSIONAL) AND no institution_id`

**Allowed pages**: Feed, My Profile, Preparation only.

**Cannot access**: Recruitment Cycles, Governance Flow, Master Schedule, Placement Templates, Request Applications, CV Template Builder, CV Verification, Approval Queue, Students, Analytics, User Management, Institution Management, etc.

Users with roles ALUMNI, GENERAL, or INVESTOR (and any other non-privileged role) also receive the restricted public nav: Feed, My Profile, Preparation.

---

## 3. Page-Level Permissions Matrix

| Page / View | CANDIDATE (inst) | CANDIDATE (public) | RECRUITER | PLACEMENT_TEAM | PLACEMENT_ADMIN | FACULTY_OBSERVER | INSTITUTION_ADMIN | SYSTEM_ADMIN | ALUMNI | GENERAL | INVESTOR |
|-------------|------------------|--------------------|-----------|----------------|-----------------|------------------|------------------|--------------|--------|---------|----------|
| Feed | Yes | Yes | Yes | No | No | No | No | No | Yes | Yes | Yes |
| My Profile | Yes | Yes | No | No | No | No | No | No | Yes | Yes | Yes |
| Preparation | Yes | Yes | No | No | No | No | No | No | Yes | Yes | Yes |
| Home/Dashboard | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | No | No | No |
| Recruitment Cycles | No | No | Yes (view) | Yes | Yes | Yes | Yes | Yes | No | No | No |
| Governance Flow | No | No | No | Yes | Yes | Yes | No | Yes | No | No | No |
| Master Schedule | No | No | No | Yes | Yes | Yes | No | Yes | No | No | No |
| Placement Templates | No | No | No | Yes | Yes | Yes | No | Yes | No | No | No |
| Request Applications | No | No | No | Yes | Yes | Yes | No | Yes | No | No | No |
| CV Template Builder | No | No | No | Yes | Yes | Yes | No | No | No | No | No |
| CV Verification | No | No | No | Yes | Yes | Yes | No | No | No | No | No |
| User Management | No | No | No | No | Yes | No | Yes | Yes | No | No | No |
| Institution Management | No | No | No | No | No | No | Yes | Yes | No | No | No |
| Analytics / Telemetry | No | No | No | No | No | No | No | Yes | No | No | No |

---

## 4. Feature-Level Permissions (Permission Code → Roles)

| Permission | Description | Roles |
|------------|-------------|-------|
| placement.cycles.view | View Placement Cycles | CANDIDATE, PROFESSIONAL, RECRUITER, PLACEMENT_TEAM, PLACEMENT_ADMIN, FACULTY_OBSERVER, INSTITUTION_ADMIN, ALUMNI |
| placement.cycles.manage | Manage Placement Cycles | PLACEMENT_TEAM, PLACEMENT_ADMIN |
| placement.cycles.configure | Configure Placement Cycles | PLACEMENT_TEAM, PLACEMENT_ADMIN |
| cv.templates.view | View CV Templates | CANDIDATE, PROFESSIONAL, PLACEMENT_TEAM, PLACEMENT_ADMIN |
| cv.templates.create | Create CV Templates | PLACEMENT_ADMIN |
| cv.templates.assign | Assign CV Templates | PLACEMENT_TEAM, PLACEMENT_ADMIN |
| cv.templates.publish | Publish CV Templates | PLACEMENT_TEAM, PLACEMENT_ADMIN |
| applications.view_own | View Own Applications | CANDIDATE, PROFESSIONAL |
| applications.view_all | View All Applications | PLACEMENT_TEAM, PLACEMENT_ADMIN, RECRUITER, FACULTY_OBSERVER |
| applications.create | Create Applications | CANDIDATE, PROFESSIONAL |
| applications.approve | Approve Applications | PLACEMENT_TEAM, PLACEMENT_ADMIN |
| users.view | View Users | PLACEMENT_TEAM, PLACEMENT_ADMIN, INSTITUTION_ADMIN |
| users.create | Create Users | PLACEMENT_ADMIN, INSTITUTION_ADMIN |
| users.manage_roles | Manage User Roles | PLACEMENT_ADMIN, INSTITUTION_ADMIN, SYSTEM_ADMIN |
| institution.view | View Institution | INSTITUTION_ADMIN |
| institution.manage | Manage Institution | INSTITUTION_ADMIN |
| institution.manage_programs | Manage Programs | INSTITUTION_ADMIN |
| company.view | View Company | RECRUITER, SYSTEM_ADMIN |
| company.manage | Manage Company | RECRUITER, SYSTEM_ADMIN |
| company.manage_jobs | Manage Jobs | RECRUITER, SYSTEM_ADMIN |
| system.admin | System Administration | SYSTEM_ADMIN |
| system.view_telemetry | View Telemetry | SYSTEM_ADMIN |
| system.view_analytics | View Analytics | SYSTEM_ADMIN |
| governance.workflows.view | View Governance Workflows | PLACEMENT_TEAM, PLACEMENT_ADMIN, FACULTY_OBSERVER, INSTITUTION_ADMIN |
| governance.workflows.manage | Manage Governance Workflows | PLACEMENT_TEAM, PLACEMENT_ADMIN, FACULTY_OBSERVER |
| governance.policies.approve | Approve Policies | PLACEMENT_TEAM, PLACEMENT_ADMIN |

---

## 5. Route Protection Summary

### Frontend
- **Nav visibility**: `Layout.js` filters nav items by role flags (`deriveRoleFlags`, `fallbackFlags`). Only governance/placement users see admin pages (Recruitment Cycles, Governance Flow, Master Schedule, etc.). Restricted users (ALUMNI, GENERAL, INVESTOR, etc.) see only Feed, My Profile, Preparation.
- **Role flags**: `deriveRoleFlags()` in `permissions.js` computes `isRestrictedUser` for users who lack governance/placement/candidate/recruiter/admin access; these users get public nav and route access to Feed, Profile, Preparation.
- **Product resolution**: `routeConfig.js` maps views to product modules; `resolveProduct()` uses role flags to determine which product to load. Restricted users resolve `feed`, `profile/*`, `preparation`, and `cv`/`cv-maker` to the appropriate products.
- **Direct URL access**: If a user navigates directly to an admin URL without matching permissions, `resolveProduct` returns null and the user sees "Select a product from the sidebar."

### Backend
- **Auth dependencies**: `core/backend/app/modules/shared/auth.py` provides `require_role()` and `require_permission()`.
- **Endpoint protection**: Placement, recruitment, and profile endpoints use these dependencies to enforce access.

---

## 6. Key Files

| Purpose | Path |
|---------|------|
| Nav filtering | `core/frontend/src/modules/shared/components/Layout.js` |
| Role flags from profile | `core/frontend/src/modules/shared/permissions.js` |
| Route resolution | `core/frontend/src/routeConfig.js` |
| Auth dependencies | `core/backend/app/modules/shared/auth.py` |
| RBAC migration | `core/backend/alembic/versions/003_rbac_tables.py` |
| Professional role | `core/backend/alembic/versions/022_professional_role.py` |
