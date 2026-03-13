# Company & Institution Enhancements – Implementation Plan

## Overview

This plan covers five enhancements:
1. **Company logos via Wikimedia** – Add Wikimedia/Wikidata as a logo source (similar to McKinsey)
2. **Company description (no salary)** – Add `description` field; ensure it never contains salary details
3. **Headquarters & Founding Year** – Add fields, fetch from Wikipedia/Wikidata, populate
4. **Recruiters tab** – Dedicated tab in Company detail view
5. **Staff tab** – Dedicated tab in Institution detail view

---

## 1. Company Logos via Wikimedia

### Current State
- `sync_company_logos.py` uses **apistemic** (first) and **Clearbit** (fallback)
- McKinsey gets logo via domain `mckinsey.com` → apistemic/Clearbit
- No Wikimedia integration yet

### Implementation

**Option A: Add Wikimedia as a source in sync script (recommended)**

Add `fetch_logo_url_wikimedia()` to `core/backend/scripts/sync_company_logos.py`:

1. **Wikidata API** – Search for company by name → get Wikidata entity → fetch P154 (logo image)
2. **URL format**: `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/FILENAME&width=300`
3. **Order**: Try apistemic → Clearbit → **Wikimedia** (or Wikimedia first for known companies)

**Option B: Curated Wikimedia mapping**

Add `COMPANY_WIKIMEDIA_LOGOS` dict mapping company name patterns to Commons file URLs (e.g. `"mckinsey": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../McKinsey_Logo.svg/..."`). Use this before apistemic/Clearbit for higher quality.

**Files to modify:**
- `core/backend/scripts/sync_company_logos.py` – add `fetch_logo_url_wikimedia()`, integrate into `fetch_logo_url()`
- `download_logo()` already supports external URLs; Wikimedia URLs return images directly

**Wikidata flow (Python):**
```python
# 1. Search Wikipedia for company name
# GET https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=McKinsey+Company
# 2. Get page, extract Wikidata ID from page props
# GET https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=McKinsey_%26_Company
# 3. Get P154 from Wikidata
# GET https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Qxxxx&props=claims
# 4. Build Commons URL from filename
```

---

## 2. Company Description (No Salary)

### Current State
- Company model has no `description` field
- Salary/compensation lives in `JobPosting` and `company.last_year_median_fixed`

### Implementation

1. **Add `description` to Company model** (`core/backend/app/modules/shared/models/core.py`)
   - `description = Column(Text, nullable=True)`

2. **Add to schemas** (`core/backend/app/modules/shared/schemas/core.py`)
   - `CompanySchema`, `CompanyCreateSchema`, `CompanyUpdateSchema`: add `description: Optional[str] = None`

3. **Alembic migration** – add `description` column to `companies` table

4. **Company form** (`CompanyForm.js`) – add optional description textarea; no salary/compensation fields in description

5. **Company detail view** – show description in Overview; ensure it is never mixed with salary (salary stays in separate stats/cards)

6. **Policy**: Description is for company overview (what they do, culture, etc.). Salary details belong only in jobs and hire stats.

**Files:**
- `core/backend/app/modules/shared/models/core.py`
- `core/backend/app/modules/shared/schemas/core.py`
- New migration `0XX_add_company_description.py`
- `products/roles-management/frontend/src/modules/company/CompanyForm.js`
- `products/system-admin/frontend/src/modules/user-management/CompanyDetailView.js`
- `core/backend/app/modules/shared/setup/registry.py` (if seed data needs description)

---

## 3. Headquarters & Founding Year

### Current State
- Company model: `id`, `name`, `last_year_hires`, `cumulative_hires_3y`, `last_year_median_fixed`, `logo_url`
- No `headquarters` or `founding_year`

### Implementation

**Backend**

1. **Model** (`core/backend/app/modules/shared/models/core.py`)
   - `headquarters = Column(String, nullable=True)`
   - `founding_year = Column(Integer, nullable=True)`  # or String if "1926" vs "1926–present"

2. **Schemas** – add both to CompanySchema, CompanyCreateSchema, CompanyUpdateSchema

3. **Alembic migration** – add columns

**Fetch script**

Create `core/backend/scripts/sync_company_info.py` (or extend `sync_company_logos.py`):

- Use **Wikipedia API** or **Wikidata API**:
  - **Wikidata**: P159 (headquarters location), P571 (inception/founded)
  - **Wikipedia**: Parse infobox from `action=parse` or `prop=revisions&rvprop=content`
- For each company in DB: search by name → get entity → extract headquarters, founding year → update company
- Run as CLI: `python -m app.scripts.sync_company_info` (or similar)

**Frontend**

- `CompanyForm.js` – add headquarters (text), founding_year (number) fields
- `CompanyDetailView.js` – display in Overview header or info section

**Files:**
- `core/backend/app/modules/shared/models/core.py`
- `core/backend/app/modules/shared/schemas/core.py`
- New migration
- New script `sync_company_info.py` (or combined with logo sync)
- `CompanyForm.js`, `CompanyDetailView.js`
- `registry.py` – optional seed values for McKinsey (e.g. headquarters: "New York City", founding_year: 1926)

---

## 4. Recruiters Tab (Company)

### Current State
- `CompanyDetailView.js` has tabs: Overview, Placement Cycles, JD Submissions, Shortlists, Applications, Audit Trail
- Recruiters are shown **inside Overview** (renderOverview) as a card
- `getUsers({ company_id: companyId })` already fetches recruiters

### Implementation

1. **Add "Recruiters" tab** to `SUB_TABS` (after Overview or before Audit)
   ```js
   { id: 'recruiters', label: 'Recruiters' },
   ```

2. **Create `renderRecruiters()`** – move the recruiters list from Overview into this dedicated tab
   - Same UI: list of recruiters with name, email, avatar
   - Include "Add Recruiter" button (or keep it in header – already present)

3. **Update Overview** – remove the recruiters card; keep only the Recruiters count in the stats grid
   - Overview stats already have `{ label: 'Recruiters', value: recruiters.length }` – keep that

4. **Tab routing** – add `tab === 'recruiters' ? renderRecruiters() : ...`

**Files:**
- `products/system-admin/frontend/src/modules/user-management/CompanyDetailView.js`

---

## 5. Staff Tab (Institution)

### Current State
- `InstitutionDetailView.js` has tabs: Overview, Programs & Policies, Students, Shortlists, Applications, Audit Trail
- Staff (ptUsers) = `PLACEMENT_TEAM` | `PLACEMENT_ADMIN` – shown only as a count in Overview
- No dedicated Staff tab

### Implementation

1. **Define staff roles**: `PLACEMENT_TEAM`, `PLACEMENT_ADMIN`, `INSTITUTION_ADMIN`
   - Filter: `allUsers.filter(u => [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN, UserRole.INSTITUTION_ADMIN].includes(u.role))`

2. **Add "Staff" tab** to `SUB_TABS`
   ```js
   { id: 'staff', label: 'Staff' },
   ```

3. **Create `renderStaff()`** – table/list of staff with:
   - Name, Email, Role, (optional: last active)
   - Same styling as Recruiters in CompanyDetailView

4. **Update Overview** – Staff count already exists; optionally add a small "View Staff" link that switches to Staff tab

5. **Tab routing** – add `tab === 'staff' ? renderStaff() : ...`

**Files:**
- `products/system-admin/frontend/src/modules/user-management/InstitutionDetailView.js`

---

## Execution Order

| Step | Task | Dependencies |
|------|------|--------------|
| 1 | Add `description`, `headquarters`, `founding_year` to Company model + migration | None |
| 2 | Update Company schemas | Step 1 |
| 3 | Add Wikimedia logo source to sync script | None |
| 4 | Create sync_company_info script for HQ + founding year | Step 1 |
| 5 | Update CompanyForm (description, HQ, founding year) | Step 2 |
| 6 | Update CompanyDetailView (description, HQ, founding year, Recruiters tab) | Step 2 |
| 7 | Add Staff tab to InstitutionDetailView | None |
| 8 | Update registry/seed data (optional) | Step 1 |

---

## File Summary

| File | Changes |
|------|---------|
| `core/backend/app/modules/shared/models/core.py` | Add description, headquarters, founding_year |
| `core/backend/app/modules/shared/schemas/core.py` | Add same to Company schemas |
| `core/backend/alembic/versions/0XX_company_description_hq_founding.py` | New migration |
| `core/backend/scripts/sync_company_logos.py` | Add fetch_logo_url_wikimedia |
| `core/backend/scripts/sync_company_info.py` | New script for HQ + founding year |
| `products/roles-management/frontend/.../CompanyForm.js` | Description, HQ, founding year fields |
| `products/system-admin/frontend/.../CompanyDetailView.js` | Recruiters tab, description/HQ/founding display |
| `products/system-admin/frontend/.../InstitutionDetailView.js` | Staff tab |
| `core/backend/app/modules/shared/setup/registry.py` | Optional seed for McKinsey (HQ, founding_year) |

---

## Notes

- **Wikimedia logos**: Prefer Wikidata P154 for reliability. Fallback to Wikipedia infobox logo if needed.
- **Company description**: Explicitly document that description must not include salary/compensation. Validation can be added later if needed.
- **Staff vs Students**: Staff = non-CANDIDATE users with institution_id. Students remain in Students tab.
- **API**: getUsers already supports `institution_id` and `company_id`; no backend changes for Recruiters/Staff tabs.
