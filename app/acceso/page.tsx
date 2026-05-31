import type { CSSProperties } from "react";
import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { memberSignInAction } from "@/app/auth/actions";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

export const dynamic = "force-dynamic";

type AccesoPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function MemberAccessPage({ searchParams }: AccesoPageProps) {
  const params = await searchParams;
  // Resolved by host: on a trainer's domain this is THEIR brand, so the client
  // login is white-label too (logo, name, accent), not the platform's.
  const brand = await getSelectedMemberAppBrand();
  const accent = brand.accentColor || "#078df2";

  return (
    <main className="authPage" style={{ "--accent": accent } as CSSProperties}>
      <section className="authPanel">
        <span className="brand" style={{ margin: 0 }}>
          <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
            {brand.logoUrl ? <img alt="" src={brand.logoUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
          </span>
          <span>
            <small>{brand.name}</small>
            <strong>Acceso de cliente</strong>
          </span>
        </span>
        <div>
          <span className="eyebrow">Tu app</span>
          <h1>Entra a {brand.name}.</h1>
          <p>Entra con tu email y la contraseña que te dio tu entrenador.</p>
        </div>
        {params?.error ? <p className="formMessage danger">{params.error}</p> : null}
        {params?.success ? <p className="formMessage success">{params.success}</p> : null}
        <form action={memberSignInAction} className="authForm">
          <label>
            Email
            <input name="email" placeholder="tu@email.com" required type="email" autoComplete="email" />
          </label>
          <label>
            Contraseña
            <input name="password" required type="password" autoComplete="current-password" />
          </label>
          <button className="btn primary" type="submit">
            Entrar <LogIn size={18} />
          </button>
        </form>
        <p className="muted">¿Eres entrenador o staff? <Link href="/login">Entra a la consola</Link></p>
      </section>
      <section className="authAside">
        <Sparkles color={accent} />
        <h2>Tu plan, en tu bolsillo.</h2>
        <p>Entrenos con vídeo, nutrición, progreso y tu coach al lado. Un enlace y estás dentro.</p>
      </section>
    </main>
  );
}
