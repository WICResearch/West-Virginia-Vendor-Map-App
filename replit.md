# West Virginia Vendor Map

An interactive research dashboard for comparing vendor access, rurality, and WIC opportunity across West Virginia.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/wv-vendor-map/src/App.tsx` — map dashboard, representative data, browser import/export, filtering, and selection state
- `artifacts/wv-vendor-map/src/index.css` — application theme and responsive visual system
- `artifacts/wv-vendor-map` — runnable web artifact

## Architecture decisions

- The first version is frontend-only so a researcher can load and explore it before connecting a data service.
- Vendor data is normalized in-browser from CSV or JSON to support common spreadsheet exports without requiring a fixed source schema.
- The map uses a deliberately simplified West Virginia geography to keep the statewide comparison legible while remaining dependency-light.

## Product

- Shows representative vendor locations across West Virginia with clickable map points.
- Compares rurality, vendor type, WIC authorization status, and access distance.
- Supports search and filters, a selected-location detail view, CSV/JSON import, and JSON export.
- Frames the map as an access and WIC opportunity analysis rather than a generic store locator.

## User preferences

No standing preferences recorded.

## Gotchas

- Imported records need either latitude/longitude or recognizable West Virginia county/place fields; invalid rows are skipped with a visible import notice.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
