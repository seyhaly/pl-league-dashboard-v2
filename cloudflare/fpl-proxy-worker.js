// FPL live-data relay for the league dashboard (Cloudflare Worker).
//
// The browser can't read fantasy.premierleague.com directly (no CORS headers),
// so the dashboard asks this Worker instead:
//   https://<your-worker>.workers.dev/api/event-status/
//   -> https://fantasy.premierleague.com/api/event-status/
//
// Only read-only FPL endpoints the dashboard uses are allowed, and answers are
// cached briefly so many page loads don't all hit FPL.

const FPL_ORIGIN = 'https://fantasy.premierleague.com';

// Sites allowed to read the responses in a browser
const ALLOWED_ORIGINS = [
  'https://seyhaly.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765'
];

// [path pattern, cache seconds]
const ROUTES = [
  [/^\/api\/event-status\/$/, 30],
  [/^\/api\/event\/\d+\/live\/$/, 30],
  [/^\/api\/fixtures\/$/, 30],
  [/^\/api\/leagues-classic\/\d+\/standings\/$/, 60],
  [/^\/api\/entry\/\d+\/event\/\d+\/picks\/$/, 60],
  [/^\/api\/entry\/\d+\/history\/$/, 120],
  [/^\/api\/entry\/\d+\/transfers\/$/, 120],
  [/^\/api\/entry\/\d+\/$/, 300],
  [/^\/api\/bootstrap-static\/$/, 300]
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
    'Vary': 'Origin'
  };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    const route = ROUTES.find(([pattern]) => pattern.test(url.pathname));
    if (!route) {
      return new Response('Not an allowed FPL endpoint', { status: 404, headers: corsHeaders(origin) });
    }
    const ttl = route[1];

    // Only the fixtures endpoint takes a query (?event=N); drop anything else
    const upstream = new URL(FPL_ORIGIN + url.pathname);
    if (url.pathname === '/api/fixtures/' && /^\d+$/.test(url.searchParams.get('event') || '')) {
      upstream.searchParams.set('event', url.searchParams.get('event'));
    }

    const cache = caches.default;
    const cacheKey = new Request(upstream.toString(), { method: 'GET' });
    let response = await cache.match(cacheKey);

    if (!response) {
      const fplResponse = await fetch(upstream.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FPL-League-Dashboard/1.0)',
          'Accept': 'application/json'
        }
      });
      if (!fplResponse.ok) {
        return new Response(`FPL returned ${fplResponse.status}`, { status: fplResponse.status, headers: corsHeaders(origin) });
      }
      response = new Response(fplResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': `public, max-age=${ttl}`
        }
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    const out = new Response(response.body, response);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  }
};
