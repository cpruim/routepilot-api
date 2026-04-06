-- Align internal v7_1 fetch with /api/next-chargers (Node): request enough rows
-- so the Vattenfall/Unknown filter can still fill p_limit slots.

CREATE OR REPLACE FUNCTION public.rp_api_next_chargers_from_gps_v1(
  p_lat numeric,
  p_lon numeric,
  p_heading numeric,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  corridor_key text,
  current_m numeric,
  match_confidence text,
  location_rank integer,
  location_id text,
  card_title text,
  site_name text,
  brand_summary text,
  access_mode text,
  location_type text,
  distance_to_location_m numeric,
  distance_to_location_km numeric,
  distance_display text,
  detour_seconds integer,
  detour_label text,
  max_power_kw numeric,
  total_connectors integer,
  available_connectors integer,
  route_context text
)
LANGUAGE sql
STABLE
AS $$
  WITH lim AS (
    SELECT GREATEST(COALESCE(p_limit, 5), 1)::integer AS n
  ),
  fetch_n AS (
    SELECT LEAST(50, GREATEST(lim.n + 20, lim.n * 4))::integer AS v71_limit
    FROM lim
  ),
  matched AS (
    SELECT
      m.corridor_key,
      m.current_m,
      m.match_confidence
    FROM public.rp_api_match_corridor_from_gps_v1(
      p_lat::double precision,
      p_lon::double precision,
      p_heading::double precision,
      2500,
      60
    ) m
    LIMIT 1
  ),
  locations AS (
    SELECT
      l.*
    FROM matched m
    CROSS JOIN fetch_n fn
    JOIN LATERAL public.rp_api_next_charging_locations_v7_1(
      m.corridor_key,
      m.current_m,
      fn.v71_limit
    ) l ON TRUE
    WHERE NOT (
      COALESCE(l.max_power_kw, 0) <= 50
      AND (
        COALESCE(l.brand_summary, '') ILIKE '%vattenfall%'
        OR COALESCE(l.brand_summary, '') ILIKE '%unknown%'
      )
    )
  )
  SELECT
    m.corridor_key,
    m.current_m,
    m.match_confidence::text,
    l.location_rank,
    l.location_id,
    l.card_title,
    l.site_name,
    l.brand_summary,
    l.access_mode,
    l.location_type,
    l.distance_to_location_m,
    l.distance_to_location_km,
    l.distance_to_location_label AS distance_display,
    NULL::integer AS detour_seconds,
    l.detour_label,
    l.max_power_kw,
    l.total_connectors,
    NULL::integer AS available_connectors,
    l.route_context
  FROM matched m
  JOIN locations l ON TRUE
  CROSS JOIN lim
  ORDER BY l.location_rank
  LIMIT lim.n;
$$;

COMMENT ON FUNCTION public.rp_api_next_chargers_from_gps_v1(numeric, numeric, numeric, integer) IS
  'v7_1 over-fetch (cap 50) before low-power Vattenfall/Unknown filter so LIMIT still fills p_limit.';
