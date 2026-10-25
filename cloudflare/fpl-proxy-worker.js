// FPL live-data relay for the league dashboard (Cloudflare Worker).
//
// The browser can't read fantasy.premierleague.com directly (no CORS headers),
// so the dashboard asks this Worker instead:
//   https://<your-worker>.workers.dev/api/event-status/
//   -> https://fantasy.premierleague.com/api/event-status/
//
// It also relays the Premier League's match-centre data (line-ups, events with
// minutes, team stats) for the match pop-up:
//   /pl/compseasons      -> latest Premier League season id
//   /pl/season/<id>      -> every fixture of that season
//   /pl/fixture/<id>     -> one match: line-ups, formation, events
//   /pl/stats/<id>       -> one match: team stats
//
// Only these read-only endpoints are allowed, and answers are cached briefly
// so many page loads don't all hit the upstream services.

const FPL_ORIGIN = 'https://fantasy.premierleague.com';
const PL_API = 'https://footballapi.pulselive.com/football';

// [path pattern, upstream URL builder, cache seconds]
const PL_ROUTES = [
  [/^\/pl\/compseasons$/, () => `${PL_API}/competitions/1/compseasons?page=0&pageSize=1`, 21600],
  [/^\/pl\/season\/(\d+)$/, m => `${PL_API}/fixtures?comps=1&compSeasons=${m[1]}&page=0&pageSize=400&altIds=true`, 300],
  [/^\/pl\/fixture\/(\d+)$/, m => `${PL_API}/fixtures/${m[1]}?altIds=true`, 20],
  [/^\/pl\/stats\/(\d+)$/, m => `${PL_API}/stats/match/${m[1]}`, 30]
];

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

    // Premier League match-centre data
    const plRoute = PL_ROUTES.map(([pattern, build, ttl]) => {
      const m = url.pathname.match(pattern);
      return m ? { upstream: build(m), ttl } : null;
    }).find(Boolean);
    if (plRoute) {
      return relayCached(plRoute.upstream, plRoute.ttl, origin, ctx, {
        'User-Agent': 'Mozilla/5.0 (compatible; FPL-League-Dashboard/1.0)',
        'Accept': 'application/json',
        'Origin': 'https://www.premierleague.com',
        'Referer': 'https://www.premierleague.com/'
      });
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

    return relayCached(upstream.toString(), ttl, origin, ctx, {
      'User-Agent': 'Mozilla/5.0 (compatible; FPL-League-Dashboard/1.0)',
      'Accept': 'application/json'
    });
  }
};

// Fetch upstream (or the edge cache) and return it with this dashboard's CORS headers
async function relayCached(upstreamUrl, ttl, origin, ctx, headers) {
  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, { method: 'GET' });
  let response = await cache.match(cacheKey);

  if (!response) {
    const upstreamResponse = await fetch(upstreamUrl, { headers });
    if (!upstreamResponse.ok) {
      return new Response(`Upstream returned ${upstreamResponse.status}`, { status: upstreamResponse.status, headers: corsHeaders(origin) });
    }
    response = new Response(upstreamResponse.body, {
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
