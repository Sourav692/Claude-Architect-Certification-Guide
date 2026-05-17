import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — provision a Postgres database first.');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000
});

export async function query(text, params) {
  return pool.query(text, params);
}
