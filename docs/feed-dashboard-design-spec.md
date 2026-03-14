# Feed Dashboard Design Specification

## Scope

Replicate the dashboard design for the High-Performance Pro Tool aesthetic. **Excluded:** Mode selector (ModeSwitcher) and brand logo. All other elements are aligned to this specification.

---

## 1. Top Header / Global Navigation

| Element        | Spec                                                                                                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Search bar** | Light gray bg, rounded corners (8px), magnifying glass icon left, placeholder "Search users... (⌘K)", subtle glass effect (`backdrop-blur-md`), `bg-white/70`                                                   |
| **Nav items**  | Feed (RSS), My Network (Users), My Calendar (CalendarDays), Preparation (BookOpen), Messages (Mail), Notifications (Bell), User avatar. Icons dark gray (Slate-700), labels below (10px, font-medium), white bg |
| **Layout**     | Search left, nav icons centered/right, flex with gap                                                                                                                                                            |

---

## 2. Left Sidebar

| Element             | Spec                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Background**      | Slate-950 `#020617`                                                                                                            |
| **Section labels**  | "MY COMMUNITIES", "EXPLORE" — `text-xs font-bold uppercase tracking-wider text-slate-300`                                      |
| **Global (active)** | `bg-indigo-500 text-white`, `border-r-2 border-r-white`, Globe icon, `font-semibold`                                           |
| **All Channels**    | `text-slate-400` or `text-indigo-400`, LayoutList or Layers icon, secondary styling                                            |
| **Inactive items**  | `text-slate-300`, `hover:bg-white/8 hover:text-white`                                                                          |
| **Community cards** | Avatar: circular, initial in orange/colored circle. Text: `text-slate-300`. "Join" link: `text-slate-400` or `text-indigo-400` |
| **Channel rows**    | Icon container `bg-white/10` (inactive), `bg-white/20` (active). `py-2.5`, `rounded-lg`                                        |
| **Border radius**   | 8px (`rounded-lg`) for all sidebar elements                                                                                    |

---

## 3. Main Canvas

| Element                     | Spec                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Background**              | `#F9FAFB`                                                                                                                      |
| **Share input**             | White card, rounded, user avatar (S) left, placeholder "Share a thought, update, or milestone..."                              |
| **Mission Control heading** | `text-2xl font-semibold text-[#0F172A]`                                                                                        |
| **Subtext**                 | `text-[var(--slate-500)]`                                                                                                      |
| **Progress bar**            | Outer `bg-[#E2E8F0]`, inner indigo fill, height 8px, rounded. Label "Onboarding Completion", "33%" right                       |
| **Cards**                   | No borders, `shadow-[0 1px 3px rgba(0,0,0,0.08)]`, `rounded-lg`. Icon: circular bg (blue-50/purple-50), icon blue-600          |
| **Status badges**           | REQUIRED: `bg-red-50 text-red-700` or orange; RECOMMENDED: `bg-emerald-50 text-emerald-700`. `text-[10px] font-bold uppercase` |
| **Action link**             | Blue, "Go to Profile →" with arrow                                                                                             |
| **Quick Stats**             | Horizontal bar, white cards, bold numbers, labels, sparkline right of each                                                   |

---

## 4. Right Rail

| Element               | Spec                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Section headers**   | "READINESS DASHBOARD", "TOP MENTORS ONLINE", "UPCOMING ENGAGEMENTS" — `text-xs font-bold uppercase tracking-wider text-[#475569]` |
| **CV Score card**     | White card, `border border-[var(--slate-200)]`, score `text-xl font-bold text-[var(--indigo-600)]`, vibrant Indigo ring           |
| **Daily Prep Streak** | Flame or Clock icon, "0 days" in bold                                                                                             |
| **CAT Prep**          | Full-width button: `bg-indigo-600 text-white`, "Take mock" or "X mocks taken"                                                     |
| **Calendar**          | Mini calendar, current day highlighted (dark circle, white text)                                                                   |
| **Empty states**      | "No mentors online yet", "No upcoming engagements" — `text-[var(--slate-500)]`                                                    |

---

## 5. Icons Reference

| Context       | Lucide icon          | iconMap key                              |
| ------------- | -------------------- | ---------------------------------------- |
| Global        | Globe                | `globe`                                  |
| All Channels  | LayoutList or Layers | `layoutList` or `institutions`            |
| Feed (top)    | Rss                  | `rss`                                    |
| My Network    | Users                | `candidates`                             |
| Calendar      | CalendarDays         | `calendar`                               |
| Preparation   | BookOpen             | `bookOpen`                               |
| Messages      | Mail                 | `mail`                                   |
| Notifications | Bell                 | `notifications`                          |
| Search        | Search               | `search`                                 |
| Daily Streak  | Flame or Clock       | `flame` or `clock`                       |
