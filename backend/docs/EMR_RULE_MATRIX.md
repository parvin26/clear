# EMR rule matrix (domain- and profile-aware)

The EMR (Execution, Metrics, Review) plan is generated from a **rule matrix** — no LLM calls. Same shape for every domain (milestones, metrics, config); content varies by **primary domain** (Finance, Growth, Ops, Tech) and **company profile** (A, B, C).

## Location

- **`backend/app/diagnostic/emr_rules.py`** — Domain enum, Profile enum, `choose_primary_domain()`, `get_company_profile()` (delegates to `profile.py`), rule matrices, `build_emr_plan()`.
- **`backend/app/diagnostic/profile.py`** — Deterministic A/B/C from onboarding (company_size, stage).
- **`backend/app/diagnostic/run_service.py`** — After synthesis, sets `primary_domain = choose_primary_domain(synthesis, agent_outputs)`, then `build_emr_plan(primary_domain, profile, ...)` for draft artifact.

## Primary domain selection

`choose_primary_domain(synthesis, agent_outputs)`:

1. **Finance critical** → return `cfo` if:
   - CFO agent `risk_level == "red"`, or
   - CFO summary mentions runway & ("< 2" or "under 2" or "critical"), or
   - `runway_critical` flag present in CFO output.
2. **Else** pick domain with **highest severity** in `synthesis["capability_gaps"]` (each gap has `domain`, `severity`).
3. **Else** fallback `cfo`.

Persisted in `DiagnosticRun.synthesis["primary_domain"]` and `DecisionArtifact.canonical_json.decision_context.primary_domain`.

## Profile (A / B / C)

From onboarding: `get_company_profile(onboarding_context)` in `profile.py`.

- **A** — Micro MSME: 2–3 milestones, 1–2 metrics, very plain language, 2–4 weeks.
- **B** — Growing SME / early startup: 3–5 milestones, 2–3 metrics, 4–8 weeks.
- **C** — Larger / funded: 5–7 milestones, 3–5 metrics, 8–12 weeks.

## Rule matrix structure

For each **domain** (`cfo`, `cmo`, `coo`, `cto`):

- **metrics_by_profile** — Lists of metric templates: `id`, `name`, `definition`, `unit`, `default_target_hint`, `cadence_hint`, `input_type` (number | text).
- **milestone_templates_by_profile** — Lists of milestone templates: `id`, `title`, `description`, `owner_role_hint`, `due_hint`.

`build_emr_plan(primary_domain, profile, ...)`:

- Looks up `METRICS_BY_DOMAIN_PROFILE[domain][profile]` and `MILESTONE_TEMPLATES_BY_DOMAIN_PROFILE[domain][profile]`.
- Selects up to `max_m` milestones and `max_met` metrics (from `PROFILE_BOUNDS`), then pads to `min_m` / `min_met` with generic placeholders if needed.
- Sets `config.cadence` (weekly for A, biweekly/monthly for B/C), `next_review_date`, `horizon_label`.
- Sets `must_do_recommended_ids` to first 2–3 milestone ids.

## How to extend

1. **New metric** — Add a template to the domain’s `*_METRICS_A` / `*_METRICS_B` / `*_METRICS_C` list in `emr_rules.py` using `_metric(id, name, definition, unit, default_target_hint, cadence_hint, input_type)`.
2. **New milestone** — Add to `*_MILESTONES_A` / `*_MILESTONES_B` / `*_MILESTONES_C` with `_milestone(id, title, description, owner_role_hint, due_hint)`.
3. **New domain** — Add a new key (e.g. `cxo`) to `METRICS_BY_DOMAIN_PROFILE` and `MILESTONE_TEMPLATES_BY_DOMAIN_PROFILE` with A/B/C lists; ensure `choose_primary_domain` can return it if you add it to synthesis/agents.
4. **Primary domain rule** — Adjust `choose_primary_domain()` (e.g. demand/cash bottleneck overrides, or industry-based default).

## Frontend

- **Result page** and **Decision workspace** show:
  - Primary domain label (Finance, Growth, Operations, Technology).
  - Profile label: A (Micro MSME), B (Growing SME), C (Larger / funded).
- **Execution tab** — Metrics list uses `input_type` (number vs text) and displays `unit` next to target and actual.

## Tests

- **`backend/tests/test_emr_rules.py`** — `choose_primary_domain` (finance red, highest gap, fallback), `build_emr_plan` milestone/metric counts per profile, domain-specific content, `input_type` on metrics, `get_company_profile` delegate.
