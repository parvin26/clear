# CLEAR Activation Engine (backend alignment)

The frontend implements an **activation engine** that guides each new enterprise through the first governed decision cycle within 14 days (checklist, nudges, first-decision template, dashboard widget).

## Future: Institutional / cohort mode

For cohort rollout, the system should support:

- **`activation_mode`**: `enterprise` (default) | `cohort`
  - **enterprise**: Current behaviour — activation state and nudges are per user/workspace (derived from decisions and milestones).
  - **cohort**: A cohort manager can see activation progress of all enterprises in the cohort and send cohort-wide nudges.

### Where to add `activation_mode`

- **Option A**: Config / environment  
  e.g. `ACTIVATION_MODE=enterprise` or `cohort` in backend config; frontend can call a small config endpoint if needed.
- **Option B**: Enterprise attribute  
  e.g. `enterprises.activation_mode` or a separate `cohort_assignments` table linking enterprises to cohorts; cohort manager role sees aggregated activation.

No backend change is required for the current (enterprise-only) activation behaviour. This note is for when cohort mode is implemented.
