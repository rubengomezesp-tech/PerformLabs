import { CalendarClock, CalendarDays, CheckCircle2, Clock3, MapPin, Plus, RotateCw, ShieldCheck, TicketCheck, TriangleAlert, UserRound } from "lucide-react";
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
import { reschedulePersonalTrainingSessionAction, schedulePersonalTrainingSessionAction } from "./actions";

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
  const [sessions, balances] = await Promise.all([
    listManagedPersonalTrainingSessions(brand.id, { limit: 300 }),
    Promise.all(members.map(async (member) => [member.id, await getManagedMemberSessionBalance(brand.id, member.id)] as const)),
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

  const copy = locale === "en" ? {
    eyebrow: "Personal training operations", title: "Agenda and session control.", text: "Book, reschedule and close every session with the pack balance protected automatically.",
    newSession: "Book session", today: "Today", upcoming: "Upcoming", attention: "Needs closure", history: "Recent history", empty: "Nothing here yet.",
  } : {
    eyebrow: "Operativa de entrenamiento personal", title: "Agenda y control de sesiones.", text: "Reserva, mueve y cierra cada entrenamiento con el saldo del bono protegido automáticamente.",
    newSession: "Reservar sesión", today: "Hoy", upcoming: "Próximas", attention: "Requieren cierre", history: "Historial reciente", empty: "Todavía no hay sesiones aquí.",
  };

  return (
    <>
      <Topbar eyebrow={copy.eyebrow} title={copy.title} text={copy.text} actions={<span className="tag"><ShieldCheck size={14} /> {locale === "en" ? "Audited balance" : "Saldo auditado"}</span>} />

      <section className="coachAgendaMetrics">
        <article><CalendarDays size={18} /><span>{copy.today}</span><strong>{today.length}</strong></article>
        <article><CalendarClock size={18} /><span>{locale === "en" ? "Reserved" : "Reservadas"}</span><strong>{scheduled.length}</strong></article>
        <article className={attention.length ? "warning" : ""}><TriangleAlert size={18} /><span>{copy.attention}</span><strong>{attention.length}</strong></article>
        <article><TicketCheck size={18} /><span>{locale === "en" ? "Free credits" : "Créditos libres"}</span><strong>{availableTotal}</strong></article>
      </section>

      <section className="coachAgendaComposer">
        <div><span className="uiIconChip"><Plus size={18} /></span><div><strong>{copy.newSession}</strong><small>{locale === "en" ? "The credit is reserved, not consumed." : "El crédito queda reservado, no consumido."}</small></div></div>
        <form action={schedulePersonalTrainingSessionAction} className="coachSessionScheduleForm">
          <input name="workspaceId" type="hidden" value={brand.id} />
          <input name="eventId" type="hidden" value={crypto.randomUUID()} />
          <label>{locale === "en" ? "Client" : "Cliente"}<select name="memberProfileId" required defaultValue={defaultMember}><option value="" disabled>{locale === "en" ? "Select client" : "Selecciona cliente"}</option>{members.map((member) => { const balance = balanceByMember.get(member.id); return <option value={member.id} key={member.id} disabled={!balance?.available}>{member.fullName} · {balance?.available ?? 0} {locale === "en" ? "free" : "libres"}</option>; })}</select></label>
          <label>{locale === "en" ? "Date and time" : "Fecha y hora"}<input name="startLocal" type="datetime-local" defaultValue={utcToLocalDateTime(roundedStart, defaultZone)} required /></label>
          <label>{locale === "en" ? "Duration" : "Duración"}<select name="durationMinutes" defaultValue="60"><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label>
          <label>{locale === "en" ? "Timezone" : "Zona horaria"}<select name="timezone" defaultValue={defaultZone}>{ZONES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>{locale === "en" ? "Location" : "Lugar"}<input name="location" placeholder={locale === "en" ? "Building gym, online…" : "Gym del edificio, online…"} /></label>
          <label>{locale === "en" ? "Cancellation policy" : "Política de cancelación"}<select name="cancellationWindowHours" defaultValue="24"><option value="12">12 h</option><option value="24">24 h</option><option value="48">48 h</option></select></label>
          <label className="coachScheduleNotes">{locale === "en" ? "Note visible to client" : "Nota visible para el cliente"}<input name="memberNotes" placeholder={locale === "en" ? "Bring a towel; lower-body session…" : "Traer toalla; sesión de pierna…"} /></label>
          <SubmitButton variant="primary" successToast={locale === "en" ? "Session booked" : "Sesión reservada"}><CalendarDays size={15} /> {copy.newSession}</SubmitButton>
        </form>
      </section>

      <section className="coachAgendaBoard">
        {attention.length ? <div className="coachAgendaLane attention"><header><TriangleAlert size={17} /><div><h2>{copy.attention}</h2><p>{locale === "en" ? "Close these to keep balances exact." : "Ciérralas para mantener los saldos exactos."}</p></div><span>{attention.length}</span></header>{attention.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />)}</div> : null}
        <div className="coachAgendaLane"><header><Clock3 size={17} /><div><h2>{copy.today}</h2><p>{locale === "en" ? "Your immediate working queue." : "Tu cola de trabajo inmediata."}</p></div><span>{today.length}</span></header>{today.length ? today.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />) : <p className="coachAgendaEmpty">{copy.empty}</p>}</div>
        <div className="coachAgendaLane"><header><CalendarClock size={17} /><div><h2>{copy.upcoming}</h2><p>{locale === "en" ? "All confirmed bookings." : "Todas las reservas confirmadas."}</p></div><span>{upcoming.length}</span></header>{upcoming.length ? upcoming.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />) : <p className="coachAgendaEmpty">{copy.empty}</p>}</div>
        <div className="coachAgendaLane history"><header><CheckCircle2 size={17} /><div><h2>{copy.history}</h2><p>{locale === "en" ? "Completed and cancelled sessions." : "Realizadas y canceladas."}</p></div><span>{history.length}</span></header>{history.length ? history.map((session) => <SessionCard key={session.id} session={session} workspaceId={brand.id} locale={locale} now={now} />) : <p className="coachAgendaEmpty">{copy.empty}</p>}</div>
      </section>
    </>
  );
}
