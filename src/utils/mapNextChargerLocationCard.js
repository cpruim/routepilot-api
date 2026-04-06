/**
 * Gedeelde mapping naar het app-cardformaat (zelfde velden als /api/next-chargers-from-gps).
 * Bron: rijen van rp_api_next_charging_locations_v1 (corridor) of rp_api_next_chargers_from_gps_v1.
 */

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

/** Lege string → null (zelfde idee als Web `strNull`). */
function strOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/**
 * Exitnummers komen soms als site_name; toon die niet als er al een echte titel is.
 * @param {unknown} siteName
 * @param {unknown} cardTitle
 */
function siteNameForCard(siteName, cardTitle) {
  if (siteName == null || siteName === '') return null;
  const s = String(siteName).trim();
  if (s === '') return null;
  const title = cardTitle != null ? String(cardTitle).trim() : '';
  const siteLooksLikeExitOnly = /^\d+$/.test(s);
  const titleIsRealName = title.length > 0 && !/^\d+$/.test(title);
  if (siteLooksLikeExitOnly && titleIsRealName) return null;
  return s;
}

/**
 * Zelfde uitsluitregel als in sql/rp_api_next_chargers_from_gps_v1_hotfix_v71.sql (WHERE NOT (...)).
 * @param {Record<string, unknown>|null|undefined} row
 */
export function isNoisyLowPowerVattenfallRow(row) {
  if (!row) return false;
  const maxPow = Number(row.max_power_kw ?? 0);
  if (!Number.isFinite(maxPow) || maxPow > 50) return false;
  const brand = String(row.brand_summary ?? '');
  return /vattenfall/i.test(brand) || /unknown/i.test(brand);
}

/**
 * @param {Record<string, unknown>} row
 */
export function mapRowToNextChargerLocationCard(row) {
  const distanceLabel =
    row.distance_display != null && row.distance_display !== ''
      ? String(row.distance_display)
      : row.distance_to_location_label != null
        ? String(row.distance_to_location_label)
        : null;

  return {
    rank: toInt(row.location_rank),
    id: row.location_id != null ? String(row.location_id) : null,
    title: row.card_title != null ? String(row.card_title) : null,
    siteName: siteNameForCard(row.site_name, row.card_title),
    brands: row.brand_summary != null ? String(row.brand_summary) : null,
    accessMode: row.access_mode != null ? String(row.access_mode) : null,
    locationType: row.location_type != null ? String(row.location_type) : null,
    distanceM: toNum(row.distance_to_location_m),
    distanceKm: toNum(row.distance_to_location_km),
    distanceLabel,
    detourSeconds: toInt(row.detour_seconds) ?? 0,
    detourLabel: row.detour_label != null ? String(row.detour_label) : null,
    maxPowerKw: toNum(row.max_power_kw),
    totalConnectors: toInt(row.total_connectors) ?? 0,
    availableConnectors: toInt(row.available_connectors) ?? 0,
    routeContext: row.route_context != null ? String(row.route_context) : null,
    accessPointType: strOrNull(row.access_point_type),
    accessPointName: strOrNull(row.access_point_name),
    accessPointRef: strOrNull(row.access_point_ref),
  };
}
