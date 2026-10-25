# FPL live-data relay (Cloudflare Worker)

The dashboard can't read FPL's data straight from the browser, so it asks this
small relay instead. The relay fetches FPL's public data, caches it for 30–300
seconds, and lets only this dashboard's web address read it.

Free plan: 100,000 requests per day — far more than a league dashboard uses.

## Set it up (about 10 minutes, once)

1. **Create a free account** at https://dash.cloudflare.com/sign-up and confirm your email.
2. In the Cloudflare dashboard, open **Workers & Pages** (under *Compute* in the left menu).
3. Click **Create** → **Create Worker** (start from "Hello World").
4. Name it `fpl-proxy` and click **Deploy**.
5. Click **Edit code**. Delete everything in the editor, paste the whole of
   [`fpl-proxy-worker.js`](fpl-proxy-worker.js), then click **Deploy** again.
6. Copy the Worker's address — it looks like
   `https://fpl-proxy.<your-name>.workers.dev`.
7. Test it: open `https://fpl-proxy.<your-name>.workers.dev/api/event-status/`
   in your browser. You should see FPL data (text starting with `{"status":`).

## Connect the dashboard

Set `FPL_PROXY_BASE` near the top of the *LIVE FPL SYNC* section in `app.js`
to the Worker address (no trailing slash).

To try a relay without changing the code, run this in the browser console on
the dashboard and reload:

```js
localStorage.setItem('fpl_proxy_base', 'https://fpl-proxy.<your-name>.workers.dev')
```

## If you change the dashboard's address

Add the new site address to `ALLOWED_ORIGINS` in the Worker and deploy again.
