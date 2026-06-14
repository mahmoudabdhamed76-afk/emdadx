# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

EmdadX / Ozarex (إمداد إكس) is a single-tenant Arabic (RTL) ERP for supply & accounting:
invoices, issuances ("صرف ورق"), customers, suppliers, products/stock, payments,
expenses, employees/salaries, bank transfers, notes, and an audit log.

It is a **zero-dependency Node.js app**: no `node_modules`, no framework, no build step.
The backend uses only Node built-ins (`node:http`, `node:sqlite`, `node:fs`). **Node.js 22+ is
required** because `node:sqlite` (`DatabaseSync`) only exists in Node 22.5+.

## Commands

```bash
# Run the server (serves API + frontend on one port)
node backend/server.js          # or: npm start
PORT=3000 node backend/server.js   # change port (default 8787)

# Open the app
http://localhost:8787            # redirects to the APP_PATH prefix
```

There are **no tests, no linter, and no build/bundle step** — `package.json` defines only
`start`. The frontend is served as-is from `frontend/public/`. To verify changes, run the
server and exercise the UI or hit the API endpoints directly.

Default login is `admin` / `admin` (seeded on first run if the `users` table is empty).

## Architecture

### The whole-state "blob" sync model (most important concept)

There is **no per-entity REST API**. The entire application state is one big JSON object
("the blob") with keys like `customers`, `invoices`, `products`, `settings`, `counters`, etc.

- **Frontend** holds the full blob in memory as `DB.data` (`frontend/public/index.html`).
- **GET `/api/data`** returns the whole blob; the frontend loads it on boot (`bootstrapFromServer`).
- **POST `/api/data`** sends the *entire* blob back. The server **wipes and re-inserts every
  table** inside one transaction (`importBlob` in `backend/src/bridge.js`), then snapshots a backup.
- Saves are debounced (~250ms) and serialized client-side, then pushed wholesale.

So a "save" is always a full-state replace, not a targeted update. Keep this in mind: editing
one record means the client mutates its in-memory blob and re-POSTs everything.

### Backend (`backend/`)

- **`server.js`** — a hand-rolled `http.createServer` router. Handles `/api/health`,
  `/api/version`, `/api/data` (GET/POST), `/api/events` (SSE), `/api/backups`, `/api/reset`,
  serves `/sw.js` at root scope, and falls back to serving `frontend/public/` static files
  (SPA fallback to `index.html`). CORS is wide open (`*`). All responses are `no-store`.
- **`db/index.js`** — opens/creates the SQLite file, runs `schema.sql`, seeds the default admin
  and the default counters. DB path is `DATA_DIR/ozarex.db` where `DATA_DIR` defaults to
  `backend/data/` (override with the `DATA_DIR` env var — required for a mounted volume).
- **`db/schema.sql`** — normalized tables. Header/line-item split for `invoices`/`invoice_items`
  and `issuances`/`issuance_items`. WAL mode, foreign keys on.
- **`src/bridge.js`** — the translation layer between the flat frontend blob and normalized
  tables. `exportBlob()` reads tables → blob; `importBlob()` writes blob → tables.

### bridge.js conventions (read before touching the data model)

- **camelCase ↔ snake_case**: frontend uses camelCase (`customerId`), DB uses snake_case
  (`customer_id`). `bridge.js` converts both directions automatically.
- **The `data` JSON column**: most tables have typed columns plus a catch-all `data TEXT`
  column. Any blob field that isn't a known column is JSON-stringified into `data` on insert
  and merged back onto the object on export. **This means you usually do NOT need a schema
  migration to add a new field** — it just rides along inside `data`. Add a real column only
  when you need to index/query on it.
- **Defensive coercion**: `NUMERIC_REQUIRED` forces NOT-NULL numeric columns to safe defaults,
  and inserts retry-then-skip a bad row rather than failing the whole save. The goal is that one
  malformed record never breaks the entire blob POST.
- **Field aliases**: e.g. stock moves use `quantity` in the frontend but `qty` in the DB;
  `customPrices` on customers is preserved explicitly. When adding entities, follow the existing
  alias-handling pattern in `insertGeneric`.

### Real-time sync (SSE)

`/api/events` is a Server-Sent Events stream. After any successful POST `/api/data`, the server
bumps a monotonic `_dataVersion` and broadcasts `data_changed` to all connected clients. Clients
don't receive the data over SSE — they get a version token and then pull `/api/data` (or check
`/api/version`) to refresh. Heartbeats every 15s keep connections alive past proxy idle timeouts.

### Offline support

`frontend/public/sw.js` is a service worker that caches the app shell and queues saves in
IndexedDB (`OfflineManager` in `index.html`). When offline, the latest snapshot is queued; on
reconnect, only the most recent payload is flushed to `/api/data`. API requests are never cached.

### Frontend (`frontend/public/index.html`)

The entire UI is **one ~25,000-line file** — HTML, CSS (`<style>`), and JS (`<script>`) inline,
plus a few `print`-window templates with their own embedded styles. There is no module system.
Functions are global (`saveInvoice`, `saveCustomer`, `renderPage`, etc.). External CDN scripts:
Chart.js and modern-screenshot. When editing the frontend, search within this single file rather
than expecting separate component files.

## Deployment

Targets **Railway via Nixpacks (NOT Docker)** — see `railway.json` and `nixpacks.toml`. Railway
auto-provides `PORT` (do not set it). Health check path is `/api/health`. For persistence, mount
a volume at the data directory and point `DATA_DIR` at it so the SQLite DB survives redeploys.

### Env vars

- `PORT` — listen port (Railway sets this automatically; default 8787 locally).
- `APP_PATH` — URL path prefix the app is mounted under. **Defaults to `/Ozarex`.** Set it to an
  **empty string** when serving from a custom domain root.
- `DATA_DIR` — directory for `ozarex.db` (default `backend/data/`).
- `HOST`, `PUBLIC_DIR`, `TZ` — optional overrides.

## Gotcha: inconsistent branding/path names

The project is branded inconsistently across the codebase. Be careful — these strings must agree
for routing to work:

- Server `APP_PATH` default: `/Ozarex`
- Frontend `detectApiBase()` strips the prefix `/EmdadX-ERP` (in `index.html`)
- DB file: `ozarex.db`; README refers to `emdadx.db`
- Service worker cache: `emdadx-v1`; localStorage keys use `emdadx_erp_v1`

If you change the mount path / `APP_PATH`, update **both** the server prefix and the
`detectApiBase()` regex in the frontend, or the SPA will fail to reach its own API.

## Git workflow

`README.txt` (Arabic) documents deployment. Commit messages in history mix Arabic and English —
match the surrounding style. The SQLite DB is created at runtime under `DATA_DIR` (default
`backend/data/`); there is no `.gitignore`, so never `git add` the database file or the data dir.
