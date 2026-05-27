export type BaseAppBlueprintModule = {
  key: string;
  title: string;
  description: string;
  consoleArea: string;
  clientExperience: string;
  routes: string[];
};

export type BuildPhase = {
  title: string;
  clientLabel: string;
  description: string;
};

export const baseAppMetrics = [
  {
    label: "Motor base",
    value: "1 core",
    text: "Una app mantenible que se personaliza por marca, dominio, contenido y permisos.",
  },
  {
    label: "Entrega",
    value: "4 fases",
    text: "Estrategia, marca, configuración operativa y revisión antes de invitar clientes.",
  },
  {
    label: "Experiencia",
    value: "9 pantallas",
    text: "Panel, onboarding, entrenamiento, comida, progreso, cardio, guías, soporte y perfil.",
  },
];

export const baseAppBlueprint: BaseAppBlueprintModule[] = [
  {
    key: "brand-access",
    title: "Marca, dominio y acceso",
    description: "Logo, colores, nombre de app, URL profesional, icono instalable y datos de soporte.",
    consoleArea: "Marca",
    clientExperience: "El usuario entra en una experiencia propia del entrenador, sin sensación de plantilla.",
    routes: ["/console/brand", "/app/select"],
  },
  {
    key: "member-dashboard",
    title: "Panel diario del cliente",
    description: "Resumen de entrenamiento, nutrición, progreso, próximos pasos y avisos del coach.",
    consoleArea: "Miembros",
    clientExperience: "Cada cliente entiende qué hacer hoy y qué queda pendiente.",
    routes: ["/app", "/app/onboarding"],
  },
  {
    key: "training-system",
    title: "Entrenamientos y biblioteca",
    description: "Programas, semanas, días, ejercicios, vídeos, alternativas y notas por lesión o nivel.",
    consoleArea: "Programas",
    clientExperience: "El plan se ve como una app premium, con vídeo y seguimiento claro.",
    routes: ["/console/programs", "/console/exercises", "/app/workouts"],
  },
  {
    key: "nutrition-engine",
    title: "Nutrición y plantillas",
    description: "Macros, recetas, categorías, restricciones, alergias y plantillas por objetivo.",
    consoleArea: "Nutrición",
    clientExperience: "El cliente recibe un plan de comidas claro, medible y adaptable.",
    routes: ["/console/nutrition", "/console/diet-templates", "/app/meals"],
  },
  {
    key: "progress-checkins",
    title: "Progreso y check-ins",
    description: "Medidas, fotos, notas, adherencia, evolución y revisión por parte del equipo.",
    consoleArea: "Miembros",
    clientExperience: "El avance se registra con fricción baja y sensación de acompañamiento.",
    routes: ["/console/members", "/app/progress"],
  },
  {
    key: "content-support",
    title: "Contenido, soporte y comunicación",
    description: "Guías, onboarding, FAQs, mensajes, notificaciones y canales de ayuda.",
    consoleArea: "Contenido",
    clientExperience: "Soporte y educación viven dentro de la marca, no repartidos por herramientas externas.",
    routes: ["/console/content", "/console/notifications", "/app/guides", "/app/support"],
  },
];

export const baseAppBuildPhases: BuildPhase[] = [
  {
    title: "Estrategia",
    clientLabel: "Definimos tu oferta",
    description: "Público, promesa, productos, contenido disponible, precio y objetivo de lanzamiento.",
  },
  {
    title: "Identidad",
    clientLabel: "Preparamos tu marca",
    description: "Dominio, logo, colores, nombre de app, icono, tono visual y primera impresión.",
  },
  {
    title: "Configuración",
    clientLabel: "Montamos la experiencia",
    description: "Entrenamientos, nutrición, guías, soporte, onboarding, productos y pantallas clave.",
  },
  {
    title: "Salida",
    clientLabel: "Lanzamos con control",
    description: "QA, vista cliente, checklist final, accesos y primeros usuarios reales.",
  },
];
