import Link from "next/link";
import { LogIn, ShieldCheck } from "lucide-react";
import { signInAction } from "@/app/auth/actions";
import { platformBrand } from "@/lib/brand";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; next?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authPanel">
        <Link className="brand" href="/" style={{ margin: 0 }}>
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
          <span>
            <small>{platformBrand.name}</small>
            <strong>Acceso seguro</strong>
          </span>
        </Link>
        <div>
          <span className="eyebrow">Login</span>
          <h1>Entra a tu consola.</h1>
          <p>Acceso para equipo, agentes y entrenadores con implantación activa.</p>
        </div>
        {params?.error ? <p className="formMessage danger">{params.error}</p> : null}
        {params?.success ? <p className="formMessage success">{params.success}</p> : null}
        <form action={signInAction} className="authForm">
          <input name="next" type="hidden" value={params?.next ?? "/console"} />
          <label>
            Email
            <input name="email" placeholder="tu@email.com" required type="email" />
          </label>
          <label>
            Contraseña
            <input name="password" required type="password" />
          </label>
          <button className="btn primary" type="submit">
            Entrar <LogIn size={18} />
          </button>
        </form>
        <p className="muted">¿No tienes acceso? <Link href="/registro">Solicitar cuenta</Link></p>
      </section>
      <section className="authAside">
        <ShieldCheck color="var(--gold)" />
        <h2>Control operativo, no caos.</h2>
        <p>Leads, proyectos, marcas, QA, contenido, entrenamiento y nutrición en una consola diseñada para entregar apps premium.</p>
      </section>
    </main>
  );
}
