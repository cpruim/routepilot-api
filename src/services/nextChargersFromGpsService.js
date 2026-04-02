/**
 * Next chargers from GPS: één call naar public.rp_api_next_chargers_from_gps_v1.
 */
import { pool } from '../db/pool.js';
import { nextChargersFromGpsV1 } from '../db/queries.js';

function toNum(v) {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toInt(v) {
  const n = toNum(v);
  if (n == null) return null;
  return Math.trunc(n);
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
 * @param {Record<string, unknown>} row
 */
function locationFromRow(row) {
  return {
    rank: toInt(row.location_rank),
    id: row.location_id != null ? String(row.location_id) : null,
    title: row.card_title != null ? String(row.card_title) : null,
    siteName: row.site_name != null ? String(row.site_name) : null,
    brands: row.brand_summary != null ? String(row.brand_summary) : null,
    accessMode: row.access_mode != null ? String(row.access_mode) : null,
    locationType: row.location_type != null ? String(row.location_type) : null,
    distanceM: toNum(row.distance_to_location_m),
    distanceKm: toNum(row.distance_to_location_km),
    distanceLabel: row.distance_display != null ? String(row.distance_display) : null,
    detourSeconds: toInt(row.detour_seconds) ?? 0,
    detourLabel: row.detour_label != null ? String(row.detour_label) : null,
    maxPowerKw: toNum(row.max_power_kw),
    totalConnectors: toInt(row.total_connectors) ?? 0,
    availableConnectors: toInt(row.available_connectors) ?? 0,
    routeContext: row.route_context != null ? String(row.route_context) : null,
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
  const locations = rows.map((r) => locationFromRow(r));

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
