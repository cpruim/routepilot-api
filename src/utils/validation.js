/**
 * Validation helpers for request inputs.
 */

const DEFAULT_NEXT_CHARGERS_LIMIT = 5;
const MAX_NEXT_CHARGERS_LIMIT = 10;
const DEFAULT_NEXT_CHARGERS_MODE = 'through_trip';
const DEFAULT_NEXT_CHARGERS_MIN_LOOKAHEAD_M = 100000;

const DEFAULT_MATCH_CORRIDOR_LIMIT = 10;
const MAX_MATCH_CORRIDOR_LIMIT = 50;

/**
 * Validate next-chargers query params. Returns { valid: true, ...parsed } or { valid: false, statusCode, message }.
 * Accepts corridorKey or corridor_key, currentM or current_m; limit optional (default 5, max 10).
 * Optional: mode (default through_trip), minLookaheadM or min_lookahead_m (default 100000).
 */
export function validateNextChargersParams(query) {
  const corridorKey = query?.corridorKey ?? query?.corridor_key;
  if (corridorKey === undefined || corridorKey === null || corridorKey === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: corridorKey' };
  }
  const trimmedKey = String(corridorKey).trim();
  if (!trimmedKey) {
    return { valid: false, statusCode: 400, message: 'corridorKey cannot be empty' };
  }

  const currentM = query?.currentM ?? query?.current_m;
  if (currentM === undefined || currentM === null || currentM === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: currentM' };
  }
  const m = Number(currentM);
  if (Number.isNaN(m)) {
    return { valid: false, statusCode: 400, message: 'currentM must be a number' };
  }

  let limit = DEFAULT_NEXT_CHARGERS_LIMIT;
  if (query?.limit !== undefined && query?.limit !== '') {
    const l = Number(query.limit);
    if (Number.isNaN(l) || l < 1) {
      return {
        valid: false,
        statusCode: 400,
        message: 'limit must be a positive number',
      };
    }
    limit = Math.min(Math.floor(l), MAX_NEXT_CHARGERS_LIMIT);
  }

  let mode = DEFAULT_NEXT_CHARGERS_MODE;
  const modeRaw = query?.mode;
  if (modeRaw !== undefined && modeRaw !== null && modeRaw !== '') {
    const s = String(modeRaw).trim();
    if (!s) {
      return { valid: false, statusCode: 400, message: 'mode cannot be empty' };
    }
    mode = s;
  }

  let minLookaheadM = DEFAULT_NEXT_CHARGERS_MIN_LOOKAHEAD_M;
  const lookaheadRaw = query?.minLookaheadM ?? query?.min_lookahead_m;
  if (lookaheadRaw !== undefined && lookaheadRaw !== null && lookaheadRaw !== '') {
    const ml = Number(lookaheadRaw);
    if (Number.isNaN(ml)) {
      return { valid: false, statusCode: 400, message: 'minLookaheadM must be a number' };
    }
    minLookaheadM = ml;
  }

  return { valid: true, corridor_key: trimmedKey, current_m: m, limit, mode, minLookaheadM };
}

/**
 * Parse corridors limit from query. Returns { limit } with limit between 1 and 500.
 */
const QA_MOTORWAYS = new Set(['A2', 'A4', 'A12', 'A27', 'A58', 'A59']);
const QA_DIRECTIONS = new Set(['FWD', 'REV']);
const QA_CATEGORIES = new Set(['all', 'baseline', 'around_location', 'cluster', 'tricky']);

/**
 * Validate GET /api/qa-review-points query params.
 */
export function validateQaReviewPointsParams(query) {
  const motorwayRaw = query?.motorway;
  if (motorwayRaw === undefined || motorwayRaw === null || motorwayRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: motorway' };
  }
  const motorway = String(motorwayRaw).trim().toUpperCase();
  if (!QA_MOTORWAYS.has(motorway)) {
    return {
      valid: false,
      statusCode: 400,
      message: `motorway must be one of: ${[...QA_MOTORWAYS].sort().join(', ')}`,
    };
  }

  const directionRaw = query?.direction;
  if (directionRaw === undefined || directionRaw === null || directionRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: direction' };
  }
  const direction = String(directionRaw).trim().toUpperCase();
  if (!QA_DIRECTIONS.has(direction)) {
    return { valid: false, statusCode: 400, message: 'direction must be FWD or REV' };
  }

  let category = 'all';
  const categoryRaw = query?.category;
  if (categoryRaw !== undefined && categoryRaw !== null && categoryRaw !== '') {
    const catTrim = String(categoryRaw).trim().toLowerCase();
    if (catTrim === '') {
      category = 'all';
    } else {
      category = catTrim === 'around-location' ? 'around_location' : catTrim;
      if (!QA_CATEGORIES.has(category)) {
        return {
          valid: false,
          statusCode: 400,
          message: `category must be one of: ${[...QA_CATEGORIES].sort().join(', ')}`,
        };
      }
    }
  }

  return { valid: true, motorway, direction, category };
}

export function parseCorridorsLimit(query) {
  const defaultLimit = 50;
  const maxLimit = 500;
  const raw = query?.limit;
  if (raw === undefined || raw === '') return { limit: defaultLimit };
  const n = Number(raw);
  if (Number.isNaN(n) || n < 1) return { limit: defaultLimit };
  return { limit: Math.min(Math.floor(n), maxLimit) };
}

/**
 * Validate next-chargers-from-gps query params.
 * Returns { valid: true, lat, lon, heading, limit } or { valid: false, statusCode, message }.
 * limit default 5; waarde wordt naar 1..10 geclamped (ongeldige niet-numerieke waarde → 400).
 */
export function validateNextChargersFromGpsParams(query) {
  const latRaw = query?.lat;
  if (latRaw === undefined || latRaw === null || latRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: lat' };
  }
  const lat = Number(latRaw);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, statusCode: 400, message: 'lat must be a number between -90 and 90' };
  }

  const lonRaw = query?.lon;
  if (lonRaw === undefined || lonRaw === null || lonRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: lon' };
  }
  const lon = Number(lonRaw);
  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    return { valid: false, statusCode: 400, message: 'lon must be a number between -180 and 180' };
  }

  const headingRaw = query?.heading;
  if (headingRaw === undefined || headingRaw === null || headingRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: heading' };
  }
  const heading = Number(headingRaw);
  if (Number.isNaN(heading) || heading < 0 || heading > 360) {
    return { valid: false, statusCode: 400, message: 'heading must be a number between 0 and 360' };
  }

  let limit = DEFAULT_NEXT_CHARGERS_LIMIT;
  if (query?.limit !== undefined && query?.limit !== '') {
    const l = Number(query.limit);
    if (Number.isNaN(l)) {
      return { valid: false, statusCode: 400, message: 'limit must be a number' };
    }
    limit = Math.min(MAX_NEXT_CHARGERS_LIMIT, Math.max(1, Math.floor(l)));
  }

  return { valid: true, lat, lon, heading, limit };
}

/**
 * Validate match-corridor-from-gps query params (debug endpoint).
 * Returns { valid: true, lat, lon, heading, limit } or { valid: false, statusCode, message }.
 */
export function validateMatchCorridorFromGpsParams(query) {
  const latRaw = query?.lat;
  if (latRaw === undefined || latRaw === null || latRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: lat' };
  }
  const lat = Number(latRaw);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, statusCode: 400, message: 'lat must be a number between -90 and 90' };
  }

  const lonRaw = query?.lon;
  if (lonRaw === undefined || lonRaw === null || lonRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: lon' };
  }
  const lon = Number(lonRaw);
  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    return { valid: false, statusCode: 400, message: 'lon must be a number between -180 and 180' };
  }

  const headingRaw = query?.heading;
  if (headingRaw === undefined || headingRaw === null || headingRaw === '') {
    return { valid: false, statusCode: 400, message: 'Missing required query parameter: heading' };
  }
  const heading = Number(headingRaw);
  if (Number.isNaN(heading) || heading < 0 || heading > 360) {
    return { valid: false, statusCode: 400, message: 'heading must be a number between 0 and 360' };
  }

  let limit = DEFAULT_MATCH_CORRIDOR_LIMIT;
  if (query?.limit !== undefined && query?.limit !== '') {
    const l = Number(query.limit);
    if (Number.isNaN(l) || l < 1 || l > MAX_MATCH_CORRIDOR_LIMIT) {
      return {
        valid: false,
        statusCode: 400,
        message: `limit must be between 1 and ${MAX_MATCH_CORRIDOR_LIMIT}`,
      };
    }
    limit = Math.floor(l);
  }

  return { valid: true, lat, lon, heading, limit };
}
