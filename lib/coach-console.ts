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
