-- Fix: v7_1 mocht 50 kW-locaties wegfilteren als er binnen 12 km een HPC is.
-- Dat sloeg ook op service_area (bv. Fastned De Keizer), terwijl v7 die rij bewust behoudt.
-- Door service_area uit te sluiten van suppress_low_value_single blijven geldige
-- tankshop-/serviceplek-locaties in through_trip zichtbaar naast exit-HPC's.

CREATE OR REPLACE FUNCTION public.rp_api_next_charging_locations_v7_1(
  p_corridor_key text,
  p_current_m numeric,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  corridor_key text,
  location_rank integer,
  location_id text,
  card_title text,
  site_name text,
  brand_summary text,
  access_mode text,
  both_directions boolean,
  location_type text,
  access_point_type text,
  location_m numeric,
  location_km numeric,
  distance_to_location_m numeric,
  distance_to_location_km numeric,
  distance_to_location_label text,
  detour_m numeric,
  detour_label text,
  max_power_kw numeric,
  provider_count integer,
  total_connectors integer,
  highlight_tier text,
  route_context text
)
LANGUAGE sql
STABLE
AS $function$
WITH raw_candidates AS (
    SELECT
        v7.*
    FROM public.rp_api_next_charging_locations_v7(
        p_corridor_key,
        p_current_m,
        GREATEST(COALESCE(p_limit, 5), 20)
    ) AS v7
),

parsed_candidates AS (
    SELECT
        r.*,
        CASE
            WHEN r.location_id ~ '^[^:]+:exit:-?[0-9]+:' THEN
                substring(r.location_id FROM '^[^:]+:exit:(-?[0-9]+):')::bigint
            ELSE NULL
        END AS parsed_exit_access_point_id
    FROM raw_candidates r
),

exit_provider_rollup AS (
    SELECT
        s.corridor_key,
        s.access_point_id,
        string_agg(
            DISTINCT s.canonical_provider_name_v10_3,
            ' / '
            ORDER BY s.canonical_provider_name_v10_3
        ) FILTER (
            WHERE coalesce(s.routepilot_provider_whitelisted, false) = true
              AND coalesce(s.canonical_provider_name_v10_3, 'Unknown') <> 'Unknown'
        ) AS provider_brand_summary,
        count(DISTINCT s.canonical_provider_name_v10_3) FILTER (
            WHERE coalesce(s.routepilot_provider_whitelisted, false) = true
              AND coalesce(s.canonical_provider_name_v10_3, 'Unknown') <> 'Unknown'
        ) AS whitelisted_provider_count,
        max(coalesce(s.max_power_kw, 0)) FILTER (
            WHERE coalesce(s.routepilot_provider_whitelisted, false) = true
        ) AS strongest_whitelisted_power_kw,
        count(*) FILTER (
            WHERE coalesce(s.routepilot_provider_whitelisted, false) = true
              AND coalesce(s.max_power_kw, 0) >= 150
        ) AS strong_whitelisted_rows
    FROM public.rp_chargers_on_corridor_serving s
    WHERE s.corridor_key = p_corridor_key
      AND s.access_point_type = 'exit'
    GROUP BY
        s.corridor_key,
        s.access_point_id
),

rescored AS (
    SELECT
        p.corridor_key,
        p.location_id,
        p.card_title,
        p.site_name,
        COALESCE(epr.provider_brand_summary, p.brand_summary) AS brand_summary,
        p.access_mode,
        p.both_directions,
        p.location_type,
        p.access_point_type,
        p.location_m,
        p.location_km,
        p.distance_to_location_m,
        p.distance_to_location_km,
        p.distance_to_location_label,
        p.detour_m,
        p.detour_label,
        p.max_power_kw,
        GREATEST(
            COALESCE(p.provider_count, 0),
            COALESCE(epr.whitelisted_provider_count, 0)
        )::integer AS provider_count,
        p.total_connectors,
        p.highlight_tier,
        p.route_context,
        p.parsed_exit_access_point_id,
        epr.whitelisted_provider_count,
        epr.strong_whitelisted_rows,
        epr.strongest_whitelisted_power_kw,

        CASE
            WHEN coalesce(p.max_power_kw, 0) <= 50
             AND COALESCE(p.access_point_type, '') <> 'service_area'
             AND coalesce(GREATEST(COALESCE(p.provider_count, 0), COALESCE(epr.whitelisted_provider_count, 0)), 0) <= 1
             AND coalesce(p.total_connectors, 0) <= 1
             AND EXISTS (
                 SELECT 1
                 FROM raw_candidates stronger
                 WHERE stronger.location_m > p.location_m
                   AND stronger.location_m <= p.location_m + 12000
                   AND (
                       coalesce(stronger.max_power_kw, 0) >= 150
                       OR coalesce(stronger.highlight_tier, '') IN ('premium_hpc', 'hpc')
                   )
             )
            THEN true
            ELSE false
        END AS suppress_low_value_single
    FROM parsed_candidates p
    LEFT JOIN exit_provider_rollup epr
      ON epr.corridor_key = p.corridor_key
     AND epr.access_point_id = p.parsed_exit_access_point_id
),

filtered AS (
    SELECT *
    FROM rescored
    WHERE suppress_low_value_single = false
),

reranked AS (
    SELECT
        corridor_key,
        row_number() OVER (
            ORDER BY location_m ASC
        )::integer AS location_rank,
        location_id,
        card_title,
        site_name,
        brand_summary,
        access_mode,
        both_directions,
        location_type,
        access_point_type,
        location_m,
        location_km,
        distance_to_location_m,
        distance_to_location_km,
        distance_to_location_label,
        detour_m,
        detour_label,
        max_power_kw,
        provider_count,
        total_connectors,
        highlight_tier,
        route_context
    FROM filtered
)
SELECT
    corridor_key,
    location_rank,
    location_id,
    card_title,
    site_name,
    brand_summary,
    access_mode,
    both_directions,
    location_type,
    access_point_type,
    location_m,
    location_km,
    distance_to_location_m,
    distance_to_location_km,
    distance_to_location_label,
    detour_m,
    detour_label,
    max_power_kw,
    provider_count,
    total_connectors,
    highlight_tier,
    route_context
FROM reranked
WHERE location_rank <= COALESCE(p_limit, 5)
ORDER BY location_rank;
$function$;

COMMENT ON FUNCTION public.rp_api_next_charging_locations_v7_1(text, numeric, integer) IS
  'v7 + exit brand rollup; service_area rows are not dropped by suppress_low_value_single (50 kW near HPC).';
