/* Replit Auth (OIDC) — ported from the JS blueprint to plain ESM. */
import * as client from 'openid-client';
import { Strategy } from 'openid-client/passport';
import passport from 'passport';
import session from 'express-session';
import memoize from 'memoizee';
import connectPgSimple from 'connect-pg-simple';
import { upsertUser } from './storage.js';

if (!process.env.REPL_ID) {
  console.error('REPL_ID is not set — Replit Auth requires it.');
  process.exit(1);
}
if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is not set — set it in Replit Secrets before running.');
  process.exit(1);
}

const getOidcConfig = memoize(
  async () => client.discovery(
    new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
    process.env.REPL_ID
  ),
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPgSimple(session);
  const store = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: 'sessions'
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, maxAge: sessionTtl, sameSite: 'lax' }
  });
}

function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

export async function setupAuth(app) {
  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    try { await upsertUser(tokens.claims()); }
    catch (err) { return verified(err); }
    verified(null, user);
  };

  const registered = new Set();
  const ensureStrategy = (domain) => {
    const name = `replitauth:${domain}`;
    if (registered.has(name)) return;
    passport.use(new Strategy({
      name,
      config,
      scope: 'openid email profile offline_access',
      callbackURL: `https://${domain}/api/callback`
    }, verify));
    registered.add(name);
  };

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));

  app.get('/api/login', (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: 'login consent',
      scope: ['openid', 'email', 'profile', 'offline_access']
    })(req, res, next);
  });

  app.get('/api/callback', (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: '/',
      failureRedirect: '/login.html'
    })(req, res, next);
  });

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}

/** API guard — returns 401 JSON for unauthenticated requests. */
export const requireApiAuth = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated || !req.isAuthenticated() || !user || !user.expires_at) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  if (!user.refresh_token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const config = await getOidcConfig();
    const tokens = await client.refreshTokenGrant(config, user.refresh_token);
    updateUserSession(user, tokens);
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

/** Page guard — redirects unauthenticated users to /login.html. */
export const requirePageAuth = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated || !req.isAuthenticated() || !user || !user.expires_at) {
    return res.redirect('/login.html?from=' + encodeURIComponent(req.originalUrl));
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  if (!user.refresh_token) return res.redirect('/login.html');
  try {
    const config = await getOidcConfig();
    const tokens = await client.refreshTokenGrant(config, user.refresh_token);
    updateUserSession(user, tokens);
    return next();
  } catch {
    return res.redirect('/login.html');
  }
};
