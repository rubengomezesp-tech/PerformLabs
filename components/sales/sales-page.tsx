import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import type { CoachPlan } from "@/lib/repositories/coach-plans";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

function formatPrice(amountCents: number, currency: string, interval: string): string {
  const amount = (amountCents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: (currency || "eur").toUpperCase(),
    maximumFractionDigits: 2,
  });
  return `${amount}/${interval === "year" ? "año" : "mes"}`;
}

/**
 * Public, brand-skinned sales page for a coach: brand lockup + active plans with a
 * working subscribe form. Presentational only — the parent route resolves the
 * brand/plans and passes the server checkout action. Reskins per coach via the
 * inline `--accent` var, same pattern as app/m/page.tsx.
 */
export function SalesPage({
  brand,
  slug,
  plans,
  canCheckout,
  checkoutAction,
  notice,
}: {
  brand: WorkspaceBrand;
  slug: string;
  plans: CoachPlan[];
  canCheckout: boolean;
  checkoutAction: (formData: FormData) => Promise<void>;
  notice?: string | null;
}) {
  const accent = brand.accentColor || "#078df2";
  const background = brand.backgroundColor || "#0d0d10";
  const headline = brand.heroHeadline || `Entrena con ${brand.name}`;
  const subtext =
    brand.heroSubtext || "Elige tu plan y empieza hoy: entrenamiento, nutrición y seguimiento con tu coach.";
  const heroStyle: CSSProperties = brand.heroImageUrl
    ? { background: `linear-gradient(160deg, rgba(0,0,0,.35), rgba(0,0,0,.72)), url(${brand.heroImageUrl}) center/cover` }
    : { background: `radial-gradient(130% 130% at 100% 0%, ${accent}33, ${background})` };

  return (
    <main style={{ "--accent": accent, background, minHeight: "100vh", color: "#e9eaec" } as CSSProperties}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "clamp(40px, 6vw, 72px) 24px 64px" }}>
        <section style={{ ...heroStyle, borderRadius: 20, padding: "clamp(28px, 5vw, 48px)" }}>
          <div className="memberBrandLockup">
            <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
              {brand.logoUrl ? <img alt="" src={brand.logoUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
            </span>
            <strong>{brand.name}</strong>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", margin: "20px 0 10px", lineHeight: 1.05 }}>{headline}</h1>
          <p style={{ maxWidth: 560, opacity: 0.85, fontSize: 17 }}>{subtext}</p>
        </section>

        <section style={{ marginTop: 36 }}>
          <span className="eyebrow" style={{ color: accent }}>Planes</span>
          <h2 style={{ margin: "6px 0 18px" }}>Elige tu plan</h2>
          {notice ? (
            <p className="formMessage danger" role="alert" style={{ marginBottom: 16 }}>
              {notice}
            </p>
          ) : null}

          {plans.length === 0 ? (
            <p className="muted">Este coach todavía no ha publicado planes. Vuelve pronto.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(248px, 1fr))",
              }}
            >
              {plans.map((plan) => (
                <article key={plan.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <strong style={{ fontSize: 18 }}>{plan.name}</strong>
                  {plan.description ? <span className="muted">{plan.description}</span> : null}
                  <span style={{ fontSize: 24, fontWeight: 700, color: accent }}>
                    {formatPrice(plan.amountCents, plan.currency, plan.interval)}
                  </span>
                  <form action={checkoutAction} style={{ display: "grid", gap: 8, marginTop: "auto" }}>
                    <input type="hidden" name="workspaceId" value={brand.id} />
                    <input type="hidden" name="planId" value={plan.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <label style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.85 }}>
                      Tu email
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="tu@email.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </label>
                    <button
                      className="btn primary"
                      type="submit"
                      disabled={!canCheckout}
                      style={{ background: accent, borderColor: accent }}
                    >
                      {canCheckout ? "Suscribirme" : "No disponible aún"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}

          <p className="muted" style={{ marginTop: 20, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <ShieldCheck size={15} aria-hidden="true" /> Pago seguro con Stripe · cancela cuando quieras.
          </p>
        </section>
      </div>
    </main>
  );
}
