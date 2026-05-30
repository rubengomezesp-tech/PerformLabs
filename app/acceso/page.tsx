import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { requestMemberAccessLinkAction } from "@/app/auth/actions";
import { platformBrand } from "@/lib/brand";

type AccesoPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function MemberAccessPage({ searchParams }: AccesoPageProps) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authPanel">
        <Link className="brand" href="/" style={{ margin: 0 }}>
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
          <span>
            <small>{platformBrand.name}</small>
            <strong>Acceso de cliente</strong>
          </span>
        </Link>
        <div>
          <span className="eyebrow">Tu app</span>
          <h1>Entra a tu entrenamiento.</h1>
          <p>Escribe tu email y te enviamos un enlace para entrar directo a tu app, sin contraseñas.</p>
        </div>
        {params?.error ? <p className="formMessage danger">{params.error}</p> : null}
        {params?.success ? <p className="formMessage success">{params.success}</p> : null}
        <form action={requestMemberAccessLinkAction} className="authForm">
          <label>
            Email
            <input name="email" placeholder="tu@email.com" required type="email" />
          </label>
          <button className="btn primary" type="submit">
            Enviarme el enlace <Mail size={18} />
          </button>
        </form>
        <p className="muted">¿Eres entrenador o staff? <Link href="/login">Entra a la consola</Link></p>
      </section>
      <section className="authAside">
        <Sparkles color="var(--gold)" />
        <h2>Tu plan, en tu bolsillo.</h2>
        <p>Entrenos con vídeo, nutrición, progreso y tu coach al lado. Un enlace y estás dentro.</p>
      </section>
    </main>
  );
}
