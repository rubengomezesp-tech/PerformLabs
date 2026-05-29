import {
  Apple,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Palette,
  Users,
} from "lucide-react";

export const coachNav = [
  { label: "Inicio", href: "/coach", icon: LayoutDashboard },
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
  { label: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck, group: "Clientes" },
  { label: "Contenido", href: "/coach/content", icon: BookOpen, group: "Marca y contenido" },
  { label: "Marca", href: "/coach/brand", icon: Palette, group: "Marca y contenido" },
  { label: "Avisos", href: "/coach/notifications", icon: Bell, group: "Marca y contenido" },
  { label: "Analítica", href: "/coach/analytics", icon: BarChart3, group: "Rendimiento" },
];
