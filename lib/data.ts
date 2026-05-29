import {
  Activity,
  Apple,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Cpu,
  Dumbbell,
  Crown,
  ListChecks,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Radar,
  ShieldCheck,
  Soup,
  Settings,
  Users,
  UserRound,
  Video,
} from "lucide-react";

export const tenant = {
  name: "Marca Blanca Fitness",
  slug: "marca-blanca",
  appName: "Coach App",
  accent: "#078df2",
  supportEmail: "soporte@tumarca.com",
};

export const consoleNav = [
  { label: "Dashboard", href: "/console", icon: Crown },
  { label: "Leads", href: "/console/leads", icon: BriefcaseBusiness },
  { label: "Proyectos", href: "/console/projects", icon: ClipboardCheck },
  { label: "Plantillas", href: "/console/templates", icon: ListChecks },
  { label: "Marcas", href: "/console/apps", icon: LayoutDashboard },
  { label: "Estrategia", href: "/console/strategy", icon: Radar },
  { label: "Lanzamiento", href: "/console/launch", icon: ShieldCheck },
  { label: "Seguridad", href: "/console/security", icon: LockKeyhole },
  { label: "Producto", href: "/console/system", icon: Cpu },
  { label: "Clientes", href: "/console/members", icon: Users },
  { label: "Ejercicios", href: "/console/exercises", icon: Dumbbell },
  { label: "Programas", href: "/console/programs", icon: Dumbbell },
  { label: "Dietas", href: "/console/diet-templates", icon: Soup },
  { label: "Nutrición", href: "/console/nutrition", icon: Apple },
  { label: "Contenido", href: "/console/content", icon: BookOpen },
  { label: "Notificaciones", href: "/console/notifications", icon: Bell },
  { label: "Comunidad", href: "/console/community", icon: MessageSquare },
  { label: "Pagos", href: "/console/billing", icon: CreditCard },
  { label: "Marca", href: "/console/brand", icon: Settings },
];

export const memberNav = [
  { label: "Panel", href: "/app", icon: LayoutDashboard },
  { label: "Inicio", href: "/app/onboarding", icon: ClipboardList },
  { label: "Entreno", href: "/app/workouts", icon: Dumbbell },
  { label: "Comida", href: "/app/meals", icon: Apple },
  { label: "Progreso", href: "/app/progress", icon: BarChart3 },
  { label: "Cardio", href: "/app/cardio", icon: Activity },
  { label: "Guías", href: "/app/guides", icon: BookOpen },
  { label: "Soporte", href: "/app/support", icon: MessageSquare },
  { label: "Perfil", href: "/app/profile", icon: UserRound },
];

export const metrics = [
  { label: "Marcas activas", value: "4", detail: "+1 este mes" },
  { label: "Miembros", value: "1.284", detail: "86% activos" },
  { label: "MRR estimado", value: "42.6k€", detail: "Pagos preparados" },
  { label: "Check-ins pendientes", value: "37", detail: "12 urgentes" },
];

export const childApps = [
  {
    name: "Marca Blanca Fitness",
    owner: "Equipo Coach",
    domain: "tumarca.com",
    status: "Activa",
    members: 438,
    mrr: "13.8k€",
  },
  {
    name: "Fit Moms Club",
    owner: "Laura Peña",
    domain: "fitmoms.example.com",
    status: "Onboarding",
    members: 92,
    mrr: "2.1k€",
  },
  {
    name: "Iron Method",
    owner: "Carlos Díaz",
    domain: "ironmethod.app",
    status: "Activa",
    members: 311,
    mrr: "8.6k€",
  },
];

export const members = [
  {
    name: "Cliente Demo",
    email: "cliente.demo@example.com",
    plan: "Soft Launch",
    status: "Expirado",
    progress: "Peso y grasa actualizados",
    coach: "Equipo Coach",
  },
  {
    name: "Lucía Martín",
    email: "lucia@example.com",
    plan: "Plan Mensual",
    status: "Activo",
    progress: "Check-in pendiente",
    coach: "Ana",
  },
  {
    name: "Carlos Diaz",
    email: "carlos@example.com",
    plan: "Transformación 12 semanas",
    status: "Activo",
    progress: "Nuevo plan solicitado",
    coach: "Equipo Coach",
  },
  {
    name: "Marina Soler",
    email: "marina@example.com",
    plan: "Nutrición",
    status: "Trial",
    progress: "Onboarding incompleto",
    coach: "Equipo Coach",
  },
];

export const modules = [
  {
    title: "Constructor de marca",
    text: "Cada cliente puede tener logo, colores, dominio, landing, emails y experiencia móvil propios.",
    state: "Base",
  },
  {
    title: "Programas de entrenamiento",
    text: "Rutinas por semanas, días, ejercicios, series, reps, tempo, descanso, vídeo y sustituciones por lesión.",
    state: "MVP",
  },
  {
    title: "Nutrición y comidas",
    text: "Planes diarios, recetas, macros, lista de compra, ingredientes que no gustan y cambios de comida.",
    state: "MVP",
  },
  {
    title: "Check-ins y progreso",
    text: "Fotos, peso, medidas, grasa corporal, notas, revisión del coach y generación de nuevo plan.",
    state: "MVP",
  },
  {
    title: "Comunidad y chat",
    text: "Canales por marca, posts, comentarios, mensajes directos, archivos y soporte.",
    state: "Fase 2",
  },
  {
    title: "Pagos y suscripciones",
    text: "Planes, cupones, pruebas, estados de acceso, recuperación de pagos fallidos y facturación.",
    state: "Fase 2",
  },
];

export const exerciseLibrary = [
  {
    name: "Press inclinado con mancuernas",
    muscles: "Pecho, hombro, tríceps",
    equipment: "Mancuernas, banco",
    source: "Biblioteca global",
    video: "Editable por marca",
  },
  {
    name: "Sentadilla",
    muscles: "Cuádriceps, glúteo",
    equipment: "Barra",
    source: "Biblioteca global",
    video: "Editable por marca",
  },
  {
    name: "Remo con polea",
    muscles: "Espalda, bíceps",
    equipment: "Polea",
    source: "Biblioteca global",
    video: "Editable por marca",
  },
  {
    name: "Hip thrust",
    muscles: "Glúteo, femoral",
    equipment: "Barra, banco",
    source: "Marca",
    video: "Propio del entrenador",
  },
];

export const dietTemplateCategories = [
  {
    name: "Sin gluten",
    description: "Excluye trigo, cebada, centeno y recetas marcadas con gluten.",
    templates: 18,
  },
  {
    name: "Alta proteína",
    description: "Prioriza proteína por kg y reparte carbohidrato según entrenamiento.",
    templates: 24,
  },
  {
    name: "Vegana",
    description: "Solo recetas vegetales, controlando proteína completa y micronutrientes.",
    templates: 12,
  },
  {
    name: "Definición",
    description: "Déficit calórico configurable con saciedad alta y snacks opcionales.",
    templates: 30,
  },
];

export const workouts = [
  {
    day: "Día 1",
    title: "Push hipertrofia",
    exercises: ["Press inclinado", "Press militar", "Fondos", "Elevaciones laterales"],
    duration: "58 min",
  },
  {
    day: "Día 2",
    title: "Pierna completa",
    exercises: ["Sentadilla", "Prensa", "Peso muerto rumano", "Gemelos"],
    duration: "64 min",
  },
  {
    day: "Día 3",
    title: "Pull controlado",
    exercises: ["Dominadas", "Remo", "Jalón unilateral", "Curl bíceps"],
    duration: "55 min",
  },
];

export const meals = [
  { name: "Desayuno", meal: "Tortilla, avena y frutos rojos", kcal: 620, protein: 42 },
  { name: "Comida", meal: "Pollo, arroz jazmín y verduras", kcal: 780, protein: 58 },
  { name: "Cena", meal: "Salmón, patata y ensalada", kcal: 690, protein: 46 },
  { name: "Snack", meal: "Yogur griego con nueces", kcal: 340, protein: 28 },
];

export const contentPages = [
  "Guía de bienvenida de nutrición",
  "Cardio HIIT y LISS",
  "FAQs de macros",
  "Cómo cambiar comidas",
  "Lesiones y sustituciones",
];

export const videos = [
  { title: "Press inclinado con mancuernas", type: "Ejercicio", icon: Video },
  { title: "Cómo pesar alimentos", type: "Nutrición", icon: Video },
  { title: "Check-in perfecto", type: "Progreso", icon: Video },
];
