/**
 * GET /api/next-chargers: één call naar public.rp_api_next_charging_locations_v5_8.
 * `data` bevat ruwe rijen (snake_case kolomnamen zoals pg die teruggeeft).
 */
import { pool } from '../db/pool.js';
import { nextChargingLocationsV58, corridorLengthByCorridorKey } from '../db/queries.js';

const FN_NAME = 'public.rp_api_next_charging_locations_v5_8';
const DEFAULT_LIMIT = 5;
const DEFAULT_MODE = 'through_trip';
const DEFAULT_MIN_LOOKAHEAD_M = 100000;

function bindCorridorKey(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

function bindCurrentM(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function bindLimit(v) {
  if (v == null || v === '') return DEFAULT_LIMIT;
  const n = Math.floor(Number(v));
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return n;
}

function bindMode(v) {
  if (v == null || v === '') return DEFAULT_MODE;
  const s = String(v).trim();
  return s || DEFAULT_MODE;
}

function bindMinLookaheadM(v) {
  if (v == null || v === '') return DEFAULT_MIN_LOOKAHEAD_M;
  const n = Number(v);
  return Number.isNaN(n) ? DEFAULT_MIN_LOOKAHEAD_M : n;
}

/**
 * @param {string} corridorKey
 * @param {number} currentM
 * @param {number} limit
 * @param {string} [mode]
 * @param {number} [minLookaheadM]
 * @returns {Promise<{ success: true, data: Array<Record<string, unknown>>, meta: object }>}
 */
export async function getNextChargers(corridorKey, currentM, limit, mode, minLookaheadM) {
  const corridorKeyBound = bindCorridorKey(corridorKey);
  const currentMBound = bindCurrentM(currentM);
  const limitBound = bindLimit(limit);
  const modeBound = bindMode(mode);
  const minLookaheadMBound = bindMinLookaheadM(minLookaheadM);

  const params = [corridorKeyBound, currentMBound, limitBound, modeBound, minLookaheadMBound];

  try {
    console.log('[RP API] next-chargers: function called:', FN_NAME);
    console.log('[RP API] next-chargers: params', {
      corridorKey: corridorKeyBound,
      currentM: currentMBound,
      limit: limitBound,
      mode: modeBound,
      minLookaheadM: minLookaheadMBound,
    });

    let lengthM = null;
    try {
      const lenRes = await pool.query(corridorLengthByCorridorKey, [corridorKeyBound]);
      if (lenRes.rows?.[0]) {
        lengthM = Number(lenRes.rows[0].length_m);
      }
    } catch (lenErr) {
      console.warn('[RP API] next-chargers: length_m lookup mislukt', lenErr.message);
    }
    if (lengthM != null && Number.isFinite(lengthM) && lengthM > 0) {
      console.log('[RP API] next-chargers: corridor length_m (rp_api_corridors)', lengthM);
      if (currentMBound > lengthM + 1000) {
        console.warn(
          '[RP API] next-chargers: currentM ligt waarschijnlijk voorbij corridor-einde (currentM > length_m + 1km) — verwacht 0 of weinig rijen vooruit'
        );
      }
      if (currentMBound < 0) {
        console.warn('[RP API] next-chargers: currentM is negatief');
      }
    } else {
      console.log('[RP API] next-chargers: geen length_m in rp_api_corridors voor deze key (of 0)');
    }

    const result = await pool.query(nextChargingLocationsV58, params);
    const data = result.rows ?? [];

    console.log('[RP API] next-chargers: row count:', data.length);
    if (data.length === 0) {
      console.warn(
        '[RP API] next-chargers: 0 rijen — check corridorKey/richting (FWD vs REV), currentM t.o.v. laadpalen vooruit, en of positie voorbij eind corridor'
      );
    }

    return {
      success: true,
      data,
      meta: {
        corridorKey: corridorKeyBound,
        currentM: currentMBound,
        limit: limitBound,
        mode: modeBound,
        minLookaheadM: minLookaheadMBound,
        count: data.length,
      },
    };
  } catch (err) {
    console.error('[RP API] next-chargers DB error', err.message);
    throw err;
  }
}
