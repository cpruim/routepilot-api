# GET /api/next-chargers

Endpoint voor de volgende laadpalen langs een corridor vanaf een gegeven positie (meter). Gebruikt de PostgreSQL-functie `rp_api_next_chargers_v3` (index-based lookup); bij ontbreken van v3 wordt teruggevallen op `rp_api_next_chargers_v2`.

## Voorbeeld request URL

```
GET /api/next-chargers?corridorKey=NL_A27_FWD&currentM=25000&limit=5
```

Queryparameters: `corridorKey` (verplicht), `currentM` (verplicht), `limit` (optioneel, default 5, max 10). Ook `corridor_key` en `current_m` worden geaccepteerd.

## Voorbeeld JSON response

```json
{
  "success": true,
  "data": [
    {
      "corridorKey": "NL_A27_FWD",
      "chargerId": "uuid",
      "chargerName": "Fastned Ravensewetering",
      "operatorName": "Fastned",
      "maxPowerKw": 350,
      "chargerM": 43773,
      "distanceToExitM": 18773,
      "distanceExitToChargerM": 1413,
      "distanceTotalM": 20186,
      "distanceDisplay": "20 km",
      "lat": 52.04992463230403,
      "lon": 5.122193865356394,
      "connectorSummary": [],
      "availabilityProvider": null,
      "exitName": null,
      "serviceArea": null,
      "accessPointType": null,
      "accessPointId": null,
      "accessM": null
    }
  ],
  "meta": {
    "corridorKey": "NL_A27_FWD",
    "currentM": 25000,
    "limit": 5,
    "count": 5
  }
}
```

Bij ongeldige invoer (400):

```json
{
  "error": "Missing required query parameter: corridorKey"
}
```

Bij databasefout (500):

```json
{
  "error": "Internal server error"
}
```

## Testcases

| # | Scenario | Request | Verwachting |
|---|----------|---------|-------------|
| 1 | Geldige request | `?corridorKey=NL_A27_FWD&currentM=25000&limit=5` | 200, `success: true`, `data` array, `meta.count` |
| 2 | Zonder limit | `?corridorKey=NL_A27_FWD&currentM=25000` | 200, default `limit=5` in meta |
| 3 | Limit > 10 | `?corridorKey=NL_A27_FWD&currentM=25000&limit=15` | 200, limit wordt geclamped naar 10 in meta |
| 4 | Zonder corridorKey | `?currentM=25000` | 400, "Missing required query parameter: corridorKey" |
| 5 | Zonder currentM | `?corridorKey=NL_A27_FWD` | 400, "Missing required query parameter: currentM" |
| 6 | Ongeldige currentM | `?corridorKey=NL_A27_FWD&currentM=abc` | 400, "currentM must be a number" |
| 7 | Onbekende corridor | `?corridorKey=XX_UNKNOWN&currentM=0&limit=5` | 200, `success: true`, `data: []`, `meta.count: 0` |

### cURL-voorbeelden

```bash
# Geldige request
curl -s "http://localhost:3000/api/next-chargers?corridorKey=NL_A27_FWD&currentM=25000&limit=5"

# Zonder limit (default 5)
curl -s "http://localhost:3000/api/next-chargers?corridorKey=NL_A27_FWD&currentM=25000"

# Validatiefout (verwacht 400)
curl -s "http://localhost:3000/api/next-chargers?currentM=25000"
```

Vervang `localhost:3000` door je daadwerkelijke host en port.
