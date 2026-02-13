# Phase 2 proof: Event-sourced execution

**Purpose:** Show that create task (event) → update status via event → derived GET shows updated state. No mutable task row update.

## Steps to generate (run locally, then paste output below)

1. Ensure a CLEAR decision exists (e.g. create via POST /api/clear/decisions or bootstrap-from-analysis). Note its `decision_id` (UUID).

2. Create a task (emits TASK_CREATED only):
   ```bash
   curl -X POST "http://localhost:8000/api/clear/decisions/{decision_id}/tasks/events" -H "Content-Type: application/json" -d "{\"title\":\"Phase 2 pilot task\",\"status\":\"planned\"}"
   ```
   Note the returned `task_key` (UUID).

3. Emit a status update (TASK_UPDATED; no PATCH on task row):
   ```bash
   curl -X POST "http://localhost:8000/api/clear/decisions/{decision_id}/tasks/{task_key}/events" -H "Content-Type: application/json" -d "{\"changes\":{\"status\":\"in_progress\"}}"
   ```

4. Get derived task list:
   ```bash
   curl "http://localhost:8000/api/clear/decisions/{decision_id}/tasks/derived"
   ```
   Expect the task to show `status: "in_progress"`.

5. (Optional) Get timeline:
   ```bash
   curl "http://localhost:8000/api/clear/decisions/{decision_id}/timeline"
   ```
   Expect TASK_CREATED and TASK_UPDATED events in order.

## Proof output (paste here after running)

```
(Replace with actual responses showing task created, event updated, and derived list showing updated state.)
```

## Acceptance

- [ ] POST .../tasks/events returns a `task_key`.
- [ ] POST .../tasks/{task_key}/events with `changes` succeeds (no mutable task row update).
- [ ] GET .../tasks/derived returns the task with the updated state (e.g. status in_progress).
