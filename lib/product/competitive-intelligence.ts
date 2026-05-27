export type CompetitorInsight = {
  name: string;
  category: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  opportunity: string;
  pricingSignal: string;
};

export type ProductModuleDefinition = {
  area: string;
  module: string;
  purpose: string;
  status: "base" | "next" | "later";
};

export const macroactiveOperatingModel = [
  {
    title: "Venta",
    insight: "No vende una herramienta barata: vende independencia, propiedad de marca y crecimiento con menos carga operativa.",
    buildForUs: "Landing orientada a consulta con agente, prueba de proceso y confianza antes que listado técnico.",
  },
  {
    title: "Onboarding",
    insight: "Especialista asignado, checklist, feedback y tareas por fecha para llegar al lanzamiento.",
    buildForUs: "Proyecto interno con briefing, checklist, readiness y estado visible por fase.",
  },
  {
    title: "App cliente",
    insight: "Dashboard, entrenamiento, comida, check-ins, progreso, contenido, soporte y mensajes en una experiencia de marca.",
    buildForUs: "Cliente final con navegación mínima, tareas de hoy, plan claro y soporte siempre visible.",
  },
  {
    title: "Automatización",
    insight: "Planes de comida y entrenamiento se generan con reglas, preferencias, alergias, progresiones y revisión opcional del coach.",
    buildForUs: "Motores de nutrición y workout editables por marca, con aprobación humana antes de publicar.",
  },
  {
    title: "Operaciones",
    insight: "Promete soporte al cliente final, marketing, contenido, pagos diarios, datos propios y upgrades nativos.",
    buildForUs: "Consola de operaciones con leads, proyectos, contenido, pagos, soporte, métricas y auditoría.",
  },
];

export const competitorInsights: CompetitorInsight[] = [
  {
    name: "MacroActive",
    category: "Done-for-you premium / white-label",
    positioning: "Plataforma propia para creadores fitness con implementación, automatización, soporte y partnership.",
    strengths: [
      "Copy emocional fuerte: independencia, propiedad, escala y no construir en terreno alquilado.",
      "Proceso humano con onboarding specialist, checklist, tareas y feedback.",
      "Promesa de app completa: meal plans, training, mindset, live, contenido, soporte y cross-sell.",
    ],
    weaknesses: [
      "Pricing opaco y mucha dependencia de llamada comercial.",
      "Experiencia pública repetitiva y con jerarquía visual irregular.",
      "Algunas apps derivadas parecen muy similares entre marcas si no se personalizan fuerte.",
    ],
    opportunity: "Ser igual de premium en servicio, pero más claro en proceso, estado, QA y control para el cliente.",
    pricingSignal: "Consulta / partnership / revenue-share o propuesta personalizada.",
  },
  {
    name: "ABC Trainerize",
    category: "SaaS self-serve con branded app",
    positioning: "App de entrenamiento, nutrición, hábitos, pagos y comunidad con add-ons de marca.",
    strengths: [
      "Precio de entrada conocido y mucha adopción.",
      "Custom branded app por niveles, icono/listing y theming.",
      "Ecosistema amplio para entrenadores, estudios y equipos.",
    ],
    weaknesses: [
      "Add-ons y límites pueden complicar el coste real.",
      "Cliente sigue dentro de una lógica de plataforma genérica.",
      "Menos sensación de entrega premium hecha por equipo.",
    ],
    opportunity: "Vender claridad, configuración completa y acompañamiento real en vez de autoservicio con extras.",
    pricingSignal: "Planes mensuales + add-ons; app custom desde setup fee o incluida en planes altos.",
  },
  {
    name: "My PT Hub",
    category: "SaaS todo-en-uno para entrenadores",
    positioning: "Clientes ilimitados, entrenamientos, nutrición, pagos, bookings, chat, check-ins y white-label.",
    strengths: [
      "Muy completo para operaciones de entrenador.",
      "White-label y custom branded app con pricing visible.",
      "Buen argumento de valor para volumen y equipos.",
    ],
    weaknesses: [
      "La amplitud puede sentirse pesada para un creador que quiere lanzar rápido.",
      "Add-ons para white-label, AI, Zapier y trainers.",
      "Menos diferencial de estrategia/implementación de marca.",
    ],
    opportunity: "Diseñar consola más curada: solo lo necesario para vender y operar una app premium.",
    pricingSignal: "Suscripción + add-ons; white-label app mensual.",
  },
  {
    name: "Everfit",
    category: "Coaching automation SaaS",
    positioning: "Automatización de onboarding, mensajes, tareas, grupos y coaching remoto.",
    strengths: [
      "Automations y mensajes programados muy alineados con ahorro de tiempo.",
      "Buena segmentación para independent trainers y gimnasios.",
      "Branding disponible en planes superiores.",
    ],
    weaknesses: [
      "Branding limitado comparado con una app realmente propia.",
      "Pricing por niveles y automatizaciones puede aumentar con uso.",
      "No vende la sensación de activo de marca premium.",
    ],
    opportunity: "Unir automatización + marca premium + proceso humano de implantación.",
    pricingSignal: "Planes mensuales por volumen y automatización.",
  },
  {
    name: "TrueCoach",
    category: "Coaching SaaS centrado en simplicidad",
    positioning: "Programación, mensajería, progreso y cliente app para coaches.",
    strengths: [
      "Reputación fuerte en programación y experiencia coach-cliente.",
      "App Store con valoración alta y muchas reviews.",
      "Workout builder, biblioteca de vídeos, mensajes y métricas.",
    ],
    weaknesses: [
      "Reviews históricas señalan UX densa, muchos clics y problemas de legibilidad.",
      "Límites de clientes por plan.",
      "Custom brand y automatización avanzada en planes superiores.",
    ],
    opportunity: "Mobile UX mucho más simple: tareas claras, menos botones, mejor lectura y continuidad en workouts.",
    pricingSignal: "Planes por número de clientes activos.",
  },
  {
    name: "PT Distinction",
    category: "PT SaaS avanzado",
    positioning: "Muchos sistemas: coaching 1:1, retos, trials, programas, integraciones y pagos.",
    strengths: [
      "Promesa de todas las funciones incluidas sin hidden fees.",
      "Marketing tools: challenges, free trials y sample programs.",
      "Integraciones útiles como Fitbit, MyFitnessPal, Stripe, YouTube y Vimeo.",
    ],
    weaknesses: [
      "Curva de aprendizaje por cantidad de funciones.",
      "Más orientado a self-serve que a marca premium implantada.",
      "Menos claro para creadores que quieren delegar la construcción.",
    ],
    opportunity: "Traer challenges/trials y sistemas de crecimiento, pero con UX guiada y paquete listo.",
    pricingSignal: "Planes mensuales transparentes por nivel.",
  },
  {
    name: "Exercise.com",
    category: "Enterprise gym / fitness business platform",
    positioning: "All-in-one para gimnasios: gestión, staff, members, branded apps, reports y operaciones.",
    strengths: [
      "Mucho peso de confianza para negocios grandes.",
      "Cobertura de negocio completa: booking, waivers, staff, reports, workouts y custom apps.",
      "Copy enfocado en crecimiento y escala operacional.",
    ],
    weaknesses: [
      "Puede ser demasiado enterprise para un entrenador creador.",
      "Demo-first y menos sensación de rapidez de lanzamiento.",
      "Complejidad de configuración alta.",
    ],
    opportunity: "Ofrecer potencia operativa sin convertirlo en software corporativo pesado.",
    pricingSignal: "Demo / propuesta personalizada.",
  },
];

export const productArchitecture: ProductModuleDefinition[] = [
  { area: "Venta", module: "Landing premium", purpose: "Explicar oferta, confianza, proceso y capturar consulta cualificada.", status: "base" },
  { area: "Venta", module: "Onboarding comercial", purpose: "Formulario corto, scoring, prioridad, agente y siguiente acción.", status: "base" },
  { area: "Operación", module: "CRM de leads", purpose: "Cualificar, anotar, asignar y convertir en proyecto.", status: "base" },
  { area: "Operación", module: "Proyectos de implantación", purpose: "Checklist, briefing, tareas, fechas, riesgos y readiness.", status: "base" },
  { area: "Operación", module: "Plantillas de entrega", purpose: "Playbooks por tipo de cliente y app.", status: "base" },
  { area: "Marca", module: "Constructor de app", purpose: "Crear workspace, dominio, app name, colores y navegación.", status: "base" },
  { area: "Cliente", module: "App miembro", purpose: "Panel, entrenamiento, comida, progreso, guías y soporte.", status: "base" },
  { area: "Contenido", module: "CMS por marca", purpose: "Editar guías, assets, banners, soporte y páginas visibles.", status: "next" },
  { area: "Fitness", module: "Biblioteca y workout builder", purpose: "Ejercicios base, vídeos propios, sustituciones y progresión.", status: "next" },
  { area: "Nutrición", module: "Motor de planes", purpose: "Macros, preferencias, alergias, plantillas y recetas por categoría.", status: "next" },
  { area: "Confianza", module: "Verificación y QA", purpose: "Checklist legal, privacidad, dominio, pagos, emails y prueba cliente.", status: "next" },
  { area: "Crecimiento", module: "Ofertas, pagos y cross-sell", purpose: "Productos, cupones, trials, VIP, upsells y reportes.", status: "later" },
  { area: "Comunicación", module: "Mensajes y notificaciones", purpose: "Email, push, in-app, chat, recordatorios y check-ins.", status: "later" },
  { area: "Métricas", module: "Command center", purpose: "MRR, leads, conversión, activación, adherencia, churn y soporte.", status: "later" },
];

export const priorityOpportunities = [
  "Hacer visible el progreso de implantación para que el cliente sienta control desde el primer día.",
  "Reducir el formulario inicial a datos de negocio que realmente cualifican: marca, audiencia, clientes, oferta y contenido disponible.",
  "Crear CMS por marca antes de añadir más pantallas estáticas.",
  "Diseñar app cliente como agenda diaria, no como menú de funciones.",
  "Separar consola interna de experiencia pública: cero jerga técnica en landing o app cliente.",
  "Añadir QA de lanzamiento: dominio, marca, contenido, pagos, soporte, legal, prueba móvil y checklist de publicación.",
];

export const auditFindings = [
  {
    severity: "Alta",
    finding: "Varias pantallas de consola siguen siendo estáticas y no editan todavía datos reales.",
    fix: "Priorizar CMS por workspace, biblioteca de ejercicios y builder nutricional conectado a base de datos.",
  },
  {
    severity: "Alta",
    finding: "La app cliente ya cambia por marca, pero workouts y meals siguen usando datos mock.",
    fix: "Conectar entrenamiento y nutrición a plantillas asignadas por workspace y miembro.",
  },
  {
    severity: "Media",
    finding: "Faltan estados sistemáticos de carga/error en rutas clave.",
    fix: "Crear componentes de loading, empty y error reutilizables y aplicarlos a consola/app.",
  },
  {
    severity: "Media",
    finding: "La landing comunica bien, pero necesita más prueba de proceso, confianza y diferenciación frente a plataformas genéricas.",
    fix: "Añadir secciones de garantía de proceso, readiness, comparativa y consulta guiada.",
  },
  {
    severity: "Media",
    finding: "Todavía no hay búsqueda/filtros reales en leads, contenido, ejercicios o miembros.",
    fix: "Añadir filtros por estado, prioridad, módulo, categoría y readiness.",
  },
];
