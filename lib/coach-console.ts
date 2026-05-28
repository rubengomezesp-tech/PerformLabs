import {
  Apple,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  Dumbbell,
  LayoutDashboard,
  Palette,
  Users,
} from "lucide-react";

export const coachNav = [
  { label: "Inicio", href: "/coach", icon: LayoutDashboard },
  { label: "Miembros", href: "/coach/members", icon: Users },
  { label: "Programas", href: "/coach/programs", icon: Dumbbell },
  { label: "Nutricion", href: "/coach/nutrition", icon: Apple },
  { label: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck },
  { label: "Contenido", href: "/coach/content", icon: BookOpen },
  { label: "Marca", href: "/coach/brand", icon: Palette },
  { label: "Avisos", href: "/coach/notifications", icon: Bell },
  { label: "Analitica", href: "/coach/analytics", icon: BarChart3 },
];

export const coachStats = [
  { label: "Miembros activos", value: "438", detail: "86% con actividad esta semana" },
  { label: "Check-ins pendientes", value: "37", detail: "12 necesitan revision prioritaria" },
  { label: "Programas publicados", value: "18", detail: "Entreno, cardio y fases activas" },
  { label: "Planes de comida", value: "42", detail: "Plantillas por objetivo y restriccion" },
];

export const coachTodayQueue = [
  {
    title: "Revisar check-in de David Test",
    detail: "Fotos subidas, peso actualizado y resultado marcado como pendiente.",
    status: "Alta prioridad",
  },
  {
    title: "Publicar Push hipertrofia 4D",
    detail: "Faltan videos en press inclinado y elevaciones laterales.",
    status: "Contenido",
  },
  {
    title: "Actualizar plan de definicion",
    detail: "Ajustar macros para miembros con baja adherencia esta semana.",
    status: "Nutricion",
  },
];

export const coachMembers = [
  {
    name: "David Test",
    email: "test+1@example.com",
    plan: "Transformacion 12 semanas",
    status: "Activo",
    checkin: "Pendiente",
    adherence: "82%",
  },
  {
    name: "Lucia Martin",
    email: "lucia@example.com",
    plan: "Elite mensual",
    status: "Activo",
    checkin: "Hoy",
    adherence: "91%",
  },
  {
    name: "Carlos Diaz",
    email: "carlos@example.com",
    plan: "Hipertrofia avanzado",
    status: "Pausado",
    checkin: "Sin enviar",
    adherence: "54%",
  },
];

export const coachPrograms = [
  {
    name: "Hipertrofia avanzado 5D",
    goal: "Volumen",
    status: "Publicado",
    days: 5,
    sessions: 20,
    assigned: 126,
  },
  {
    name: "Definicion 4D + cardio",
    goal: "Definicion",
    status: "Borrador",
    days: 4,
    sessions: 16,
    assigned: 0,
  },
  {
    name: "Base casa 3D",
    goal: "Recomposicion",
    status: "Publicado",
    days: 3,
    sessions: 12,
    assigned: 84,
  },
];

export const coachMeals = [
  {
    name: "Pollo, arroz jazmin y verduras",
    type: "Comida",
    kcal: 780,
    protein: 58,
    restrictions: "Sin lactosa",
  },
  {
    name: "Tortilla, avena y frutos rojos",
    type: "Desayuno",
    kcal: 620,
    protein: 42,
    restrictions: "Alta proteina",
  },
  {
    name: "Wrap de huevo y aguacate",
    type: "Cena",
    kcal: 540,
    protein: 34,
    restrictions: "Flexible",
  },
];

export const coachContent = [
  { title: "Guia de bienvenida", area: "Onboarding", status: "Publicado" },
  { title: "Como registrar fotos", area: "Progreso", status: "Publicado" },
  { title: "FAQs de macros", area: "Nutricion", status: "Borrador" },
];
