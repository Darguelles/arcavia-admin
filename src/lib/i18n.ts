// Admin UI language strings (es default per spec §3)
// All labels and messages the admin operator sees are in Spanish.

export const t = {
  // Navigation
  dashboard: 'Panel',
  cities: 'Ciudades',
  campaigns: 'Campañas',
  missions: 'Misiones',
  users: 'Usuarios',
  settings: 'Configuración',
  logout: 'Cerrar sesión',

  // Common actions
  save: 'Guardar',
  cancel: 'Cancelar',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  deactivate: 'Desactivar',
  activate: 'Activar',
  confirm: 'Confirmar',
  search: 'Buscar',
  loading: 'Cargando…',
  back: 'Volver',
  add: 'Agregar',
  remove: 'Eliminar',
  generate: 'Generar',
  download: 'Descargar',
  copy: 'Copiar',
  close: 'Cerrar',

  // Status
  active: 'Activo',
  inactive: 'Inactivo',

  // Field labels (spec §5.2)
  name: 'Nombre',
  description: 'Descripción',
  slug: 'Código corto',
  slugHint: 'Minúsculas, sin espacios. Se usa en enlaces. ej: lima',
  country: 'País',
  cityState: 'Ciudad / Estado',
  cityStateHint: 'Elígela para nombrar y centrar el mapa automáticamente.',
  selectOption: 'Selecciona…',
  language: 'Idioma',
  timezone: 'Zona horaria',
  privacyRules: 'Reglas de privacidad',
  cityMapArea: 'Área del mapa de la ciudad',
  cityMapAreaHint:
    'Arrastra el cuadro para cubrir la ciudad. Los jugadores dentro de él verán esta ciudad automáticamente.',
  requiredCloseness: 'Proximidad requerida (metros)',
  requiredClosenessHint:
    'Cuán cerca debe estar físicamente un jugador para escanear. Por defecto 50 m.',
  pointsAwarded: 'Puntos otorgados',
  launchDate: 'Fecha de lanzamiento',
  startDate: 'Fecha de inicio',
  endDate: 'Fecha de fin',
  otherLanguages: 'Otros idiomas',
  otherLanguagesHint: 'Opcional. Agrega una traducción para cada idioma que admitas.',
  calibrationNotes: 'Notas de calibración en campo',

  // Confirm messages
  deactivateCityConfirm: (name: string) =>
    `Desactivar ${name} ocultará todas sus misiones a los jugadores. El progreso de los jugadores se conserva. ¿Continuar?`,
  deactivateCampaignConfirm: (name: string) =>
    `Desactivar la campaña "${name}" ocultará sus misiones. El progreso se conserva. ¿Continuar?`,
  deactivateMissionConfirm: (name: string) =>
    `Desactivar la misión "${name}" la ocultará a los jugadores. ¿Continuar?`,
  deactivateQRConfirm:
    'Desactivar este código QR hará que el código impreso deje de funcionar. ¿Continuar?',
  resetPasswordConfirm: (email: string) =>
    `Esto generará una contraseña temporal para ${email}. Deberás entregársela directamente. ¿Continuar?`,
  deactivateUserConfirm: (email: string) =>
    `Desactivar a ${email} impedirá que inicie sesión. Sus datos se conservan. ¿Continuar?`,
  activateUserConfirm: (email: string) =>
    `Activar a ${email} permitirá que vuelva a iniciar sesión. ¿Continuar?`,
  resetProgress: 'Reiniciar progreso',
  resetProgressConfirm: (email: string) =>
    `Se borrará TODO el progreso de ${email}: misiones, puntos de control, respuestas, intentos de ubicación y recompensas. También se ajustan el ranking y los contadores. No se puede deshacer. ¿Continuar?`,
  resetProgressDone: 'Progreso reiniciado. El usuario empieza desde cero.',

  // Mission activation guard (spec §5.1)
  missionNoQuestionsHint: 'Agrega al menos una pregunta antes de activar esta misión.',

  // QR section
  qrGuardrail:
    'Generar un nuevo QR hará que cualquier código previamente impreso para esta misión deje de funcionar cuando desactives el anterior. Vuelve a imprimir y reemplaza el código físico.',

  // Password reset reveal
  tempPasswordTitle: 'Contraseña temporal generada',
  tempPasswordHint:
    'Entrega esta contraseña temporal al usuario directamente (en persona o por teléfono). No se mostrará de nuevo. El usuario deberá establecer su propia contraseña al primer inicio de sesión.',
  tempPasswordCopied: 'Contraseña copiada.',

  // Auth
  loginTitle: 'Arcavia — Panel de administración',
  email: 'Correo electrónico',
  password: 'Contraseña',
  loginButton: 'Iniciar sesión',
  loginError: 'Correo o contraseña incorrectos.',
  roleError: 'Solo los administradores pueden acceder a este panel.',
  setNewPassword: 'Establecer nueva contraseña',
  newPassword: 'Nueva contraseña',
  confirmPassword: 'Confirmar contraseña',
  passwordMismatch: 'Las contraseñas no coinciden.',
  currentPassword: 'Contraseña actual',

  // Settings
  branding: 'Marca y recursos',
  uiTexts: 'Textos de la app',
  appInfo: 'Información de la app',
  appName: 'Nombre de la app',
  supportContact: 'Contacto de soporte',
  privacyPolicy: 'Política de privacidad',
  privacyPolicyVersion: 'Versión de la política',
  privacyPolicyVersionHint:
    'Cambiar la versión notificará a los usuarios para que acepten la nueva política.',
  legalContent: 'Contenido legal',
  gameInstructions: 'Instrucciones del juego',
  gameInstructionsHint:
    'Cómo jugar, ganar puntos y completar misiones. Se muestra en la app del jugador.',
  termsAndConditions: 'Términos y condiciones',
  termsAndConditionsHint: 'Texto legal que ven los jugadores desde el menú de información.',

  // Dashboard
  activeCities: 'Ciudades activas',
  activeCampaigns: 'Campañas activas',
  activeMissions: 'Misiones activas',
  totalPlayers: 'Jugadores registrados',
  recentCompletions: 'Completados recientes',
  topScorers: 'Mejores puntajes',
  topScorersNote:
    'Usa esto para auditar ganadores de premios — el GPS web no es completamente a prueba de suplantación.',

  // Challenges editor
  question: 'Pregunta',
  questions: 'Preguntas',
  addQuestion: 'Agregar pregunta',
  questionPrompt: 'Enunciado de la pregunta',
  options: 'Opciones',
  addOption: 'Agregar opción',
  optionText: 'Texto de la opción',
  correctOption: 'Opción correcta',
  noQuestionsYet: 'Este punto aún no tiene preguntas. Agrega al menos una para activarlo.',
  questionsHint: 'Agrega las preguntas de este punto. Se guardan junto con el punto.',
  reviewQuestions:
    'Revisa las preguntas: cada una necesita un enunciado, al menos 2 opciones y una correcta.',
  minTwoOptions: 'Cada pregunta debe tener al menos 2 opciones.',
  mustMarkCorrect: 'Debes marcar una opción como correcta.',
  riddle: 'Es un acertijo',
  keyword: 'Palabra clave',
  keywordHint: 'Se revela al jugador cuando responde correctamente.',
  funFact: 'Dato curioso',

  // Mission structure (v2): difficulty, categories, phases, waypoints
  campaign: 'Campaña',
  difficulty: 'Dificultad',
  difficultyBaja: 'Baja',
  difficultyMedia: 'Media',
  difficultyAlta: 'Alta',
  rewardPoints: 'Bono de finalización',
  rewardPointsHint:
    'Puntos extra otorgados al completar toda la misión, además de los puntos que suma cada punto de control.',
  estimatedTime: 'Tiempo estimado (min)',
  explorers: 'Exploradores',
  detailsSection: 'Detalles',
  categoriesTab: 'Categorías',
  phasesTab: 'Fases y puntos',
  // Mission cover image
  missionImage: 'Imagen de portada',
  missionImageHint:
    'Se muestra en la lista de misiones y en la pantalla de la misión. JPG, PNG o WebP, hasta 5 MB.',
  uploadImage: 'Subir imagen',
  changeImage: 'Cambiar imagen',
  removeImage: 'Quitar imagen',
  noImageYet: 'Sin imagen. Se usará un degradado como respaldo.',
  imageUploaded: 'Imagen actualizada.',
  imageRemoved: 'Imagen eliminada.',
  imageTooLarge: 'La imagen supera el tamaño máximo (5 MB).',
  invalidImageType: 'Formato no permitido. Usa JPG, PNG o WebP.',
  // Challenge reference image
  challengeImage: 'Imagen de referencia',
  challengeImageHint:
    'Opcional. Se muestra al jugador en la pantalla del desafío. JPG, PNG o WebP, hasta 5 MB.',
  categories: 'Categorías',
  category: 'Categoría',
  addCategory: 'Agregar categoría',
  threshold: 'Umbral (%)',
  thresholdHint: 'Porcentaje de los puntos de la categoría necesario para completarla.',
  totalPoints: 'Puntos totales',
  order: 'Orden',
  phases: 'Fases',
  phase: 'Fase',
  addPhase: 'Agregar fase',
  waypoints: 'Puntos',
  waypoint: 'Punto',
  addWaypoint: 'Agregar punto',
  noCategoriesYet: 'Esta misión aún no tiene categorías. Agrega al menos una.',
  noPhasesYet: 'Esta misión aún no tiene fases. Agrega al menos una.',
  noWaypointsYet: 'Esta fase aún no tiene puntos.',
  waypointNoChallengesHint: 'Agrega al menos una pregunta antes de activar este punto.',
  missionNotCompletableHint:
    'La misión necesita una estructura completable (categorías, fases y puntos activos con preguntas) antes de activarse.',
  deleteCategoryConfirm: (name: string) =>
    `¿Eliminar la categoría "${name}"? Reasigna o elimina sus puntos primero.`,
  deletePhaseConfirm: (name: string) => `¿Eliminar la fase "${name}"? Elimina sus puntos primero.`,
  deleteWaypointConfirm: (name: string) => `¿Desactivar el punto "${name}"?`,
  deleteChallengeConfirm: '¿Eliminar esta pregunta? No se puede deshacer.',

  // Map
  mapPinHint:
    'Coloca el pin donde está el punto físico. El círculo muestra cuán cerca deben estar los jugadores — también es el radio de la geocerca para la verificación por ubicación.',
  mapFromCalibration: 'Estas coordenadas provienen de la calibración en campo.',

  // Geo check-in (waypoint validation — geolocation is the default; QR and
  // palabra clave son factores adicionales opcionales)
  validationSection: 'Verificación',
  requireQr: 'Requerir escaneo de código QR',
  requireQrHint:
    'Factor adicional opcional, además de la ubicación. Actívalo cuando el sitio permita colocar un QR físico — recomendado para puntos con premio.',
  requireKeyword: 'Requerir palabra clave en el lugar',
  requireKeywordHint:
    'Factor adicional opcional para sitios donde no se puede colocar un QR (p. ej. patrimonio protegido) — el jugador lee algo físicamente presente (año de una placa, número de arcos) y lo escribe.',
  requiredAccuracy: 'Precisión de GPS requerida (metros)',
  requiredAccuracyHint: 'Rechaza lecturas de GPS menos precisas que este valor. Por defecto 50 m.',
  dwellSeconds: 'Tiempo mínimo en el lugar (segundos)',
  dwellSecondsHint: 'Cuánto tiempo debe permanecer el jugador dentro del radio. Por defecto 60 s.',
  minFixes: 'Lecturas mínimas de GPS',
  minFixesHint: 'Cantidad mínima de lecturas de ubicación aceptadas durante la espera.',
  onsiteKeywordPrompt: 'Pregunta para el jugador',
  onsiteKeywordPromptHint: 'Algo que solo se puede leer estando físicamente en el lugar.',
  onsiteKeywordAnswer: 'Respuesta esperada',
  onsiteKeywordAnswerHint: 'Nunca se muestra al jugador — se compara en el servidor.',
  geoOnlyPrizeConflict:
    'Un punto con premio no puede depender solo de la ubicación — requiere QR o palabra clave también.',

  // Operator review queue (flagged geo check-in attempts)
  reviewQueue: 'Verificaciones',
  reviewQueueTitle: 'Cola de revisión',
  reviewQueueEmpty: 'No hay intentos marcados para revisar.',
  reviewQueueHint:
    'Estos intentos pasaron la verificación de ubicación pero el sistema detectó una señal sospechosa (coordenadas congeladas, precisión constante, etc.). Nunca se rechazan automáticamente — revísalos y decide.',
  flags: 'Señales',
  accuracyRange: 'Precisión (mejor–peor)',
  approve: 'Aprobar',
  reject: 'Rechazar',
  reviewNote: 'Nota (opcional)',
  approveConfirm: 'Marcar este intento como revisado y aprobado. ¿Continuar?',
  rejectConfirm:
    'Esto marca el intento como rechazado para fines de auditoría. NO revierte el progreso ni los puntos que el jugador ya obtuvo. ¿Continuar?',
  reviewed: 'Revisado',
  notReviewed: 'Sin revisar',
  reviewPending: 'Pendiente',
  reviewApproved: 'Aprobado',
  reviewRejected: 'Rechazado',

  // Toasts
  saved: 'Guardado correctamente.',
  created: 'Creado correctamente.',
  deleted: 'Eliminado correctamente.',
  deactivated: 'Desactivado correctamente.',
  activated: 'Activado correctamente.',
  error: 'Ocurrió un error. Intenta de nuevo.',
  passwordChanged: 'Contraseña actualizada correctamente.',

  // Pagination
  previous: 'Anterior',
  next: 'Siguiente',
  showing: (from: number, to: number, total: number) => `Mostrando ${from}–${to} de ${total}`,

  // Empty states
  noResults: 'No se encontraron resultados.',
  noCities: 'Aún no hay ciudades.',
  noCampaigns: 'Aún no hay campañas.',
  noMissions: 'Aún no hay misiones.',
  noUsers: 'Aún no hay usuarios.',

  // Map area / location
  mapAreaLabel: 'Área del mapa',
  centerPin: 'Centro de la ciudad',
  locationTab: 'Ubicación',
  detailsTab: 'Detalles',
  questionsTab: 'Preguntas',
  qrTab: 'Código QR',

  // Users — list search & filters
  searchUsersPlaceholder: 'Buscar por nombre o correo…',
  filterRole: 'Rol',
  filterStatus: 'Estado',
  filterAll: 'Todos',
  roleAdmin: 'Administrador',
  rolePlayer: 'Jugador',
  registeredFrom: 'Registrado desde',
  registeredTo: 'Registrado hasta',
  clearFilters: 'Limpiar filtros',
  colRole: 'Rol',
  colRegistered: 'Registrado',
  colLastActivity: 'Última actividad',
  viewDetail: 'Ver detalle',

  // Users — detail overview
  sectionProfile: 'Perfil',
  sectionConsent: 'Consentimiento (RGPD)',
  sectionPoints: 'Resumen de puntos',
  sectionMissions: 'Misiones',
  sectionRewards: 'Recompensas obtenidas',
  sectionDevices: 'Dispositivos y sesiones',
  sectionActions: 'Acciones',
  consentAccepted: 'Aceptado',
  consentVersion: 'Versión de política',
  notAccepted: 'No registrado',
  anonymizedBadge: 'Cuenta anonimizada (RGPD)',
  anonymizedHint:
    'Este usuario ejerció su derecho de supresión. Los datos personales fueron anonimizados; el progreso se conserva desvinculado de su identidad.',
  accumulatedPoints: 'Puntos acumulados',
  checkpointPoints: 'Puntos de control',
  bonusPointsLabel: 'Bono de finalización',
  pointsByCity: 'Puntos por ciudad',
  missionsStarted: 'Misiones iniciadas',
  missionsCompletedLabel: 'Misiones completadas',
  challengesCorrect: 'Preguntas correctas',
  statusInProgress: 'En progreso',
  statusCompleted: 'Completada',
  riddleSolvedLabel: 'Acertijo resuelto',
  riddlePendingLabel: 'Acertijo pendiente',
  checkpointsProgress: (done: number, total: number) => `${done}/${total} puntos de control`,
  categoryMet: 'Cumplida',
  noMissionsUser: 'Este usuario aún no ha iniciado ninguna misión.',
  noRewardsUser: 'Aún no ha obtenido recompensas.',
  rewardEarnedAt: 'Obtenida',
  rewardValidUntil: 'Válida hasta',
  rewardValid: 'Vigente',
  rewardExpired: 'No vigente',
  noSessionsUser: 'Sin sesiones registradas.',
  sessionDevice: 'Dispositivo',
  sessionBrowser: 'Navegador / SO',
  sessionIp: 'IP (aprox.)',
  sessionFirstSeen: 'Inicio de sesión',
  sessionLastSeen: 'Última actividad',
  deviceDesktop: 'Escritorio',
  deviceMobile: 'Móvil',
  deviceTablet: 'Tableta',
  deviceUnknown: 'Desconocido',
  exportData: 'Exportar datos',
  exportDataHint:
    'Descarga en JSON todos los datos personales que guardamos de este usuario (acceso/portabilidad, RGPD Art. 15/20).',
  exportDataDone: 'Datos exportados.',
} as const
