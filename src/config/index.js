/**
 * Application configuration from environment variables.
 * All DB and server settings are configurable via .env.
 */
const required = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];

function loadConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(', ')}. Copy .env.example to .env and set values.`);
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    db: {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      min: parseInt(process.env.PGPOOL_MIN || '2', 10),
      max: parseInt(process.env.PGPOOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  };
}

export const config = loadConfig();
