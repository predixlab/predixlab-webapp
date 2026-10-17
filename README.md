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

All routes except sign-in, registration, and OAuth callbacks are protected. Feature availability and data recency remain subject to API configuration and account entitlement.

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
npm run build
npm run preview
```

`build` type-checks the project and writes static assets to `dist/`. The repository has no separate test script; lint and build are the available frontend validation.

## Design and deployment

[DESIGN.md](DESIGN.md) documents the Dashboard's shared interface language. The Azure Static Web Apps workflow builds and publishes `dist/` from the repository root; [`staticwebapp.config.json`](staticwebapp.config.json) supplies the React Router SPA fallback. Deployment requires the Azure Static Web Apps secret referenced by the workflow and an API deployment compatible with the production client base URL.

CI explicitly installs Node.js 24, runs `npm ci` and `npm run build`, then
uploads the prebuilt `dist/` directory with the deployment action's app build
disabled. It does not rely on the deployment image to choose Node or rebuild
the application with a different toolchain.

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
