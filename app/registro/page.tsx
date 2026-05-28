import Link from "next/link";
import { Send } from "lucide-react";
import { requestAccessAction } from "@/app/auth/actions";
import { platformBrand } from "@/lib/brand";

type RegisterPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
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
            <strong>Solicitud de acceso</strong>
          </span>
        </Link>
        <div>
          <span className="eyebrow">Acceso privado</span>
          <h1>Solicita entrada al sistema.</h1>
          <p>Las cuentas reales se activan solo por invitación confirmada de PerformLabs.</p>
        </div>
        {params?.error ? <p className="formMessage danger">{params.error}</p> : null}
        {params?.success ? <p className="formMessage success">{params.success}</p> : null}
        <form action={requestAccessAction} className="authForm">
          <label>
            Nombre
            <input name="fullName" placeholder="Tu nombre" required />
          </label>
          <label>
            Email
            <input name="email" placeholder="tu@email.com" required type="email" />
          </label>
          <label>Marca o equipo<input name="brandName" placeholder="Nombre de la marca" /></label>
          <label>Contexto<textarea name="notes" rows={3} placeholder="Quién te invitó, marca, rol esperado o motivo de acceso..." /></label>
          <button className="btn primary" type="submit">
            Enviar solicitud <Send size={18} />
          </button>
        </form>
        <p className="muted">¿Ya tienes cuenta? <Link href="/login">Entrar</Link></p>
      </section>
      <section className="authAside">
        <Send color="var(--gold)" />
        <h2>Sin registros abiertos.</h2>
        <p>Cada entrenador o miembro del equipo entra por una invitación auditada, con rol y marca asignados.</p>
      </section>
    </main>
  );
}
