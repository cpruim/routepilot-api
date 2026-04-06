-- Service_area-locaties werden gegroepeerd op corridor + floor(anchor_m/1200) alleen.
-- Verschillende serviceplekken in dezelfde 1,2 km-band (andere access_point_id) verdwenen
-- achter één representatieve rij (bv. Fastned Scheiwijk achter Vulpen/Unknown in bucket 29).
-- Oplossing: neem access_point_id op in grouped_location_id (zelfde patroon als exit).

CREATE OR REPLACE FUNCTION public.rp_api_next_charging_locations_v6(
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
WITH base AS (
    SELECT
        m.serving_id,
        m.corridor_key,
        m.canonical_charger_id,
        COALESCE(NULLIF(m.charger_name, ''), 'Unknown charger') AS charger_name,
        COALESCE(NULLIF(m.operator_name, ''), 'Unknown') AS operator_name,
        COALESCE(NULLIF(m.access_mode, ''), 'unknown') AS access_mode,
        COALESCE(NULLIF(m.access_point_type, ''), 'exit') AS access_point_type,
        m.access_point_id,
        m.access_point_name,
        m.access_point_ref,
        m.charger_m,
        m.access_m,
        COALESCE(m.distance_access_to_charger_m, 0) AS detour_m,
        COALESCE(m.charger_count, 1) AS charger_count,
        COALESCE(m.max_power_kw, 0) AS max_power_kw,

        CASE
            WHEN COALESCE(NULLIF(m.access_point_type, ''), '') = 'service_area'
                THEN m.charger_m
            WHEN COALESCE(NULLIF(m.access_point_type, ''), '') IN ('exit', 'access')
                 AND COALESCE(m.distance_access_to_charger_m, 0) > 0
                THEN GREATEST(COALESCE(m.access_m, 0), COALESCE(m.charger_m, 0))
            WHEN COALESCE(NULLIF(m.access_point_type, ''), '') IN ('exit', 'access')
                THEN COALESCE(m.access_m, m.charger_m)
            ELSE
                COALESCE(m.charger_m, m.access_m)
        END AS anchor_m,

        CASE WHEN lower(COALESCE(m.charger_name, '')) = 'unknown charger' THEN 1 ELSE 0 END AS is_unknown_name,
        CASE WHEN lower(COALESCE(m.operator_name, '')) = 'unknown' THEN 1 ELSE 0 END AS is_unknown_operator,
        CASE WHEN lower(COALESCE(m.operator_name, '')) LIKE '%vattenfall%'
               OR lower(COALESCE(m.charger_name, '')) LIKE '%vattenfall%' THEN 1 ELSE 0 END AS is_vattenfall
    FROM public.rp_chargers_on_corridor_access_model m
    WHERE m.corridor_key = p_corridor_key
),
future_only AS (
    SELECT *
    FROM base
    WHERE anchor_m IS NOT NULL
      AND anchor_m >= p_current_m
),
normalized AS (
    SELECT
        f.*,
        CASE
            WHEN f.access_point_type = 'service_area' THEN
                f.corridor_key || ':service:' || COALESCE(f.access_point_id::text, 'na') || ':' || floor(f.anchor_m / 1200.0)::text
            WHEN f.access_point_type IN ('exit', 'access') THEN
                f.corridor_key || ':exit:' || COALESCE(f.access_point_id::text, 'na') || ':' || floor(f.anchor_m / 1200.0)::text
            ELSE
                f.corridor_key || ':other:' || floor(f.anchor_m / 1200.0)::text
        END AS grouped_location_id
    FROM future_only f
),
scored AS (
    SELECT
        n.*,
        CASE
            WHEN n.max_power_kw >= 300 THEN 'premium_hpc'
            WHEN n.max_power_kw >= 100 THEN 'hpc'
            WHEN n.max_power_kw >= 50 THEN 'standard_fast'
            ELSE 'standard'
        END AS highlight_tier,

        (
            CASE
                WHEN n.max_power_kw >= 300 THEN 650
                WHEN n.max_power_kw >= 100 THEN 360
                WHEN n.max_power_kw >= 50 THEN 120
                ELSE 20
            END
            + CASE WHEN n.is_unknown_name = 0 THEN 40 ELSE 0 END
            + CASE WHEN n.is_unknown_operator = 0 THEN 20 ELSE 0 END
            + CASE WHEN n.detour_m = 0 THEN 30
                   WHEN n.detour_m <= 400 THEN 20
                   WHEN n.detour_m <= 1000 THEN 8
                   ELSE 0 END
            - CASE WHEN n.is_unknown_name = 1 THEN 220 ELSE 0 END
            - CASE WHEN n.is_unknown_operator = 1 THEN 50 ELSE 0 END
            - CASE WHEN n.is_vattenfall = 1 AND n.max_power_kw <= 50 THEN 80 ELSE 0 END
        ) AS quality_score
    FROM normalized n
),
group_stats AS (
    SELECT
        s.corridor_key,
        s.grouped_location_id AS location_id,

        string_agg(DISTINCT s.operator_name, ' / ' ORDER BY s.operator_name)
            FILTER (WHERE lower(s.operator_name) <> 'unknown') AS brand_summary_raw,

        COUNT(DISTINCT s.operator_name) FILTER (WHERE lower(s.operator_name) <> 'unknown')::integer AS provider_count,
        SUM(COALESCE(s.charger_count, 0))::integer AS total_connectors,

        bool_or(s.max_power_kw >= 300) AS has_hpc300,
        bool_or(s.max_power_kw >= 100) AS has_hpc100,
        bool_or(s.is_unknown_name = 1) AS any_unknown_name,
        bool_or(s.is_vattenfall = 1) AS any_vattenfall,
        MAX(s.quality_score) AS best_quality_score
    FROM scored s
    GROUP BY s.corridor_key, s.grouped_location_id
),
rep_rows AS (
    SELECT
        s.*,
        ROW_NUMBER() OVER (
            PARTITION BY s.corridor_key, s.grouped_location_id
            ORDER BY
                s.quality_score DESC,
                s.max_power_kw DESC,
                s.anchor_m ASC,
                s.charger_name ASC
        ) AS rep_rank
    FROM scored s
),
grouped AS (
    SELECT
        r.corridor_key,
        r.grouped_location_id AS location_id,

        r.charger_name AS card_title,

        CASE
            WHEN r.access_point_type = 'service_area' THEN r.charger_name
            ELSE COALESCE(
                NULLIF(r.access_point_ref, ''),
                NULLIF(r.access_point_name, ''),
                r.charger_name
            )
        END AS site_name,

        COALESCE(NULLIF(gs.brand_summary_raw, ''), 'Unknown') AS brand_summary,

        r.access_mode,
        (r.access_mode = 'both_directions') AS both_directions,
        'charger_location'::text AS location_type,
        r.access_point_type,

        r.anchor_m AS location_m,
        COALESCE(r.detour_m, 0) AS detour_m,
        r.max_power_kw,
        GREATEST(gs.provider_count, 1) AS provider_count,
        gs.total_connectors,
        r.highlight_tier,
        gs.best_quality_score,
        gs.has_hpc300,
        gs.has_hpc100,
        gs.any_unknown_name,
        gs.any_vattenfall
    FROM rep_rows r
    JOIN group_stats gs
      ON gs.corridor_key = r.corridor_key
     AND gs.location_id = r.grouped_location_id
    WHERE r.rep_rank = 1
),
suppressed AS (
    SELECT
        a.location_id,
        CASE
            WHEN a.any_unknown_name = true
                 AND a.max_power_kw <= 50
            THEN 1

            WHEN a.access_point_type = 'service_area'
                 AND a.max_power_kw <= 50
                 AND EXISTS (
                    SELECT 1
                    FROM grouped b
                    WHERE b.location_id <> a.location_id
                      AND b.max_power_kw >= 100
                      AND ABS(b.location_m - a.location_m) <= 1500
                 )
            THEN 1

            WHEN a.access_point_type IN ('exit', 'access')
                 AND a.max_power_kw <= 50
                 AND EXISTS (
                    SELECT 1
                    FROM grouped b
                    WHERE b.location_id <> a.location_id
                      AND b.max_power_kw >= 100
                      AND ABS(b.location_m - a.location_m) <= 1200
                 )
            THEN 1

            WHEN a.any_vattenfall = true
                 AND a.max_power_kw <= 50
                 AND EXISTS (
                    SELECT 1
                    FROM grouped b
                    WHERE b.location_id <> a.location_id
                      AND b.max_power_kw >= 300
                      AND ABS(b.location_m - a.location_m) <= 2000
                 )
            THEN 1

            ELSE 0
        END AS drop_as_noise
    FROM grouped a
),
ranked AS (
    SELECT
        g.corridor_key,
        row_number() OVER (
            ORDER BY
                g.location_m ASC,
                CASE g.highlight_tier
                    WHEN 'premium_hpc' THEN 1
                    WHEN 'hpc' THEN 2
                    WHEN 'standard_fast' THEN 3
                    ELSE 4
                END ASC,
                g.best_quality_score DESC,
                g.max_power_kw DESC,
                g.card_title ASC
        )::integer AS location_rank,
        g.location_id,
        g.card_title,
        g.site_name,
        g.brand_summary,
        g.access_mode,
        g.both_directions,
        g.location_type,
        g.access_point_type,
        g.location_m,
        round(g.location_m / 1000.0, 3) AS location_km,
        round(g.location_m - p_current_m, 2) AS distance_to_location_m,
        round((g.location_m - p_current_m) / 1000.0, 3) AS distance_to_location_km,
        CASE
            WHEN (g.location_m - p_current_m) < 1000
                THEN round(g.location_m - p_current_m)::text || ' m'
            ELSE round((g.location_m - p_current_m) / 1000.0, 1)::text || ' km'
        END AS distance_to_location_label,
        COALESCE(g.detour_m, 0) AS detour_m,
        CASE
            WHEN COALESCE(g.detour_m, 0) <= 0 THEN '0 m'
            WHEN g.detour_m < 1000 THEN round(g.detour_m)::text || ' m'
            ELSE round(g.detour_m / 1000.0, 1)::text || ' km'
        END AS detour_label,
        g.max_power_kw,
        g.provider_count,
        g.total_connectors,
        g.highlight_tier,
        'through_trip'::text AS route_context
    FROM grouped g
    JOIN suppressed s
      ON s.location_id = g.location_id
    WHERE s.drop_as_noise = 0
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
FROM ranked
ORDER BY location_rank
LIMIT p_limit;
$function$;

COMMENT ON FUNCTION public.rp_api_next_charging_locations_v6(text, numeric, integer) IS
  'service_area grouping key includes access_point_id so adjacent service sites stay distinct.';
