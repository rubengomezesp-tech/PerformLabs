import { redirect } from "next/navigation";
import { getMemberContext, memberNeedsIntake } from "@/lib/auth/member-access";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

/**
 * Gate de valoración inicial (Lote B). Vive en el layout de este route group —
 * NO en el layout raíz de /app — porque las rutas exentas (onboarding, soporte,
 * perfil, selector) quedan fuera del grupo: entrar a cualquier ruta gated desde
 * ellas monta este layout de nuevo y el check corre también en navegación
 * client-side. Grandfathering, admins y modo open quedan exentos en
 * memberNeedsIntake; kill-switch por env INTAKE_GATE_DISABLED=1.
 */
export default async function GatedMemberLayout({ children }: { children: React.ReactNode }) {
  const brand = await getSelectedMemberAppBrand();
  const context = await getMemberContext(brand.id);
  if (memberNeedsIntake(context)) {
    redirect("/app/onboarding?gate=1");
  }
  return <>{children}</>;
}
