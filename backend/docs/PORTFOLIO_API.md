# Read-only portfolio API (CLEAR)

For partners (funds, accelerators, banks) to view portfolio and enterprise readiness without write access.

## Endpoint

**GET** `/api/clear/orgs/{portfolio_id}/portfolio`

Returns an enriched list of enterprises in the portfolio. Each item includes:

- `enterprise_id`, `enterprise_name`, `country`, `industry`, `company_size_band`
- `last_decision_id`, `last_primary_domain`, `readiness_band`, `last_review_date`, `has_committed_plan`

## Query parameters (optional filters)

| Parameter         | Type   | Description |
|------------------|--------|-------------|
| `readiness_band` | string | Filter by band (e.g. Nascent, Emerging, Institutionalizing). |
| `primary_domain` | string | Filter by last decision primary domain (cfo, cmo, coo, cto). |
| `country`        | string | Filter by enterprise geography. |
| `industry`       | string | Filter by sector. |
| `no_review_days` | int    | Only enterprises with no outcome review in the last N days (or never). |

## Authentication (optional)

When the environment variable **`CLEAR_PORTFOLIO_API_KEY`** is set, the API requires either:

- Query parameter: `?api_key=<key>`, or
- Header: `X-API-Key: <key>`

If the key is missing or does not match, the server returns **401 Unauthorized**. When `CLEAR_PORTFOLIO_API_KEY` is not set, the endpoint is open (no key required).

No rate limits or partner-specific schema in v0.

## Example

```http
GET /api/clear/orgs/1/portfolio?readiness_band=Emerging&no_review_days=60
```

Response: JSON array of objects with the fields above.

## Related

- Timeline for one enterprise: **GET** `/api/clear/enterprises/{enterprise_id}/timeline`
- Decision detail: **GET** `/api/clear/decisions/{decision_id}`
