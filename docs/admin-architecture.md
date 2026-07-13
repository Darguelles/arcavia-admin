# Admin Module Architecture

This document is the living source of truth for the `arcavia-admin` SPA. See `arcavia-admin.spec.md` for the full specification.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Local/UI state | Zustand v5 |
| Forms | React Hook Form v7 + Zod v4 |
| Tables | TanStack Table v8 |
| Maps | Leaflet 1.9 (imperative, `MapPicker` + `MapAreaPicker`) |
| QR | qrcode.react v4 |
| HTTP | typed `apiClient` wrapper (`src/api/client.ts`) |
| Tests | Vitest 4 + RTL + MSW 2 |
| E2E | Playwright |

## Auth

- Access token in memory (Zustand), never localStorage (§4.3).
- On 401: one refresh attempt via the httpOnly refresh cookie, then retry. Failure clears session.
- `role === 'admin'` required; player tokens are rejected client-side and the API enforces it server-side.
- `forceReset` state routes to `ForcedResetPage` and blocks all other navigation.

## State ownership

```
Server data ──→ React Query (useQuery/useMutation)
UI state    ──→ Zustand (auth, city filter)
Forms       ──→ React Hook Form (ephemeral)
```

Never copy server data into Zustand.

## Query key structure

```ts
cityKeys.list({ search, page })
cityKeys.detail(id)
campaignKeys.list({ cityId, search, offset })
missionKeys.list({ cityId, campaignId, search, offset })
missionKeys.detail(id)
challengeKeys.byMission(missionId)
qrKeys.byMission(missionId)
userKeys.list({ search, offset })
userKeys.detail(id)
settingKeys.key(key)
```

## Mission activation guard (spec §5.1)

The Active toggle on any mission is **disabled** when `challenge_count === 0`.
Enforced in:
- `MissionsPage` (list view badge)
- `MissionEditor` (details tab checkbox + disabled prop)

The server returns `409 MISSION_HAS_NO_CHALLENGES` as the backstop.

## File structure

```
src/
  api/           # one file per resource: keys + hooks + mutations
  auth/          # Zustand store, useAuth hook, RequireAdmin guard
  components/    # DataTable, FormField, ConfirmDialog, Toast, MapPicker, MapAreaPicker, TranslationsEditor, Layout
  features/      # one folder per screen group
  lib/
    i18n.ts      # all admin UI strings in Spanish
    utils.ts     # cn(), slugify(), formatDate()
    validation/  # Zod schemas mirroring backend Pydantic models
```
