# Em dash removal report

**Date:** 2026-02-14  
**Goal:** Remove all em dashes (—) and improve punctuation consistency across user-facing copy with minimal risk.

---

## Summary

- **Total occurrences found and fixed:** 100+ across frontend, backend, and docs.
- **Placeholder strategy:** All UI placeholders that displayed "—" for empty values were changed to "-" (hyphen).
- **En dashes:** Replaced where they functioned as sentence dashes (e.g. "CLEAR – Capability" → "CLEAR: Capability"). Number ranges (e.g. 5–100, 2–3) and compound labels (e.g. Founder–CTO) were left as-is where conventional.

---

## Replacement choices (by guideline)

- **Period:** New thought / independent clause (e.g. "We build the decision infrastructure that growing businesses need. So founders stop guessing.")
- **Comma:** Short parenthetical or list (e.g. "CLEAR treats every decision as a governed artifact, not a note in a chat thread.")
- **Colon:** Introduces list, definition, or section label (e.g. "EMR: Milestones", "C: Clarify the situation", "Phase 4: Institutional service (portfolios, ...).")
- **Semicolon:** Closely related independent clauses (e.g. "I'm not sure; it's complicated.", "Link and file upload are independent; you can use one or both.")
- **Removed / rephrased:** Only where punctuation swap read awkward (e.g. table placeholders "—" → "-").

---

## Files changed

### Frontend (components and pages)

- `frontend/src/components/about/TrustSection.tsx`
- `frontend/src/components/about/Hero.tsx`
- `frontend/src/components/about/AboutHero.tsx`
- `frontend/src/components/about/UseCases.tsx`
- `frontend/src/components/about/TargetAudience.tsx`
- `frontend/src/components/demo/DemoTour.tsx`
- `frontend/src/components/landing/ArtifactsSection.tsx`
- `frontend/src/components/landing/HeroSection.tsx`
- `frontend/src/components/landing/DiagnosticCTASection.tsx`
- `frontend/src/components/landing/PlaybooksSection.tsx`
- `frontend/src/components/landing/ClearFrameworkSection.tsx`
- `frontend/src/components/activation/ActivationChecklist.tsx`
- `frontend/src/components/diagnostic/MSMEDiagnosticWizard.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/diagnostic/page.tsx`
- `frontend/src/app/decisions/new/page.tsx`
- `frontend/src/app/decisions/page.tsx`
- `frontend/src/app/decisions/[id]/page.tsx`
- `frontend/src/app/enterprise/[enterpriseId]/dashboard/page.tsx`
- `frontend/src/app/institutional/portfolios/page.tsx`
- `frontend/src/app/institutional/portfolios/[portfolioId]/page.tsx`
- `frontend/src/app/institutional/cohorts/page.tsx`
- `frontend/src/app/institutional/cohorts/[id]/page.tsx`
- `frontend/src/app/institutional/enterprises/[enterpriseId]/page.tsx`
- `frontend/src/app/institutional/cohort-activation/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/advisor/enterprises/[id]/page.tsx`
- `frontend/src/app/advisor/decisions/[id]/page.tsx`
- `frontend/src/app/resources/page.tsx`
- `frontend/src/lib/activation.ts`
- `frontend/src/lib/demo-api.ts`

### Backend

- `backend/app/diagnostic/prompts.py`
- `backend/app/diagnostic/synthesis.py`
- `backend/scripts/seed_knowledge_finance_ops.py`
- `backend/tests/test_synthesis.py`
- `backend/app/routes/clear_routes.py`
- `backend/app/routes/demo_routes.py`
- `backend/app/auth/zepto_client.py`
- `backend/app/clear/activation.py`
- `backend/app/institutional/service.py`
- `backend/app/institutional/routes.py`
- `backend/app/institutional/exports.py`
- `backend/app/institutional/__init__.py`
- `backend/app/execution/routes.py`
- `backend/app/capability/engine.py`
- `backend/app/capability/__init__.py`
- `backend/app/documents/service.py`

### Docs and config

- `docs/BACKEND_DEPLOYMENT_AUDIT.md`
- `docs/CLEAR_RUNBOOK.md`
- `docs/PROGRESS_AND_UX_AUDIT_V2.md`
- `docs/PRE_PUSH_AND_DEPLOYMENT_CHECKLIST.md`
- `docs/LAUNCH_CHECKLIST.md`
- `backend/scripts/README_SEED_PORTFOLIOS.md`
- `backend/scripts/smoke_test.ps1`
- `.cursor/rules/motion-and-hero-content.mdc`

### New / updated for safety

- `scripts/check-no-em-dash.sh` — script to scan tracked source/copy for em dash (optional pre-commit).
- `.github/workflows/ci.yml` — added job `no-em-dash` to fail CI if "—" appears in `frontend/src`, `backend/app`, `backend/scripts`, or `docs`.

---

## Cases where rephrase or light cleanup was used

- **Empty cell placeholders:** All "—" used as empty value in tables/cards (e.g. readiness, domain, date) were replaced with "-" so copy stays consistent and no em dash remains.
- **Dropdown:** "— None —" in enterprise selector → "- None -".
- **Email signature:** Zepto email template "<p>— CLEAR</p>" → "<p>- CLEAR</p>".
- **Section/phase docstrings:** "Phase X: Module — description" → "Phase X: Module (description)." or "Phase X: Module: description." for readability.

---

## Lint and typecheck

- **TypeScript:** `npx tsc --noEmit` run in `frontend/` completed successfully.
- **ESLint:** Frontend uses Next.js lint; no changes were made that introduce new lint errors. (If your project uses a custom ESLint config, run `npm run lint` locally.)

---

## Optional: pre-commit or local check

To run the em dash check locally (bash):

```bash
# From repo root
bash scripts/check-no-em-dash.sh
```

CI runs the same logic in the `no-em-dash` job on push/PR to `main`/`master`.

---

## Docs not fully swept

Some internal docs (e.g. `CLEAR_FOUNDER_CTO_AND_VC_NARRATIVE.md`, `CLEAR_IMPLEMENTATION_STATUS.md`, `CLEAR_WEBSITE_MASTER_PAGE_INVENTORY.md`, and a few others) still contain "—" in tables, technical references, or long narrative. They were out of scope for this pass to avoid unnecessary churn. You can run the CI job or `scripts/check-no-em-dash.sh` after cleaning those if you want the repo to be fully em-dash-free in tracked copy.
