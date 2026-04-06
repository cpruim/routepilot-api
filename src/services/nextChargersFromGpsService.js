/**
 * Next chargers from GPS: één call naar public.rp_api_next_chargers_from_gps_v1.
 */
import { pool } from '../db/pool.js';
import { nextChargersFromGpsV1 } from '../db/queries.js';
import { mapRowToNextChargerLocationCard } from '../utils/mapNextChargerLocationCard.js';

function toNum(v) {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * @param {Record<string, unknown>|null|undefined} row
 */
function matchFromRow(row) {
  if (!row || row.corridor_key == null || row.corridor_key === '') return null;
  const conf = row.match_confidence;
  return {
    corridorKey: String(row.corridor_key),
    currentM: toNum(row.current_m),
    confidence: conf != null && conf !== '' ? String(conf) : null,
  };
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} heading
 * @param {number} limit
 */
export async function getNextChargersFromGps(lat, lon, heading, limit) {
  const result = await pool.query(nextChargersFromGpsV1, [lat, lon, heading, limit]);
  const rows = result.rows ?? [];

  if (rows.length === 0) {
    console.log('[RP API] next-chargers-from-gps', { corridorKey: null, limit, count: 0 });
    return {
      ok: true,
      match: null,
      locations: [],
    };
  }

  const match = matchFromRow(rows[0]);
  const locations = rows.map((r) => mapRowToNextChargerLocationCard(r));

  console.log('[RP API] next-chargers-from-gps', {
    corridorKey: match?.corridorKey ?? null,
    limit,
    count: locations.length,
  });

  return {
    ok: true,
    match,
    locations,
  };
}
