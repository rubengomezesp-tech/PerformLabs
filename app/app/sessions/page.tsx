import { CalendarClock, CheckCircle2, ChevronDown, Clock3, History, MapPin, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getLocale } from "@/lib/i18n/server";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listMemberPersonalTrainingSessions, type PersonalTrainingSession } from "@/lib/repositories/personal-training-sessions";
import { getMemberSessionBalance } from "@/lib/repositories/session-credits";

export const dynamic = "force-dynamic";

function formatDateTime(session: PersonalTrainingSession, locale: string) {
  const date = new Intl.DateTimeFormat(locale, { timeZone: session.timezone, weekday: "long", day: "numeric", month: "long" }).format(new Date(session.startsAt));
  const time = new Intl.DateTimeFormat(locale, { timeZone: session.timezone, hour: "numeric", minute: "2-digit" }).format(new Date(session.startsAt));
  return { date, time };
}

export default async function MemberSessionsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [sessions, balance, localeValue] = await Promise.all([
    listMemberPersonalTrainingSessions(brand.id),
    getMemberSessionBalance(brand.id),
    getLocale(),
  ]);
  const english = localeValue === "en";
  const locale = english ? "en-US" : "es-ES";
  const now = new Date().getTime();
  const upcoming = sessions.filter((session) => session.status === "scheduled" && new Date(session.endsAt).getTime() >= now);
  const nextSession = upcoming[0];
  const laterSessions = upcoming.slice(1);
  const pendingCoach = sessions.filter((session) => session.status === "scheduled" && new Date(session.endsAt).getTime() < now);
  const history = sessions.filter((session) => session.status !== "scheduled").sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const statusLabel: Record<string, string> = english ? {
    completed: "Completed", cancelled_on_time: "Cancelled on time · credit released", cancelled_late: "Late cancellation · credit used", no_show: "No-show · credit used",
  } : {
    completed: "Realizada", cancelled_on_time: "Cancelada a tiempo · crédito liberado", cancelled_late: "Cancelación tardía · crédito utilizado", no_show: "No-show · crédito utilizado",
  };

  return (
    <>
      <Topbar
        eyebrow={english ? "Personal training" : "Entrenamiento personal"}
        title={english ? "Your sessions." : "Tus sesiones."}
        text={english ? "Your next appointment, available credits and cancellation policy." : "Tu próxima cita, créditos disponibles y política de cancelación."}
      />
      <section className={`memberSessionAtGlance ${nextSession ? "hasSession" : "empty"}`} aria-labelledby="next-session-title">
        {nextSession ? (() => {
          const when = formatDateTime(nextSession, locale);
          const cutoff = new Date(new Date(nextSession.startsAt).getTime() - nextSession.cancellationWindowHours * 3_600_000);
          return <div className="memberNextSession">
            <span><CalendarClock size={17} /> {english ? "Next session" : "Próxima sesión"}</span>
            <h2 className="sessionDateTitle" id="next-session-title">{when.date}</h2>
            <strong>{when.time}</strong>
            <p><MapPin size={16} /> {nextSession.location || (english ? "Location pending" : "Lugar pendiente")}</p>
            {nextSession.memberNotes ? <small>{nextSession.memberNotes}</small> : null}
            <em><Clock3 size={14} /> {english ? "Cancel without using a credit until" : "Cancela sin consumir crédito hasta"} {new Intl.DateTimeFormat(locale, { timeZone: nextSession.timezone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(cutoff)}</em>
          </div>;
        })() : <div className="memberNextSession"><span><CalendarClock size={17} /> {english ? "Next session" : "Próxima sesión"}</span><h2 id="next-session-title">{english ? "No booking yet" : "Todavía sin reserva"}</h2><p>{english ? "Your coach will confirm the next appointment here." : "Tu coach confirmará aquí la próxima cita."}</p></div>}
        <dl className="memberSessionCreditSummary">
          <div className="available"><dt>{english ? "Available" : "Disponibles"}</dt><dd>{balance.available}</dd></div>
          <div><dt>{english ? "Reserved" : "Reservadas"}</dt><dd>{balance.reserved}</dd></div>
          <div><dt>{english ? "Used" : "Utilizadas"}</dt><dd>{balance.totalUsed}</dd></div>
        </dl>
      </section>

      {pendingCoach.length ? <p className="memberSessionPending"><Clock3 size={16} /> {english ? `${pendingCoach.length} past session(s) awaiting coach confirmation.` : `${pendingCoach.length} sesión(es) pasada(s) pendientes de confirmación del coach.`}</p> : null}

      <section className="memberSessionsDetails" aria-label={english ? "Session details" : "Detalles de sesiones"}>
        {laterSessions.length ? <details className="memberSessionsDisclosure" open>
          <summary><CalendarClock size={18} /><span><strong>{english ? "More upcoming sessions" : "Siguientes sesiones"}</strong><small>{english ? "Confirmed after your next appointment" : "Confirmadas después de tu próxima cita"}</small></span><em>{laterSessions.length}</em><ChevronDown size={17} /></summary>
          <ul>{laterSessions.map((session) => { const when = formatDateTime(session, locale); const cutoff = new Date(new Date(session.startsAt).getTime() - session.cancellationWindowHours * 3_600_000); return <li key={session.id}><span className="memberSessionDate"><strong>{when.date}</strong><em>{when.time}</em></span><div><strong><MapPin size={14} /> {session.location || (english ? "Location pending" : "Lugar pendiente")}</strong>{session.memberNotes ? <p>{session.memberNotes}</p> : null}<small><Clock3 size={13} /> {english ? "Cancel without charge until" : "Cancela sin consumo hasta"} {new Intl.DateTimeFormat(locale, { timeZone: session.timezone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(cutoff)}</small></div></li>; })}</ul>
        </details> : null}

        <details className="memberSessionsDisclosure policy">
          <summary><ShieldCheck size={18} /><span><strong>{english ? "How cancellations work" : "Cómo funcionan las cancelaciones"}</strong><small>{english ? "Your balance is protected by the agreed policy" : "Tu saldo está protegido por la política acordada"}</small></span><ChevronDown size={17} /></summary>
          <p>{english ? "Cancelling within the allowed window releases the reserved credit. A late cancellation or no-show uses one session." : "Cancelar dentro del plazo libera el crédito reservado. Una cancelación tardía o un no-show consumen una sesión."}</p>
        </details>

        <details className="memberSessionsDisclosure history">
          <summary><History size={18} /><span><strong>{english ? "Session history" : "Historial de sesiones"}</strong><small>{english ? "Completed and cancelled appointments" : "Citas realizadas y canceladas"}</small></span><em>{history.length}</em><ChevronDown size={17} /></summary>
          {history.length ? <ul>{history.slice(0, 12).map((session) => { const when = formatDateTime(session, locale); return <li key={session.id}><span className={`memberSessionOutcome ${session.status}`}>{session.status === "completed" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span><div><strong>{statusLabel[session.status]}</strong><small>{when.date} · {when.time}</small></div></li>; })}</ul> : <div className="memberSessionsEmpty"><History size={24} /><strong>{english ? "No activity yet" : "Sin actividad todavía"}</strong><p>{english ? "Completed and cancelled sessions will appear here." : "Aquí aparecerán las sesiones realizadas y canceladas."}</p></div>}
        </details>
      </section>
    </>
  );
}
