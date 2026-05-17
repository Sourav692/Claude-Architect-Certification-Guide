import { pool, query } from './db.js';

/** Upsert a user from OIDC claims and stamp last_login_at.
 *  Uses a transaction-scoped advisory lock so the "first user becomes admin"
 *  bootstrap is race-free across concurrent sign-ins. */
export async function upsertUser(claims) {
  const id   = claims.sub;
  const email = claims.email || null;
  const fn = claims.first_name || null;
  const ln = claims.last_name  || null;
  const img = claims.profile_image_url || null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Single fixed key — only one concurrent upsertUser runs the bootstrap check.
    await client.query('SELECT pg_advisory_xact_lock($1)', [424242]);
    const { rows } = await client.query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url,
                          is_admin, last_login_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5,
               (SELECT COUNT(*) = 0 FROM users),
               NOW(), NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             first_name = EXCLUDED.first_name,
             last_name  = EXCLUDED.last_name,
             profile_image_url = EXCLUDED.profile_image_url,
             updated_at = NOW(),
             last_login_at = NOW()
       RETURNING *`,
      [id, email, fn, ln, img]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
}

/** Returns the number of users currently flagged as admin. */
export async function countAdmins() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM users WHERE is_admin');
  return rows[0].n;
}

export async function getUser(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

/** Return all enh:* progress keys for a user as a flat object. */
export async function getProgress(userId) {
  const { rows } = await query(
    'SELECT key, value FROM progress_kv WHERE user_id = $1',
    [userId]
  );
  const out = {};
  rows.forEach(r => { out[r.key] = r.value; });
  return out;
}

export async function putProgress(userId, key, value) {
  await query(
    `INSERT INTO progress_kv (user_id, key, value, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (user_id, key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = NOW()`,
    [userId, key, JSON.stringify(value)]
  );
}

export async function deleteProgress(userId, key) {
  await query('DELETE FROM progress_kv WHERE user_id = $1 AND key = $2', [userId, key]);
}

/** Admin: list all users with rollup stats from their progress blobs. */
export async function listUsersWithStats() {
  const { rows } = await query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image_url,
           u.is_admin, u.created_at, u.last_login_at,
           COALESCE((SELECT jsonb_array_length(pk.value)
                     FROM progress_kv pk
                     WHERE pk.user_id = u.id AND pk.key = 'enh:attempts:mock'), 0) AS mock_attempts,
           COALESCE((SELECT (SELECT COUNT(*) FROM jsonb_object_keys(pk.value))
                     FROM progress_kv pk
                     WHERE pk.user_id = u.id AND pk.key = 'enh:visited'), 0) AS pages_visited,
           (SELECT MAX(updated_at) FROM progress_kv pk WHERE pk.user_id = u.id) AS last_activity
    FROM users u
    ORDER BY u.last_login_at DESC NULLS LAST
  `);
  return rows;
}

export async function setAdmin(userId, isAdmin) {
  await query('UPDATE users SET is_admin = $1, updated_at = NOW() WHERE id = $2',
              [isAdmin, userId]);
}
