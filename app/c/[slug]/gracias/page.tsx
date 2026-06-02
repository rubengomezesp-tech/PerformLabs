import type { CSSProperties } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { requestMemberAccessLinkAction } from "@/app/auth/actions";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";

export const dynamic = "force-dynamic";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Post-checkout success page. The Stripe webhook provisions the member's account
 * from the paid email; here they claim access with a passwordless magic link
 * (reuses requestMemberAccessLinkAction, shouldCreateUser:false). Brand-skinned to
 * match the sales landing so the buy → access handoff feels like one product.
 */
export default async function CheckoutSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getWorkspaceBrand(slug);
  const known = brand.id !== ZERO_UUID;
  const accent = (known && brand.accentColor) || "#078df2";
  const background = (known && brand.backgroundColor) || "#0d0d10";

  return (
    <main className="salesPage" style={{ "--accent": accent, "--sales-bg": background } as CSSProperties}>
      <div className="salesThanks">
        <span className="salesThanksMark" aria-hidden="true"><CheckCircle2 size={40} /></span>
        <h1 className="salesThanksTitle">¡Pago confirmado!</h1>
        <p className="muted">
          Hemos creado tu cuenta{known ? ` en ${brand.name}` : ""}. Escribe el email con el que pagaste y te enviamos un
          enlace para entrar a tu app.
        </p>
        <form action={requestMemberAccessLinkAction} className="salesThanksForm">
          <input type="hidden" name="w" value={slug} />
          <label className="salesPlanField">
            El email con el que pagaste
            <input name="email" type="email" required placeholder="tu@email.com" autoComplete="email" inputMode="email" />
          </label>
          <button className="btn primary salesPlanCta" type="submit" style={{ background: accent, borderColor: accent }}>
            Enviarme el enlace de acceso
          </button>
        </form>
        <p className="salesTrust">
          <ShieldCheck size={14} aria-hidden="true" /> Revisa tu correo (incluido spam). El enlace caduca pronto.
        </p>
      </div>
    </main>
  );
}
