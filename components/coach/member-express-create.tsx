"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, Check, Mail, Plus, ShieldCheck, TicketCheck, UserPlus } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { SubmitButton } from "@/components/ui";

export function MemberExpressCreate({
  brandId,
  brandName,
  defaultStart,
  action,
}: {
  brandId: string;
  brandName: string;
  defaultStart: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [packageSessions, setPackageSessions] = useState("0");
  const [scheduleFirst, setScheduleFirst] = useState(false);
  const hasCredits = packageSessions !== "0";

  return (
    <Dialog
      triggerClassName="btn primary"
      trigger={<>Nuevo cliente <Plus size={18} /></>}
      title={`Alta express · ${brandName}`}
      description="Cliente, bono, primera sesión y acceso desde una sola pantalla."
    >
      <form action={action} className="memberExpressForm">
        <input name="workspaceId" type="hidden" value={brandId} />
        <input name="heightCm" type="hidden" value="" />
        <input name="sex" type="hidden" value="" />

        <div className="memberExpressPromise">
          <span><UserPlus size={18} /></span>
          <div><strong>Alta preparada en menos de 60 segundos</strong><p>Solo lo imprescindible. La valoración completa viene después.</p></div>
        </div>

        <fieldset className="memberExpressSection">
          <legend><span>1</span> Cliente</legend>
          <div className="memberExpressFields">
            <label>Nombre completo<input autoComplete="name" name="fullName" placeholder="Nombre y apellidos" required /></label>
            <label>Email de acceso<input autoComplete="email" name="email" placeholder="cliente@email.com" required type="email" /></label>
            <label>Teléfono<input autoComplete="tel" name="phone" placeholder="+1 305…" type="tel" /></label>
            <label>Objetivo principal<input name="goal" placeholder="Perder grasa y retomar el gym" /></label>
            <label>Peso inicial (kg)<input inputMode="decimal" min="20" max="400" name="startingWeightKg" placeholder="82" step="0.1" type="number" /></label>
            <label>Zona horaria<select name="timezone" defaultValue="America/New_York"><option value="America/New_York">Miami / New York</option><option value="Europe/Madrid">Madrid</option><option value="UTC">UTC</option></select></label>
          </div>
        </fieldset>

        <fieldset className="memberExpressSection">
          <legend><span>2</span> Bono confirmado</legend>
          <label className="memberExpressPack">
            <TicketCheck size={18} />
            <span><strong>Sesiones que ya ha comprado</strong><small>Déjalo pendiente si todavía debe completar el pago.</small></span>
            <select name="packageSessions" value={packageSessions} onChange={(event) => {
              setPackageSessions(event.target.value);
              if (event.target.value === "0") setScheduleFirst(false);
            }}>
              <option value="0">Pendiente de pago</option>
              <option value="1">1 sesión confirmada</option>
              <option value="8">Bono de 8 sesiones</option>
              <option value="12">Bono de 12 sesiones</option>
            </select>
          </label>
          <label className={`memberExpressToggle ${hasCredits ? "" : "disabled"}`}>
            <input checked={scheduleFirst} disabled={!hasCredits} onChange={(event) => setScheduleFirst(event.target.checked)} type="checkbox" />
            <span><CalendarDays size={17} /><span><strong>Reservar la primera sesión ahora</strong><small>{hasCredits ? "Descontará una reserva del bono, no una sesión utilizada." : "Confirma primero un bono para poder reservar."}</small></span></span>
          </label>
          {scheduleFirst ? <div className="memberExpressSession">
            <label>Fecha y hora<input name="startLocal" defaultValue={defaultStart} required type="datetime-local" /></label>
            <label>Duración<select name="durationMinutes" defaultValue="60"><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label>
            <label>Lugar<input name="location" placeholder="Gym del edificio, online…" /></label>
            <label>Nota para el cliente<input name="memberNotes" placeholder="Traer toalla, llegar 5 min antes…" /></label>
          </div> : null}
        </fieldset>

        <fieldset className="memberExpressSection access">
          <legend><span>3</span> Acceso</legend>
          <label className="memberExpressAccess">
            <input defaultChecked name="sendAccess" type="checkbox" value="yes" />
            <span className="memberExpressCheck"><Check size={15} /></span>
            <Mail size={18} />
            <span><strong>Enviar su acceso privado al crearle</strong><small>Recibirá un enlace personal para entrar sin contraseña.</small></span>
            <ShieldCheck size={17} />
          </label>
        </fieldset>

        <div className="memberExpressSubmit">
          <p>Después irás directamente a su valoración inicial.</p>
          <SubmitButton variant="primary" successToast="Cliente creado">Crear cliente y continuar <ArrowRight size={18} /></SubmitButton>
        </div>
      </form>
    </Dialog>
  );
}
