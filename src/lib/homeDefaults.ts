/**
 * Default copy of the player app's Home page (Figma HOME frame 316:40) — the
 * editor pre-fills its fields with these so the operator edits the live text in
 * place, and the player falls back to them field-by-field when unset.
 * Hand-mirrored from arcavia-frontend/src/content/homeDefaults.ts — keep in sync.
 */
export const HOME_DEFAULTS = {
  hero_intro: 'Cada lugar esconde una historia.\nCada pregunta revela un secreto.',
  hero_tagline: '¿Te atreves a descubrir lo que pocos conocen?',
  headline: 'El mundo se convierte en una aventura',
  headline_body:
    'Explora y descubre cada ciudad a través de su cultura, sus historias, experiencias y recompensas.',
  city_title: 'La ciudad se vive, no solo se visita',
  city_body:
    'Arcavia transforma cada recorrido en una experiencia que invita a explorar, descubrir el patrimonio, conectar con negocios locales y vivir la ciudad por más tiempo.',
  how_title: '¡Tu aventura comienza aquí!',
  how_steps: [
    { title: 'Únete', body: 'Crea tu perfil' },
    { title: 'Elige', body: 'Escoge tu aventura' },
    { title: 'Descifra', body: 'Supera los retos' },
    { title: 'Explora', body: 'Visita y desbloquea pistas' },
    { title: 'Desbloquea', body: 'Descubre la clave final' },
    { title: 'Compite', body: 'Ranking de temporada' },
  ],
  legend_title: 'La leyenda del Ángel',
  legend_subtitle: 'Bienvenido, Explorador…',
  legend_body:
    'Dicen que cada ciudad guarda un tesoro. No de oro ni de joyas, sino de historias, secretos y lugares que pocos se detienen a mirar.\n\nHace mucho tiempo apareció un misterioso viajero que guiaba a quienes deseaban descubrirlos. Lo llamaron El Ángel. Hoy, su espíritu vive en un nuevo compañero, creado para caminar contigo, descubrir lo invisible y convertir cada viaje en una historia inolvidable.\n\nPorque el verdadero tesoro nunca estuvo escondido bajo tierra.\n\nSiempre estuvo esperando ser descubierto.',
  feature_title: 'El mundo real acaba de convertirse en tu aventura',
  feature_body: 'Explora lugares. Descifra secretos. Supera misiones. Conquista recompensas.',
  tiers_title: '¿Hasta dónde llegarás?',
  tiers_intro: 'Cada misión te acerca a algo más',
  tiers: [
    { title: 'Durante la misión', body: 'Obtén recompensas' },
    { title: 'Misiones completadas', body: 'Desbloquea beneficios exclusivos' },
    { title: 'Ranking mensual', body: 'Compite por premios especiales' },
    { title: 'Top de temporada', body: 'Premios para los aventureros' },
    { title: 'Exploradores élite', body: 'Accede a privilegios Arcavia' },
  ],
  closing_title: '¡Estás listo!',
  closing_body: 'Explora y experimenta las ciudades del mundo.',
} as const
