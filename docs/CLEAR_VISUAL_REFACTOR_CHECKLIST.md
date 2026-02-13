# CLEAR Full-Site Visual Refactor – Checklist

Summary of files and components changed for the global palette, design tokens, icon removal, and consistency across brackets A–G.

---

## 1. Theme & design tokens (single source of truth)

| File | Changes |
|------|---------|
| `frontend/src/app/globals.css` | CSS variables: `--color-ink`, `--color-ink-muted`, `--color-bg`, `--color-surface`, `--color-border`, `--color-primary`, `--color-primary-hover`, `--color-primary-soft`, `--color-accent`, `--color-accent-soft`; card radius/shadow/selected; utility classes `card-hover`, `card-selected`, `premium-shadow`; focus states. |
| `frontend/tailwind.config.ts` | Extended theme colors: `ink`, `ink-muted`, `primary`, `primary-hover`, `primary-soft`, `accent`, `accent-soft`, `background`, `border`; shadcn-compat HSL aligned to palette. |

**Palette:** Ink/Navy `#1F2A37`, Brand Blue `#2F4B7C`, Base Off-white `#F8F9FA`, Accent Yellow `#FFCA0A`.

---

## 2. Shared components

| File | Changes |
|------|---------|
| `frontend/src/components/ui/button.tsx` | Primary: `bg-primary` / white / `hover:bg-primary-hover`; secondary: outline ink/primary; link: `text-primary`. |
| `frontend/src/components/ui/card.tsx` | `rounded-xl`, `var(--card-radius)`; used with `card-hover` / `card-selected` where needed. |
| `frontend/src/components/ui/badge.tsx` | Variants: default (primary/white), secondary (primary-soft/ink), outline (ink), accent (yellow/ink). Legacy green/yellow/red mapped to success/accent/danger. |

---

## 3. Marketing & landing (Bracket A)

### Pages

| File | Changes |
|------|---------|
| `frontend/src/app/page.tsx` | Uses Shell + landing sections; no direct color/icon edits (sections updated below). |
| `frontend/src/app/about/page.tsx` | Headings/text: `text-ink`, `text-ink-muted`; body `text-gray-*` → `text-ink` / `text-ink-muted`; founder avatar `from-blue-400 to-purple-500` → `bg-primary`. |
| `frontend/src/app/how-it-works/page.tsx` | Removed decorative icons (User, Brain, Users, Rocket, BookOpen, ArrowRight). Numbered steps with `border-2 border-primary` circles; cards `card-hover`; all `text-gray-*` → `text-ink` / `text-ink-muted`; `bg-blue-50` / `bg-purple-50` etc. → `bg-primary-soft`, `border-border`; CTAs text-only (no ArrowRight). |
| `frontend/src/app/who-we-help/page.tsx` | Removed TrendingUp, Users, Building, Heart, ArrowRight. Cards typography-only with `card-hover`; `text-gray-*` / `text-blue-*` etc. → `text-ink`, `text-ink-muted`, `text-primary` for labels; single “Get Started” button. |
| `frontend/src/app/ecosystem/page.tsx` | Removed Link2, Building2, Users, TrendingUp, ArrowRight. Cards typography-only; `text-gray-*` → `text-ink` / `text-ink-muted`; gradient card → `bg-primary-soft/30 border-border`; Capability card `border-primary card-selected`; “Explore Resources” button text-only. |
| `frontend/src/app/get-started/page.tsx` | `text-gray-900` → `text-ink`, `text-gray-600` / `text-gray-700` → `text-ink-muted` / `text-ink`. (Decorative icons e.g. ArrowRight, CheckCircle, Zap can be removed in a follow-up if desired.) |

### Landing sections (used on homepage and/or other marketing pages)

| File | Changes |
|------|---------|
| `frontend/src/components/landing/HeroSection.tsx` | Removed ArrowRight from primary CTA; right block `rounded-xl border border-border bg-surface`. |
| `frontend/src/components/landing/RoleSelectorSection.tsx` | Removed User, Building2, TrendingUp. Cards: top Badge (Founder / Investor / Raising), CardTitle, body, single Button; `card-hover`. |
| `frontend/src/components/landing/HowItWorksSection.tsx` | Removed Search, FileCheck, RefreshCw; numbered circles (1–3) with `border-2 border-primary`. |
| `frontend/src/components/landing/WhoItsForSection.tsx` | Removed Building2, Users, Landmark; cards `rounded-xl card-hover` with `border-l-4 border-l-primary`; headline-only. |
| `frontend/src/components/landing/PainValidationSection.tsx` | Removed TrendingDown, Settings, Monitor, Compass; cards title + description only, `rounded-xl card-hover`, `bg-surface`. |
| `frontend/src/components/landing/DifferentiationSection.tsx` | Removed Search, ArrowRightLeft, Zap; numbered circles (1–3), highlight pillar uses `bg-accent/20 border-accent`. |
| `frontend/src/components/landing/PlaybooksSection.tsx` | Removed BookOpen, Users, Calculator, Calendar; “Playbook” label + title + description; `card-hover`, `bg-surface`. |
| `frontend/src/components/landing/DiagnosticCTASection.tsx` | Removed ArrowRight from button; link target `/diagnostic/run`. |
| `frontend/src/components/landing/LensCardsSection.tsx` | Removed Target, Wallet, TrendingUp, Cog, Shield; lens title as label + body; `bg-surface`, `card-hover`. |

---

## 4. Diagnostic flow (Bracket B)

| File | Changes |
|------|---------|
| `frontend/src/app/diagnostic/page.tsx` | Removed Check and ArrowRight; list bullets only; “Begin diagnostic” button text-only. |
| `frontend/src/app/diagnostic/result/[run_id]/page.tsx` | Removed ArrowRight from all CTAs (“Open playbooks”, “Open advisor chat”, “Request human review”, “Open Decision Workspace”). Uses `Loader2` (functional). |

---

## 5. Post-diagnostic (Bracket C)

| File | Changes |
|------|---------|
| `frontend/src/app/resources/page.tsx` | (ArrowLeft kept as functional back navigation; token pass can be applied for any remaining gray/blue in a follow-up.) |
| `frontend/src/app/human-review/page.tsx` | (ArrowLeft, Check kept as functional; token pass for colors in a follow-up if needed.) |

---

## 6. Decision workspace (Bracket D)

No structural/layout changes in this pass. Buttons/cards/tabs inherit from shared components and globals; functional icons (e.g. Pencil, Trash2) kept with navy styling per brief.

---

## 7. CFO/CMO/COO/CTO hubs (Bracket E)

No component file renames. Shared Button/Card/Badge and globals apply. Functional icons (Send, Loader2, etc.) retained; ensure stroke/hover use `text-ink` / `text-primary` and aria-labels where applicable.

---

## 8. Auth & dashboard (Bracket F)

| File | Changes |
|------|---------|
| `frontend/src/app/login/page.tsx` | Replaced `PRIMARY_HEX` with `BRAND_COLOR` (#2F4B7C); `bg-slate-*` → `bg-background` / `bg-surface` / `bg-ink`; `text-slate-*` → `text-ink` / `text-ink-muted`; `border-slate-200` → `border-border`; focus rings → `ring-primary`. Mail/Lock/Loader2 kept (functional). |
| `frontend/src/components/layout/Sidebar.tsx` | `bg-white` / `border-gray-200` → `bg-surface` / `border-border`; active state `bg-blue-600` → `bg-primary`; `hover:bg-gray-50` → `hover:bg-muted`; `text-gray-500` → `text-ink-muted`. Nav icons kept (functional). |
| `frontend/src/components/layout/Topbar.tsx` | Already using `border-border`, `text-ink`, `text-ink-muted`, `bg-primary`; no icon removal (Menu, X, Search, Bell, User are functional). |

Dashboard and signup: can use same token pass (gray/slate/blue → ink, ink-muted, primary, background, surface) in a follow-up.

---

## 9. Institutional / enterprise (Bracket G)

No edits in this pass. Tables, filters, cards will pick up tokens from globals and shared components; optional follow-up token pass for any remaining hardcoded gray/blue.

---

## 10. Optional follow-up (not done in this pass)

- **Remaining token pass:** Replace any leftover `text-gray-*`, `bg-blue-*`, `bg-green-*`, `bg-purple-*`, `text-slate-*` in: `signup/page.tsx`, `dashboard/page.tsx`, `case-studies/page.tsx`, `why-exec-connect/page.tsx`, `book-diagnostic/page.tsx`, `book-call/page.tsx`, `cxos/page.tsx`, CxO diagnostic/chat/analysis components, `decisions/*`, `institutional/*`, `enterprise/*`.
- **Get-started / other marketing:** Remove remaining decorative icons (e.g. ArrowRight, CheckCircle, Zap) where present; rely on typography and buttons only.
- **Accessibility:** Confirm contrast (e.g. white on #2F4B7C, ink on #F8F9FA); verify focus rings and that selected/active states use border/rule in addition to color.

---

## Summary

- **Theme/tokens:** 2 files (`globals.css`, `tailwind.config.ts`).
- **Shared components:** 3 files (Button, Card, Badge).
- **Marketing/landing:** 6 pages + 9 landing section components (icons removed or replaced with type/chips/rules; tokens applied).
- **Diagnostic:** 2 pages.
- **Auth/layout:** Login, Sidebar (and Topbar already aligned).
- **Other brackets:** Rely on shared components and globals; optional token/icon pass on remaining routes.

All changes keep layout and copy structure intact and do not alter brand strategy.
