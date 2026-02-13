# CLEAR UI – Design System

**Modern light SaaS dashboard palette.** Layout and typography stay consistent; colors use the token set below.

---

## Color palette (tokens)

| Token | HEX | Use |
|-------|-----|-----|
| **Page background** | `#F9FAFB` | `--color-bg`, page background |
| **Surface** | `#FFFFFF` | `--color-surface`, cards, nav |
| **Border** | `#E5E7EB` | `--color-border`, dividers, borders |
| **Ink** | `#111827` | `--color-ink`, primary text, headlines |
| **Ink muted** | `#6B7280` | `--color-ink-muted`, secondary text |
| **Primary** | `#1D4ED8` | `--color-primary`, primary actions (buttons, links) |
| **Primary soft** | `#DBEAFE` | `--color-primary-soft`, light blue tints |
| **Accent** | `#FACC54` | `--color-accent`, hero, highlights (e.g. mustard) |
| **Success** | `#10B981` | `--color-success` |
| **Danger** | `#EF4444` | `--color-danger` |

### Contrast and accessibility

- **Primary buttons:** white text on `#1D4ED8` (primary).
- **Secondary / outline buttons:** outline with `#1D4ED8` (primary) border and text on hover; default subtle (border + ink-muted).

---

## Typography

- **Font:** Inter (or `system-ui` fallback).
- **Scale:** H1 40–44px, H2 28–32px, H3 20–22px, Body 16–17px, Small 14px; weight 600 for headings, 400 for body.
- **Rules:** No italics for emphasis, sentence case, max line length ~65ch.

---

## Implementation

### CSS variables (`src/app/globals.css`)

- `--color-bg`, `--color-surface`, `--color-border`, `--color-ink`, `--color-ink-muted`, `--color-primary`, `--color-primary-soft`, `--color-accent`, `--color-success`, `--color-danger`.

### Tailwind

- **Backgrounds:** `bg-background` (page), `bg-surface` (cards/nav), `bg-primary`, `bg-primary-soft`, `bg-accent`.
- **Text:** `text-ink`, `text-ink-muted`, `text-primary`.
- **Borders:** `border-border` or `border-divider`.
- **Buttons:** default = `bg-primary text-primary-foreground`; outline = `border-border text-ink` with `hover:border-primary hover:text-primary hover:bg-primary-soft`.

### Hero

- Headline: `text-ink`.
- Secondary copy: `text-ink-muted`.
- Illustration: keep mustard accent (`--color-accent` / `#FACC54`) for hero/highlights.

### Files

- **CSS variables & base:** `src/app/globals.css`
- **Tailwind theme:** `tailwind.config.ts`
- **Font:** Inter via `next/font/google` in `src/app/layout.tsx` (`--font-inter` on `<html>`)
