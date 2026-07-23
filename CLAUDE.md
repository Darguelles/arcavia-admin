# Arcavia Admin — agent guide

Admin panel (SPA) for **Arcavia Quest**. React 19 + TypeScript + Vite, served under
`/admin`. It is a thin management UI over the **`arcavia-api`** FastAPI backend (v2)
located at `../arcavia-api`. This file gives an agent the context needed to work here
without re-discovering it. See also `docs/admin-architecture.md`, `docs/api-contract.md`,
`docs/operator-guide.md`, and the backend schemas/routers referenced below.

## Run & verify

- **Use Docker** for the whole platform — host Node/Python may be the wrong versions.
  From the repo root: `docker compose up` →
  admin at `http://localhost:3001/admin/`, API + docs at `http://localhost:8000` (`/docs`),
  player PWA at `http://localhost:3000`. Vite dev server runs with HMR + volume mount, so
  source edits are live; you rarely need to restart.
- **Local default admin** (pre-filled on the login form): `admin@arcavia.com` / `12345678`.
  Seeded by `../arcavia-api/scripts/seed_admin.py` (idempotent; wired into the compose
  `seed` service). Overridable via `VITE_DEFAULT_ADMIN_*` (form) and `ADMIN_*` (seed).
- **Verify a change** with: `npm run typecheck`, `npx vitest run`, `npm run format:check`,
  `npm run lint`.
- ⚠️ **`npm run ci` currently fails on a PRE-EXISTING coverage gate** (`test:coverage`
  requires 80% lines; real coverage is ~20%). That failure is not your regression — run
  typecheck + tests + format:check separately to judge your work.
- **Live-API checks**: the fastest way to confirm a create/update flow is a `curl`
  round-trip against `:8000` (login → create → patch → delete) and clean up test rows via
  `docker exec arcavia-postgres-1 psql -U arcavia -d arcavia -c "…"`. The test DB is
  `arcavia_test` (migrate it with `alembic upgrade head` before running backend pytest).

## Architecture conventions

- **Server state → React Query** (`useQuery`/`useMutation`). Never copy query data into Zustand.
- **UI state → Zustand**: auth (`src/auth/store.ts`) and the city filter (`useCityFilter` in
  `src/components/Layout.tsx`).
- **Forms → React Hook Form + Zod**; all schemas live in `src/lib/validation/index.ts`.
- **One API module per resource** in `src/api/`: `cities, campaigns, missions, categories,
  phases, waypoints, challenges, qr, users, settings, geoAttempts`.
- **All UI strings are Spanish**, centralized in `src/lib/i18n.ts` (import `t`). Add keys
  there, don't inline literals.
- **No raw UUIDs shown to users** — IDs live in URLs and React keys only.
- **Maps use plain imperative Leaflet** (NOT react-leaflet — v5 has Vite/SSR stability
  issues). Tiles fall back to public OpenStreetMap via `src/lib/mapTiles.ts` when no
  MapTiler key is set (which is the default in dev). `MapPicker` = single pin; `MapAreaPicker`
  = bounding box + center pin.

## ⚠️ THE BIG GOTCHA: admin TS model ≠ API wire contract

The admin's TypeScript types express the *intended* contract; the real `arcavia-api` often
differs. **Every `src/api/*.ts` bridges the two** with adapter helpers
(`fromApi` / `toApiCreate` / `toApiUpdate`). Recurring mismatches to expect:

- **List endpoints return a bare array**, not `{items,total,limit,offset}` → adapters
  synthesize the `Page<T>` the UI wants.
- **Updates are `PATCH`, not `PUT`.**
- **Field renames**, e.g. cities: compass bbox `bbox_north/south/east/west` ↔ backend
  `bbox_max_lat/min_lat/max_lng/min_lng`; `default_language` ↔ `default_locale`;
  `map_tile_url` ↔ `tile_url`.
- **Empty vs null**: date `datetime-local` inputs emit `""`; the API wants `datetime | None`
  → coerce `""`→`null` (see `campaigns.ts`).
- **Fields the UI shows but the API doesn't return** (`campaign_count`, a mission's
  `campaign_name`, a campaign's `city_name`) → resolve client-side (extra fetch) or default.

**Recipe when touching a resource**: read the backend schema
(`../arcavia-api/app/schemas/<x>.py`) and router (`../arcavia-api/app/api/v1/admin/<x>.py`)
first; build/adjust the adapter; verify with a live `curl` create→patch→delete; and make the
MSW mocks in `tests/mocks/handlers.ts` mirror the **real backend shape** (they historically
lied, which hid these bugs). `src/api/client.ts` unwraps the API's `{error:{code,message}}`
envelope and skips the token-refresh retry on `/api/v1/auth/*` (so a bad login shows the real
reason, not "Sesión expirada").

## Domain glossary (v2 content model)

Content hierarchy:

```
City → Campaign → Mission → (Categories + Phases) → Waypoints → (Challenges + QR)
```

- **City** — a playable city defined by a bounding box; players physically inside it see its
  content. Has locale, timezone, legal regime, tile URL.
- **Campaign** — a themed group of missions within a city, with an optional active window
  (`starts_at`/`ends_at`).
- **Mission** — a route/quest. Fields: `difficulty` (`baja`/`media`/`alta`), `reward_points`,
  `estimated_time_minutes`, `explorers_count`. **No location** — location lives on waypoints.
- **Category** — a **scoring bucket + theme** (e.g. *Cultural*, *Patrocinador*). Carries a
  completion **`threshold_pct`** and a denormalized `total_points`. Categories **cross-cut**
  phases. **Completion rule (enforced in `gameplay.py`)**: the mission completes only when, for
  **every** category, `earned_points / total_points ≥ threshold_pct/100` (plus a riddle solved).
  A category answers *"what kind of stop, and how much of it must be done?"*
- **Phase (Fase)** — an ordered **leg of the route** (`order_index`). It answers *"in what order
  does the player move through the stops?"*
- **Waypoint** — a physical point (`lat`/`lng`, `tolerance_radius_m`, `points`). Belongs to
  **exactly one phase AND one category**. **Geolocation dwell check-in is the always-on
  presence proof for every waypoint** — `tolerance_radius_m` doubles as the geofence radius,
  no separate column. `requires_qr`/`requires_keyword` are optional additional factors an
  admin can require on top (e.g. geo+QR for a reward-bearing waypoint at a site where QR is
  physically allowed; geo+keyword — an on-site question, `onsite_keyword_prompt`/
  `onsite_keyword_answer` — where it isn't). `required_accuracy_m`/`dwell_seconds`/
  `min_fixes` tune the geofence. **Guardrail**: the API rejects saving a waypoint with an
  active reward if both `requires_qr` and `requires_keyword` are off
  (`GEO_ONLY_PRIZE_CONFLICT`) — raw dwell-only presence is never sufficient alone for a prize.
- **Challenge** — a question attached to a waypoint (`prompt` + ≥2 `options`, exactly one
  correct). May be a **riddle** (`is_riddle` → `keyword` + `fun_fact`, revealed only on a
  correct answer). Unrelated to a waypoint's `onsite_keyword_*` fields — same word, two
  different mechanics (a quiz reward word vs. an on-site presence-proof answer).
- **QR** — one per waypoint, only relevant when that waypoint's `requires_qr` is on; the
  player scans it as one of the check-in's optional additional factors (never the sole
  presence proof anymore). "Retire" = PATCH it inactive (there is no delete). Backend added
  `GET /admin/waypoints/{id}/qr` so the UI can show an existing code.
- **Geo check-in attempt** — one row per presence-proof attempt (`waypoint_geo_attempts`,
  exposed at `/admin/geo-attempts`). Anti-cheat heuristics (frozen coordinates, constant
  accuracy, etc.) never hard-reject — they append a flag and the attempt still completes;
  flagged attempts land in the **operator review queue** (`ReviewQueuePage`,
  `/admin/review-queue`) for a human to approve or reject. Reject is flag-only (audit/ban
  signal) — it does not revert the progress/points already granted.

**Category vs Phase (the common confusion):** a waypoint has *both* at once — they are
orthogonal. **Phase = sequence/order**; **Category = scoring bucket + theme with a completion
threshold**. Example: "Catedral" can be in *Fase 1* and category *Cultural*; "Café" in *Fase 2*
and category *Patrocinador*. In the player PWA: phases render as the itinerary accordion and
drive map focus; categories render as filter chips and the diamond glyph on each pin.

**Activation guards (enforced server-side; the UI just surfaces the API error):** a waypoint
cannot be active with 0 challenges; a mission cannot activate unless its structure is
*completable* (categories with reachable thresholds, active waypoints that have challenges).

## Route / file map

- **Routing**: `src/App.tsx` — everything under `/admin`. Missions area routes:
  `missions`, `missions/new`, `missions/:id` (editor),
  `missions/:missionId/waypoints/new?phaseId=…`, `missions/:missionId/waypoints/:waypointId`,
  plus `review-queue` (operator review of flagged geo check-in attempts).
- **Missions UI** (`src/features/missions/`): `MissionsPage` (list), `MissionEditor`
  (create + edit tabs **Detalles / Categorías / Fases y puntos**), `CategoriesEditor`,
  `PhasesEditor` (each phase lists its waypoints), `WaypointEditor` (fields + `MapPicker`
  centered on the city + geolocation check-in config (`requires_qr`/`requires_keyword` +
  geofence/dwell tuning) + `ChallengesEditor` + `QRSection`, the last shown only when
  `requires_qr` is on), `ChallengesEditor`, `QRSection`.
- **Review queue** (`src/features/reviewQueue/ReviewQueuePage.tsx`): lists geo check-in
  attempts with anti-cheat flags (default filter), approve/reject via `ConfirmDialog` — same
  `DataTable` + confirm + toast + invalidate pattern as everywhere else. `src/api/geoAttempts.ts`.
- **Other features** (`src/features/`): `auth`, `dashboard`, `cities`, `campaigns`, `users`,
  `settings`.
- **Shared components** (`src/components/`): `FormField`, `DataTable`, `MapPicker`,
  `MapAreaPicker`, `Layout` (nav + city filter), `Toast`, `ConfirmDialog`, `TranslationsEditor`.
- **Auth**: `src/auth/` (`store.ts`, `useAuth.ts`, `RequireAdmin.tsx`). Login returns
  `access_token` + `role` + `user_id` + `force_password_reset`; the panel is admin-only
  (`role === 'admin'`). Access token is a JWT; refresh via httpOnly cookie.

## Known gaps (backend not yet implemented)

- **Dashboard**: `useDashboardStats`/`useTopScorers` call `/api/v1/admin/dashboard` and
  `/dashboard/top-scorers`, which **don't exist** in the backend → the dashboard soft-degrades
  to zeros / "no results".
- **City `slug`/`country`** are not editable after creation (backend `CityUpdate` omits them;
  the adapter drops them).
- **`translations` / `campaign_count` / `mission_count`** are not persisted or returned by
  several endpoints → defaulted client-side.

## Related sources of truth

- Admin docs: `docs/admin-architecture.md`, `docs/api-contract.md`, `docs/operator-guide.md`.
- Backend contract: `../arcavia-api/app/schemas/*.py` and routers `../arcavia-api/app/api/v1/admin/*.py`.
- Player PWA (mirrors the same content model, design-to-code from Figma): `../arcavia-frontend`.
