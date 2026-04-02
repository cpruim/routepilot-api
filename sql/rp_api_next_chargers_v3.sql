-- Migration: next-chargers v3 — index-based lookup for performance at scale
-- Purpose: Use prebuilt rp_corridor_charger_index (bucket_m) to fetch a small candidate set
--          and join to rp_chargers_on_corridor_v4 instead of scanning the full corridor table.
-- Keeps: same API contract; v2 remains in place.

-- =============================================================================
-- 1. Indexes for fast lookup (idempotent)
-- =============================================================================

-- Index: find candidates by corridor + bucket + order by rank (single index scan, no sort)
CREATE INDEX IF NOT EXISTS idx_rp_corridor_charger_index_lookup
  ON public.rp_corridor_charger_index (corridor_key, bucket_m, charger_rank);

-- Index: join from index result to corridor charger details by (corridor_key, canonical_charger_id)
CREATE INDEX IF NOT EXISTS idx_rp_chargers_on_corridor_v4_lookup
  ON public.rp_chargers_on_corridor_v4 (corridor_key, canonical_charger_id);

-- =============================================================================
-- 2. Function: rp_api_next_chargers_v3 (bucket-based, small candidate set)
-- =============================================================================
-- Reason for v3: v2 may scan or filter large corridor data per request.
-- v3: (1) compute bucket from current_m, (2) read only index rows for that bucket,
--     (3) join to charger details for those candidates, (4) filter ahead, limit.
-- Response shape matches v2 so the API response format stays unchanged.

CREATE OR REPLACE FUNCTION public.rp_api_next_chargers_v3(
  p_corridor_key text,
  p_current_m numeric,
  p_limit integer
)
RETURNS TABLE (
  corridor_key text,
  canonical_charger_id uuid,
  charger_name text,
  operator_name text,
  max_power_kw numeric,
  access_point_type text,
  access_point_id text,
  access_point_name text,
  access_point_ref text,
  access_m numeric,
  access_km numeric,
  charger_m numeric,
  charger_km numeric,
  distance_to_access_m numeric,
  distance_to_access_km numeric,
  distance_to_access_label text,
  distance_access_to_charger_m numeric,
  distance_access_to_charger_label text
)
LANGUAGE sql
STABLE
AS $$
  WITH params AS (
    -- 100 m buckets with 25 m offset to match rp_corridor_charger_index (e.g. 20025, 20125, …)
    SELECT (floor((p_current_m - 25) / 100.0) * 100 + 25)::integer AS bucket_m
  ),
  candidate_chargers AS (
    -- Small candidate set from index only; +5 to allow filtering ahead and limit
    SELECT
      idx.canonical_charger_id,
      idx.charger_rank,
      idx.charger_m,
      idx.distance_ahead_m
    FROM public.rp_corridor_charger_index idx
    CROSS JOIN params p
    WHERE idx.corridor_key = p_corridor_key
      AND idx.bucket_m = p.bucket_m
    ORDER BY idx.charger_rank
    LIMIT greatest(p_limit + 5, 15)
  )
  SELECT
    c.corridor_key,
    c.canonical_charger_id,
    c.charger_name,
    c.operator_name,
    c.max_power_kw,
    c.access_point_type,
    c.access_point_id,
    c.access_point_name,
    c.access_point_ref,
    c.access_m,
    c.access_km,
    c.charger_m,
    c.charger_km,
    c.distance_to_access_m,
    c.distance_to_access_km,
    c.distance_to_access_label,
    c.distance_access_to_charger_m,
    c.distance_access_to_charger_label
  FROM candidate_chargers idx
  JOIN public.rp_chargers_on_corridor_v4 c
    ON c.canonical_charger_id = idx.canonical_charger_id
   AND c.corridor_key = p_corridor_key
  WHERE idx.charger_m > p_current_m
  ORDER BY idx.charger_rank
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.rp_api_next_chargers_v3(text, numeric, integer) IS
  'Next chargers along corridor from current_m using rp_corridor_charger_index (bucket-based). Same contract as v2 for API compatibility.';
