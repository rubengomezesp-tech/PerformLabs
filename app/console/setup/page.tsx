import { CheckCircle2, Database, KeyRound, XCircle } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";

export default function SetupPage() {
  const publicEnv = getSupabasePublicEnv();
  const serviceEnv = getSupabaseServiceEnv();

  return (
    <>
      <Topbar
        eyebrow="Estado técnico"
        title="Configuración de plataforma."
        text="Panel interno para confirmar que los servicios privados están disponibles. Esta zona no forma parte de la experiencia comercial."
      />
      <section className="grid">
        <article className="card span6">
          <Database color="var(--gold)" />
          <h2>Conexión pública</h2>
          {publicEnv.ok ? (
            <p className="status"><CheckCircle2 size={18} /> Servicio público configurado.</p>
          ) : (
            <p><XCircle color="var(--red)" size={18} /> Faltan: {publicEnv.missing.join(", ")}</p>
          )}
        </article>
        <article className="card span6">
          <KeyRound color="var(--gold)" />
          <h2>Servicio privado</h2>
          {serviceEnv.ok ? (
            <p className="status"><CheckCircle2 size={18} /> Servicio privado disponible solo en servidor.</p>
          ) : (
            <p><XCircle color="var(--red)" size={18} /> Faltan: {serviceEnv.missing.join(", ")}</p>
          )}
        </article>
        <article className="card span12">
          <h2>Siguiente paso</h2>
          <p>
            Completar autenticación, permisos, bibliotecas y módulos operativos
            antes de abrir esta plataforma a clientes reales.
          </p>
        </article>
      </section>
    </>
  );
}
