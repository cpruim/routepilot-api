# SQL migrations

Run migrations with a PostgreSQL client connected to the same database as the API.

## next-chargers v3 (index-based lookup)

**File:** `rp_api_next_chargers_v3.sql`

- Creates indexes on `rp_corridor_charger_index` and `rp_chargers_on_corridor_v4` for fast lookup.
- Creates function `rp_api_next_chargers_v3(corridor_key, current_m, limit)` that uses 1000 m buckets to fetch a small candidate set from the index, then joins to charger details.

**Apply:**

```bash
psql -d your_database -f sql/rp_api_next_chargers_v3.sql
```

Or run the file contents in your preferred SQL tool. The API will use v3 when available and fall back to v2 if the function does not exist yet.

**Prerequisites:** Tables `rp_corridor_charger_index` and `rp_chargers_on_corridor_v4` must exist. The view `rp_chargers_on_corridor_v4` must expose the same column names as `rp_api_next_chargers_v2` (e.g. `distance_to_access_m`, `distance_access_to_charger_m`, etc.). If your view uses different names, alias them in the function’s `SELECT` list.
