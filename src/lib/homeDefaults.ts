/**
 * Default (fallback) copy for the Home marketing page. Every block is
 * operator-editable via the `home_content` setting (arcavia-admin →
 * Configuración → Página de inicio); the admin editor pre-fills its fields
 * from these defaults so the current text can be edited in place, and the
 * player falls back to them field-by-field when the setting is unset.
 * Hand-mirrored in arcavia-frontend/src/content/homeDefaults.ts — keep in sync.
 *
 * Multi-paragraph bodies use blank-line separators; `headline` uses \n for
 * its designed line break.
 */
export const HOME_DEFAULTS = {
  headline: 'Plataforma de\ngamificación urbana',
  need_title: 'Necesidad',
  need_body:
    'El turismo urbano actual es pasivo y concentrado, impidiendo que muchos negocios locales atraigan clientes.\n\nEsto abre la oportunidad de transformar la experiencia urbana uniendo exploración, juego y economía local.',
  solution_title: 'Solución',
  solution_body:
    'ARCAVIA QUEST es una plataforma de gamificación urbana que conecta turismo y comercio local.\n\nA través de juegos narrativos y retos, transforma la ciudad en un escenario interactivo y cultural.',
  how_title: 'Cómo Funciona',
  how_steps: [
    { title: 'Registro', body: 'El usuario se registra en la app.' },
    { title: 'Selección', body: 'Elige una ruta urbana.' },
    { title: 'Acción', body: 'Resuelve acertijos en lugares reales.' },
    { title: 'Validación', body: 'Visita patrocinadores para avanzar.' },
    { title: 'Meta', body: 'Consigue palabras clave y resuelve el acertijo final.' },
    { title: 'Competición', body: 'Compite en el ranking de la temporada.' },
  ],
  vision_title: 'El mundo está listo; nuestro momento es ahora',
  vision_intro:
    'Nuestra visión cobra vida gracias a un movimiento global que late con fuerza a través de realidades muy claras.',
  vision_points: [
    'El deseo profundo de vivir las ciudades en lugar de solo visitarlas.',
    'La evolución hacia ciudades mucho más humanas, conectadas y vivas.',
    'El anhelo colectivo de jugar, descubrir y emocionarnos juntos.',
    'La tecnología móvil guiando nuestros pasos hacia historias reales.',
    'El compromiso urgente de devolverle la vida y el corazón a nuestros barrios.',
  ],
  band_text:
    'ARCAVIA QUEST gamifica ciudades globalmente conectando cultura, tecnología y comercio local.',
  play_title: 'Juega y gana premios',
  closing_title: '¡Estás listo!',
  closing_body: 'Explora y experimenta las ciudades del mundo.',
} as const
