/**
 * Parse en valideer query parameters voor GET /api/next-charging-locations.
 * Roept intern alleen corridorKey, currentM en limit door naar rp_api_next_charging_locations_v7_1.
 */

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

/**
 * @typedef {Object} NextChargingLocationsParsedQuery
 * @property {string} corridorKey
 * @property {number} currentM
 * @property {number} limit
 */

/**
 * @typedef {NextChargingLocationsParsedQuery & { valid: true }} ParseNextChargingLocationsOk
 */

/**
 * @typedef {{ valid: false, statusCode: number, message: string }} ParseNextChargingLocationsErr
 */

/**
 * @param {Record<string, unknown>|undefined|null} query
 * @returns {ParseNextChargingLocationsOk | ParseNextChargingLocationsErr}
 */
export function parseNextChargingLocationsQuery(query) {
  const corridorKey = query?.corridorKey;
  if (corridorKey === undefined || corridorKey === null || corridorKey === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: corridorKey' };
  }
  const trimmedKey = String(corridorKey).trim();
  if (!trimmedKey) {
    return { valid: false, statusCode: 400, message: 'corridorKey cannot be empty' };
  }

  const currentMRaw = query?.currentM;
  if (currentMRaw === undefined || currentMRaw === null || currentMRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: currentM' };
  }
  const currentM = Number(currentMRaw);
  if (!Number.isFinite(currentM)) {
    return { valid: false, statusCode: 400, message: 'currentM must be a valid finite number' };
  }

  let limit = DEFAULT_LIMIT;
  if (query?.limit !== undefined && query?.limit !== null && query?.limit !== '') {
    const l = Number(query.limit);
    if (!Number.isFinite(l) || l < 1) {
      return { valid: false, statusCode: 400, message: 'limit must be a positive integer' };
    }
    const li = Math.trunc(l);
    if (li !== l) {
      return { valid: false, statusCode: 400, message: 'limit must be a positive integer' };
    }
    if (li > MAX_LIMIT) {
      return {
        valid: false,
        statusCode: 400,
        message: `limit must be at most ${MAX_LIMIT}`,
      };
    }
    limit = li;
  }

  return {
    valid: true,
    corridorKey: trimmedKey,
    currentM,
    limit,
  };
}
