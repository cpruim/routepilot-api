/**
 * Corridors business logic. Reads from rp_api_corridors.
 */
import { pool } from '../db/pool.js';
import { listCorridors } from '../db/queries.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/**
 * @param {number} limit
 * @returns {Promise<{ count: number, corridors: Array<object> }>}
 */
export async function getCorridors(limit = DEFAULT_LIMIT) {
  const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
  const result = await pool.query(listCorridors, [safeLimit]);
  const corridors = result.rows.map(rowToCorridor);
  return { count: corridors.length, corridors };
}

function rowToCorridor(row) {
  return {
    corridor_key: row.corridor_key,
    country_code: row.country_code,
    ref: row.ref,
    corridor_dir: row.corridor_dir,
    length_m: row.length_m == null ? null : Number(row.length_m),
  };
}
