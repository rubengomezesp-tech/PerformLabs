"use client";

import { useMemo, useState } from "react";
import { Ban, CalendarPlus, Check, CheckCircle2, FlaskConical, History, Play, RefreshCcw, RotateCcw, ShieldCheck, TicketCheck, XCircle } from "lucide-react";
import {
  applySessionFlowEvent,
  EMPTY_SESSION_FLOW,
  FULL_SESSION_FLOW_EVENTS,
  runFullSessionFlow,
  sessionFlowChecks,
  type SessionFlowEvent,
  type SessionFlowState,
  type SessionFlowTimelineItem,
} from "@/lib/domain/session-flow-simulator";
import type { Locale } from "@/lib/i18n/config";

type FlowLabLocale = "es" | "en";

const copy = {
  es: {
    safe: "Simulación segura",
    safeText: "Todo ocurre en esta pestaña. No cobra, no escribe en Supabase y no modifica clientes.",
    runAll: "Ejecutar test completo",
    reset: "Reiniciar",
    balance: "Saldo del bono",
    available: "disponibles",
    reserved: "reservadas",
    consumed: "consumidas",
    duplicates: "duplicados bloqueados",
    manualTitle: "Recorre el flujo paso a paso",
    manualText: "Prueba cada decisión como ocurriría en una jornada real.",
    purchase: "1. Simular compra Bono 8",
    book: "2. Reservar entrenamiento",
    complete: "3A. Marcar realizada",
    cancel: "3B. Cancelar a tiempo",
    late: "3C. No-show / cancelación tardía",
    resend: "Reenviar último evento",
    results: "Controles automáticos",
    history: "Registro de la prueba",
    waiting: "Ejecuta el flujo completo o comienza por la compra.",
    pass: "Correcto",
    pending: "Pendiente",
    completeResult: "Flujo completo superado",
    incompleteResult: "Continúa la prueba",
    checks: [
      "La compra añade el bono una sola vez",
      "Una sesión realizada consume exactamente una",
      "Cancelar a tiempo libera sin consumir",
      "No-show o cancelación tardía consume una",
      "Un evento duplicado no altera el saldo",
      "El saldo final coincide y no quedan reservas",
    ],
  },
  en: {
    safe: "Safe simulation",
    safeText: "Everything runs in this tab. It charges nothing, writes nothing to Supabase and changes no client data.",
    runAll: "Run complete test",
    reset: "Reset",
    balance: "Pack balance",
    available: "available",
    reserved: "reserved",
    consumed: "consumed",
    duplicates: "duplicates blocked",
    manualTitle: "Walk through the flow",
    manualText: "Test each decision exactly as it would happen during a working day.",
    purchase: "1. Simulate 8-session pack",
    book: "2. Book training session",
    complete: "3A. Mark completed",
    cancel: "3B. Cancel on time",
    late: "3C. No-show / late cancellation",
    resend: "Resend last event",
    results: "Automated checks",
    history: "Test log",
    waiting: "Run the complete flow or start with the purchase.",
    pass: "Passed",
    pending: "Pending",
    completeResult: "Complete flow passed",
    incompleteResult: "Continue testing",
    checks: [
      "Purchase adds the pack only once",
      "A completed session consumes exactly one",
      "An on-time cancellation releases without consuming",
      "A no-show or late cancellation consumes one",
      "A duplicate event cannot change the balance",
      "Final balance matches with no reservations left",
    ],
  },
} as const;

function eventLabel(item: SessionFlowTimelineItem, locale: FlowLabLocale) {
  const labels = locale === "en" ? {
    purchase: "8-session pack purchased",
    book: "Session reserved",
    complete: "Session completed · 1 used",
    cancel_on_time: "Cancelled on time · credit released",
    late_cancel: "Late cancellation · 1 used",
    duplicate_ignored: "Duplicate detected · no balance change",
    rejected: "Action rejected safely",
  } : {
    purchase: "Bono de 8 comprado",
    book: "Entrenamiento reservado",
    complete: "Entrenamiento realizado · 1 consumida",
    cancel_on_time: "Cancelado a tiempo · sesión liberada",
    late_cancel: "Cancelación tardía · 1 consumida",
    duplicate_ignored: "Duplicado detectado · saldo intacto",
    rejected: "Acción rechazada de forma segura",
  };
  return labels[item.type];
}

export function SessionFlowLab({ locale }: { locale: Locale }) {
  const activeLocale: FlowLabLocale = locale === "en" ? "en" : "es";
  const t = copy[activeLocale];
  const [state, setState] = useState<SessionFlowState>(EMPTY_SESSION_FLOW);
  const [lastEvent, setLastEvent] = useState<SessionFlowEvent | null>(null);
  const checks = sessionFlowChecks(state);
  const checkValues = Object.values(checks);
  const passed = checkValues.every(Boolean);
  const reservedBookingId = useMemo(
    () => Object.entries(state.bookings).find(([, status]) => status === "reserved")?.[0] ?? null,
    [state.bookings],
  );

  function dispatch(event: SessionFlowEvent) {
    setState((current) => applySessionFlowEvent(current, event));
    setLastEvent(event);
  }

  function book() {
    const index = Object.keys(state.bookings).length + 1;
    dispatch({ id: `manual-book-${index}`, type: "book", bookingId: `manual-session-${index}` });
  }

  function resolveBooking(type: "complete" | "cancel_on_time" | "late_cancel") {
    if (!reservedBookingId) return;
    dispatch({ id: `manual-${type}-${state.timeline.length}`, type, bookingId: reservedBookingId });
  }

  function runAll() {
    setState(runFullSessionFlow());
    setLastEvent(FULL_SESSION_FLOW_EVENTS.at(-1) ?? null);
  }

  function reset() {
    setState(EMPTY_SESSION_FLOW);
    setLastEvent(null);
  }

  return (
    <div className="flowTestLayout">
      <section className="flowTestSafety" role="status">
        <ShieldCheck size={19} />
        <div><strong>{t.safe}</strong><p>{t.safeText}</p></div>
        <span>TEST MODE</span>
      </section>

      <section className="flowTestMetrics" aria-label={t.balance}>
        <article className="flowTestBalance"><TicketCheck size={22} /><div><span>{t.balance}</span><strong>{state.balance}</strong><small>{t.available}</small></div></article>
        <article><span>{t.reserved}</span><strong>{state.reserved}</strong></article>
        <article><span>{t.consumed}</span><strong>{state.consumed}</strong></article>
        <article><span>{t.duplicates}</span><strong>{state.duplicateEventsDetected}</strong></article>
      </section>

      <section className="flowTestActions">
        <div className="flowTestHeading"><div><FlaskConical size={19} /><span><strong>{t.manualTitle}</strong><small>{t.manualText}</small></span></div><div><button className="btn primary" type="button" onClick={runAll}><Play size={15} /> {t.runAll}</button><button className="btn ghost" type="button" onClick={reset}><RotateCcw size={15} /> {t.reset}</button></div></div>
        <div className="flowTestSteps">
          <button type="button" onClick={() => dispatch({ id: "manual-purchase", type: "purchase", sessions: 8 })} disabled={state.purchased > 0}><TicketCheck size={17} /><span>{t.purchase}</span></button>
          <button type="button" onClick={book} disabled={state.purchased === 0 || state.balance - state.reserved <= 0 || Boolean(reservedBookingId)}><CalendarPlus size={17} /><span>{t.book}</span></button>
          <button type="button" onClick={() => resolveBooking("complete")} disabled={!reservedBookingId}><CheckCircle2 size={17} /><span>{t.complete}</span></button>
          <button type="button" onClick={() => resolveBooking("cancel_on_time")} disabled={!reservedBookingId}><XCircle size={17} /><span>{t.cancel}</span></button>
          <button type="button" onClick={() => resolveBooking("late_cancel")} disabled={!reservedBookingId}><Ban size={17} /><span>{t.late}</span></button>
          <button type="button" onClick={() => lastEvent && setState((current) => applySessionFlowEvent(current, lastEvent))} disabled={!lastEvent}><RefreshCcw size={17} /><span>{t.resend}</span></button>
        </div>
      </section>

      <section className="flowTestColumns">
        <article className="flowTestChecks">
          <div className="flowTestPanelTitle"><CheckCircle2 size={18} /><h2>{t.results}</h2><span className={passed ? "passed" : "pending"}>{passed ? t.completeResult : t.incompleteResult}</span></div>
          <ul>{t.checks.map((label: string, index: number) => <li key={label} className={checkValues[index] ? "passed" : ""}>{checkValues[index] ? <Check size={15} /> : <span>{index + 1}</span>}<div><strong>{label}</strong><small>{checkValues[index] ? t.pass : t.pending}</small></div></li>)}</ul>
        </article>

        <article className="flowTestHistory">
          <div className="flowTestPanelTitle"><History size={18} /><h2>{t.history}</h2><span>{state.timeline.length}</span></div>
          {state.timeline.length ? <ol>{state.timeline.map((item, index) => <li key={item.id}><span>{index + 1}</span><div><strong>{eventLabel(item, activeLocale)}</strong><small>{t.balance}: {item.balance} · {t.reserved}: {item.reserved}</small></div></li>)}</ol> : <p>{t.waiting}</p>}
        </article>
      </section>
    </div>
  );
}
