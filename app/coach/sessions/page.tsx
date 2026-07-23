import Link from "next/link";
import { BellRing, CalendarClock, CalendarDays, CheckCircle2, ChevronDown, Clock3, MapPin, Plus, RotateCw, Settings2, ShieldCheck, TicketCheck, TriangleAlert, UserRound, XCircle } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { SessionResolutionActions } from "@/components/coach/session-resolution-actions";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { utcToLocalDateTime, type PersonalTrainingStatus } from "@/lib/domain/personal-training-schedule";
import { getLocale } from "@/lib/i18n/server";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listManagedPersonalTrainingSessions, type PersonalTrainingSession } from "@/lib/repositories/personal-training-sessions";
import { getManagedMemberSessionBalance } from "@/lib/repositories/session-credits";
import { listManagedSessionChangeRequests } from "@/lib/repositories/session-change-requests";
import { reschedulePersonalTrainingSessionAction, resolveSessionChangeRequestAction, schedulePersonalTrainingSessionAction } from "./actions";

export const dynamic = "force-dynamic";

const ZONES = [
  ["America/New_York", "Miami / New York"],
  ["Europe/Madrid", "Madrid"],
  ["UTC", "UTC"],
] as const;

function durationMinutes(session: PersonalTrainingSession) {
  return Math.round((new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 60_000);
}

function sessionDate(session: PersonalTrainingSession, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: session.timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(session.startsAt));
}

function sessionTime(session: PersonalTrainingSession, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone: session.timezone, hour: "numeric", minute: "2-digit" });
  return `${formatter.format(new Date(session.startsAt))}–${formatter.format(new Date(session.endsAt))}`;
}

function SessionCard({ session, workspaceId, locale, now }: { session: PersonalTrainingSession; workspaceId: string; locale: "es" | "en"; now: number }) {
  const canClose = now >= new Date(session.startsAt).getTime();
  const cancellationCutoff = new Date(session.startsAt).getTime() - session.cancellationWindowHours * 3_600_000;
  const cancellationConsumes = now > cancellationCutoff;
  const statusLabels: Record<PersonalTrainingStatus, string> = locale === "en" ? {
    scheduled: "Scheduled", completed: "Completed", cancelled_on_time: "Cancelled on time", cancelled_late: "Late cancellation", no_show: "No-show",
  } : {
    scheduled: "Reservada", completed: "Realizada", cancelled_on_time: "Cancelada a tiempo", cancelled_late: "Cancelación tardía", no_show: "No-show",
  };

  return (
    <article className={`coachAgendaSession status-${session.status}`} data-testid="agenda-session">
      <div className="coachAgendaDate"><strong>{sessionDate(session, locale === "en" ? "en-US" : "es-ES")}</strong><span>{sessionTime(session, locale === "en" ? "en-US" : "es-ES")}</span></div>
      <div className="coachAgendaPerson">
        <span className="uiIconChip"><UserRound size={17} /></span>
        <div><strong>{session.memberName}</strong><small>{durationMinutes(session)} min · {session.timezone}</small></div>
      </div>
      <div className="coachAgendaPlace">
        <span><MapPin size={14} /> {session.location || (locale === "en" ? "Location pending" : "Lugar pendiente")}</span>
        {session.memberNotes ? <small>{session.memberNotes}</small> : null}
      </div>
      <span className={`coachAgendaStatus ${session.status}`}>{statusLabels[session.status]}</span>
      {session.status === "scheduled" ? (
        <div className="coachAgendaControls">
          <SessionResolutionActions
            workspaceId={workspaceId}
            sessionId={session.id}
            canClose={canClose}
            cancellationConsumes={cancellationConsumes}
            locale={locale}
            eventIds={{ completed: crypto.randomUUID(), cancel_policy: crypto.randomUUID(), no_show: crypto.randomUUID() }}
          />
          <Dialog triggerClassName="btn ghost sm" trigger={<><RotateCw size={14} /> {locale === "en" ? "Move" : "Mover"}</>} title={locale === "en" ? "Reschedule session" : "Mover entrenamiento"} description={session.memberName}>
            <form action={reschedulePersonalTrainingSessionAction} className="coachSessionScheduleForm compact">
              <input name="workspaceId" type="hidden" value={workspaceId} />
              <input name="sessionId" type="hidden" value={session.id} />
              <input name="eventId" type="hidden" value={crypto.randomUUID()} />
              <label>{locale === "en" ? "New date and time" : "Nueva fecha y hora"}<input name="startLocal" type="datetime-local" defaultValue={utcToLocalDateTime(session.startsAt, session.timezone)} required /></label>
              <label>{locale === "en" ? "Duration" : "Duración"}<select name="durationMinutes" defaultValue={String(durationMinutes(session))}><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label>
              <label>{locale === "en" ? "Timezone" : "Zona horaria"}<select name="timezone" defaultValue={session.timezone}>{ZONES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>{locale === "en" ? "Location" : "Lugar"}<input name="location" defaultValue={session.location ?? ""} /></label>
              <label className="spanFull">{locale === "en" ? "Visible note" : "Nota visible"}<input name="memberNotes" defaultValue={session.memberNotes ?? ""} /></label>
              <SubmitButton variant="primary" className="spanFull" successToast={locale === "en" ? "Session moved" : "Sesión movida"}>{locale === "en" ? "Save new time" : "Guardar nuevo horario"}</SubmitButton>
            </form>
          </Dialog>
        </div>
      ) : null}
    </article>
  );
}

export default async function CoachSessionsPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const requestedMember = (await searchParams).member ?? "";
  const [brand, localeValue] = await Promise.all([getSelectedMemberAppBrand(), getLocale()]);
  const locale: "es" | "en" = localeValue === "en" ? "en" : "es";
  const members = await listManagedMembers(brand.id);
  const [sessions, balances, changeRequests] = await Promise.all([
    listManagedPersonalTrainingSessions(brand.id, { limit: 300 }),
    Promise.all(members.map(async (member) => [member.id, await getManagedMemberSessionBalance(brand.id, member.id)] as const)),
    listManagedSessionChangeRequests(brand.id, { status: "pending", limit: 100 }),
  ]);
  const balanceByMember = new Map(balances);
  const nowDate = new Date();
  const now = nowDate.getTime();
  const defaultZone = "America/New_York";
  const roundedStart = new Date(Math.ceil((now + 30 * 60_000) / 1_800_000) * 1_800_000);
  const todayLocal = utcToLocalDateTime(nowDate, defaultZone).slice(0, 10);
  const scheduled = sessions.filter((session) => session.status === "scheduled");
  const attention = scheduled.filter((session) => new Date(session.endsAt).getTime() < now);
  const activeFuture = scheduled.filter((session) => new Date(session.endsAt).getTime() >= now);
  const today = activeFuture.filter((session) => utcToLocalDateTime(session.startsAt, defaultZone).slice(0, 10) === todayLocal);
  const upcoming = activeFuture.filter((session) => !today.includes(session));
  const history = sessions.filter((session) => session.status !== "scheduled").sort((a, b) => b.startsAt.localeCompare(a.startsAt)).slice(0, 24);
  const availableTotal = balances.reduce((sum, [, balance]) => sum + balance.available, 0);
  const defaultMember = members.some((member) => member.id === requestedMember && (balanceByMember.get(member.id)?.available ?? 0) > 0) ? requestedMember : "";
  const eligibleMembers = members.filter((member) => (balanceByMember.get(member.id)?.available ?? 0) > 0);

  const copy = locale === "en" ? {
    eyebrow: "Personal training operations", title: "Agenda and session control.", text: "Book, reschedule and close every session with the pack balance protected automatically.",
    newSession: "Book session", today: "Today", upcoming: "Upcoming", attention: "Needs closure", history: "Recent history",
  } : {
    eyebrow: "Operativa de entrenamiento personal", title: "Agenda y control de sesiones.", text: "Reserva, mueve y cierra cada entrenamiento con el saldo del bono protegido automáticamente.",
    newSession: "Reservar sesión", today: "Hoy", upcoming: "Próximas", attention: "Requieren cierre", history: "Historial reciente",
  };

  return (
    <>
      <Topbar eyebrow={copy.eyebrow} title={copy.title} text={copy.text} actions={<span className="tag"><ShieldCheck size={14} /> {locale === "en" ? "Audited balance" : "Saldo auditado"}</span>} />

      <section className={`coachAgendaPulse ${attention.length ? "warning" : "clear"}`} aria-label={locale === "en" ? "Agenda summary" : "Resumen de agenda"}>
        <div className="coachAgendaPulsePrimary">
          {attention.length ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
          <div>
            <span>{attention.length ? copy.attention : (locale === "en" ? "Nothing awaiting closure" : "Nada pendiente de cierre")}</span>
            {attention.length ? <strong>{attention.length}</strong> : null}
          </div>
          {attention.length ? <a href="#needs-closure">{locale === "en" ? "Close now" : "Cerrar ahora"}</a> : null}
        </div>
        <dl>
          <div><dt><CalendarDays size={15} /> {copy.today}</dt><dd>{today.length}</dd></div>
          <div><dt><CalendarClock size={15} /> {locale === "en" ? "Reserved" : "Reservadas"}</dt><dd>{scheduled.length}</dd></div>
          <div><dt><TicketCheck size={15} /> {locale === "en" ? "Free credits" : "Créditos libres"}</dt><dd>{availableTotal}</dd></div>
        </dl>
      </section>

      {changeRequests.length ? (
        <section className="coachChangeQueue" aria-labelledby="change-requests-title">
          <header>
            <span className="uiIconChip"><BellRing size={18} /></span>
            <div><h2 id="change-requests-title">{locale === "en" ? "Schedule changes to review" : "Cambios de horario por revisar"}</h2><p>{locale === "en" ? "The original booking remains protected until you decide." : "La reserva original sigue protegida hasta que tú decidas."}</p></div>
            <strong>{changeRequests.length}</strong>
          </header>
          <div className="coachChangeQueueList">
            {changeRequests.map((request) => {
              const current = new Date(request.currentStartsAt);
              const requested = new Date(request.requestedStartsAt);
              const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", { timeZone: request.timezone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
              return <article key={request.id}>
                <div className="coachChangePerson"><UserRound size={17} /><div><strong>{request.memberName}</strong><small>{request.message || (locale === "en" ? "No note" : "Sin nota")}</small></div></div>
                <div className="coachChangeTimes"><span><em>{locale === "en" ? "Current" : "Actual"}</em>{formatter.format(current)}</span><RotateCw size={15} /><span className="requested"><em>{locale === "en" ? "Requested" : "Solicita"}</em>{formatter.format(requested)}</span></div>
                <div className="coachChangeActions">
                  <form action={resolveSessionChangeRequestAction}><input name="workspaceId" type="hidden" value={brand.id} /><input name="requestId" type="hidden" value={request.id} /><input name="decision" type="hidden" value="decline" /><SubmitButton variant="ghost" successToast={locale === "en" ? "Request declined" : "Solicitud rechazada"}><XCircle size={14} /> {locale === "en" ? "Decline" : "Rechazar"}</SubmitButton></form>
                  <form action={resolveSessionChangeRequestAction}><input name="workspaceId" type="hidden" value={brand.id} /><input name="requestId" type="hidden" value={request.id} /><input name="decision" type="hidden" value="approve" /><SubmitButton variant="primary" successToast={locale === "en" ? "New time confirmed" : "Nuevo horario confirmado"}><CheckCircle2 size={14} /> {locale === "en" ? "Approve" : "Aprobar"}</SubmitButton></form>
                </div>
              </article>;
            })}
          </div>
        </section>
      ) : null}

      <section className="coachAgendaBoard">
        {attention.length ? <div className="coachAgendaLane attention" id="needs-closure"><header><TriangleAlert size={17} /><div><h2>{copy.attention}</h2><p>{locale === "en" ? "Close these first to keep balances exact." : "Ciérralas primero para mantener los saldos exactos."}</p></div><span>{attention.length}</span></header>{attention.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />)}</div> : null}
        <div className="coachAgendaLane"><header><Clock3 size={17} /><div><h2>{copy.today}</h2><p>{locale === "en" ? "What you need for today." : "Lo que necesitas para trabajar hoy."}</p></div><span>{today.length}</span></header>{today.length ? today.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />) : <p className="coachAgendaEmpty">{locale === "en" ? "Nothing pending today. Book a session or review what is next." : "Nada pendiente hoy. Reserva una sesión o revisa las próximas."}</p>}</div>

        <details className="coachAgendaComposer" open={Boolean(defaultMember)}>
          <summary><span className="uiIconChip"><Plus size={18} /></span><span><strong>{copy.newSession}</strong><small>{eligibleMembers.length} {locale === "en" ? "clients with free credits" : "clientes con créditos libres"}</small></span><ChevronDown size={18} /></summary>
          {eligibleMembers.length ? <form action={schedulePersonalTrainingSessionAction} className="coachSessionScheduleForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="eventId" type="hidden" value={crypto.randomUUID()} />
            <div className="coachSchedulePrimary">
              <label>{locale === "en" ? "Client" : "Cliente"}<select name="memberProfileId" required defaultValue={defaultMember}><option value="" disabled>{locale === "en" ? "Select client" : "Selecciona cliente"}</option>{eligibleMembers.map((member) => { const balance = balanceByMember.get(member.id); return <option value={member.id} key={member.id}>{member.fullName} · {balance?.available ?? 0} {locale === "en" ? "free" : "libres"}</option>; })}</select></label>
              <label>{locale === "en" ? "Date and time" : "Fecha y hora"}<input name="startLocal" type="datetime-local" defaultValue={utcToLocalDateTime(roundedStart, defaultZone)} required /></label>
              <label>{locale === "en" ? "Duration" : "Duración"}<select name="durationMinutes" defaultValue="60"><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label>
              <label>{locale === "en" ? "Location" : "Lugar"}<input name="location" placeholder={locale === "en" ? "Building gym, online…" : "Gym del edificio, online…"} /></label>
              <SubmitButton variant="primary" successToast={locale === "en" ? "Session booked" : "Sesión reservada"}><CalendarDays size={15} /> {copy.newSession}</SubmitButton>
            </div>
            <details className="coachScheduleAdvanced">
              <summary><Settings2 size={15} /> {locale === "en" ? "Policy and optional details" : "Política y detalles opcionales"}<ChevronDown size={15} /></summary>
              <div>
                <label>{locale === "en" ? "Timezone" : "Zona horaria"}<select name="timezone" defaultValue={defaultZone}>{ZONES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                <label>{locale === "en" ? "Cancellation policy" : "Política de cancelación"}<select name="cancellationWindowHours" defaultValue="24"><option value="12">12 h</option><option value="24">24 h</option><option value="48">48 h</option></select></label>
                <label>{locale === "en" ? "Note visible to client" : "Nota visible para el cliente"}<input name="memberNotes" placeholder={locale === "en" ? "Bring a towel; lower-body session…" : "Traer toalla; sesión de pierna…"} /></label>
              </div>
            </details>
          </form> : <div className="coachScheduleBlocked"><TicketCheck size={19} /><div><strong>{locale === "en" ? "No client has free credits" : "Ningún cliente tiene créditos libres"}</strong><p>{locale === "en" ? "Add a pack before booking a session." : "Añade un bono antes de reservar una sesión."}</p></div><Link className="btn ghost" href="/coach/members">{locale === "en" ? "Open clients" : "Abrir clientes"}</Link></div>}
        </details>

        <div className="coachAgendaLane"><header><CalendarClock size={17} /><div><h2>{copy.upcoming}</h2><p>{locale === "en" ? "Confirmed bookings after today." : "Reservas confirmadas después de hoy."}</p></div><span>{upcoming.length}</span></header>{upcoming.length ? upcoming.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />) : <p className="coachAgendaEmpty">{locale === "en" ? "No more bookings. Use “Book session” when you agree on the next one." : "No hay más reservas. Usa «Reservar sesión» cuando acuerdes la siguiente."}</p>}</div>
        <details className="coachAgendaHistory"><summary><CheckCircle2 size={17} /><span><strong>{copy.history}</strong><small>{locale === "en" ? "Completed and cancelled sessions" : "Sesiones realizadas y canceladas"}</small></span><em>{history.length}</em><ChevronDown size={17} /></summary><div>{history.length ? history.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />) : <p className="coachAgendaEmpty">{locale === "en" ? "History will appear after closing the first session." : "El historial aparecerá al cerrar la primera sesión."}</p>}</div></details>
      </section>
    </>
  );
}
