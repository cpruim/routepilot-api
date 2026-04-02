# GET /api/next-charging-locations

Volgende **laadlocaties** langs de corridor. Roept `public.rp_api_next_charging_locations_v7_1(corridor_key, current_m, limit)` aan.

## Request

```
GET /api/next-charging-locations?corridorKey=NL_A27_REV&currentM=0&limit=5
```

| Parameter     | Verplicht | Default |
| ------------- | --------- | ------- |
| `corridorKey` | ja        | —       |
| `currentM`    | ja        | —       |
| `limit`       | nee       | 5 (max 50) |

Aliases: `corridor_key`, `current_m`.

## Voorbeeld (fetch)

```js
const url =
  '/api/next-charging-locations?' +
  new URLSearchParams({
    corridorKey: 'NL_A27_REV',
    currentM: String(currentMeters),
    limit: '5',
  });
const res = await fetch(url);
const body = await res.json();
// body.data — array van objecten (camelCase)
```

## Response

Succes: `{ "data": [ … ] }`. Kolommen uit de DB-functie worden expliciet naar camelCase gemapt (o.a. `corridorKey`, `locationRank`, `cardTitle`, `locationType`, `highlightTier`, `routeContext`).

Fouten: `400` / `500` met `{ "success": false, "error": "…" }` waar van toepassing.
