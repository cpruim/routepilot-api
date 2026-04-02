/**
 * Next chargers along a corridor (v2). Calls rp_api_next_chargers_v2() when available.
 * Falls back to rp_api_next_chargers() if v2 does not exist yet in the DB.
 * Returns clean JSON for mobile navigation UI with exit_name, distances, distance_display.
 */
import { pool } from '../db/pool.js';
import { nextChargersV2, nextChargers } from '../db/queries.js';
import { formatDistanceTotal } from '../utils/formatDistance.js';

const PG_UNDEFINED_FUNCTION = '42883';

/**
 * @param {string} corridorKey
 * @param {number} currentM
 * @param {number} limit
 * @returns {Promise<{ corridor_key: string, current_m: number, limit: number, count: number, chargers: Array<object> }>}
 */
export async function getNextChargersV2(corridorKey, currentM, limit) {
  try {
    const result = await pool.query(nextChargersV2, [corridorKey, currentM, limit]);
    const chargers = result.rows.map(rowToChargerV2);
    return buildResponse(corridorKey, currentM, limit, chargers);
  } catch (err) {
    if (err.code === PG_UNDEFINED_FUNCTION || /does not exist/i.test(err.message ?? '')) {
      const result = await pool.query(nextChargers, [corridorKey, currentM, limit]);
      const chargers = result.rows.map(rowToChargerV1);
      return buildResponse(corridorKey, currentM, limit, chargers);
    }
    throw err;
  }
}

function buildResponse(corridorKey, currentM, limit, chargers) {
  return {
    corridor_key: corridorKey,
    current_m: currentM,
    limit,
    count: chargers.length,
    chargers,
  };
}

function rowToChargerV2(row) {
  const distanceTotalM =
    (toNum(row.distance_to_access_m) ?? 0) + (toNum(row.distance_access_to_charger_m) ?? 0);
  return {
    name: row.charger_name ?? row.name ?? null,
    operator: row.operator_name ?? row.operator ?? null,
    max_power_kw: toNum(row.max_power_kw),
    exit_name: row.access_point_name ?? null,
    service_area: null,
    distance_to_exit_m: toNum(row.distance_to_access_m),
    distance_exit_to_charger_m: toNum(row.distance_access_to_charger_m),
    distance_total_m: distanceTotalM,
    distance_display: formatDistanceTotal(distanceTotalM),
    lat: null,
    lon: null,
  };
}

/** Map v1 result (rp_api_next_chargers) to same shape; v2-only fields null, distance from distance_ahead_m */
function rowToChargerV1(row) {
  const distanceAheadM = toNum(row.distance_ahead_m);
  return {
    name: row.charger_name ?? row.name ?? null,
    operator: row.operator_name ?? row.operator ?? null,
    max_power_kw: toNum(row.max_power_kw),
    exit_name: null,
    service_area: null,
    distance_to_exit_m: null,
    distance_exit_to_charger_m: null,
    distance_total_m: distanceAheadM,
    distance_display: formatDistanceTotal(distanceAheadM),
    lat: toNum(row.lat),
    lon: toNum(row.lon),
  };
}

function toNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
