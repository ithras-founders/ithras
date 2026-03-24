# Page quality audit (Ithras)

Actionable inventory of primary surfaces. **Rubric:** Route(s) → Job-to-be-done → Primary data → Empty/weak states → Recommendation (S/M/L).

---

## Authentication & onboarding

| Route(s) | Job | Data | Empty / weak | Rec |
|----------|-----|------|--------------|-----|
| `/`, `/register`, `/register/*` | Sign in or complete registration | Auth API | Long forms; validation errors | M: progress clarity, save draft |
| `/pending-approval` | Wait for approval | User status | Static waiting state | S: link to profile completion if allowed |

---

## Prepare (professional)

| Route(s) | Job | Data | Empty / weak | Rec |
|----------|-----|------|--------------|-----|
| `/prepare` | Career prep roadmap | Static + Coming Soon | — | L: wire real prep APIs |
| `/prepare/longform` | Newsletter-style essays | Placeholder posts | Subscribe CTA disabled | L: CMS / posts backend |

**Files:** [`products/preparation/frontend/src/PreparationView.js`](../products/preparation/frontend/src/PreparationView.js)

---

## Feed (professional)

| Route(s) | Job | Data | Empty / weak | Rec |
|----------|-----|------|--------------|-----|
| `/feed` | Home timeline | `getGlobalFeed` | Quiet feed | M: onboarding prompts, suggested joins |
| `/feed/saved` | Revisit saved posts | Saved feed API | Empty saved | S: CTA to feed |
| `/feed/discover` | Find communities | `listCommunities` | “No match” with filters | S: clear filter reset |
| `/feed/c/:slug` | Community discussion | Community + feed | Non-member composer hidden | OK |
| `/feed/c/:slug/ch/:ch` | Channel thread | Channel feed | Same | OK |
| **Right rail (non-community)** | Context / discovery | Placeholders only | **Always “Quiet / No picks”** | L: wire trending/suggested APIs or hide until real |

**Files:** [`products/feed/frontend/src/FeedView.js`](../products/feed/frontend/src/FeedView.js), [`CommunityFeedRightRail.js`](../products/feed/frontend/src/components/community/CommunityFeedRightRail.js).

---

## Network (professional)

| Route(s) | Job | Data | Empty / weak | Rec |
|----------|-----|------|--------------|-----|
| `/network` | Network hub / stats | `getOverview` | **Zeros only felt empty** | **M: CTAs, pending invites (done in pass)** |
| `/network/connections` | Manage connections | Connections API | Empty list | S: link to suggestions |
| `/network/following` | Following list | Follows API | Empty | S: discover people |
| `/network/org` | Same-org peers | `getOrgNetwork` | No profile data | M: profile nudge |
| `/network/institution` | Same school | `getInstitutionNetwork` | Same | M: profile nudge |
| `/network/function` | Same function | `getFunctionNetwork` | Same | M: profile nudge |
| `/network/suggestions` | Discover people | Suggestions API | Empty | S: broaden criteria copy |

**Files:** [`NetworkView.js`](../products/network/frontend/src/NetworkView.js), [`OverviewPage.js`](../products/network/frontend/src/views/OverviewPage.js).

---

## Messaging

| Route(s) | Job | Data | Empty / weak | Rec |
|----------|-----|------|--------------|-----|
| `/messages` | DMs & requests | Conversations API | Empty inbox | S: CTA to network/search |
| (in-app) | Priority / other sections | Section filters | Low signal without data | M: section tooltips |

**Files:** [`MessagingView.js`](../products/messaging/frontend/src/MessagingView.js), [`MessagingLayout.js`](../products/messaging/frontend/src/components/MessagingLayout.js).

---

## Profile & public

| Route(s) | Job | Data | Empty / weak | Rec |
|----------|-----|------|--------------|-----|
| `/p/:slug` (own) | Edit professional profile | Profile APIs | Partial profile | M: completeness meter (where absent) |
| `/p/:slug` (other) | View member | Public profile | 404 handling | S: friendly not found |
| `/i/:slug`, `/o/:slug` | Org / institution pages | Public entity APIs | Thin content | L: richer layouts |
| `/about` | Product story | Static / light | — | S: keep aligned with brand |

---

## Admin

| Area | Job | Empty / weak | Rec |
|------|-----|--------------|-----|
| Institutions / Organisations / Users / Communities | CRUD + ops | Table empty states | S: consistent empty components |
| `/admin/technology/*` | Telemetry & ops | Charts placeholders | M: document “no data yet” vs error |
| Community detail / requests | Moderation | Low volume | S: filters + export hints |

**Files:** [`AdminLayout.js`](../admin/frontend/src/AdminLayout.js), telemetry under [`admin/frontend/src/telemetry/`](../admin/frontend/src/telemetry/).

---

## Global search

| Surface | Job | Empty / weak | Rec |
|---------|-----|--------------|-----|
| ⌘K overlay | Quick jump | API unreachable → long error | S: short message + [LOCAL_DEV.md](./LOCAL_DEV.md) |
| `/search` (full page) | Deep search + filters | — | **Shipped in this pass** |

---

## Priority backlog (cross-cutting)

1. **Feed right rail:** Replace placeholders with real data or collapse until available (L).
2. **Network sub-pages:** Profile completeness prompts when `profile_has_data` is false (M).
3. **Messaging:** Stronger empty inbox connection to “Find people” / search (S).
4. **Admin telemetry:** Differentiate loading vs empty dataset (M).

_Last updated: product pass (page audit + search)._
