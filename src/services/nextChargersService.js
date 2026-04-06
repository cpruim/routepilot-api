/**
 * GET /api/next-chargers: zelfde bron als GPS-route — v7_1 + dezelfde Vattenfall/Unknown-filter.
 * Haalt bewust méér rijen op dan `limit` (zoals GPS zou moeten na filter) zodat na filter
 * alsnog genoeg locaties overblijven; ranks worden client-side 1..n.
 */
import { pool } from '../db/pool.js';
import {
  nextChargingLocationsV71,
  NEXT_CHARGING_LOCATIONS_BUCKET_SIZE_M,
  corridorLengthByCorridorKey,
} from '../db/queries.js';
import {
  isNoisyLowPowerVattenfallRow,
  mapRowToNextChargerLocationCard,
} from '../utils/mapNextChargerLocationCard.js';

const FN_NAME = 'public.rp_api_next_charging_locations_v1 (named p_corridor_key, p_current_m, p_limit, p_bucket_size_m)';
const DEFAULT_LIMIT = 5;
const DEFAULT_MODE = 'through_trip';
const DEFAULT_MIN_LOOKAHEAD_M = 100000;
/** Genoeg kandidaten om na dezelfde noise-filter als GPS-route alsnog `limit` items te vullen. */
const INTERNAL_V71_FETCH_CAP = 50;

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

  try {
    console.log('[RP API] next-chargers: function called:', FN_NAME);
    console.log('[RP API] next-chargers: params', {
      corridorKey: corridorKeyBound,
      currentM: currentMBound,
      limit: limitBound,
      mode: modeBound,
      minLookaheadM: minLookaheadMBound,
      note: 'mode/minLookaheadM worden niet meer naar de DB doorgegeven (v1-locaties-pipeline)',
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

    const fetchLimit = Math.min(
      INTERNAL_V71_FETCH_CAP,
      Math.max(limitBound + 20, limitBound * 4)
    );
    const result = await pool.query(nextChargingLocationsV71, [
      corridorKeyBound,
      currentMBound,
      fetchLimit,
      NEXT_CHARGING_LOCATIONS_BUCKET_SIZE_M,
    ]);
    const rawRows = result.rows ?? [];
    const filtered = rawRows.filter((r) => !isNoisyLowPowerVattenfallRow(r));
    const capped = filtered.slice(0, limitBound);
    const data = capped.map((r, idx) => {
      const card = mapRowToNextChargerLocationCard(r);
      return { ...card, rank: idx + 1 };
    });

    console.log('[RP API] next-chargers: row count:', data.length, {
      rawFromDb: rawRows.length,
      v71FetchLimit: fetchLimit,
      afterNoiseFilter: filtered.length,
    });
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
