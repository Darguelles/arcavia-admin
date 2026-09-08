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

  // MFA
  mfaTitle: 'Verificación en dos pasos',
  mfaCodeLabel: 'Código de verificación',
  mfaCodeHint: 'Introduce el código de 6 dígitos de tu app de autenticación.',
  mfaVerifyButton: 'Verificar',
  mfaUseRecoveryCode: 'Usar un código de recuperación',
  mfaUseTotpCode: 'Usar el código de la app',
  mfaRecoveryCodeLabel: 'Código de recuperación',
  mfaInvalidCode: 'Código de verificación incorrecto.',
  mfaTokenExpired: 'La sesión de verificación ha caducado. Inicia sesión de nuevo.',
  mfaEnrollTitle: 'Configura la verificación en dos pasos',
  mfaEnrollIntro:
    'Escanea este código QR con tu app de autenticación (Google Authenticator, 1Password, Authy…) y confirma con el código de 6 dígitos.',
  mfaEnrollManual: 'O introduce esta clave manualmente:',
  mfaEnrollConfirmButton: 'Activar y continuar',
  mfaEnrollRequired: 'Debes configurar la verificación en dos pasos para acceder al panel.',
  mfaRecoveryCodesTitle: 'Códigos de recuperación',
  mfaRecoveryCodesHint:
    'Guarda estos códigos en un lugar seguro (gestor de contraseñas o impresos). Cada uno funciona una sola vez y son la única forma de entrar si pierdes tu app de autenticación. No se mostrarán de nuevo.',
  mfaRecoveryCodesCopied: 'Códigos copiados.',
  mfaRecoveryCodesContinue: 'Ya los guardé — continuar',
  backToLogin: 'Volver a iniciar sesión',

  // Team management
  resetPassword: 'Restablecer contraseña',
  team: 'Equipo',
  teamTitle: 'Equipo del panel',
  teamNew: 'Nuevo usuario',
  teamCreateTitle: 'Crear usuario del panel',
  teamRoleLabel: 'Rol',
  teamRoleRoot: 'Root',
  teamRoleAdmin: 'Administrador',
  teamRoleStaff: 'Staff',
  teamColMfa: 'MFA',
  teamMfaEnrolled: 'Activada',
  teamMfaPending: 'Pendiente',
  teamResetMfa: 'Restablecer MFA',
  teamResetMfaConfirm: (email: string) =>
    `Se desactivará la verificación en dos pasos de ${email} y sus sesiones se cerrarán. Deberá configurarla de nuevo en su próximo inicio de sesión. ¿Continuar?`,
  teamChangeRole: 'Cambiar rol',
  teamChangeRoleConfirm: (email: string, role: string) =>
    `Cambiar el rol de ${email} a ${role}. ¿Continuar?`,
  teamCreated: 'Usuario creado.',
  teamUpdated: 'Usuario actualizado.',
  teamMfaResetDone: 'MFA restablecida.',
  errCannotModifySelf: 'No puedes modificar tu propia cuenta.',
  errCannotModifyRoot: 'La cuenta root no se puede modificar.',
  errEmailTaken: 'Ya existe una cuenta con ese correo.',

  // Duplicate city slug (409 SLUG_TAKEN)
  errSlugTakenField: 'Ya existe una ciudad con este código corto.',
  errSlugTaken:
    'Ya existe una ciudad con ese código corto. Para crear otra zona de la misma ciudad (p. ej. «Lima Antigua»), cambia el nombre o el código corto — cada zona funciona como una ciudad aparte.',

  // Audit log
  audit: 'Auditoría',
  auditTitle: 'Registro de auditoría',
  auditColDate: 'Fecha',
  auditColActor: 'Usuario',
  auditColAction: 'Acción',
  auditColTarget: 'Objeto',
  auditColIp: 'IP',
  auditFilterActor: 'Usuario',
  auditFilterAction: 'Acción',
  auditFilterFrom: 'Desde',
  auditFilterTo: 'Hasta',
  auditNoResults: 'Sin registros para los filtros seleccionados.',
  auditDetails: 'Detalles',

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
  homeContent: 'Página de inicio',
  homeContentHint:
    'Textos y fotos de la página de inicio de la app del jugador (diseño «HOME»). Cada campo viene con el texto actual; déjalo vacío para volver al texto por defecto.',
  homeHeroSection: 'Portada',
  homeHeroIntro: 'Introducción (salto de línea = dos líneas)',
  homeHeroTagline: 'Pregunta destacada (dorada)',
  homeHeadline: 'Titular «El mundo se convierte en una aventura»',
  homeHeadlineBody: 'Texto bajo el titular',
  homeCitySection: 'Sección «La ciudad se vive, no solo se visita»',
  homeHowSection: 'Sección «¡Tu aventura comienza aquí!» (6 pasos)',
  homeLegendSection: 'Sección «La leyenda del Ángel»',
  homeLegendSubtitle: 'Subtítulo (dorado)',
  homeFeatureSection: 'Tarjeta dorada',
  homeTiersSection: 'Sección «¿Hasta dónde llegarás?» (5 niveles)',
  homeTiersIntro: 'Introducción',
  homeClosingSection: 'Cierre de la página',
  fieldTitle: 'Título',
  fieldBody: 'Texto',
  homeImages: 'Fotos de la página',
  homeImagesHint:
    'Reemplazan las fotos de diseño que la app trae por defecto. JPG, PNG o WebP — máximo 5 MB.',
  homeHeroImage: 'Portada — el Ángel (bajo el logo)',
  homeLegendImage: '«La leyenda del Ángel» — foto',
  homeFeatureImage: 'Tarjeta dorada — foto',
  // Recommended resolutions: 2× the player render size (Figma frame) so the
  // photo stays sharp on high-density phones. The player crops to fit
  // (object-cover), so the aspect ratio matters more than exact pixels.
  imageSpecLabel: 'Resolución recomendada',
  homeHeroImageSpec:
    '650 × 650 px (cuadrada, 1:1). Se muestra a 322 × 325 y se recorta por arriba.',
  homeLegendImageSpec: '640 × 450 px (horizontal, 10:7). Se muestra a 320 × 224.',
  homeFeatureImageSpec: '570 × 480 px (horizontal, 6:5). Se muestra a 283 × 240.',
  landmarkImageSpec: '560 × 900 px (vertical, 5:8). Cada tarjeta se muestra a 280 × 450.',
  logoImageSpec:
    'Mínimo 800 px de ancho, proporción ~2:1 (p. ej. 800 × 380 px). PNG o SVG con fondo transparente.',
  missionImageSpec:
    '1000 × 1000 px (cuadrada, 1:1) o mayor. Se recorta al centro: 370 × 329 en la lista y 402 × 453 en la misión.',
  challengeImageSpec:
    '810 × 910 px (vertical, 8:9) o mayor. Se muestra a 402 × 453 en pantalla completa.',
  noImage: 'Sin imagen',
  homeLandmarks: 'Carrusel de lugares destacados',
  homeLandmarksHint:
    'El jugador desliza entre estas imágenes (máximo 8). Título y descripción se muestran sobre cada foto. JPG, PNG o WebP — máximo 5 MB.',
  landmarkTitle: 'Título',
  landmarkCaption: 'Descripción (opcional)',
  addLandmark: 'Agregar imagen',
  landmarkLimitReached: 'Límite de 8 imágenes alcanzado.',

  // Login (split-screen redesign)
  loginBrandTitle: 'Administrador',
  loginBrandSubtitle: 'Panel de operación de Arcavia Quest.',
  loginBrandFootnote: 'Acceso restringido al equipo. Toda acción queda registrada en auditoría.',
  loginOverline: 'Iniciar sesión',
  loginWelcome: 'Bienvenido de vuelta',
  loginMfaNote: 'Tras la contraseña se pide el código de verificación en dos pasos.',

  // Dashboard (redesign)
  needsAttention: 'Requiere tu atención',
  shortcuts: 'Atajos',
  newMission: 'Nueva misión',
  newCity: 'Nueva ciudad',
  completions7d: 'Completados (7 d)',
  allCitiesRange: 'Todas las ciudades · 30 días',

  // List toolbars
  createCity: 'Crear ciudad',
  createMission: 'Crear misión',
  createCampaign: 'Crear campaña',
  searchCitiesPlaceholder: 'Buscar ciudades…',
  searchMissionsPlaceholder: 'Buscar misiones…',
  searchCampaignsPlaceholder: 'Buscar campañas…',
  filterTabAll: 'Todas',
  filterTabActive: 'Activas',
  filterTabDraft: 'Borrador',
  recordsCount: (n: number) => `${n.toLocaleString('es')} registros`,
  filterTabPending: 'Pendientes',
  filterTabResolved: 'Resueltas',
  auditHideDetails: 'Ocultar',
  riddleWarningTitle: 'Falta el acertijo',
  readinessProgress: (met: number, total: number) => `${met} de ${total} requisitos cumplidos`,

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
  riddleHint: 'Requisito para cerrar la misión: el jugador debe resolver al menos un acertijo.',
  keyword: 'Palabra clave',
  keywordHint: 'Se revela al jugador solo cuando resuelve el acertijo correctamente.',
  funFact: 'Dato curioso',
  funFactHint:
    'Opcional. Se muestra al jugador al responder correctamente esta pregunta — sea acertijo o no.',

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
  categoryPlaceholder: 'Ej.: Punto Cultural, Patrocinador',
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
  // Publication readiness (Estado de publicación)
  publicationStatus: 'Estado de publicación',
  activateMission: 'Activar misión',
  missionActivated: 'Misión activada.',
  missionActiveBadge: 'Misión activa',
  checkHasCategories: 'Tiene al menos una categoría',
  checkHasPhases: 'Tiene al menos una fase',
  checkPhasesHaveActiveWaypoint: 'Cada fase tiene al menos un punto activo',
  checkCategoriesHavePoints: 'Cada categoría suma puntos',
  noPointsBadge: 'Sin puntos',
  noActiveWaypointBadge: 'Sin punto activo',
  riddleWarning:
    'Ninguna pregunta está marcada como "Es un acertijo". El acertijo es la llave final de la misión: además de sumar los puntos de cada categoría, el jugador debe resolver un acertijo para completarla y cobrar el bono. Sin uno, nadie podrá terminar la misión — marca al menos una pregunta como acertijo.',
  fixThis: 'Revisar',

  // Backend error codes, translated (see src/lib/apiErrors.ts)
  errMissionNeedsStructure: 'La misión necesita al menos una categoría y una fase para activarse.',
  errPhaseNoActiveWaypoint: (name: string) => `La fase "${name}" no tiene ningún punto activo.`,
  errCategoryNoPoints: (name: string) =>
    `La categoría "${name}" no suma puntos. Activa al menos un punto suyo con puntos.`,
  errCategoryInUse: 'La categoría tiene puntos asignados. Reasigna o elimina sus puntos primero.',
  errPhaseInUse: 'La fase tiene puntos asignados. Elimina sus puntos primero.',
  errChallengeOptionInUse:
    'Algún jugador ya respondió con una de las alternativas que quitaste. Edita su texto en lugar de eliminarla.',
  errChallengeInUse: 'Algún jugador ya respondió esta pregunta; no se puede eliminar.',
  errInvalidOptions: 'Cada pregunta necesita al menos 2 opciones y una correcta.',
  errKeywordRequired: 'La verificación por palabra clave necesita una pregunta y una respuesta.',
  errCategoryMissionMismatch: 'La categoría seleccionada no pertenece a esta misión.',

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
