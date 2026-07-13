# Arcavia Admin

Panel de administración para la plataforma Arcavia Quest. SPA en React 19 + TypeScript + Vite, servida en `/admin`.

## Requisitos previos

- Node.js 20+
- La API (`arcavia-api`) corriendo en `http://localhost:8000`
- Cuenta MapTiler para los tiles del mapa

## Configuración local

1. Copia el archivo de entorno:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tus valores:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   VITE_MAPTILER_KEY=tu_clave_de_maptiler
   ```

3. Instala dependencias:
   ```bash
   npm install
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre `http://localhost:5173/admin`.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`dist/`) |
| `npm run preview` | Vista previa del build |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |
| `npm run lint` | Linting con oxlint |
| `npm run format` | Formateo con Prettier |
| `npm run format:check` | Verifica formato (para CI) |
| `npm run test` | Tests unitarios e integración (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con cobertura (mínimo 80% en `src/features` y `src/api`) |
| `npm run test:e2e` | Tests E2E con Playwright |
| `npm run ci` | typecheck + format:check + test:coverage |

## Tests E2E

Los tests E2E requieren un servidor corriendo y una BD con datos de prueba:

```bash
export PLAYWRIGHT_BASE_URL=http://localhost:5173
export TEST_ADMIN_EMAIL=admin@arcavia.test
export TEST_ADMIN_PASSWORD=AdminTest123!
npm run test:e2e
```

## Build y despliegue

El build genera una SPA estática en `dist/`. Configura Nginx para servir los archivos desde `/admin` y hacer proxy de `/api` hacia el backend:

```nginx
location /admin {
    alias /path/to/arcavia-admin/dist;
    try_files $uri $uri/ /admin/index.html;
}
location /api {
    proxy_pass http://localhost:8000;
}
```

## Convenciones de código

- **Estado de servidor:** React Query (`useQuery`/`useMutation`). Nunca copiar en Zustand.
- **Estado UI local:** Zustand (auth, filtro de ciudad).
- **Formularios:** React Hook Form + Zod. Los schemas están en `src/lib/validation/`.
- **Una API por recurso:** `src/api/cities.ts`, `src/api/campaigns.ts`, etc.
- **Sin IDs en pantalla:** Los UUIDs van en URLs y como keys de React, nunca como contenido visible.
- **Idioma del panel:** Español. Todas las etiquetas y mensajes están en `src/lib/i18n.ts`.

## Convenciones de ramas/PR

- `feature/*` para nuevas funcionalidades
- `fix/*` para correcciones
- Cada PR debe pasar `npm run ci` antes de hacer merge
