/**
 * QA reviewpunten: lezen uit rp_qa_review_points_v1 + corridorlengte uit rp_api_corridors.
 */
import { pool } from '../db/pool.js';
import { listQaReviewPointsV1, corridorLengthByCorridorKey } from '../db/queries.js';

function mapReviewId(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(value);
  if (Number.isFinite(n) && String(value).trim() !== '' && String(n) === String(value).trim()) return n;
  return String(value);
}

function mapPriority(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowToPoint(row) {
  return {
    reviewId: mapReviewId(row.review_id),
    motorway: row.motorway == null ? '' : String(row.motorway),
    corridorKey: row.corridor_key == null ? '' : String(row.corridor_key),
    currentM: row.current_m == null ? 0 : Number(row.current_m),
    category: row.category == null ? '' : String(row.category),
    label: row.label == null ? '' : String(row.label),
    sourceLabel: row.source_label == null || row.source_label === '' ? null : String(row.source_label),
    priority: mapPriority(row.priority),
  };
}

/**
 * @param {string} motorway
 * @param {string} direction
 * @param {string} category
 * @returns {Promise<{ success: boolean, motorway: string, direction: string, category: string, corridorLengthM: number | null, points: Array<object>, error?: string }>}
 */
export async function getQaReviewPoints(motorway, direction, category) {
  const result = await pool.query(listQaReviewPointsV1, [motorway, direction, category]);
  const points = result.rows.map(rowToPoint);

  let corridorLengthM = null;
  const firstKey = points[0]?.corridorKey?.trim();
  if (firstKey) {
    try {
      const lenRes = await pool.query(corridorLengthByCorridorKey, [firstKey]);
      if (lenRes.rows?.[0] && lenRes.rows[0].length_m != null) {
        const n = Number(lenRes.rows[0].length_m);
        corridorLengthM = Number.isFinite(n) ? n : null;
      }
    } catch {
      corridorLengthM = null;
    }
  }

  return {
    success: true,
    motorway,
    direction,
    category,
    corridorLengthM,
    points,
  };
}
