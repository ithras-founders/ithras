# Ithras UI design system & art direction

Engineering companion to the Behance-caliber rehaul. **Figma**: replicate the five key frames below in your design file (same structure, spacing, and tokens).

## Brand pillars

- **Clarity first** — Career and admin tasks are dense; hierarchy beats decoration.
- **Warm precision** — Refined surfaces, soft elevation, one confident accent (electric indigo family, token-driven).
- **Motion with purpose** — Short, eased transitions; respect `prefers-reduced-motion`.

## Typography

| Role | Stack | Usage |
|------|--------|--------|
| **UI** | `Inter` (400–700) | Body, labels, tables, navigation |
| **Display** | `Instrument Serif`, `Georgia`, serif | Optional hero titles, marketing, empty-state headlines (loaded in `index.html` when used) |

Scale: use CSS tokens `--text-xs` … `--text-3xl` and `--line-*`, `--tracking-*`. Display lines may use `--tracking-tight`.

## Color & themes

- **Light** (`:root`): warm off-white app background, true white surfaces, indigo accent (`--accent`), semantic status colors unchanged in meaning.
- **Dark** (`[data-theme="dark"]`): deep charcoal surfaces, softened borders, desaturated accent for contrast on dark.

Toggle: `document.documentElement.dataset.theme = 'dark' | 'light'`. Persisted in `localStorage` under key **`ithras_theme`** (applied automatically when using **AppShell** via the sun/moon control in the top bar).

## Shape language

- **Cards / modals**: `--app-radius-card` (24px) — soft, editorial.
- **Inputs / chips**: `--radius-md` (12px) — slightly tighter than cards for “tool” feel.
- **Pills**: `--radius-pill` for badges and filters.

## Motion

- Fast interactions: `--transition-fast` (160ms).
- Panels / sidebar: `--transition-base` (220ms).
- **Reduced motion**: global rules zero out transforms and long transitions (see `base.css`).

## Imagery (empty states & onboarding)

- **Style**: Abstract geometric gradients + single accent line art, or duotone photography with `--app-accent` tint — avoid stock clichés; keep 16:9 or 4:3 crops.
- **Slots**: Components accept `illustration` or `heroImage` URL optional props; fallback to CSS gradient mesh using `--app-accent-soft`.

---

## Five key screens (Figma frames)

### 1. App shell + feed

- **Layout**: Top bar full width (glass/blur optional). Left sidebar 260px expanded / 72px collapsed. Main: max-width ~1200px centered with `--space-8` horizontal padding.
- **Top bar**: Logo, search trigger (⌘K hint), primary nav as icon+label pills, profile avatar.
- **Feed**: Stack of elevated cards (`--shadow-elevated`), author row, generous vertical rhythm.

### 2. Command palette / discovery search

- **Overlay**: Backdrop `rgba` + blur token; modal `--radius-lg`, `--shadow-floating`.
- **Sections**: “People”, “Communities”, “Posts” with uppercase micro-labels (`--text-xs`, `--app-text-muted`).
- **Empty**: Illustrated placeholder + single CTA line.

### 3. Profile hero

- **Cover**: 180px height, gradient or image; avatar overlaps cover bottom-left.
- **Stats**: Inline pills (Badge primitive); primary CTA button.

### 4. Auth / onboarding (step)

- **Split layout**: Left 40% brand panel (gradient + tagline); right 60% form on `--app-surface`.
- **Progress**: Stepped indicator using Tabs or custom stepper tokens.

### 5. Admin — data table

- **Page header**: Title `--text-2xl`, subtitle `--text-sm` muted, toolbar row (filters + primary button).
- **Table**: Sticky header, `--app-surface` rows alternating subtle hover, rounded container with `--app-border-soft`.

---

## Accessibility

- Focus: always visible via `--focus-ring-width`, `--focus-ring-color`, `--focus-ring-offset`.
- Contrast: accent on white and on dark must meet WCAG AA for large text minimum; body text 4.5:1.
- Do not rely on color alone for status — pair with icon or label.

## Layout and information architecture

Cross-product rules (feed, network, messages, communities):

| Principle | Anti-pattern | Direction |
|-----------|--------------|-----------|
| **Single focal column** | One card floating in unlimited horizontal space | Use `max-w-*` on the primary column or dense list rows; add meaningful subtitles (counts, context). |
| **One padding owner** | `p-8` on a page inside `AppShell` / `.app-main-inner` | Prefer shell tokens; avoid double horizontal padding. |
| **Rails ≠ cards** | Nested tinted boxes in sidebars | Side rails: section titles, quiet dividers, compact list rows—no “card inside card.” |
| **Mobile column discipline** | Three fixed columns on narrow viewports | Stack panes (e.g. inbox list ↔ thread) with an explicit **Back** control; hide non-primary columns below `md`. |
| **Progressive disclosure** | Many equal-weight controls in one row | **Primary + overflow** (e.g. main reaction + menu for other reactions; “More channels” for long channel lists). |

### Feed rail (trending / suggested)

- Use **`shared/components/feed/FeedRailKit.js`**: stacked **panels** (`FeedRailPanel`) with **icon + title + kicker**, then **`FeedRailEmpty`** (dashed soft well, gradient whisper, calm copy—not bold “No X” headlines).
- When lists are populated, use **compact rows** (avatar + title + meta), not large cards.

### Network lists (connections, suggestions)

- Prefer **shared `Tabs`** for Connections / Invitations; avoid duplicating the same label as both tab and page title.
- Use a **list-row** variant (divided rows) or constrained width (`max-w-2xl` / `3xl`) for scanability.

### Post social row

- **Primary reaction** visible; secondary reactions in a **popover** from a single control.
- Optional **reaction summary** (emoji + counts) when totals &gt; 0.

### Messaging

- **Inbox sections**: Priority = connections; Following = people you follow; Other = everyone else; Requests = inbound asks; Archived = hidden from default lists. Copy should state this in one line where possible.
- **Search**: Client-side filter on loaded conversations until server search exists.
- **Thread utilities** (mute, archive, mark unread): expose in header overflow menu; wire APIs when available.

### Communities and channels

- **URLs** `/feed/c/:slug` and `/feed/c/:slug/ch/:channelSlug` are the source of truth.
- **Breadcrumb** (e.g. Feed → Community → Channel) reduces disorientation when deep-linking.
- **Desktop (`lg+`)**: **Channels + Trending + Suggested** live in the **right rail** (`CommunityFeedRightRail`): vertical scrollable channel list (handles 20+), filter field when many channels, quiet empty states below.
- **Mobile**: horizontal scroll **pills** for channels under the breadcrumb (`lg:hidden`); no unbounded top tab rows.

### Cross-surface clarity

| Surface | Job-to-be-done |
|---------|----------------|
| **Home feed** | Updates from communities you’ve joined; compose and scan. |
| **Discover** | Browse and join communities (search/filter), not the personalized feed. |
| **Notifications (bell)** | Lightweight **alerts** (e.g. network activity); **not** the DM inbox. |
| **Messages** | Direct conversations and requests. |
| **Public profile** | Read-only portfolio; editing lives in the signed-in profile experience. |

---

## File map

| Concern | Location |
|---------|----------|
| Tokens | `shared/styles/tokens.css` |
| Global base | `shared/styles/base.css` |
| Primitives | `shared/components/ui/*` |
| Shell | `shared/components/appShell/*` |
| Search | Top bar field + ⌘K/`/` → `shared/components/search/SearchPage.js` (`/search`) |
| Prepare | `products/preparation/frontend/` — `/prepare` (career prep hub), `/prepare/longform` (Substack-style LongForm) |
