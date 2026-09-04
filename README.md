# SIEM Light — Frontend

Dashboard for the [`siem-backend`](https://github.com/MergenUchiha/siem-backend)
API: live security events over WebSocket, incident tracking, alert rules,
analytics and the remote log integration.

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript, Vite 7 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Icons | lucide-react |
| Realtime | socket.io-client |
| Data | `fetch`, wrapped in a small typed API layer |

There is no router: `App.tsx` switches between pages and remembers the active
tab in `localStorage`.

## Getting started

The backend must be running first — see its README.

```bash
bun install            # or npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | REST API, including the `/api` prefix |
| `VITE_WS_URL` | `http://localhost:3001` | Socket.IO origin, no prefix |

The dev server binds 5173 with `strictPort`, which is the origin the backend
allows through `CORS_ORIGINS` by default.

## Pages

| Page | What it shows |
|---|---|
| Dashboard | Headline metrics, hourly event chart, severity split |
| Logs | Server-side filtering by severity, source, text and date; paginated; CSV export; manual log entry |
| Incidents | Filter by status and severity, create, update status and assignee, delete |
| Analytics | Source distribution, severity distribution, top addresses |
| Integrations | Remote log source config, connection test, one-off pull, auto-pull, live event feed with client-side filter rules |
| Alerts | Alert rules from the API — enable, disable and delete |
| Settings | Language, theme, display preferences, profile |

## Authentication

Sign in with an account an administrator created; there is no registration
form. The token goes into `localStorage` and is attached by the API layer as a
bearer header, and passed to the Socket.IO handshake — the gateway closes any
connection without a valid one.

A 401 from the API, or a rejected handshake, clears the stored token and
returns to the login screen.

What a role can do is enforced by the server; the UI shows the same pages to
everyone and surfaces the error when an action is refused. `viewer` can read,
`analyst` can also write logs and incidents, `admin` can also reach settings,
alert rules and account management.

## Layout

```
src/
├── services/
│   ├── api.ts         every REST call, one `apiFetch` helper, ApiError
│   └── websocket.ts   Socket.IO singleton with the handshake token
├── contexts/          language (en/ru/tk) and theme providers
├── i18n/i18n.ts       all three translations, typed
├── components/
│   ├── layout/        Sidebar, Header (notification bell)
│   ├── dashboard/     MetricCard
│   └── ui/            Toast, ConfirmDialog
├── hooks/useApi.ts    useFetch, useMutation, useDebounce, useInterval
├── pages/             one file per page
└── types/             shared domain types
```

## Scripts

```bash
npm run dev       # dev server on 5173
npm run build     # tsc -b && vite build
npm run preview   # serve the production build
npm run lint      # ESLint
```

## Known limitations

* **No tests.** Nothing here is covered; correctness was checked by running
  the app against the API.
* **One bundle.** About 1.1 MB minified, 300 kB gzipped — Recharts is most of
  it. No code splitting or lazy routes.
* **The token lives in `localStorage`,** so any script running on the page can
  read it. Moving it to an httpOnly cookie needs the backend to set one.
* **Creating and editing alert rules is not in the UI.** Rules can be enabled,
  disabled and deleted here; creating one means calling the API directly.
* **Settings are local.** Language, theme, refresh interval and profile live in
  `localStorage` — only the retention values on the Settings page correspond
  to anything the server stores.
* **Filter rules on the Integrations feed are client-side** and apply to the
  live view only; they do not filter what is stored.

## Licence

MIT
