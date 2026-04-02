import { checkConnection } from '../db/pool.js';

/**
 * GET /health - API and database health.
 */
export async function getHealth(req, res, next) {
  try {
    const database = await checkConnection();
    res.json({ ok: true, database: !!database });
  } catch (err) {
    next(err);
  }
}
