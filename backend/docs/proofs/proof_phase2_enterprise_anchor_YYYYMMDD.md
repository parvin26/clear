# Phase 2 proof: Enterprise anchoring

**Purpose:** Show that create enterprise → run diagnose with `enterprise_id` → decision context snapshot exists.

## Steps to generate (run locally, then paste output below)

1. Create an enterprise:
   ```bash
   curl -X POST http://localhost:8000/api/enterprises -H "Content-Type: application/json" -d "{\"name\":\"Acme Co\",\"sector\":\"retail\",\"size_band\":\"small\"}"
   ```
   Note the returned `id` (e.g. `1`).

2. Run diagnose with that `enterprise_id` (use your agent’s diagnose endpoint and include `enterprise_id` in the body if supported).

3. Get the created decision’s `decision_id` from the diagnose response, then fetch context:
   ```bash
   curl http://localhost:8000/api/decisions/{decision_id}/context
   ```
   Expect `latest` to be non-null and to reference the enterprise (e.g. `enterprise_id` in the snapshot).

## Proof output (paste here after running)

```
(Replace this with the actual curl responses / console output showing enterprise creation and decision context with enterprise_id.)
```

## Acceptance

- [ ] At least one enterprise was created via POST /api/enterprises.
- [ ] At least one pilot decision has a context snapshot referencing that enterprise (latest or history contains `enterprise_id`).
