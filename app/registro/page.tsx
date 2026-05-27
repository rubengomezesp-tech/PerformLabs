import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUpAction } from "@/app/auth/actions";
import { platformBrand } from "@/lib/brand";

type RegisterPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authPanel">
        <Link className="brand" href="/" style={{ margin: 0 }}>
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
          <span>
            <small>{platformBrand.name}</small>
            <strong>Nueva cuenta</strong>
          </span>
        </Link>
        <div>
          <span className="eyebrow">Registro</span>
          <h1>Crea acceso al sistema.</h1>
          <p>Acceso para entrenadores y equipo autorizado.</p>
        </div>
        {params?.error ? <p className="formMessage danger">{params.error}</p> : null}
        <form action={signUpAction} className="authForm">
          <label>
            Nombre
            <input name="fullName" placeholder="Tu nombre" required />
          </label>
          <label>
            Email
            <input name="email" placeholder="tu@email.com" required type="email" />
          </label>
          <label>
            Contraseña
            <input name="password" minLength={8} required type="password" />
          </label>
          <button className="btn primary" type="submit">
            Crear cuenta <UserPlus size={18} />
          </button>
        </form>
        <p className="muted">¿Ya tienes cuenta? <Link href="/login">Entrar</Link></p>
      </section>
      <section className="authAside">
        <UserPlus color="var(--gold)" />
        <h2>Acceso preparado para roles.</h2>
        <p>Cada persona entra solo a las zonas que necesita para operar con claridad.</p>
      </section>
    </main>
  );
}
