/**
 * Next charging locations: één call naar public.rp_api_next_charging_locations_v1 (4-arg, named);
 * DB snake_case wordt expliciet gemapt naar camelCase in de response.
 */
import { pool } from '../db/pool.js';
import {
  nextChargingLocationsV71,
  NEXT_CHARGING_LOCATIONS_BUCKET_SIZE_M,
} from '../db/queries.js';
import { mapNextChargingLocation } from '../utils/mapNextChargingLocation.js';

/**
 * @param {string} corridorKey
 * @param {number} currentM
 * @param {number} limit
 * @returns {Promise<{ data: Record<string, unknown>[] }>}
 */
export async function getNextChargingLocations(corridorKey, currentM, limit) {
  // v1 4-arg overload (named); DB-kolommen (snake_case) worden expliciet naar API camelCase gemapt.
  const result = await pool.query(nextChargingLocationsV71, [
    corridorKey,
    currentM,
    limit,
    NEXT_CHARGING_LOCATIONS_BUCKET_SIZE_M,
  ]);

  const data = result.rows.map((row) => mapNextChargingLocation(row));
  return { data };
}
