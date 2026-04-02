/**
 * GET /api/match-corridor-from-gps
 *
 * Productie: zelfde beste match als rp_api_next_chargers_from_gps_v1 gebruikt:
 * public.rp_api_match_corridor_from_gps_v1(lat, lon, heading, 2500, 60).
 *
 * Eerder: alleen rij 0 van rp_api_match_corridors_from_gps_heading — die kan een
 * andere corridor/richting (bijv. NL_A27_FWD + verkeerde current_m) geven dan
 * de canonical v1-match (bijv. NL_A27_REV bij Oosterhout).
 */
import { pool } from '../db/pool.js';
import { matchCorridorFromGpsV1, matchCorridorsFromGpsHeading } from '../db/queries.js';

const MAX_DISTANCE_M = 2500;
const MAX_HEADING_DIFF_DEG = 60;

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} heading
 * @param {number} limit
 * @returns {Promise<{ lat: number, lon: number, heading: number, limit: number, count: number, matches: Array<object>, matchSource: string }>}
 */
export async function getMatchCorridorsFromGps(lat, lon, heading, limit) {
  console.log('[RP API] match-corridor-from-gps: input (ruw)', {
    lat,
    lon,
    heading_deg: heading,
    limit,
  });

  const v1Result = await pool.query(matchCorridorFromGpsV1, [
    lat,
    lon,
    heading,
    MAX_DISTANCE_M,
    MAX_HEADING_DIFF_DEG,
  ]);
  let matches = v1Result.rows.map(rowToMatch);
  let matchSource = 'rp_api_match_corridor_from_gps_v1';

  if (matches.length === 0) {
    console.warn(
      '[RP API] match-corridor-from-gps: v1 gaf 0 rijen; fallback rp_api_match_corridors_from_gps_heading'
    );
    const headingResult = await pool.query(matchCorridorsFromGpsHeading, [lat, lon, heading, limit]);
    matches = headingResult.rows.map(rowToMatch);
    matchSource = 'rp_api_match_corridors_from_gps_heading_fallback';
  }

  if (matches.length > 0) {
    const m0 = matches[0];
    console.log('[RP API] match-corridor-from-gps: gekozen match[0]', {
      corridor_key: m0.corridor_key,
      current_m: m0.current_m,
      match_score: m0.match_score,
      heading_diff_deg: m0.heading_diff_deg,
      distance_to_segment_m: m0.distance_to_segment_m,
      matchSource,
      candidateCount: matches.length,
    });
    if (matches.length > 1) {
      console.log(
        '[RP API] match-corridor-from-gps: ook andere kandidaten (eerste 5)',
        matches.slice(0, 5).map((m) => ({
          corridor_key: m.corridor_key,
          current_m: m.current_m,
          match_score: m.match_score,
        }))
      );
    }
  } else {
    console.warn('[RP API] match-corridor-from-gps: geen enkele match (v1 + fallback)');
  }

  return {
    lat,
    lon,
    heading,
    limit,
    count: matches.length,
    matches,
    matchSource,
  };
}

function rowToMatch(row) {
  return {
    corridor_key: row.corridor_key,
    ref: row.ref,
    corridor_dir: row.corridor_dir,
    corridor_id: toNum(row.corridor_id),
    segment_id: toNum(row.segment_id),
    seq: toNum(row.seq),
    distance_to_segment_m: toNum(row.distance_to_segment_m),
    heading_diff_deg: toNum(row.heading_diff_deg),
    current_m: toNum(row.current_m),
    bearing_deg: toNum(row.bearing_deg),
    match_score: toNum(row.match_score),
    match_confidence: row.match_confidence != null ? String(row.match_confidence) : null,
  };
}

function toNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
