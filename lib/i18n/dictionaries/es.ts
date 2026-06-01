// Spanish is the source dictionary: its shape defines the `Dictionary` type that
// every other language must satisfy (missing keys become a type error).

export const es = {
  switcher: { label: "Idioma", change: "Cambiar idioma" },
  nav: {
    access: "Acceder",
    app: "La app",
    process: "Proceso",
    demo: "Demo",
    requestProposal: "Solicitar propuesta",
  },
  hero: {
    eyebrow: "La app de coaching con tu marca",
    headlineLead: "La app de tu marca para",
    accents: ["entrenar", "comer", "progresar"],
    conjunction: "y",
    headlineTail: ".",
    sub: "Entrenos en vídeo con el progreso por serie, contador de calorías por foto y nutrición a tu método. Con tu marca, y contigo al frente de tus clientes.",
    ctaPrimary: "Solicitar propuesta",
    ctaDemo: "Ver experiencia demo",
  },
  trust: ["Entrenos en vídeo", "Calorías por foto", "Nutrición a tu método", "100% tu marca"],
  stats: [
    { value: "Por foto", label: "calorías y macros, sin escribir" },
    { value: "En vídeo", label: "cada ejercicio, con su técnica" },
    { value: "100%", label: "tu marca, tu nombre, tu dominio" },
    { value: "App + consola", label: "para tu cliente y para ti" },
  ],
  platform: {
    tag: "La app",
    title: "La app que tus clientes usan cada día.",
    text: "Entreno, comida y progreso en un solo sitio, con tu marca. Tú acompañas; la tecnología hace el trabajo repetitivo.",
  },
  capabilities: [
    { tag: "Sin escribir", title: "Calorías por foto", text: "El cliente hace una foto al plato y la app estima calorías y macros al instante. Cero fricción, más adherencia." },
    { tag: "Vídeo + técnica", title: "Entrenos en vídeo", text: "Cada ejercicio con su vídeo, series, reps y descanso. El cliente sabe exactamente qué hacer en cada sesión." },
    { tag: "Serie a serie", title: "Progreso real", text: "Apunta reps y kilos en cada serie y ve la evolución de cada ejercicio y de tu peso." },
    { tag: "Tu método", title: "Nutrición a medida", text: "Plan de comidas, macros y recetas con tus reglas, no una dieta genérica de plantilla." },
    { tag: "Tú al frente", title: "Acompañas sin perseguir", text: "Ves quién flojea y actúas a tiempo. Tú eres quien acompaña; las herramientas te quitan el trabajo repetitivo." },
    { tag: "White-label", title: "100% tu marca", text: "Logo, color, nombre y dominio. Tus clientes ven tu marca de principio a fin, nunca la nuestra." },
  ],
  bentoShot: { dish: "Bowl de pollo y arroz" },
  process: {
    tag: "Proceso",
    title: "De idea a app operativa, con implantación guiada.",
    text: "Trabajamos contigo el encaje, la marca y la experiencia antes de lanzar a clientes reales.",
    steps: [
      { title: "Cuéntanos tu proyecto", text: "Revisamos tu marca, tu método, tu oferta y la experiencia que quieres entregar." },
      { title: "Definimos la propuesta", text: "Aterrizamos alcance, branding, contenidos iniciales y calendario de implantación." },
      { title: "Implantamos y lanzamos", text: "Dejamos la app y la consola listas para operar con tus clientes reales." },
    ],
  },
  demo: {
    tag: "Vista cliente",
    title: "Mira la app por dentro.",
    text: "Entreno, comida, progreso, mensajes con tu coach y comunidad. Arrastra para recorrerla, con tu marca de principio a fin.",
  },
  lead: {
    tag: "Solicitar propuesta",
    title: "Cuéntanos qué quieres construir.",
    text: "Revisamos el encaje, el alcance y la mejor forma de lanzar tu app de marca.",
    fields: {
      name: "Nombre",
      namePlaceholder: "Tu nombre",
      email: "Email",
      phone: "Teléfono",
      brand: "Marca o nombre del proyecto",
      brandPlaceholder: "Ej. Elite Coach Academy",
      site: "Web o Instagram",
      clients: "Clientes actuales aproximados",
      clientsPlaceholder: "Selecciona una opción",
      goal: "Objetivo principal",
      goalPlaceholder: "Qué necesitas conseguir",
      goalLaunch: "Lanzar mi primera app",
      goalUpgrade: "Mejorar mi sistema actual",
      goalScale: "Escalar clientes y equipo",
      goalBrand: "Elevar percepción de marca",
      notes: "Notas",
      notesPlaceholder: "Cuéntanos tu oferta, el contenido disponible y qué experiencia quieres entregar.",
      submit: "Enviar solicitud",
    },
  },
  faq: {
    tag: "Preguntas",
    title: "Lo que sueles querer saber antes de hablar.",
    items: [
      { question: "¿Cómo empezamos?", answer: "Rellenas la solicitud, revisamos el encaje y te enviamos una propuesta con alcance, fases y próximos pasos." },
      { question: "¿Puedo usar mi propio branding?", answer: "Sí. Cada app tiene nombre, logo, color, dominio, soporte y configuración propios." },
      { question: "¿Es una plantilla genérica?", answer: "No. Partimos de una base sólida y la adaptamos a tu marca, tu método, tu contenido y tu operación." },
    ],
  },
  footer: {
    tagline: "La app de coaching con tu marca.",
    start: "Empezar",
  },
};

export type Dictionary = typeof es;
