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
  { label: "Inicio", href: "/coach", icon: LayoutDashboard, group: "Operación" },
  { label: "Miembros", href: "/coach/members", icon: Users, group: "Operación" },
  { label: "Programas", href: "/coach/programs", icon: Dumbbell, group: "Operación" },
  { label: "Nutricion", href: "/coach/nutrition", icon: Apple, group: "Operación" },
  { label: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck, group: "Operación" },
  { label: "Contenido", href: "/coach/content", icon: BookOpen, group: "Marca y contenido" },
  { label: "Marca", href: "/coach/brand", icon: Palette, group: "Marca y contenido" },
  { label: "Avisos", href: "/coach/notifications", icon: Bell, group: "Marca y contenido" },
  { label: "Analitica", href: "/coach/analytics", icon: BarChart3, group: "Rendimiento" },
];
