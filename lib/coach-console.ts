import {
  Apple,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  ClipboardCheck,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Palette,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

export const coachNav = [
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
    ],
  },
  { label: "Miembros", href: "/coach/members", icon: Users, group: "Clientes" },
  { label: "Retención IA", href: "/coach/retention", icon: HeartPulse, group: "Clientes" },
  { label: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck, group: "Clientes" },
  { label: "Comunidad", href: "/coach/community", icon: MessagesSquare, group: "Clientes" },
  { label: "Contenido", href: "/coach/content", icon: BookOpen, group: "Marca y contenido" },
  { label: "Marca", href: "/coach/brand", icon: Palette, group: "Marca y contenido" },
  { label: "Avisos", href: "/coach/notifications", icon: Bell, group: "Marca y contenido" },
  { label: "Analítica", href: "/coach/analytics", icon: BarChart3, group: "Rendimiento" },
];
