import type { CSSProperties } from "react";
import { LogIn, Mail, ShieldCheck } from "lucide-react";
import { memberSignInAction, requestMemberAccessLinkAction } from "@/app/auth/actions";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { workspaceBrandMarkUrl } from "@/lib/workspace-brand-assets";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const brand = await getSelectedMemberAppBrand();
  return { title: `Entrar · ${brand.name}` };
}

type MemberLandingPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function MemberLandingPage({ searchParams }: MemberLandingPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const accent = brand.accentColor || "#078df2";
  const background = brand.backgroundColor || "#0d0d10";
  const headline = brand.heroHeadline || `Entrena con ${brand.name}`;
  const subtext = brand.heroSubtext || "Tu plan de entrenamiento y nutrición, tu progreso y tu coach, en un solo sitio.";
  const markUrl = workspaceBrandMarkUrl(brand);

  const asideStyle: CSSProperties = brand.heroImageUrl
    ? { background: `linear-gradient(160deg, rgba(0,0,0,.25), rgba(0,0,0,.7)), url(${brand.heroImageUrl}) center/cover` }
    : { background: `radial-gradient(130% 130% at 100% 0%, ${accent}33, ${background})` };

  return (
    <main className="memberLanding" style={{ "--accent": accent, background } as CSSProperties}>
      <section className="memberLandingPanel">
        <div className="memberBrandLockup">
          <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
            {markUrl ? <img alt="" src={markUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
          </span>
          <strong>{brand.name}</strong>
        </div>

        <div className="memberLandingHero">
          <h1>{headline}</h1>
          <p>{subtext}</p>
        </div>

        {params?.error ? <p className="formMessage danger" role="alert">{params.error}</p> : null}
        <form action={requestMemberAccessLinkAction} className="memberAccessForm">
          <input type="hidden" name="w" value={brand.id} />
          <label>
            Email
            <input name="email" type="email" required placeholder="tu@email.com" autoComplete="email" inputMode="email" />
          </label>
          <button className="btn primary" type="submit" style={{ background: accent, borderColor: accent }}>
            Enviarme un enlace de acceso <Mail size={18} />
          </button>
        </form>
        <div className="authDivider"><span>o</span></div>
        <GoogleSignInButton />
        <details>
          <summary className="muted" style={{ cursor: "pointer", marginTop: 14 }}>¿Tienes contraseña? Entra con ella</summary>
          <form action={memberSignInAction} className="memberAccessForm" style={{ marginTop: 12 }}>
            <label>
              Email
              <input name="email" type="email" required placeholder="tu@email.com" autoComplete="email" />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button className="btn" type="submit">
              Entrar <LogIn size={18} />
            </button>
          </form>
        </details>

        <p className="muted memberLandingSupport">
          <ShieldCheck size={15} /> ¿Sin acceso todavía? Escribe a {brand.supportEmail}.
        </p>
      </section>

      <aside className="memberLandingAside" style={asideStyle}>
        <div className="memberLandingAsideInner">
          <span className="eyebrow" style={{ color: accent }}>Tu espacio</span>
          <h2>Entrenamiento, nutrición y progreso.</h2>
          <p>Plan del día, recetas, diario con IA, hábitos y chat con tu coach.</p>
        </div>
      </aside>
    </main>
  );
}
