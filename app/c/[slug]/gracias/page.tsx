import type { CSSProperties } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { requestMemberAccessLinkAction } from "@/app/auth/actions";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";

export const dynamic = "force-dynamic";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Post-checkout success page. The Stripe webhook provisions the member's account
 * from the paid email; here they claim access with a passwordless magic link
 * (reuses the existing requestMemberAccessLinkAction, shouldCreateUser:false).
 */
export default async function CheckoutSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getWorkspaceBrand(slug);
  const known = brand.id !== ZERO_UUID;
  const accent = (known && brand.accentColor) || "#078df2";
  const background = (known && brand.backgroundColor) || "#0d0d10";

  return (
    <main style={{ "--accent": accent, background, minHeight: "100vh", color: "#e9eaec" } as CSSProperties}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "clamp(56px, 9vw, 96px) 24px", textAlign: "center" }}>
        <CheckCircle2 size={48} color={accent} aria-hidden="true" />
        <h1 style={{ marginTop: 16 }}>¡Pago confirmado!</h1>
        <p className="muted">
          Hemos creado tu cuenta{known ? ` en ${brand.name}` : ""}. Escribe el email con el que pagaste y te enviamos un
          enlace para entrar a tu app.
        </p>
        <form action={requestMemberAccessLinkAction} style={{ display: "grid", gap: 10, marginTop: 24, textAlign: "left" }}>
          <input type="hidden" name="w" value={slug} />
          <label style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.85 }}>
            El email con el que pagaste
            <input name="email" type="email" required placeholder="tu@email.com" autoComplete="email" inputMode="email" />
          </label>
          <button className="btn primary" type="submit" style={{ background: accent, borderColor: accent }}>
            Enviarme el enlace de acceso
          </button>
        </form>
        <p className="muted" style={{ marginTop: 18, display: "inline-flex", gap: 6, alignItems: "center" }}>
          <ShieldCheck size={14} aria-hidden="true" /> Revisa tu correo (incluido spam). El enlace caduca pronto.
        </p>
      </div>
    </main>
  );
}
