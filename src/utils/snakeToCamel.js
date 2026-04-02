/**
 * Convert snake_case keys to camelCase for JSON API responses.
 * Recurses into plain objects and arrays (e.g. nested chargers).
 */

function snakeToCamelKey(key) {
  return String(key).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
export function keysToCamelCase(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => keysToCamelCase(item));
  }
  if (typeof value === 'object' && value.constructor === Object) {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[snakeToCamelKey(k)] = keysToCamelCase(v);
    }
    return out;
  }
  return value;
}
