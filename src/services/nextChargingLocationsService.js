/**
 * Next charging locations: één call naar public.rp_api_next_charging_locations_v7_1;
 * DB snake_case wordt expliciet gemapt naar camelCase in de response.
 */
import { pool } from '../db/pool.js';
import { nextChargingLocationsV71 } from '../db/queries.js';
import { mapNextChargingLocation } from '../utils/mapNextChargingLocation.js';

/**
 * @param {string} corridorKey
 * @param {number} currentM
 * @param {number} limit
 * @returns {Promise<{ data: Record<string, unknown>[] }>}
 */
export async function getNextChargingLocations(corridorKey, currentM, limit) {
  // v7_1 is de productiebron; DB-kolommen (snake_case) worden expliciet naar API camelCase gemapt.
  const result = await pool.query(nextChargingLocationsV71, [corridorKey, currentM, limit]);

  const data = result.rows.map((row) => mapNextChargingLocation(row));
  return { data };
}
