# routePilot API (RP API)

Production-ready backend API for the routePilot EV charging corridor app. Serves the mobile app/frontend and reads from the PostgreSQL database **RP_OFFLINE_MASTER_DB**.

## Tech stack

- **Node.js** (ES modules)
- **Express**
- **pg** (PostgreSQL client with connection pooling)
- **dotenv** (environment configuration)

## Installation

```bash
cd API
npm install
```

## Environment variables

Copy `.env.example` to `.env` and set the values:

```bash
cp .env.example .env
```

| Variable     | Description                    | Example                |
| ------------ | ------------------------------ | ---------------------- |
| `PORT`       | HTTP server port               | `3000`                 |
| `PGHOST`     | PostgreSQL host                | `192.168.1.102`        |
| `PGPORT`     | PostgreSQL port                | `5440`                 |
| `PGDATABASE` | Database name                  | `RP_OFFLINE_MASTER_DB` |
| `PGUSER`     | Database user                  | `routepilot`           |
| `PGPASSWORD` | Database password              | `routepilot`           |
| `PGPOOL_MIN` | (Optional) Pool min connections | `2`                    |
| `PGPOOL_MAX` | (Optional) Pool max connections | `10`                   |

All connection settings are read from the environment.

## How to run

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or the port you set in `.env`).

## Endpoints

| Method | Path                         | Description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| GET    | `/health`                    | API and database health                     |
| GET    | `/api/corridors`             | List corridors (optional `limit`)           |
| GET    | `/api/next-chargers`          | Next chargers along a corridor (legacy)     |
| GET    | `/api/next-charging-locations` | Next charging locations (grouped sites)   |
| GET    | `/api/next-chargers-from-gps`| Next chargers from GPS + heading            |
| GET    | `/api/match-corridor-from-gps` | Match corridors from GPS + heading (debug) |

### GET /health

Returns API and database connectivity status.

**Example**

```bash
curl -s http://localhost:3000/health
```

**Response**

```json
{
  "ok": true,
  "database": true
}
```

### GET /api/corridors

Returns a list of corridors. Optional query parameter: `limit` (default 50, max 500).

**Example**

```bash
curl -s "http://localhost:3000/api/corridors?limit=20"
```

**Response**

```json
{
  "count": 20,
  "corridors": [
    {
      "corridor_key": "NL_A27_FWD",
      "country_code": "NL",
      "ref": "A27",
      "corridor_dir": "FWD",
      "length_m": 123773
    }
  ]
}
```

### GET /api/next-chargers

Returns the next chargers ahead on a corridor from a given position.

Charger objects include route distance from the database (`distance_ahead_m`, `distance_ahead_km`) and a user-friendly display field (`distance_display`), e.g. `"850 m"` or `"7 km"`. The API only formats the display value; the database computes the actual route distance.

**Query parameters**

| Parameter      | Required | Description                    | Default |
| -------------- | -------- | ------------------------------ | ------- |
| `corridor_key` | Yes      | Corridor identifier            | —       |
| `current_m`    | Yes      | Current position along corridor (metres) | — |
| `limit`        | No       | Max number of chargers to return (1–20)  | 5       |

**Example**

```bash
curl -s "http://localhost:3000/api/next-chargers?corridor_key=NL_A27_FWD&current_m=12500&limit=5"
```

**Response**

```json
{
  "corridor_key": "NL_A27_FWD",
  "current_m": 12500,
  "limit": 5,
  "count": 5,
  "chargers": [
    {
      "canonical_charger_id": "uuid",
      "charger_name": "IONITY Oosterhout",
      "operator_name": "IONITY",
      "corridor_key": "NL_A27_FWD",
      "country_code": "NL",
      "ref": "A27",
      "corridor_dir": "FWD",
      "charger_m": 14797,
      "charger_km": 14.797,
      "distance_ahead_m": 2297,
      "distance_ahead_km": 2.3,
      "distance_display": "2 km",
      "max_power_kw": 350,
      "connector_summary": {},
      "availability_provider": null,
      "lat": 51.6,
      "lon": 4.8
    }
  ]
}
```

**Validation (400)**

- Missing `corridor_key` or empty → 400
- Missing or invalid `current_m` (non-numeric) → 400
- `limit` not between 1 and 20 → 400

**Errors**

- Database errors → 500 with generic message
- Unknown routes → 404

### GET /api/next-charging-locations

Returns the next **charging locations** (grouped sites) ahead on the corridor. Uses `public.rp_api_next_charging_locations_v7_1(corridor_key, current_m, limit)` in PostgreSQL.

**Query parameters**

| Parameter    | Required | Description                          | Default |
| ------------ | -------- | ------------------------------------ | ------- |
| `corridorKey`| Yes      | Corridor identifier                  | —       |
| `currentM`   | Yes      | Current position along route (m)     | —       |
| `limit`      | No       | Max locations (integer, 1–50)        | 5       |

Aliases: `corridor_key`, `current_m`. Extra query keys (e.g. oude `groupGapM`) worden genegeerd.

**Example (curl)**

```bash
curl -s "http://localhost:3000/api/next-charging-locations?corridorKey=NL_A27_REV&currentM=0&limit=5"
```

**Example (frontend fetch)**

```js
const base = 'https://api.example.com'; // mijn API-base-URL
const qs = new URLSearchParams({
  corridorKey: 'NL_A27_REV',
  currentM: '0',
  limit: '5',
});
const res = await fetch(`${base}/api/next-charging-locations?${qs}`);
const json = await res.json();
console.log(json.data); // array van laadlocaties (camelCase, zie API-contract)
```

**Success response**

`{ "data": [ { "corridorKey", "locationRank", "locationId", "cardTitle", … } ] }` — velden expliciet gemapt vanuit snake_case DB-kolommen.

**Fouten**

- Ongeldige query → `400` met `{ "success": false, "error": "…" }`
- Databasefout → `500` met `{ "success": false, "error": "Failed to fetch next charging locations" }`

### GET /api/next-chargers-from-gps

Returns app-ready charging stops from a single database call: `public.rp_api_next_chargers_from_gps_v1(lat, lon, heading, limit)`. Corridor matching, filtering (e.g. service area vs exit), and ordering are handled in SQL.

Primary UI-oriented fields on each location: `title`, `brands`, `distanceLabel`, `detourLabel`, `maxPowerKw`. Treat `availableConnectors` as optional/unreliable in the UI for now.

**Query parameters**

| Parameter  | Required | Description                         | Default |
| ---------- | -------- | ----------------------------------- | ------- |
| `lat`      | Yes      | Latitude (-90 to 90)                | —       |
| `lon`      | Yes      | Longitude (-180 to 180)             | —       |
| `heading`  | Yes      | Heading in degrees (0–360)          | —       |
| `limit`    | No       | Max locations (clamped to 1–10)     | 5       |

**Example**

```bash
curl -s "http://localhost:3000/api/next-chargers-from-gps?lat=51.5866&lon=4.776&heading=3.13&limit=5"
```

**Response**

```json
{
  "ok": true,
  "match": {
    "corridorKey": "NL_A27_REV",
    "currentM": 7800,
    "confidence": "high"
  },
  "locations": [
    {
      "rank": 1,
      "id": "…",
      "title": "…",
      "siteName": "…",
      "brands": "…",
      "accessMode": "…",
      "locationType": "…",
      "distanceM": 951.68,
      "distanceKm": 0.952,
      "distanceLabel": "952 m",
      "detourSeconds": 0,
      "detourLabel": "0 m",
      "maxPowerKw": 350,
      "totalConnectors": 2,
      "availableConnectors": 0,
      "routeContext": "through_trip"
    }
  ]
}
```

With no rows from the database (e.g. no corridor match), the API returns HTTP 200 with `ok: true`, `match: null`, and `locations: []`.

**Validation (400)**

- Missing or invalid `lat` (non-numeric or not in -90..90) → 400
- Missing or invalid `lon` (non-numeric or not in -180..180) → 400
- Missing or invalid `heading` (non-numeric or not in 0..360) → 400
- Non-numeric `limit` → 400; numeric values are clamped to 1..10

**Errors (500)**

- `{ "ok": false, "error": "Failed to fetch next chargers from GPS" }`

### GET /api/match-corridor-from-gps

Debug endpoint: returns candidate corridor/segment matches for a given GPS position and heading. Useful to inspect how GPS/bearing matching behaves.

**Query parameters**

| Parameter  | Required | Description                          | Default |
| ---------- | -------- | ------------------------------------ | ------- |
| `lat`      | Yes      | Latitude (-90 to 90)                 | —       |
| `lon`      | Yes      | Longitude (-180 to 180)              | —       |
| `heading`  | Yes      | Heading in degrees (0–360)           | —       |
| `limit`    | No       | Max number of matches to return (1–50) | 10   |

**Example**

```bash
curl -s "http://localhost:3000/api/match-corridor-from-gps?lat=51.5866&lon=4.776&heading=3.13&limit=10"
```

**Response**

```json
{
  "lat": 51.5866,
  "lon": 4.776,
  "heading": 3.13,
  "limit": 10,
  "count": 2,
  "matches": [
    {
      "corridor_key": "NL_A27_REV",
      "ref": "A27",
      "corridor_dir": "REV",
      "corridor_id": 123,
      "segment_id": 3385,
      "seq": 31,
      "distance_to_segment_m": 0,
      "heading_diff_deg": 0,
      "current_m": 27523,
      "bearing_deg": 3.1,
      "match_score": 1
    }
  ]
}
```

**Validation (400)**

- Same as `/api/next-chargers-from-gps` for `lat`, `lon`, `heading`; `limit` must be between 1 and 50.

## Project structure

```
src/
  app.js              # Express app setup
  server.js            # Entry point, starts server
  config/
    index.js           # Load config from env
  db/
    pool.js            # PostgreSQL connection pool
    queries.js         # SQL queries / function calls
  routes/
    index.js           # Mounts all routes
    health.js
    corridors.js
    nextChargers.js
    nextChargersFromGps.js
    matchCorridorFromGps.js
  controllers/
    healthController.js
    corridorsController.js
    nextChargersController.js
    nextChargersFromGpsController.js
    matchCorridorFromGpsController.js
  services/
    corridorsService.js
    nextChargersService.js
    nextChargersFromGpsService.js
    matchCorridorFromGpsService.js
  middleware/
    errorHandler.js    # Centralized error handler
    notFound.js        # 404 handler
    validateNextChargers.js
    validateNextChargersFromGps.js
    validateMatchCorridorFromGps.js
  utils/
    validation.js      # Input validation helpers
    formatDistance.js  # Route distance display formatting
```

## Extending the API

The codebase is structured so you can add later:

- **GET /api/next-chargers-live** – same as next-chargers but enriched with live availability (e.g. from Redis).
- **Redis integration** – add a `src/services/availabilityService.js` (or similar) and call it from a new controller/route.
- **Route-based lookups** – reuse the existing db pool and add new queries in `src/db/queries.js`.
- **GPS/corridor matching** – when segment geometry is available, add a dedicated service and endpoint that uses it.

Keep routes thin, put business logic in services, and use the shared pool in `src/db/pool.js` for all DB access.

## License

Private / UNLICENSED.
