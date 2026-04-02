-- Validation queries for rp_api_next_chargers_from_gps_v1 hotfix
-- Target DB: RP_OFFLINE_MASTER_DB (schema: public)
-- Run after applying:
--   sql/rp_api_next_chargers_from_gps_v1_hotfix_v71.sql

-- 1) Verify Shell Recharge and Fastned De Keizer are no longer merged.
-- Expected: separate rows / distinct location_id values for each site.
SELECT
  t.location_rank,
  t.location_id,
  t.card_title,
  t.brand_summary,
  t.max_power_kw
FROM public.rp_api_next_chargers_from_gps_v1(51.5866, 4.7760, 3.13, 10) t
WHERE t.card_title ILIKE '%Shell Recharge%'
   OR t.card_title ILIKE '%Fastned De Keizer%'
ORDER BY t.location_rank;

-- 2) Verify Oosterhout grouping is logically correct (no broad incorrect merge).
-- Expected: no single row that combines unrelated brands from separate exit subgroups.
SELECT
  t.location_rank,
  t.location_id,
  t.card_title,
  t.site_name,
  t.brand_summary
FROM public.rp_api_next_chargers_from_gps_v1(51.5866, 4.7760, 3.13, 15) t
WHERE t.card_title ILIKE '%Oosterhout%'
   OR t.brand_summary ILIKE '%IONITY%'
   OR t.brand_summary ILIKE '%Tesla%'
ORDER BY t.location_rank;

-- 3) Verify Vattenfall/Unknown low-power noise no longer appears as top next location.
-- Expected: zero rows in the first 5 that match the noise condition.
WITH top5 AS (
  SELECT *
  FROM public.rp_api_next_chargers_from_gps_v1(51.5866, 4.7760, 3.13, 5)
)
SELECT
  t.location_rank,
  t.location_id,
  t.card_title,
  t.brand_summary,
  t.max_power_kw
FROM top5 t
WHERE COALESCE(t.max_power_kw, 0) <= 50
  AND (
    COALESCE(t.brand_summary, '') ILIKE '%vattenfall%'
    OR COALESCE(t.brand_summary, '') ILIKE '%unknown%'
  );
