import {
  Apple,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Palette,
  Pill,
  Salad,
  Sparkles,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const coachNavEs = [
  { label: "Inicio", href: "/coach", icon: LayoutDashboard },
  {
    label: "Coach IA",
    icon: Sparkles,
    children: [
      { label: "Cerebro", href: "/coach/ai", icon: Brain },
      { label: "Generador de planes", href: "/coach/ai/plans", icon: Wand2 },
    ],
  },
  {
    label: "Fitness",
    icon: Dumbbell,
    children: [
      { label: "Programas", href: "/coach/programs", icon: Dumbbell },
      { label: "Ejercicios", href: "/coach/exercises", icon: ListChecks },
    ],
  },
  {
    label: "Nutrición",
    icon: Apple,
    children: [
      { label: "Comidas y planes", href: "/coach/nutrition", icon: Apple },
      { label: "Alimentos", href: "/coach/foods", icon: Salad },
      { label: "Suplementos", href: "/coach/supplements", icon: Pill },
    ],
  },
  { label: "Leads", href: "/coach/leads", icon: Inbox, group: "Clientes" },
  { label: "Miembros", href: "/coach/members", icon: Users, group: "Clientes" },
  { label: "Mensajes", href: "/coach/messages", icon: MessagesSquare, group: "Clientes" },
  { label: "Retención IA", href: "/coach/retention", icon: HeartPulse, group: "Clientes" },
  { label: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck, group: "Clientes" },
  { label: "Comunidad", href: "/coach/community", icon: MessagesSquare, group: "Clientes" },
  { label: "Retos", href: "/coach/challenges", icon: Trophy, group: "Clientes" },
  { label: "Contenido", href: "/coach/content", icon: BookOpen, group: "Marca y contenido" },
  { label: "Marca", href: "/coach/brand", icon: Palette, group: "Marca y contenido" },
  { label: "Avisos", href: "/coach/notifications", icon: Bell, group: "Marca y contenido" },
  { label: "Analítica", href: "/coach/analytics", icon: BarChart3, group: "Rendimiento" },
  { label: "Facturación", href: "/coach/billing", icon: CreditCard, group: "Negocio" },
];

const coachNavEn = [
  { label: "Home", href: "/coach", icon: LayoutDashboard },
  { label: "AI Coach", icon: Sparkles, children: [
    { label: "Brain", href: "/coach/ai", icon: Brain },
    { label: "Plan generator", href: "/coach/ai/plans", icon: Wand2 },
  ] },
  { label: "Fitness", icon: Dumbbell, children: [
    { label: "Programs", href: "/coach/programs", icon: Dumbbell },
    { label: "Exercises", href: "/coach/exercises", icon: ListChecks },
  ] },
  { label: "Nutrition", icon: Apple, children: [
    { label: "Meals and plans", href: "/coach/nutrition", icon: Apple },
    { label: "Foods", href: "/coach/foods", icon: Salad },
    { label: "Supplements", href: "/coach/supplements", icon: Pill },
  ] },
  { label: "Leads", href: "/coach/leads", icon: Inbox, group: "Clients" },
  { label: "Members", href: "/coach/members", icon: Users, group: "Clients" },
  { label: "Messages", href: "/coach/messages", icon: MessagesSquare, group: "Clients" },
  { label: "AI retention", href: "/coach/retention", icon: HeartPulse, group: "Clients" },
  { label: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck, group: "Clients" },
  { label: "Community", href: "/coach/community", icon: MessagesSquare, group: "Clients" },
  { label: "Challenges", href: "/coach/challenges", icon: Trophy, group: "Clients" },
  { label: "Content", href: "/coach/content", icon: BookOpen, group: "Brand and content" },
  { label: "Brand", href: "/coach/brand", icon: Palette, group: "Brand and content" },
  { label: "Notifications", href: "/coach/notifications", icon: Bell, group: "Brand and content" },
  { label: "Analytics", href: "/coach/analytics", icon: BarChart3, group: "Performance" },
  { label: "Billing", href: "/coach/billing", icon: CreditCard, group: "Business" },
];

export const coachNav = coachNavEs;
export function getCoachNav(locale: Locale) {
  return locale === "en" ? coachNavEn : coachNavEs;
}
