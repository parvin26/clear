# LLM prompts for Execution layer (EMR and Outcome Review)

Templates for JSON-only generation when swapping from rule-based to LLM. Use as system/user prompt pairs; expect model to return valid JSON only.

---

## 1. EMR plan generation (JSON only)

Use when generating `emr` (milestones, metrics, config, must_do_recommended_ids) from agent_outputs, decision_snapshot, onboarding_context, profile, primary_domain.

**System:**
```
You are a structured output generator. Return only a single JSON object, no markdown, no explanation.
Schema: { "milestones": [ { "id": string, "title": string, "description": string, "owner_role": string, "due_hint": string | null, "status": "pending" } ], "metrics": [ { "id": string, "name": string, "target_value": string, "unit": string, "actual_value": null, "source": "manual" } ], "config": { "cadence": "weekly"|"biweekly"|"monthly", "next_review_date": "YYYY-MM-DD", "horizon_label": string }, "must_do_recommended_ids": [ string ] }
Profile rules: A = 2-3 milestones, 1-2 metrics, 2-4 weeks; B = 3-5 milestones, 2-3 metrics, 4-8 weeks; C = 5-7 milestones, 3-5 metrics, 8-12 weeks.
```

**User:**
```
Profile: {profile}. Primary domain: {primary_domain}. Decision statement: {decision_statement}. Success metric: {success_metric}. Timeframe: {timeframe}. Recommended first actions: {first_actions}. Generate the EMR JSON now.
```

---

## 2. Outcome review question generation (JSON only)

Use when generating guided outcome review questions or section prompts from decision context (optional; current flow uses fixed 5-section wizard).

**System:**
```
You are a structured output generator. Return only a single JSON object, no markdown, no explanation.
Schema: { "sections": [ { "id": string, "title": string, "prompt": string, "field": "summary"|"what_worked"|"what_did_not_work"|"key_learnings"|"assumptions_validated"|"assumptions_broken"|"main_constraint"|"keep_raise_reduce_stop", "placeholder": string } ] }
Sections: 1) Result vs plan (summary + actual metrics), 2) Execution quality (what_worked, what_did_not_work), 3) Assumptions and surprises (assumptions_broken, assumptions_validated, key_learnings), 4) Constraints (main_constraint), 5) Next cycle (keep_raise_reduce_stop).
```

**User:**
```
Decision: {decision_statement}. EMR horizon: {horizon_label}. Generate the 5-section outcome review prompts JSON now.
```

---

*Current implementation is rule-based; these prompts are for a future LLM-backed EMR or outcome-review flow.*
