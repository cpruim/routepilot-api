/**
 * Live beschikbaarheid per locatie-id via rp_api_location_availability_v1.
 */
import { pool } from '../db/pool.js';
import { locationAvailabilityV1 } from '../db/queries.js';

/**
 * @param {string[]} locationIds
 * @returns {Promise<unknown[]>}
 */
export async function getChargingLocationAvailability(locationIds) {
  const result = await pool.query(locationAvailabilityV1, [locationIds]);
  const raw = result.rows[0]?.data;
  if (raw == null) {
    return [];
  }
  if (typeof raw === 'string') {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }
  return Array.isArray(raw) ? raw : [];
}
