import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { platformBrand } from "@/lib/brand";
import { getRequestTenantBrand } from "@/lib/request-brand";

export default async function AuthCallbackPage() {
  const tenantBrand = await getRequestTenantBrand();
  const isTenant = Boolean(tenantBrand);
  const name = tenantBrand?.name ?? platformBrand.name;
  const appName = tenantBrand?.appName || name;
  const accent = tenantBrand?.accentColor || platformBrand.accentColor;

  return (
    <main className="authPage" style={{ "--accent": accent } as CSSProperties}>
      <section className="authPanel">
        {tenantBrand ? (
          <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
            {tenantBrand.logoUrl ? <img alt="" src={tenantBrand.logoUrl} /> : appName.slice(0, 3).toUpperCase()}
          </span>
        ) : (
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
        )}
        <div>
          <span className="eyebrow">Acceso seguro</span>
          <h1>Activando tu sesión en {name}.</h1>
          <p>
            {isTenant
              ? "Estamos verificando tu acceso y preparando tu entrada a la app."
              : "Estamos verificando la invitación y preparando tu entrada a la consola."}
          </p>
        </div>
      </section>
      <section className="authAside">
        <ShieldCheck color={isTenant ? accent : "var(--gold)"} />
        <h2>Un momento.</h2>
        <p>
          {isTenant
            ? `Cuando termine la validación entrarás directamente a ${appName}.`
            : "Cuando termine la validación entrarás directamente al panel correspondiente."}
        </p>
      </section>
    </main>
  );
}
