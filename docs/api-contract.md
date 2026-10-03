# API Contract

This panel consumes `/api/v1/admin/*` and `/api/v1/auth/*`. The live contract is the backend OpenAPI docs at `http://localhost:8000/docs` (or `/redoc`).

## Auth endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Login — body `{email, password, scope: "admin"}`. Panel roles get `{mfa, mfa_token}` (tokens only after `/auth/mfa/*`); players get `403 NOT_ADMIN`. The player app sends `scope: "player"` and gets a player session for ANY account (no MFA) that `/admin/*` rejects with `403 ADMIN_SCOPE_REQUIRED`. Post-MFA response: `access_token`, `role`, `user_id`, `force_password_reset` |
| POST | `/api/v1/auth/logout` | Logout — revokes refresh JTI |
| POST | `/api/v1/auth/refresh` | Refresh access token via httpOnly cookie |
| POST | `/api/v1/auth/change-password` | Change password (clears `force_password_reset`) |

## Admin resource endpoints

All require `Authorization: Bearer <access_token>` with `role === admin`.

| Resource | CRUD |
|---|---|
| Cities | `GET/POST /admin/cities`, `GET/PUT/DELETE /admin/cities/{id}` |
| Campaigns | `GET/POST /admin/campaigns`, `GET/PUT/DELETE /admin/campaigns/{id}` |
| Missions | `GET/POST /admin/missions`, `GET/PUT/PATCH/DELETE /admin/missions/{id}` |
| Challenges | `GET /admin/missions/{id}/challenges`, `PUT /admin/missions/{id}/challenges` (full replace) |
| QR | `GET/POST /admin/missions/{id}/qr`, `PATCH /admin/missions/{id}/qr/{qrId}` |
| Users | `GET /admin/users`, `GET /admin/users/{id}`, `POST /admin/users/{id}/reset-password`, `PATCH /admin/users/{id}` |
| Settings | `GET/PUT /admin/settings/{key}` |
| Assets | `POST /admin/assets` (multipart) |
| Dashboard | `GET /admin/dashboard`, `GET /admin/dashboard/top-scorers` |

## Error envelope

```json
{ "code": "MISSION_HAS_NO_CHALLENGES", "message": "...", "details": {} }
```

`ApiClientError` in `src/api/client.ts` parses this envelope. `code` drives specific UI messages; everything else falls back to `message`.

## Notable API constraints (spec §11.3)

- `PUT /admin/missions/{id}/challenges` replaces the full challenges list for a mission atomically.
- `DELETE /admin/cities/{id}` soft-deactivates; it does not permanently delete.
- `POST /admin/users/{id}/reset-password` returns the temp password **once** in the response body.
