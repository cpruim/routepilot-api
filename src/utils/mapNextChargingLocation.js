/**
 * Map één rij van public.rp_api_next_charging_locations_v7_1 naar API JSON (camelCase).
 * Expliciete kolom-mapping (geen blind doorgeven van raw rows).
 */

function toFiniteNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toInt(v) {
  const n = toFiniteNumber(v);
  if (n === null) return null;
  return Math.trunc(n);
}

function toStr(v) {
  if (v === null || v === undefined) return null;
  return String(v);
}

function toBool(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v === 1;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'true' || s === 't' || s === '1') return true;
    if (s === 'false' || s === 'f' || s === '0') return false;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function mapNextChargingLocation(row) {
  return {
    corridorKey: toStr(row.corridor_key),
    locationRank: toInt(row.location_rank),
    locationId: toStr(row.location_id),
    cardTitle: toStr(row.card_title),
    siteName: toStr(row.site_name),
    brandSummary: toStr(row.brand_summary),
    accessMode: toStr(row.access_mode),
    bothDirections: toBool(row.both_directions),
    locationType: toStr(row.location_type),
    accessPointType: toStr(row.access_point_type),
    locationM: toFiniteNumber(row.location_m),
    locationKm: toFiniteNumber(row.location_km),
    distanceToLocationM: toFiniteNumber(row.distance_to_location_m),
    distanceToLocationKm: toFiniteNumber(row.distance_to_location_km),
    distanceToLocationLabel: toStr(row.distance_to_location_label),
    detourM: toFiniteNumber(row.detour_m),
    detourLabel: toStr(row.detour_label),
    maxPowerKw: toFiniteNumber(row.max_power_kw),
    providerCount: toInt(row.provider_count),
    totalConnectors: toInt(row.total_connectors),
    highlightTier: toStr(row.highlight_tier),
    routeContext: toStr(row.route_context),
  };
}
