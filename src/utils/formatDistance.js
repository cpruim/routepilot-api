/**
 * Formats route distance (distance_ahead_m) for display.
 * Database remains source of truth; this is presentation only.
 *
 * @param {number} distanceAheadM - Distance ahead in metres (from DB).
 * @returns {string|null} - "850 m", "2 km", etc., or null if invalid.
 */
export function formatDistance(distanceAheadM) {
  if (!Number.isFinite(distanceAheadM)) return null;

  if (distanceAheadM <= 1000) {
    return `${Math.round(distanceAheadM)} m`;
  }

  return `${Math.round(distanceAheadM / 1000)} km`;
}

/**
 * Formats total distance for mobile nav: < 1000 m → "850 m", ≥ 1000 m → "9.7 km" (1 decimal).
 *
 * @param {number} distanceTotalM - Total distance in metres.
 * @returns {string|null} - "850 m", "9.7 km", or null if invalid.
 */
export function formatDistanceTotal(distanceTotalM) {
  if (!Number.isFinite(distanceTotalM)) return null;

  if (distanceTotalM < 1000) {
    return `${Math.round(distanceTotalM)} m`;
  }

  const km = distanceTotalM / 1000;
  return `${Number(km.toFixed(1))} km`;
}
