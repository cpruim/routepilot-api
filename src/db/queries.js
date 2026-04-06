/**
 * SQL queries and function calls for RP API.
 * All queries use parameterized statements.
 */

/**
 * List corridors (from rp_api_corridors).
 * Excludes geom; returns corridor_key, country_code, ref, corridor_dir, length_m.
 */
export const listCorridors = `
  SELECT corridor_key, country_code, ref, corridor_dir, length_m
  FROM rp_api_corridors
  ORDER BY country_code, ref, corridor_dir
  LIMIT $1
`;

/**
 * Next chargers along a corridor (calls DB function).
 * Params: corridor_key, current_m, limit.
 */
export const nextChargers = `
  SELECT * FROM rp_api_next_chargers($1, $2, $3)
`;

/**
 * Next chargers v2 along a corridor (calls DB function).
 * Params: $1 = corridorKey (text), $2 = currentM (numeric), $3 = limit (integer).
 */
export const nextChargersV2 = `
  SELECT *
  FROM public.rp_api_next_chargers_v2($1::text, $2::numeric, $3::integer)
`;

/**
 * Next chargers v3: index-based lookup via rp_corridor_charger_index (bucket_m).
 * Same params and response shape as v2; use for performance at scale.
 * Params: $1 = corridorKey (text), $2 = currentM (numeric), $3 = limit (integer).
 */
export const nextChargersV3 = `
  SELECT *
  FROM public.rp_api_next_chargers_v3($1::text, $2::numeric, $3::integer)
`;

/** Lengte corridor (m) voor diagnostiek bij /api/next-chargers. */
export const corridorLengthByCorridorKey = `
  SELECT COALESCE(length_m, 0)::numeric AS length_m
  FROM rp_api_corridors
  WHERE corridor_key = $1
  LIMIT 1
`;

/**
 * Match position to corridor (v2). Same flow as SQL validation query.
 * Params: lat, lon, heading_deg, max_distance_m (2500), max_heading_diff_deg (60).
 * Returns: corridor_key, current_m, and match metadata.
 */
export const matchPositionToCorridorV2 = `
  SELECT * FROM public.rp_match_position_to_corridor_v2($1::double precision, $2::double precision, $3::double precision, 2500, 60)
  LIMIT 1
`;

/**
 * Match corridors from GPS + heading (debug; calls DB function).
 * Params: lat, lon, heading_deg, limit.
 */
export const matchCorridorsFromGpsHeading = `
  SELECT * FROM rp_api_match_corridors_from_gps_heading($1, $2, $3, $4)
`;

/**
 * Vaste bucket voor rp_api_next_charging_locations_v1(p_bucket_size_m); samen met named args
 * voorkomt PostgreSQL-overload-resolutie (text, numeric, integer) → (text, numeric, numeric).
 */
export const NEXT_CHARGING_LOCATIONS_BUCKET_SIZE_M = 1000;

/**
 * Next charging locations ahead on corridor — rp_api_next_charging_locations_v1 4-arg overload,
 * expliciet benoemde parameters (geen positionele 3-arg call naar v1).
 * Params: $1 corridorKey (text), $2 currentM (numeric), $3 limit (integer), $4 bucket_size_m (integer).
 * DB snake_case wordt in mapNextChargingLocation expliciet naar API camelCase gemapt.
 */
export const nextChargingLocationsV71 = `
  SELECT *
  FROM public.rp_api_next_charging_locations_v1(
    p_corridor_key => $1::text,
    p_current_m => $2::numeric,
    p_limit => $3::integer,
    p_bucket_size_m => $4::integer
  )
`;

/**
 * Single best corridor match from GPS + heading (API-wrapper in DB).
 * DB-signatuur: p_lat, p_lon double precision; p_heading numeric; p_max_candidates, p_max_distance_m integer.
 */
export const matchCorridorFromGpsV1 = `
  SELECT *
  FROM public.rp_api_match_corridor_from_gps_v1(
    $1::double precision,
    $2::double precision,
    $3::numeric,
    $4::integer,
    $5::integer
  )
  LIMIT 1
`;

/**
 * Next chargers from GPS in één DB-call (corridor + locaties in SQL).
 * Params: lat, lon, heading (numeric), limit (integer, default in DB 5).
 */
export const nextChargersFromGpsV1 = `
  SELECT *
  FROM public.rp_api_next_chargers_from_gps_v1($1::numeric, $2::numeric, $3::numeric, $4::integer)
`;

/**
 * Live availability for location ids.
 * Param: text[] of access ids etc.
 */
export const locationAvailabilityV1 = `
  SELECT public.rp_api_location_availability_v1($1::text[]) AS data
`;

/**
 * QA reviewpunten (corridor-based, geen GPS).
 * Kolommen: review_id, motorway, corridor_key, current_m, category, label, source_label, priority.
 * $1 = motorway (null = geen filter), $2 = direction FWD|REV (null = geen corridor_key-filter),
 * $3 = category ('all' of null = geen category-filter).
 * Sort: corridor_key, current_m.
 */
export const listQaReviewPointsV1 = `
  SELECT
    review_id,
    motorway,
    corridor_key,
    current_m,
    category,
    label,
    source_label,
    priority
  FROM public.rp_qa_review_points_v1
  WHERE ($1::text IS NULL OR motorway = $1)
    AND (
      $2::text IS NULL
      OR corridor_key LIKE ('NL_' || $1 || '_' || $2)
    )
    AND (
      $3::text IS NULL
      OR $3 = 'all'
      OR category = $3
    )
  ORDER BY corridor_key, current_m
`;
