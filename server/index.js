import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAuth, requireApiAuth, requirePageAuth } from './auth.js';
import {
  getUser,
  getProgress,
  putProgress,
  deleteProgress,
  listUsersWithStats,
  setAdmin,
  countAdmins
} from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

await setupAuth(app);

/* ── Always-public assets (CSS / JS / images / SW / manifest / data) ── */
app.use('/assets', express.static(path.join(ROOT, 'assets'), {
  maxAge: '1h', etag: true, immutable: false
}));
app.get('/sw.js', (_req, res) => res.sendFile(path.join(ROOT, 'sw.js')));
app.get('/favicon.svg', (_req, res) => res.sendFile(path.join(ROOT, 'assets/favicon.svg')));
app.get('/login.html', (_req, res) => res.sendFile(path.join(ROOT, 'login.html')));
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').sendFile(path.join(ROOT, 'robots.txt'));
});
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').sendFile(path.join(ROOT, 'sitemap.xml'));
});
app.get('/healthz', (_req, res) => res.json({ ok: true }));

/* ── API ── */
app.get('/api/me', requireApiAuth, async (req, res) => {
  try {
    const u = await getUser(req.user.claims.sub);
    if (!u) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      profileImageUrl: u.profile_image_url,
      isAdmin: u.is_admin,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at
    });
  } catch (err) {
    console.error('GET /api/me', err);
    res.status(500).json({ message: 'Failed to load user' });
  }
});

app.get('/api/progress', requireApiAuth, async (req, res) => {
  try {
    const data = await getProgress(req.user.claims.sub);
    res.json(data);
  } catch (err) {
    console.error('GET /api/progress', err);
    res.status(500).json({ message: 'Failed to load progress' });
  }
});

// Whitelist of keys we accept from the client.
// We accept any key starting with `enh:` to remain forward-compatible with
// new features added on the client.
function isAllowedKey(k) {
  return typeof k === 'string' && /^enh:[A-Za-z0-9:_\-\.]{1,80}$/.test(k);
}

app.patch('/api/progress', requireApiAuth, async (req, res) => {
  try {
    const updates = req.body && req.body.updates;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'Body must be { updates: { key: value } }' });
    }
    const entries = Object.entries(updates);
    if (entries.length === 0) return res.json({ written: 0 });
    if (entries.length > 50) {
      return res.status(400).json({ message: 'Too many keys in one update (max 50)' });
    }
    let written = 0;
    for (const [key, value] of entries) {
      if (!isAllowedKey(key)) {
        return res.status(400).json({ message: `Disallowed key: ${key}` });
      }
      if (value === null) {
        await deleteProgress(req.user.claims.sub, key);
      } else {
        await putProgress(req.user.claims.sub, key, value);
      }
      written++;
    }
    res.json({ written });
  } catch (err) {
    console.error('PATCH /api/progress', err);
    res.status(500).json({ message: 'Failed to save progress' });
  }
});

/* ── Admin API ── */
async function requireAdmin(req, res, next) {
  try {
    const u = await getUser(req.user.claims.sub);
    if (!u || !u.is_admin) return res.status(403).json({ message: 'Admin only' });
    next();
  } catch (err) {
    console.error('admin check', err);
    res.status(500).json({ message: 'Admin check failed' });
  }
}
app.get('/api/admin/users', requireApiAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await listUsersWithStats();
    res.json(users);
  } catch (err) {
    console.error('GET /api/admin/users', err);
    res.status(500).json({ message: 'Failed to list users' });
  }
});
app.post('/api/admin/users/:id/admin', requireApiAuth, requireAdmin, async (req, res) => {
  try {
    const isAdmin = req.body && !!req.body.isAdmin;
    const target = await getUser(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // Guardrail: never let the last remaining admin be demoted, even themselves.
    if (!isAdmin && target.is_admin) {
      const n = await countAdmins();
      if (n <= 1) {
        return res.status(409).json({
          message: 'Cannot remove the last admin. Promote another user first.'
        });
      }
    }
    await setAdmin(req.params.id, isAdmin);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST set admin', err);
    res.status(500).json({ message: 'Failed to update' });
  }
});

/* ── Auth-gated HTML pages ── */
const PROTECTED_HTML = [
  '/', '/index.html',
  '/domain1_study_guide.html', '/domain1_practice.html', '/domain1_build_exercise.html',
  '/domain2_study_guide.html', '/domain2_practice.html', '/domain2_build_exercise.html',
  '/domain3_study_guide.html', '/domain3_practice.html', '/domain3_build_exercise.html',
  '/domain4_study_guide.html', '/domain4_practice.html', '/domain4_build_exercise.html',
  '/domain5_study_guide.html', '/domain5_practice.html', '/domain5_build_exercise.html',
  '/anti_patterns.html', '/mock_exam.html', '/flashcards.html', '/report.html', '/admin.html'
];

PROTECTED_HTML.forEach(route => {
  app.get(route, requirePageAuth, (req, res) => {
    const file = route === '/' ? 'index.html' : route.slice(1);
    res.sendFile(path.join(ROOT, file));
  });
});

/* ── 404 ── */
app.use((req, res) => {
  if (req.accepts('html')) return res.redirect('/login.html');
  res.status(404).json({ message: 'Not found' });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CCA Foundations server listening on :${PORT}`);
});
