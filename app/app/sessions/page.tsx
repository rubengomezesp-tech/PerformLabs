import { CalendarClock, CheckCircle2, Clock3, History, MapPin, ShieldCheck, TicketCheck } from "lucide-react";
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
        title={english ? "Your sessions and pack." : "Tus sesiones y tu bono."}
        text={english ? "Confirmed bookings, cancellation policy and a transparent credit history." : "Reservas confirmadas, política de cancelación e historial transparente de créditos."}
      />
      <section className="memberSessionsWallet">
        <div className="memberSessionsBalance"><TicketCheck size={22} /><span>{english ? "Available" : "Disponibles"}</span><strong>{balance.available}</strong></div>
        <div><span>{english ? "Reserved" : "Reservadas"}</span><strong>{balance.reserved}</strong><small>{english ? "not charged yet" : "aún no consumidas"}</small></div>
        <div><span>{english ? "Used" : "Utilizadas"}</span><strong>{balance.totalUsed}</strong><small>{english ? "closed sessions" : "sesiones cerradas"}</small></div>
        <div className="memberSessionsPolicy"><ShieldCheck size={18} /><strong>{english ? "Protected balance" : "Saldo protegido"}</strong><p>{english ? "On-time cancellations release the credit. Late cancellations and no-shows use one session." : "Cancelar dentro del plazo libera el crédito. Las cancelaciones tardías y no-shows consumen una sesión."}</p></div>
      </section>

      <section className="memberSessionsGrid">
        <article className="memberSessionsPanel upcoming">
          <header><CalendarClock size={19} /><div><span>{english ? "Agenda" : "Agenda"}</span><h2>{english ? "Upcoming sessions" : "Próximas sesiones"}</h2></div><strong>{upcoming.length}</strong></header>
          {upcoming.length ? <ul>{upcoming.map((session) => { const when = formatDateTime(session, locale); const cutoff = new Date(new Date(session.startsAt).getTime() - session.cancellationWindowHours * 3_600_000); return <li key={session.id}><span className="memberSessionDate"><strong>{when.date}</strong><em>{when.time}</em></span><div><strong><MapPin size={14} /> {session.location || (english ? "Location pending" : "Lugar pendiente")}</strong>{session.memberNotes ? <p>{session.memberNotes}</p> : null}<small><Clock3 size={13} /> {english ? "Cancel without charge until" : "Cancela sin consumo hasta"} {new Intl.DateTimeFormat(locale, { timeZone: session.timezone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(cutoff)}</small></div></li>; })}</ul> : <div className="memberSessionsEmpty"><CalendarClock size={24} /><strong>{english ? "No bookings yet" : "Sin reservas todavía"}</strong><p>{english ? "Your coach will schedule the next session here." : "Tu coach añadirá aquí tu próxima sesión."}</p></div>}
          {pendingCoach.length ? <p className="memberSessionPending"><Clock3 size={14} /> {english ? `${pendingCoach.length} past session(s) awaiting coach confirmation.` : `${pendingCoach.length} sesión(es) pasada(s) pendientes de confirmación del coach.`}</p> : null}
        </article>

        <article className="memberSessionsPanel history">
          <header><History size={19} /><div><span>{english ? "Traceability" : "Trazabilidad"}</span><h2>{english ? "Recent history" : "Historial reciente"}</h2></div><strong>{history.length}</strong></header>
          {history.length ? <ul>{history.slice(0, 12).map((session) => { const when = formatDateTime(session, locale); return <li key={session.id}><span className={`memberSessionOutcome ${session.status}`}>{session.status === "completed" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span><div><strong>{statusLabel[session.status]}</strong><small>{when.date} · {when.time}</small></div></li>; })}</ul> : <div className="memberSessionsEmpty"><History size={24} /><strong>{english ? "No activity yet" : "Sin actividad todavía"}</strong><p>{english ? "Completed and cancelled sessions will appear here." : "Aquí aparecerán las sesiones realizadas y canceladas."}</p></div>}
        </article>
      </section>
    </>
  );
}
