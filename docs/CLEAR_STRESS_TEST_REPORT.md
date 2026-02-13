# CLEAR stress-test report – 10 founder personas

**Purpose:** Stress-test the current CLEAR implementation end-to-end (diagnostic → synthesis → EMR → AI advisor chat → outcome/readiness) using 10 synthetic founder personas. No product or backend logic was changed; only simulated usage and code/data analysis.

**Post-implementation (fundable-product):** The 10-persona script supports optional strict assertions: set `STRESS_TEST_STRICT=1` to assert (1) `primary_domain` is in the allowed set per operating persona, and (2) advisor reply is non-empty and references at least one EMR-related term (milestone, metric, plan, first step, cash, etc.). Run locally before release or add a CI job that runs `python backend/scripts/run_10_persona_stress_test.py` with the backend up and `STRESS_TEST_STRICT=1`.

**Scope:** Findings are based on (1) codebase analysis (mapping, synthesis, EMR rules, chat, readiness), (2) the five documented runs in `docs/CLEAR_TEST_RUNS.md`, and (3) inferred behaviour for the 10 personas. Running `backend/scripts/run_10_persona_stress_test.py` with the backend up is recommended to obtain live outputs and refine this report.

---

## 1. Executive summary

### Overall verdict by segment

| Segment | Verdict | Notes |
|--------|---------|--------|
| **Survival MSMEs** (A1–A3) | **Strong but early** | Cash-focused synthesis and Finance EMR (e.g. weekly cash board, runway) fit. Risk: generic “Resource and time constraints” and same success_metric for everyone. Hawker/micro (A1) gets Profile A EMR; agency (A3) can feel slightly generic. |
| **Scaling companies** (B1–B3) | **Promising but thin** | Primary domain and snapshot can reflect growth/ops (CMO/COO), but agent payloads are largely generic; differentiation depends on LLM reading situation text. EMR rule matrix (Growth/Ops) helps. GTM-focused founders may still get CFO-framed snapshot if finance severity wins. |
| **Ops-heavy businesses** (C1–C2) | **Acceptable but thin** | Ops/COO can surface (delivery, SOPs, process). COO payload is generic (process_standardization, partial_use); nuance comes from situationDescription. EMR Ops templates (on-time delivery %, cycle time, milestones) are relevant. |
| **Inception-stage founders** (D1–D2) | **Not yet there** | No “pre-company” or “idea-stage” path. Wizard and mapping assume an operating business. D1 (idea-stage fintech) can be misread as “no revenue / dormant” (see Test 4 pattern). D2 (sole prop, mixing money) fits cash/survival framing but may get boilerplate first_actions. |

### Key strengths (top 5)

1. **End-to-end flow holds:** Diagnostic → result page → decision workspace → EMR → chat → outcome review and readiness is coherent and does not break for the tested personas.
2. **EMR is domain- and profile-aware:** Rule matrix (Finance/Growth/Ops/Tech × A/B/C) yields concrete, domain-specific milestones and metrics (e.g. Finance A: weekly cash board, runway; Growth: lead volume, conversion; Ops: on-time delivery %, cycle time) instead of generic “Week 1 / Month 1.”
3. **Chat seed is contextual:** First advisor message is generated from decision snapshot and name; it usually reflects the stated decision and asks a relevant first question.
4. **Primary domain selection has clear rules:** Finance-critical (e.g. CFO red, runway-critical) correctly forces Finance; otherwise highest-severity capability gap drives domain, so survival/cash personas get Finance, ops-heavy get COO when gaps support it.
5. **Guest flow and backward compatibility:** No login required; old decisions without new fields (profile, primary_domain, EMR templates) still render.

### Key weaknesses / risks (top 5)

1. **Agent payloads are mostly generic:** `mapping.py` sends the same default structures to all four agents; only `notes` (situationDescription) and a few COO/CTO fields carry through. Industry, company size, and stage from onboarding are not passed into agent payloads. Differentiation depends almost entirely on LLMs interpreting free text.
2. **Snapshot often repeats itself:** opt1 summary and recommended_path frequently repeat the decision_statement. key_constraints are almost always “Resource and time constraints typical of SMEs.” success_metric is almost always “Improved clarity and first steps completed within 90 days.” This makes outputs feel copy-paste across personas.
3. **Misattribution risk:** When CFO has high severity (or is chosen by choose_primary_domain), the snapshot can be framed as “cash flow / no revenue / financial statements” even when the founder’s pain is GTM, execution rhythm, or ops (see Test 4 – Kofi, Test 5 – Maya in CLEAR_TEST_RUNS.md).
4. **Chat follow-up context is thin:** `generate_assistant_reply` receives only `decision_statement[:300]` plus the user message—no EMR milestones, first_actions, or capability_gaps. The advisor can give generic or contradictory advice (e.g. “focus on these three milestones” without knowing what they are).
5. **Inception / pre-revenue not first-class:** No path for “no company yet” or “idea-stage.” Wizard and synthesis assume an operating business; idea-stage founders can be classified as “dormant financial state / no revenue” and get finance-heavy framing instead of validation/prioritisation.

### Red-flag issues before external demos

- **Inception personas (D1–D2):** Do not run a live demo with “I have an idea but no company yet” or “just registered sole prop” without either (a) clarifying that CLEAR is for operating businesses, or (b) adding a lightweight pre-path that avoids “no revenue” / “dormant” language.
- **GTM vs finance framing:** For growth/GTM-heavy personas (e.g. B1, B4/Kofi), run at least one test and confirm the main decision is not mis-framed as “manage cash flow” when the founder said “decide GTM focus and ICP.”
- **Chat contradicting EMR:** Manually test: commit a plan with 3 must-do milestones, then ask the advisor “What should I do first?” If the reply ignores or contradicts those milestones, treat as a demo risk and either enrich chat context or add a short disclaimer.

---

## 2. Persona-by-persona findings

*(Scores 0–5: 0 = broken / wrong, 5 = world-class for this persona. Findings inferred from code and existing test runs; run the 10-persona script to validate with live data.)*

---

### A1 – Cash‑strained Hawker Stall Owner

**Snapshot:** Kuala Lumpur hawker, 3 staff, RM35k/month, daily cashflow and supplier/rent pressure. **Main decision system is likely to surface:** Need to stabilise cash and visibility (e.g. weekly cash, essential spend, collections).

**1. Diagnostic quality**  
Wizard accepts messy, first-person language; situationClarifiers (“Cash feels tight”, “Customers paying late”) map to capability gaps. Profile A (micro) from company_size 1–10; primary domain likely CFO. **Risk:** Generic “Resource and time constraints” and same success_metric as others. **Score: 4**

**2. Synthesis / decision snapshot**  
One sharp decision (survive, smooth cash) is plausible. Constraints and timeframe (e.g. 90 days) are named. Tone can feel slightly formal for a hawker; survival intent is clear. **Score: 4**

**3. EMR plan**  
Finance Profile A: 2–3 milestones (e.g. weekly cash board, stop the leak list, collect faster), 1–2 metrics (runway, weekly net cash), short horizon, plain language. Concrete and actionable for a time-poor owner. **Score: 5**

**4. AI advisor chat**  
First message can reference “cash” and “next 12 months.” Follow-ups only get decision_statement[:300], so advice may stay generic; “Should I raise money?” could be deflected but not with full EMR context. **Score: 3**

**5. Outcome / readiness logic**  
Marking 1–2 milestones done and one outcome review moves readiness toward Emerging. State after one cycle is interpretable. **Score: 4**

**Persona verdict:** For this persona, CLEAR feels **promising and close to usable**: EMR and survival framing fit; main gaps are generic snapshot phrasing and thin chat follow-up context.

---

### A2 – Family Manufacturing SME Owner

**Snapshot:** Penang, 40 staff, RM8m/year, old systems; working capital, late payments, inventory pile-up. **Main decision:** Improve cash conversion and reduce financing cost.

**1. Diagnostic quality**  
Accepts detailed situation; clarifiers map to cash + ops. Profile B (11–50). Primary domain likely CFO (working capital) or COO (inventory). Capability gaps should reflect both. **Score: 4**

**2. Synthesis / decision snapshot**  
Decision can be sharp (cash conversion, inventory, DSO/DPO). Options may still repeat statement; constraints again generic. **Score: 4**

**3. EMR plan**  
Finance B or Ops B: 3–5 milestones, 2–3 metrics (e.g. runway, net cash, CCC for Finance B; on-time delivery, defect rate for Ops). Sequenced and relevant; may feel a bit much if profile flips to Ops and template is long. **Score: 4**

**4. AI advisor chat**  
First message can reference working capital / inventory. Follow-up context still thin; “Which metric should I fix first?” may not align with EMR metrics. **Score: 3**

**5. Outcome / readiness logic**  
Same as A1; one cycle with milestones + review is interpretable. **Score: 4**

**Persona verdict:** CLEAR feels **promising but thin**: right domain and EMR shape; differentiation and chat depth need work.

---

### A3 – Bootstrapped Services Agency Founder

**Snapshot:** Jakarta, 12 people, project-based lumpy revenue; no budgets, founder sets prices. **Main decision:** Predictable monthly cash and margins.

**1. Diagnostic quality**  
Lumpy revenue and pricing are in the situation; agents get this only via notes. Profile B. Gaps may emphasise cash; “margins” may be underplayed. **Score: 3**

**2. Synthesis / decision snapshot**  
Decision can be “predictable cash and margins.” first_actions may be generic (e.g. “review cash flow”) unless agent returns margin-specific recommendations. **Score: 3**

**3. EMR plan**  
Finance B: 13-week forecast, expense reset, pricing/margin test, DSO/DPO, funding pack. Relevant; “pricing or margin quick win” fits. **Score: 4**

**4. AI advisor chat**  
First message can mention “predictable cash” and “margins.” Follow-ups may not reference EMR milestones. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable after one cycle. **Score: 4**

**Persona verdict:** CLEAR feels **acceptable but thin**: EMR helps; snapshot and chat could better reflect “margins and pricing” vs generic cash.

---

### B1 – VC-backed SaaS Startup Founder

**Snapshot:** Singapore, 18 staff, pre-Series A, USD40k MRR; burn, CAC/LTV, unclear GTM. **Main decision:** Extend runway and hit Series A metrics.

**1. Diagnostic quality**  
Situation and clarifiers support both growth and cash. If CFO risk is high, choose_primary_domain may pick CFO and snapshot can skew “cash/burn” instead of “GTM and metrics.” Primary can be CMO if growth gaps have higher severity. **Score: 3**

**2. Synthesis / decision snapshot**  
When primary is CMO, decision and options can focus on GTM and pipeline. When primary is CFO, decision can over-index on “cash flow / runway” and underplay “CAC/LTV and focus.” **Score: 3**

**3. EMR plan**  
Growth B: ICP/messaging, funnel audit, channel experiments, follow-up cadence, referral/partnerships; metrics e.g. lead volume, conversion, CAC payback. Aligned if primary_domain is Growth. **Score: 4**

**4. AI advisor chat**  
“Should I raise money now?” can be answered but without full EMR/milestones the advisor may give generic “extend runway vs grow” advice. First message can be on point. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable. **Score: 4**

**Persona verdict:** CLEAR feels **promising but thin**: EMR and snapshot can be good when Growth wins; finance-heavy framing is a real risk and must be checked before demos.

---

### B2 – E‑commerce Brand Founder

**Snapshot:** KL, 7 staff, RM450k GMV/month; ad inefficiency, stockouts, ops chaos. **Main decision:** Profitable growth with basic ops discipline.

**1. Diagnostic quality**  
Growth + ops signals; primary can be CMO or COO. Gaps should reflect both; differentiation from situation text. **Score: 4**

**2. Synthesis / decision snapshot**  
Decision can combine growth and ops. options and recommended_path may still repeat statement. **Score: 3**

**3. EMR plan**  
Growth A or B, or Ops: lead volume, conversion, on-time/defect/cycle. Fit for “profitable growth” and “ops discipline.” **Score: 4**

**4. AI advisor chat**  
First message can reference GMV and ops. Follow-up context thin. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable. **Score: 4**

**Persona verdict:** CLEAR feels **acceptable but thin**: EMR and snapshot can work; generic phrasing and chat depth remain.

---

### B3 – Multi-outlet Restaurant Group Owner

**Snapshot:** Johor, 5 outlets, 65 staff; inconsistent performance, weak reporting, wastage. **Main decision:** Standardise operations and central dashboards.

**1. Diagnostic quality**  
Strong ops/clarity signals; primary likely COO. Profile C (51–100). Gaps can reflect process and reporting. **Score: 4**

**2. Synthesis / decision snapshot**  
Decision can be “standardise ops and reporting.” first_actions can include SOPs and dashboards if COO agent returns them. **Score: 4**

**3. EMR plan**  
Ops C: KPI dashboard, root cause, improvement backlog, vendor performance, training, S&OP, quarterly audit; metrics on-time %, defect %, cycle time. Concrete and sequenced; fits “serious, time-poor” owner. **Score: 5**

**4. AI advisor chat**  
First message can reference standardisation and dashboards. Follow-ups may not cite specific EMR milestones. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable; readiness can move to Emerging with progress. **Score: 4**

**Persona verdict:** For this persona, CLEAR feels **promising**: ops framing and EMR are strong; chat and snapshot phrasing could be sharper.

---

### C1 – Logistics SME Owner

**Snapshot:** Klang Valley, 30 drivers, 5 ops; missed deliveries, no route planning, driver turnover. **Main decision:** Reliability and fewer complaints.

**1. Diagnostic quality**  
Ops-heavy; primary likely COO. Gaps can reflect delivery, process, systems. **Score: 4**

**2. Synthesis / decision snapshot**  
Decision can be “reliability and complaints.” first_actions can include process and planning if agent returns them. **Score: 4**

**3. EMR plan**  
Ops B or C: bottleneck analysis, SOPs, quality at source, capacity, weekly review; on-time %, defect %, cycle time. Aligned with “reliability.” **Score: 5**

**4. AI advisor chat**  
First message can reference deliveries and reliability. Follow-up context thin. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable. **Score: 4**

**Persona verdict:** CLEAR feels **promising** for ops-heavy logistics: EMR and snapshot fit; chat depth is the main gap.

---

### C2 – Clinic Network Founder

**Snapshot:** 3 clinics, mix of doctors/assistants; each clinic different, poor process. **Main decision:** Standard SOPs and better patient experience.

**1. Diagnostic quality**  
Ops/process signals; primary COO. Industry “healthcare – clinic network” is in onboarding but not in agent payloads; nuance from situation only. **Score: 4**

**2. Synthesis / decision snapshot**  
Decision can be “SOPs and patient experience.” first_actions can be process- and experience-oriented. **Score: 4**

**3. EMR plan**  
Ops B/C: SOPs, quality at source, capacity, review cadence. Fits; “patient experience” may appear in narrative more than in template labels. **Score: 4**

**4. AI advisor chat**  
First message can reference SOPs and experience. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable. **Score: 4**

**Persona verdict:** CLEAR feels **acceptable but thin**: right domain and EMR; healthcare-specific language is light.

---

### D1 – Idea-stage Tech Founder

**Snapshot:** Fintech app idea, no company yet; overwhelmed, unclear what to validate first. **Main decision (ideal):** Disciplined 90-day validation path.

**1. Diagnostic quality**  
Wizard and mapping assume an operating business (revenue, expenses, etc.). “Idea / pre-revenue” can lead to CFO agent inferring “no revenue” and synthesis to “dormant financial state” (see Test 4 – Kofi). Primary may be CFO; decision can be mis-framed as “manage cash flow” instead of “validate and prioritise.” **Score: 1**

**2. Synthesis / decision snapshot**  
High risk of “no revenue,” “cash flow,” “go-to-market” mixed into one finance-heavy statement. Not yet a sharp “validation path” decision. **Score: 1**

**3. EMR plan**  
If primary is CFO, Finance A/B milestones (cash board, forecast) are misaligned with “no company yet.” If primary is CMO, Growth milestones are closer but still assume an operating pipeline. **Score: 2**

**4. AI advisor chat**  
First message may reinforce “revenue” or “cash” framing. “What should I validate first?” may get generic advice; advisor has no validation-specific context. **Score: 2**

**5. Outcome / readiness logic**  
Mechanics work but feel wrong for someone with no execution yet. **Score: 2**

**Persona verdict:** For this persona, CLEAR feels **not yet usable**: product assumes an operating business; idea-stage founders need a dedicated path or clear scope disclaimer.

---

### D2 – Newly Registered Sole Proprietor

**Snapshot:** Home bakery scaling online; mixing personal/business money, ad-hoc pricing. **Main decision:** Basic financial discipline and simple plan.

**1. Diagnostic quality**  
Cash and “little formal data” fit; Profile A. Primary likely CFO. Gaps can reflect cash and discipline. **Score: 4**

**2. Synthesis / decision snapshot**  
Decision can be “basic financial discipline and simple plan.” first_actions may be generic (e.g. “track cash”) unless agent returns sole-prop-specific steps. **Score: 3**

**3. EMR plan**  
Finance A: weekly cash board, stop the leak list, collect faster; runway and net cash. Simple and relevant. **Score: 5**

**4. AI advisor chat**  
First message can reference “financial discipline” and “simple plan.” Follow-up context thin. **Score: 3**

**5. Outcome / readiness logic**  
Interpretable. **Score: 4**

**Persona verdict:** CLEAR feels **promising but thin**: EMR and survival framing fit; snapshot could better reflect “separate money and simple plan” vs generic cash.

---

## 3. Cross-persona patterns

### Where CLEAR consistently shines

- **Finance discipline and survival:** When cash/runway is the main pain (A1, A2, A3, D2), primary domain and EMR (Finance A/B) align with “weekly cash board,” “runway,” “net cash,” and short horizons. Founders can see “if I just did these 2–3 things.”
- **Ops and process:** When the situation is clearly ops-heavy (B3, C1, C2), COO can win and EMR Ops templates (on-time %, defect %, cycle time, SOPs, review cadence) feel relevant and sequenced.
- **Domain-specific EMR:** Rule matrix (Finance/Growth/Ops/Tech × A/B/C) produces meaningfully different milestones and metrics per segment; no longer generic “Week 1 / Month 1” everywhere.
- **Chat seed:** First advisor message is usually on-topic and names the decision; good first impression.
- **Readiness logic:** Simple (reviews + milestone completion + approval) and interpretable; one cycle with some progress and a review moves band sensibly.

### Where CLEAR consistently fails or feels generic

- **Snapshot boilerplate:** success_metric (“Improved clarity and first steps completed within 90 days”), key_constraints (“Resource and time constraints typical of SMEs.”), and opt1/recommended_path repeating the decision_statement appear across almost all runs. Reduces “I hadn’t seen it that way” moments.
- **Chat follow-up depth:** Only decision_statement[:300] is sent to the LLM for follow-up replies. Advisor does not see EMR milestones, first_actions, or capability_gaps, so it cannot consistently align with “do these 3–5 things” or challenge assumptions using the same frame as the plan.
- **Agent input poverty:** Mapping sends the same default payloads; only situationDescription (and a few fields) carry persona context. Industry, size, stage from onboarding are not in agent inputs, so differentiation is entirely from free text.
- **Inception / pre-revenue:** No path for “no company yet” or “idea-stage.” These personas get finance-heavy or “no revenue” framing and misaligned EMR.
- **GTM vs finance framing:** When both growth and cash are in the situation, CFO severity can win and snapshot becomes “cash flow / financial statements” even when the founder’s main ask is “GTM focus and ICP” (observed in Test 4).

### Biased behaviour

- **Finance overweight:** choose_primary_domain falls back to CFO when gaps are empty or when CFO is red. Synthesis can then frame GTM or execution-rhythm decisions as “cash flow and financial visibility” (Test 5 – Maya).
- **No systematic “challenge assumptions”:** Chat system prompt does not explicitly ask the advisor to challenge “raise money now” or “hire first” for survival personas; behaviour is model-dependent.
- **One-size success_metric:** 90-day “improved clarity and first steps” does not adapt to 6-month horizon or to “validation” vs “execution” goals.

---

## 4. Top 10 actionable recommendations

| # | Title | Description | Impact | Effort |
|---|--------|-------------|--------|--------|
| 1 | **Enrich chat follow-up context** | Pass into `generate_assistant_reply` the full decision snapshot (or key fields), EMR milestones and must_do ids, and first_actions (or a short summary). Enables the advisor to align answers with the plan and reduce contradiction. | High | Medium |
| 2 | **Differentiate snapshot success_metric and constraints** | Derive success_metric and key_constraints from primary domain and situation (e.g. “Runway ≥ 6 months” for Finance, “On-time delivery ≥ 92%” for Ops) instead of a single default. Add 1–2 persona-specific constraints where possible. | High | Medium |
| 3 | **Pass onboarding into agent payloads** | Include industry, company_size (or band), and stage in CFO/CMO/COO/CTO payloads (e.g. as notes or structured fields) so agents can tailor language and priorities. | High | Low |
| 4 | **Inception / pre-revenue scope or path** | Either (a) add a short “I’m pre-revenue / idea-stage” path that avoids “dormant / no revenue” and surfaces validation/prioritisation, or (b) state clearly in product that CLEAR is for operating businesses and steer idea-stage users elsewhere. | High | Medium |
| 5 | **Reduce snapshot repetition** | Ensure opt1 summary and recommended_path are not verbatim copies of decision_statement; use options as true alternatives (e.g. opt2 from first alternative recommendation). | Medium | Low |
| 6 | **GTM vs finance primary-domain guard** | When situationClarifiers and situationDescription are strongly GTM-heavy (e.g. “ICP,” “GTM,” “segment,” “pipeline”), bias choose_primary_domain toward CMO unless CFO is explicitly red or runway_critical. | Medium | Low |
| 7 | **Explicit “challenge assumptions” in chat** | In the advisor system prompt, add one line: e.g. “For survival/cash-stress contexts, gently challenge ‘raise money now’ or ‘hire first’ if the plan prioritises runway and basics.” | Medium | Low |
| 8 | **Outcome review and next cycle** | After an outcome review, surface “what changed” (e.g. next_review_date advanced, readiness band) and one line “Next cycle focus” derived from keep_raise_reduce_stop and key_learnings so it feels like the system remembers the cycle. | Medium | Medium |
| 9 | **Persona-specific EMR labels** | Where templates allow, inject industry or context into milestone titles (e.g. “Weekly cash board (stall)” for F&B micro) so the plan feels less generic. | Low | Medium |
| 10 | **Run 10-persona script in CI or pre-release** | Add `run_10_persona_stress_test.py` to a nightly or pre-release run; capture primary_domain, emerging_decision, and EMR summary per persona; flag regressions (e.g. all personas suddenly CFO, or same success_metric for all). | Medium | Low |

---

**Report version:** 1.0  
**Basis:** Codebase analysis + `docs/CLEAR_TEST_RUNS.md` (5 runs) + inferred behaviour for 10 personas.  
**Next step:** Run `python backend/scripts/run_10_persona_stress_test.py` with backend and optional `STRESS_TEST_OUTPUT_JSON=1` to generate live results and update this report with actual outputs.

---

## Post-fix (implementation following 10-persona stress test)

After the four critical fixes documented in `docs/CLEAR_IMPLEMENTATION_STATUS.md` (sections 8–11):

1. **Primary domain selection**  
   - CFO is forced only when there is an **explicit survival indicator** (e.g. “runway critical”, “behind on rent”), not on “red” alone.  
   - **GTM-heavy** situations (e.g. ICP, pipeline, MRR in the text) can yield **CMO** when CMO severity is within 1 of CFO.  
   - **Ops-heavy** situations (e.g. operations, process, delivery, clinic, logistics) can yield **COO** when COO severity is within 1 of CFO.  
   - Re-run the 10-persona script to confirm B1 (GTM) and C2 (ops-heavy) get more balanced primary domains where appropriate.

2. **Snapshot boilerplate**  
   - The **chosen** primary (from `choose_primary_domain`) is used to **rebuild** the decision snapshot, so `success_metric` and `key_constraints` are always **domain-specific** (Finance, Growth, Ops, Tech) and aligned with the stored primary and EMR.

3. **AI advisor**  
   - **Chat/message** accepts requests **without** `session_id`; the backend creates or reuses a session when needed.  
   - The stress test calls `POST .../chat/message` with `{"message": "What should I focus on first?"}` and records `sample_advisor_reply`.  
   - Advisor context already includes decision snapshot and EMR (must-do milestones, metrics); replies should be non-empty and contextual.

4. **Idea-stage off-ramp**  
   - If `diagnostic_data.businessStage` is one of “Idea / pre-revenue”, “Idea”, “Pre-revenue”, “validation”, etc., the run **does not** execute the full diagnostic: no agents, no synthesis, no decision.  
   - Response: `idea_stage: true`, `decision_id: null`, `idea_stage_message` with a short explanation; an `IdeaStageLead` row is created when contact info is provided.  
   - **D1** in the 10-persona script uses `businessStage: "Idea / pre-revenue"` and is now off-ramped (no full decision or EMR).

Re-run with `STRESS_TEST_OUTPUT_JSON=1` and confirm in the new JSON: more balanced primary domains, varied domain-aware success_metric/key_constraints, non-empty `sample_advisor_reply` for non–idea-stage personas, and D1 recorded as idea-stage with no decision.

### D2 bug fix (sole proprietor 500)

- **Cause:** Synthesis assumed agent `recommendations` were always a list of strings. For D2 (and similar runs), the CFO agent sometimes returned a list of objects (e.g. `[{"description": "Open a business account"}]`). Code did `recs[0][:200]` when building the decision snapshot, causing **TypeError** and HTTP 500.
- **Fix:** Normalise recommendation items to strings in `backend/app/diagnostic/synthesis.py` via `_recommendation_to_str()` (handles str, dict with description/text/title/etc., or other). All uses of `recs[0]` and of `first_actions` from recommendations now use this helper. Added a guard in `choose_primary_domain` (emr_rules) for empty `by_domain`. Regression tests in `backend/tests/test_synthesis.py`.
- **Date:** 2025-02-11.
- **Confirmation:** After the fix, all **9 operating personas** (A1–A3, B1–B3, C1–C2, D2) complete successfully; D1 remains idea-stage off-ramp. D2’s primary_domain, success_metric, key_constraints, EMR summary, and sample_advisor_reply are appropriate for a home-bakery sole proprietor (e.g. Finance A: cash board, runway, net cash).
