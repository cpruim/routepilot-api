/**
 * @typedef {Object} RpNextChargingLocationsCachePayload
 * @property {boolean} [success]
 * @property {string} [corridor_key]
 * @property {number} [current_m]
 * @property {number} [limit]
 * @property {unknown[]} [data]
 * @property {Record<string, unknown>} [cache]
 * @property {string} [error]
 */

/**
 * @typedef {Object} NextChargersFromGpsMatch
 * @property {string|null} corridorKey
 * @property {number|null} currentM
 * @property {number|null} [confidence]
 * @property {number|null} [distanceToSegmentM]
 * @property {number|null} [headingDiffDeg]
 */

/**
 * @typedef {Object} NextChargersFromGpsResponse
 * @property {boolean} success
 * @property {NextChargersFromGpsMatch|null} match
 * @property {unknown[]} data
 * @property {Record<string, unknown>|null} [cache]
 */

export {};
