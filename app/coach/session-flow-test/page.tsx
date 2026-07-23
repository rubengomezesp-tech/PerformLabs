import { FlaskConical } from "lucide-react";
import { SessionFlowLab } from "@/components/coach/session-flow-lab";
import { Topbar } from "@/components/topbar";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SessionFlowTestPage() {
  const locale = await getLocale();
  const isEnglish = locale === "en";

  return (
    <>
      <Topbar
        eyebrow={isEnglish ? "Private test lab" : "Laboratorio privado"}
        title={isEnglish ? "Test the full session flow." : "Comprueba el flujo completo de una sesión."}
        text={isEnglish
          ? "Validate purchase, booking, attendance, cancellation and idempotency before using the workflow with a real client."
          : "Valida compra, reserva, asistencia, cancelación e idempotencia antes de utilizar el proceso con un cliente real."}
        actions={<span className="tag"><FlaskConical size={14} /> {isEnglish ? "No real data" : "Sin datos reales"}</span>}
      />
      <SessionFlowLab locale={locale} />
    </>
  );
}
