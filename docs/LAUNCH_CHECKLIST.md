# Launch checklist: built vs missing

Use this with the [Pre-push and deployment checklist](PRE_PUSH_AND_DEPLOYMENT_CHECKLIST.md) before deploy. It tracks the eight launch areas and what is **built** vs **missing**.

---

## 1. Blocking build issue: FIXED

| Item | Status | Notes |
|------|--------|--------|
| DemoTour `Button variant="accent"` | **Done** | Replaced with `variant="default"` + accent `className`. |
| `activation.ts` TS errors | **Done** | `nextActionHref` / `nextActionLabel` typed as `string` in both `computeActivationProgress` and `mapEnterpriseActivationToProgress`; label "Assign milestones" aligned to "Assign execution milestones". |

**Verify:** `cd frontend && npx tsc --noEmit` passes.

---

## 2. Required pages: built vs missing

| Page | Route | Built? | What exists / what's missing |
|------|--------|--------|------------------------------|
| **Pricing** | `/pricing` | Yes | 3-column plan table (Enterprise, Founder, Capital Partner), Contact sales card, FAQ accordion. Copy may still be placeholder. |
| **Guided start** | `/guided-start` | Partial | Page exists; CTAs → `/book-call` and `/diagnostic`. **Missing:** intake form (or calendar). No dedicated guided-start form or confirmation flow. |
| **For partners** | `/for-partners` | Partial | Page exists; CTAs → "Partner onboarding request" (`/book-call`) and Login. **Missing:** partner-specific intake form (org, type, portfolio size, use case, email, notes) and confirmation ("We will respond within 24–48 hours"). |
| **Contact** | `/contact` | No | No `/contact` route. **Current:** "Contact" in header/footer points to `/book-call`, which has a full form but submit is client-only (setTimeout + alert); no backend. **Missing:** either add `/contact` (simple form) or formally treat `/book-call` as contact and add backend for it. |
| **Privacy** | `/privacy` | No | No page. Footer has "Privacy" → `#`. **Missing:** `/privacy` page + footer link. |
| **Terms** | `/terms` | No | No page. Footer has "Terms" → `#`. **Missing:** `/terms` page + footer link. |
| **Security** | `/security` | No | No linkable page. Governance has a "How we protect your decisions" strip. **Missing:** `/security` page (or linkable section under `/governance`) + footer/header link. |

**Header/Footer today:** Pricing, For partners, Guided start, Contact (`/book-call`) are linked. Terms and Privacy are `#`. Security not linked.

---

## 3. Partner onboarding capture: missing

| Item | Status | Notes |
|------|--------|--------|
| Partner intake form | Missing | Needed on `/for-partners`: Organization name, Type (bank, VC, grant, agency, accelerator, family office), Portfolio size range, Use case (visibility, cohort, readiness scoring), Email, Notes. |
| Storage | Missing | Backend: `partner_inquiries` table (or equivalent) + POST endpoint; or send to email provider. |
| Confirmation | Missing | After submit: confirmation screen with "We will respond within 24–48 hours" (or similar). |

---

## 4. Guided start booking or fallback: missing

| Item | Status | Notes |
|------|--------|--------|
| Intake form | Missing | Minimum: guided-start intake form with same confirmation flow as partner (or shared). |
| Calendar | Optional | If no calendar integration, do not block launch; later replace CTA with calendar embed. |

---

## 5. Snapshots operational: not verified in this pass

| Item | Status | Notes |
|------|--------|--------|
| Snapshot endpoints | Exist | Per your note, snapshot endpoints exist. |
| Automation | Unknown | **Needed:** daily (month-change) or weekly job, **or** admin-only "Run monthly snapshots now" in institutional UI for selected enterprise/cohort. Not verified in this checklist. |

---

## 6. Partner nav gating: optional for launch

| Item | Status | Notes |
|------|--------|--------|
| Portfolios visibility | Current | Visible to all logged-in users; non-partners see empty state. Acceptable for launch. |
| Stricter gating | Optional | Later: gate by role claim or "has institutional access" backend call. |

---

## 7. Launch-grade instrumentation: missing / not verified

| Item | Status | Notes |
|------|--------|--------|
| Analytics events | Missing | Desired: `start_clicked`, `diagnostic_started`, `decision_finalized`, `review_scheduled`, `partner_inquiry_submitted`. |
| Error monitoring | Missing | Frontend and backend. |
| Rate limiting | Missing | Public endpoints (auth, diagnostic). |
| Production smoke tests | Missing | Hit `/start`, `/demo`, `/diagnostic`, `/login`, `/institutional/cohorts`, `/institutional/portfolios`. |
| Optional | — | DB backups policy, admin view of inquiries, status/friendly error page. |

---

## 8. Conversion routing: partial

| Rule | Status | Notes |
|------|--------|--------|
| Marketing primary CTAs → `/start` | Partial | Some CTAs go to `/guided-start`, `/diagnostic`, `/book-call`. Need to make primary CTAs → `/start` and ensure no unintentional bypass. |
| `/start` → `/diagnostic` or `/decisions/new` | Yes | `/start` page links to guided start and diagnostic. |
| Decision workspace → activation checklist | Exists | Activation flow exists. |
| Activation complete → readiness + sharing | Exists | Per design. |
| Dead-link audit | Not done | Run audit and fix CTAs that bypass `/start` or point to `#`. |

---

## Summary: do next

1. **Build:** Fixed (DemoTour + activation.ts). Run `npx tsc --noEmit` and `npm run build` before push.
2. **Partner inquiry:** Add partner intake form on `/for-partners`, backend (`partner_inquiries` + POST or email), and confirmation screen.
3. **Guided start:** Add guided-start intake form (and confirmation); calendar optional later.
4. **Legal/trust:** Add `/privacy`, `/terms`, `/security` (or linkable section), and wire footer (and header if desired).
5. **Contact:** Either add `/contact` (simple form) or standardize on `/book-call` as contact and add backend for it; fix Terms/Privacy from `#`.
6. **Snapshots:** Decide and implement automation (scheduled job or admin "Run monthly snapshots now").
7. **Instrumentation:** Analytics, error monitoring, rate limiting, smoke tests.
8. **Conversion:** Enforce primary CTA → `/start`; run dead-link audit.

---

*Last updated from launch checklist request and activation.ts fix.*
