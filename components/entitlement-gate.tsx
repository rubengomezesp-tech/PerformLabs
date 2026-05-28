import { LockKeyhole, ShieldAlert } from "lucide-react";
import {
  entitlementAllows,
  entitlementStatusDescriptions,
  entitlementStatusLabels,
  type EntitlementModule,
  type WorkspaceEntitlement,
} from "@/lib/repositories/entitlements";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

export function EntitlementGate({
  brand,
  entitlement,
  module,
  children,
}: {
  brand: WorkspaceBrand;
  entitlement: WorkspaceEntitlement;
  module: EntitlementModule;
  children: React.ReactNode;
}) {
  if (entitlementAllows(entitlement, module) && brand.isActive) {
    return children;
  }

  const title = brand.isActive
    ? entitlementStatusLabels[entitlement.status]
    : "Servicio pausado";
  const text = brand.isActive
    ? entitlement.reason || entitlementStatusDescriptions[entitlement.status]
    : "Este espacio no esta disponible temporalmente.";

  return (
    <section className="entitlementGate">
      <div className="entitlementGatePanel">
        <span className="entitlementGateIcon">
          {entitlement.status === "past_due" ? <ShieldAlert size={24} /> : <LockKeyhole size={24} />}
        </span>
        <span className="eyebrow">{brand.appName}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        <small>Contacta con tu equipo de soporte para revisar el acceso.</small>
      </div>
    </section>
  );
}
