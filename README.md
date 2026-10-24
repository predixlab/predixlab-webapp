# PredixLab Dashboard

[Contributing](CONTRIBUTING.md) | [Security](SECURITY.md) | [Apache-2.0](LICENSE)

PredixLab Dashboard is an authenticated workspace for viewing published PredixLab market data and model results. It presents daily signals with price context, market views, screeners, signal performance, options activity, and account settings. It does not execute trades or provide investment advice.

## Role in PredixLab

```text
PredixLab API -> Dashboard -> Authenticated browser session
                         ↑
PredixLab Portal ---------+  Public product and legal pages
```

Dashboard consumes the API; it does not collect market data or generate signals. Visible content therefore depends on API data, authentication, and publishing jobs.

## Current features

- Daily signals, charts, and signal markers for selected symbols.
- Market summaries, movers, breadth, sentiment, and return distributions.
- Screeners using server-side filters and presets.
- Signal performance, unusual options activity, profile, and subscription pages.
- Email-code and OAuth sign-in, English and Chinese interfaces, and light and dark themes.
- Referral links with verified-registration attribution, premium-access rewards, and conversion reporting.
- MCP agent connections and API key management.

All routes except sign-in, registration, and OAuth callbacks are protected. Feature availability and data recency remain subject to API configuration and account entitlement.

Ticker charts and signal performance use only `is_index` from
`GET /v1/stocks/data/{symbol}` to enable signals. Signal history and UI remain
disabled until that symbol's response confirms `is_index: false`; index symbols
show price data only.

Pivot state labels and technical signal strengths accept both the legacy
buy/sell vocabulary and the directional API vocabulary. Use
`normalizePivotAction` / `normalizeSignalStrength` before comparing or displaying
these values; UI labels are directional and localized. Pivot event identifiers
and backtest trade actions are separate contracts and retain their existing
values. Requests filter Pivot by direction/event, not by state label, so either
API vocabulary can be deployed first. Signal states display as
bullish/bearish/neutral (看涨/看跌/中性). Pivot's relative signal strength is
labelled Score (评分), not a success probability; translation keys and API fields
retain their existing names.

## Run locally

Use Node.js 22.12+ and npm. The GitHub repository is named `predixlab-webapp`;
clone it as `predixlab-dashboard` when using the sibling-repository layout:

```bash
git clone https://github.com/predixlab/predixlab-webapp.git predixlab-dashboard
cd predixlab-dashboard
npm ci
npm run dev
```

Vite serves the app at <http://localhost:3000>. During development, `/api` proxies to `http://localhost:8000`, the default local PredixLab API address.

The application does not read `VITE_API_BASE_URL`. The production API base URL is currently defined in [`src/services/api.ts`](src/services/api.ts); change that source configuration deliberately when using another deployment target.

### Development mock data

Append `?mock=true` to the development URL to have the API adapter use local mock data. Production builds disable mock mode; mock data is not live market or account data.

## Common commands

```bash
npm run lint
npm test
npm run build
npm run preview
```

`build` type-checks the project and writes static assets to `dist/`. `test`
uses Node's built-in runner and Vite's SSR loader to check vocabulary
compatibility, API response normalization, localized badges, agent configuration
safety/key lifecycle and the static hosting policy without a live API.

## Design and deployment

[DESIGN.md](DESIGN.md) documents the Dashboard's shared interface language. The Azure Static Web Apps workflow builds and publishes `dist/` from the repository root; [`public/staticwebapp.config.json`](public/staticwebapp.config.json) supplies the React Router SPA fallback and response headers. Deployment requires the Azure Static Web Apps secret referenced by the workflow and an API deployment compatible with the production client base URL.

CI explicitly installs Node.js 24, runs `npm ci`, `npm test` with `CI=true` and
`npm run build`, then uploads the prebuilt `dist/` directory with the deployment
action's app build disabled. It does not rely on the deployment image to choose Node or rebuild
the application with a different toolchain. The Node test runner is non-watch
and must finish successfully before the build or upload starts.

Official GitHub actions (`actions/*`, `github/*`) and Microsoft actions
(`azure/*`, `Azure/*`) use readable major version tags without trailing version
comments. All other third-party actions must remain pinned to full commit SHAs
with release tags in comments. The SWA action currently publishes only `v1`,
not numbered v1 patch releases. The workflow defaults to read-only repository
access; deployment and preview-close jobs additionally allow PR comments, with
no OIDC permission because neither job uses OIDC. Dependabot checks npm and
GitHub Actions weekly and groups minor/patch updates within each ecosystem.

Local `.env*` files are ignored, except `.env.example`. There are currently no
tracked environment examples or templates; explicitly un-ignore any future
tracked templates rather than committing environment credentials.

### Browser resource policy

The static hosting config retains `noindex` and SPA routes while setting CSP,
HSTS, frame denial, referrer policy, MIME-sniffing protection and
`Permissions-Policy: camera=(), microphone=(), geolocation=()`. The production
resource inventory covers source, HTML, public assets, Vite configuration and
fresh build output; there are currently no environment files to inspect.

| Allowed origin/source | Purpose |
| --- | --- |
| `'self'` | Bundled scripts/styles, self-hosted fonts, images, manifest and PWA workers. |
| `https://api.predixlab.com` | Production API requests. |
| `https://checkout.stripe.com` | Retained Stripe checkout form target only. |
| `https://accounts.google.com` | Retained Google sign-in form target only. |
| `https://login.microsoftonline.com`, `https://login.live.com` | Retained Microsoft sign-in form targets only. |
| `data:` (images only) | Inline image data; fonts remain local. |

GA4/GTM, Google Identity Services and Stripe.js are not loaded by this app.
Google/Microsoft OAuth and Stripe checkout use full-page redirects through the
API, not browser SDK requests or embedded frames. Their script/connection
allowances are removed and `frame-src` is `'none'`; form targets remain allowed.
These navigations, portal/legal links and chart attribution links do not require
additional CSP source origins.

Images are limited to `'self' data:`: the brand, favicon, touch and PWA icons are
local; interface icons are inline SVG; CSS uses gradients rather than remote
images; charts render canvas/inline SVG with the attribution logo disabled.
Avatars display name/email initials, not OAuth profile pictures. No remote or
blob image loads are used, so the blanket `https:` and `blob:` allowances are
removed.

The only inline script initializes the theme before first paint. Its exact
SHA-256 hash is allowed in `script-src`; update that hash when editing the
script (the tests check it). No script `unsafe-inline` or `unsafe-eval` is
allowed. Styles allow `unsafe-inline` for React/chart layout styles.

## Operating boundaries

- Signals, indicators, market views, backtests, and options activity are informational. They make no performance commitment and do not execute trades.
- Live behavior depends on an available API and its external integrations.
- The public product site is maintained separately in [PredixLab Portal](https://github.com/predixlab/predixlab-portal).

## Documentation

- [PredixLab API](https://github.com/predixlab/predixlab-api)
- [PredixLab Signals](https://github.com/predixlab/predixlab-signals)
- [PredixLab Portal](https://github.com/predixlab/predixlab-portal)
- [Design conventions](DESIGN.md)

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md) for validation and pull requests.
Use [GitHub Issues](https://github.com/predixlab/predixlab-webapp/issues) for
bugs and proposals and [SECURITY.md](SECURITY.md) for private vulnerability reports.
Repository documentation is English; the application retains both interface languages.

## License

Copyright 2026 PredixLab contributors.

Project source is licensed under the [Apache License 2.0](LICENSE).
Self-hosted fonts retain their [Manrope](public/fonts/manrope-LICENSE.txt) and
[IBM Plex Mono](public/fonts/ibm-plex-mono-LICENSE.txt) licenses.
Third-party data and hosted services have separate access and usage terms.
