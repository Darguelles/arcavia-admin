import { test, expect } from '@playwright/test'

// Critical flows end-to-end (spec §11.4)
// Run against a running dev server with a seeded test database.

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@arcavia.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? '12345678'
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'

test.describe('E2E: Full admin flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/admin/login`)
    await page.getByLabel(/correo/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/contraseña/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await page.waitForURL(`${BASE}/admin`)
  })

  test('dashboard shows stats cards', async ({ page }) => {
    await expect(page.getByText('Ciudades activas')).toBeVisible()
    await expect(page.getByText('Panel')).toBeVisible()
  })

  test('create city → campaign → mission → questions → QR → activate', async ({ page }) => {
    // ── 1. Create city ──────────────────────────────────────────────────
    await page.getByRole('link', { name: /ciudades/i }).click()
    await page.getByRole('button', { name: /crear/i }).click()
    await page.getByLabel(/nombre/i).fill('Ciudad de Prueba E2E')
    // Slug auto-suggested on blur
    await page.getByLabel(/nombre/i).blur()
    await expect(page.getByLabel(/código corto/i)).toHaveValue(/ciudad-de-prueba/i)

    // Select country
    await page.getByLabel(/país/i).selectOption('PE')

    // The map area picker is present
    await expect(page.getByLabel(/mapa para definir/i)).toBeVisible()

    // Save the city
    await page.getByRole('button', { name: /guardar/i }).click()
    await expect(page.getByText(/guardado correctamente/i)).toBeVisible()

    // ── 2. Create campaign ──────────────────────────────────────────────
    await page.getByRole('link', { name: /campañas/i }).click()
    await page.getByRole('button', { name: /crear/i }).click()

    await page.getByLabel(/nombre/i).fill('Campaña E2E')
    await page.getByRole('button', { name: /guardar/i }).click()
    await expect(page.getByText(/guardado|creado/i)).toBeVisible()

    // ── 3. Create mission ────────────────────────────────────────────────
    await page.getByRole('link', { name: /misiones/i }).click()
    await page.getByRole('button', { name: /crear/i }).click()

    await page.getByLabel(/nombre/i).fill('Misión E2E')
    await page.getByRole('button', { name: /crear/i }).click()
    await page.waitForURL(/\/admin\/missions\/.+/)

    // ── 4. Add questions ────────────────────────────────────────────────
    await page.getByRole('button', { name: /preguntas/i }).click()
    await page.getByText('+ Agregar pregunta').click()

    await page.getByRole('textbox', { name: /enunciado/i }).fill('¿Cuál es la capital de Perú?')
    const options = page.getByPlaceholder(/texto de la opción/i)
    await options.nth(0).fill('Lima')
    await options.nth(1).fill('Cusco')

    // Mark first option as correct
    await page.getByRole('radio').first().click()

    await page.getByRole('button', { name: /^guardar$/i }).click()
    await expect(page.getByText(/guardado/i)).toBeVisible()

    // ── 5. Generate QR ──────────────────────────────────────────────────
    await page.getByRole('button', { name: /código qr/i }).click()
    await expect(page.getByText(/código qr impreso/i)).toBeVisible()
    await page.getByRole('button', { name: /generar código qr/i }).click()
    await expect(
      page.locator('svg[data-testid="qr-code"]').or(page.getByRole('img', { name: /qr/i }))
    ).toBeVisible({ timeout: 10000 })

    // ── 6. Activate mission ─────────────────────────────────────────────
    await page.getByRole('button', { name: /detalles/i }).click()
    const activeCheckbox = page.getByLabel(/^activo$/i)
    await expect(activeCheckbox).not.toBeDisabled() // challenge exists now
    await activeCheckbox.check()
    await page.getByRole('button', { name: /^guardar$/i }).click()
    await expect(page.getByText(/guardado/i)).toBeVisible()
  })

  test('waypoint geo check-in config persists (geo + QR + keyword)', async ({ page }) => {
    // Geolocation dwell check-in is the always-on default for every waypoint;
    // requires_qr/requires_keyword are optional additional factors. This
    // exercises both toggles together and confirms the values round-trip.
    await page.getByRole('link', { name: /misiones/i }).click()
    const missionLink = page.getByRole('link', { name: /misión e2e/i }).first()
    if (!(await missionLink.isVisible())) test.skip()
    await missionLink.click()

    await page.getByRole('button', { name: /fases y puntos/i }).click()
    await page.getByRole('link', { name: /agregar punto/i }).click()

    await page.getByLabel(/^nombre$/i).fill('Arco Colonial E2E')
    await page.getByLabel(/requerir escaneo de código qr/i).check()
    await page.getByLabel(/requerir palabra clave en el lugar/i).check()
    await page.getByLabel(/pregunta para el jugador/i).fill('¿Qué año tiene la placa?')
    await page.getByLabel(/respuesta esperada/i).fill('1887')

    await page.getByRole('button', { name: /^crear$/i }).click()
    await expect(page.getByText(/creado correctamente/i)).toBeVisible()

    // Reload and confirm the config persisted server-side, not just in the form.
    await page.reload()
    await expect(page.getByLabel(/requerir escaneo de código qr/i)).toBeChecked()
    await expect(page.getByLabel(/requerir palabra clave en el lugar/i)).toBeChecked()
    await expect(page.getByLabel(/respuesta esperada/i)).toHaveValue('1887')
  })

  test('reset user password → one-time reveal → deactivate user', async ({ page }) => {
    await page.getByRole('link', { name: /usuarios/i }).click()
    await expect(page.getByRole('heading', { name: /usuarios/i })).toBeVisible()

    // Click first user's detail
    const detailButton = page.getByRole('button', { name: /ver detalle/i }).first()
    if (!(await detailButton.isVisible())) {
      test.skip() // No users in test DB
    }

    await detailButton.click()
    await page.waitForURL(/\/admin\/users\/.+/)

    // Reset password
    await page.getByRole('button', { name: /restablecer contraseña/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /generar contraseña temporal/i }).click()

    // One-time reveal appears
    await expect(page.getByText('Contraseña temporal generada')).toBeVisible()
    // Copy button is present
    await expect(page.getByRole('button', { name: /copiar/i })).toBeVisible()

    // Dismiss
    await page.getByRole('button', { name: /ya copié la contraseña/i }).click()
    await expect(page.getByText('Contraseña temporal generada')).not.toBeVisible()

    // Deactivate user
    await page.getByRole('button', { name: /desactivar/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /desactivar/i })
      .click()
    await expect(page.getByText(/desactivado/i)).toBeVisible()
  })
})
