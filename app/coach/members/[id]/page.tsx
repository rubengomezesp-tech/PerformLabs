import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  ExternalLink,
  History,
  Mail,
  MessageSquareText,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TicketCheck,
  TrendingDown,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedCheckins } from "@/lib/repositories/checkin-management";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { getRetentionRadar, type RetentionTier } from "@/lib/repositories/member-retention";
import { getManagedMemberSessionBalance, type SessionLedgerEventType } from "@/lib/repositories/session-credits";
import { adjustCoachMemberSessionsAction } from "../actions";

export const dynamic = "force-dynamic";

type MemberDetailPageProps = {
  params: Promise<{ id: string }>;
};

const tierLabel: Record<RetentionTier, string> = {
  high: "Riesgo alto",
  medium: "A vigilar",
  low: "Saludable",
};

const tierIcon: Record<RetentionTier, typeof ShieldAlert> = {
  high: ShieldAlert,
  medium: TrendingDown,
  low: ShieldCheck,
};

function prettyDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CoachMemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  const brand = await getSelectedMemberAppBrand();
  const [members, radar, allCheckins, sessionBalance] = await Promise.all([
    listManagedMembers(brand.id),
    getRetentionRadar(brand.id),
    listManagedCheckins(brand.id),
    getManagedMemberSessionBalance(brand.id, id),
  ]);

  const member = members.find((candidate) => candidate.id === id);
  if (!member) {
    notFound();
  }

  const risk = radar.members.find((candidate) => candidate.id === id) ?? null;
  const checkins = allCheckins.filter((checkin) => checkin.memberProfileId === id).slice(0, 5);
  const TierIcon = risk ? tierIcon[risk.tier] : ShieldCheck;
  const plan = member.activeWorkoutPlan;
  const memberHost = brand.memberDomain || brand.fallbackSubdomain;
  const memberAccessHref = memberHost ? `https://${memberHost}/m` : "/m";
  const purchaseBase = `https://pay.rev.cat/yvcgmrwpgqphcyyq/${encodeURIComponent(member.id)}`;
  const sessionEventLabels: Record<SessionLedgerEventType, string> = {
    purchase: "Bono comprado",
    session_used: "Entrenamiento realizado",
    coach_credit: "Abono manual",
    coach_debit: "Ajuste manual",
    refund: "Reembolso",
    pack_assigned: "Bono asignado",
    void: "Bono anulado",
  };

  return (
    <>
      <Topbar
        eyebrow="Ficha de cliente"
        title={member.fullName}
        text={`${member.email}${member.goal ? ` · ${member.goal}` : ""}`}
        actions={
          <Link className="btn" href="/coach/members">
            <ArrowLeft size={16} /> Volver
          </Link>
        }
      />

      <section className="coachMemberLaunchpad">
        <div className="coachMemberLaunchTitle"><Rocket size={20} /><div><strong>Activa a {member.fullName} en 3 pasos</strong><p>El recorrido completo de la cita, sin buscar por el panel.</p></div></div>
        <div className="coachMemberLaunchSteps">
          <Link className="coachMemberLaunchStep" href={`/coach/members/${member.id}/assessment`}><span>{member.onboardingStatus === "complete" ? <CheckCircle2 size={17} /> : "1"}</span><div><small>Primero</small><strong>Valoración</strong></div><ArrowLeft className="launchArrow" size={16} /></Link>
          <Link className="coachMemberLaunchStep" href={`/coach/members/${member.id}/control`}><span>{plan ? <CheckCircle2 size={17} /> : "2"}</span><div><small>Después</small><strong>Preparar y publicar plan</strong></div><ArrowLeft className="launchArrow" size={16} /></Link>
          <a className="coachMemberLaunchStep" href={memberAccessHref} rel="noreferrer" target="_blank"><span>3</span><div><small>Enséñale</small><strong>Abrir su acceso</strong></div><ExternalLink size={16} /></a>
        </div>
      </section>

      <section className="grid">
        <article className="card span3 motionCard">
          <UserRound color="var(--accent)" aria-hidden="true" />
          <p className="metric">Estado<strong>{member.subscriptionStatus}</strong></p>
          <p>Onboarding: {member.onboardingStatus}</p>
        </article>
        <article className={`card span3 motionCard${risk && risk.tier !== "low" ? " warning" : ""}`}>
          <TierIcon color="var(--accent)" aria-hidden="true" />
          <p className="metric">Riesgo<strong>{risk ? `${risk.riskScore}/100` : "—"}</strong></p>
          <p>{risk ? tierLabel[risk.tier] : "Sin datos (suscripción inactiva)"}</p>
        </article>
        <article className="card span3 motionCard">
          <Activity color="var(--accent)" aria-hidden="true" />
          <p className="metric">Entrenos 14d<strong>{risk ? risk.workoutsLast14 : "—"}</strong></p>
          <p>
            {risk
              ? risk.daysSinceActivity === null
                ? "Sin actividad reciente"
                : `Última actividad hace ${risk.daysSinceActivity} día(s)`
              : "Sin seguimiento"}
          </p>
        </article>
        <article className="card span3 motionCard">
          <ClipboardCheck color="var(--accent)" aria-hidden="true" />
          <p className="metric">Check-ins<strong>{checkins.length}</strong></p>
          <p>
            {risk && risk.lastCheckinDays !== null
              ? `Último hace ${risk.lastCheckinDays} día(s)`
              : checkins.length
                ? `Último ${prettyDate(checkins[0]!.submittedAt)}`
                : "Aún sin check-ins"}
          </p>
        </article>

        <article className="card span12 coachSessionControl motionCard">
          <div className="coachSessionSummary">
            <span className="uiIconChip"><TicketCheck size={20} /></span>
            <div><span className="eyebrow">Bono de entrenamiento personal</span><strong>{sessionBalance.available}</strong><p>sesiones disponibles</p></div>
            <dl>
              <div><dt>Reservadas</dt><dd>{sessionBalance.reserved}</dd></div>
              <div><dt>Utilizadas</dt><dd>{sessionBalance.totalUsed}</dd></div>
              <div><dt>Abonadas</dt><dd>{sessionBalance.totalGranted}</dd></div>
              <div><dt>Caduca antes</dt><dd>{sessionBalance.nextExpiryAt ? prettyDate(sessionBalance.nextExpiryAt) : "Sin caducidad"}</dd></div>
            </dl>
          </div>

          <form action={adjustCoachMemberSessionsAction} className="coachSessionForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="memberProfileId" type="hidden" value={member.id} />
            <label>Movimiento<select name="operation" defaultValue="add"><option value="add">Añadir sesiones</option></select></label>
            <label>Cantidad<input name="quantity" type="number" min="1" max="100" defaultValue="1" inputMode="numeric" /></label>
            <label className="coachSessionNote">Nota visible para el cliente<input name="note" placeholder="Ej. Sesión del 15 de julio" /></label>
            <SubmitButton variant="primary" successToast="Saldo actualizado">Guardar movimiento</SubmitButton>
          </form>

          <div className="coachSessionPurchase">
            <div><CreditCard size={17} /><span><strong>Enviar pago</strong><small>El bono se asigna a este cliente al completarse.</small></span></div>
            <div className="coachSessionPurchaseLinks">
              <a href={`${purchaseBase}?package_id=single_session`} target="_blank" rel="noreferrer">1 sesión · $70 <ExternalLink size={13} /></a>
              <a href={`${purchaseBase}?package_id=pack_8`} target="_blank" rel="noreferrer">8 sesiones · $440 <ExternalLink size={13} /></a>
              <a href={`${purchaseBase}?package_id=pack_12`} target="_blank" rel="noreferrer">12 sesiones · $600 <ExternalLink size={13} /></a>
            </div>
          </div>

          <div className="coachSessionHistory">
            <h3><History size={16} /> Últimos movimientos</h3>
            {sessionBalance.movements.length ? (
              <ul>{sessionBalance.movements.slice(0, 5).map((movement) => <li key={movement.id}><span className={movement.delta > 0 ? "positive" : "negative"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</span><div><strong>{sessionEventLabels[movement.eventType]}</strong><small>{prettyDate(movement.createdAt)}{movement.note ? ` · ${movement.note}` : ""}</small></div></li>)}</ul>
            ) : <p>Aún no hay movimientos. Añade el bono inicial o envía un enlace de pago.</p>}
          </div>
        </article>

        {/* Datos del cliente */}
        <article className="card span5 motionCard">
          <div className="sectionHeader">
            <div>
              <UserRound color="var(--accent)" aria-hidden="true" />
              <h2>Datos del cliente</h2>
              <p>Información básica y de contacto.</p>
            </div>
          </div>
          <ul className="list">
            <li className="row"><Mail size={15} /> Email <span>{member.email}</span></li>
            <li className="row"><Target size={15} /> Objetivo <span>{member.goal || "Pendiente"}</span></li>
            <li className="row">Estado <span className="tag">{member.subscriptionStatus}</span></li>
            <li className="row"><CalendarDays size={15} /> Alta <span>{prettyDate(member.createdAt)}</span></li>
            <li className="row">Zona horaria <strong>{member.timezone}</strong></li>
            {member.startingWeightKg ? (
              <li className="row">Peso inicial <strong>{member.startingWeightKg} kg</strong></li>
            ) : null}
          </ul>
          <div className="memberQuickLinks">
            <Link className="btn primary sm" href={`/coach/members/${member.id}/assessment`}><ClipboardCheck size={15} /> Primera valoración</Link>
            <Link className="btn ghost sm" href={`/coach/members/${member.id}/control`}><SlidersHorizontal size={15} /> Centro de control</Link>
            <Link className="btn ghost sm" href={`/coach/sessions?member=${member.id}`}><CalendarDays size={15} /> Reservar sesión</Link>
            <Link className="btn ghost sm" href="/coach/messages"><MessageSquareText size={15} /> Mensajes</Link>
            <Link className="btn ghost sm" href="/coach/checkins"><ClipboardCheck size={15} /> Check-ins</Link>
          </div>
        </article>

        {/* Retención */}
        <article className="card span7 motionCard" id="plans">
          <div className="sectionHeader">
            <div>
              <TierIcon color="var(--accent)" aria-hidden="true" />
              <h2>Retención</h2>
              <p>Señales de abandono y acción recomendada.</p>
            </div>
          </div>
          {risk ? (
            <>
              <div className={`riskPill ${risk.tier}`}>
                <TierIcon size={15} /> {tierLabel[risk.tier]} · {risk.riskScore}/100
              </div>
              {risk.reasons.length ? (
                <ul className="list">
                  {risk.reasons.map((reason) => (
                    <li className="row" key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p>Sin señales de riesgo. Mantén el contacto habitual.</p>
              )}
              <div className="memberAssignmentState">
                <span className="eyebrow">Acción recomendada</span>
                <strong>{risk.recommendedAction}</strong>
              </div>
            </>
          ) : (
            <div className="coachEmptyPanel compact">
              <ShieldCheck color="var(--soft)" />
              <strong>Sin datos de retención.</strong>
              <p>La suscripción de este cliente está inactiva, así que no entra en el radar de retención.</p>
            </div>
          )}
        </article>

        {/* Entrenamiento activo + asignación */}
        <article className="card span7 motionCard">
          <div className="sectionHeader">
            <div>
              <Dumbbell color="var(--accent)" aria-hidden="true" />
              <h2>Entrenamiento activo</h2>
              <p>Plan asignado, fase del bloque y próxima revisión.</p>
            </div>
          </div>
          <div className="memberAssignmentState">
            {plan ? (
              <>
                <strong>{plan.name}</strong>
                <p>
                  {plan.daysPerWeek ?? "-"} días/semana · Mes {plan.currentMonth} · Semana {plan.currentWeek}
                </p>
                <small>Revisión: {plan.nextReviewOn || "sin fecha"} · {plan.reviewStatus}</small>
              </>
            ) : (
              <p>Sin entrenamiento asignado todavía.</p>
            )}
          </div>
          <Link className="btn primary" href={`/coach/members/${member.id}/control`}><SlidersHorizontal size={16} /> Preparar y publicar plan</Link>
        </article>

        {/* Check-ins recientes */}
        <article className="card span5 motionCard">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--accent)" aria-hidden="true" />
              <h2>Check-ins recientes</h2>
              <p>Últimos partes de progreso.</p>
            </div>
          </div>
          {checkins.length ? (
            <ul className="list">
              {checkins.map((checkin) => (
                <li className="row" key={checkin.id}>
                  <span>{prettyDate(checkin.submittedAt)}</span>
                  <span>
                    {checkin.values.weightKg != null ? `${checkin.values.weightKg} kg` : "—"}
                    {" · "}
                    <span className="tag">{checkin.status === "reviewed" ? "Revisado" : "Pendiente"}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="coachEmptyPanel compact">
              <ClipboardCheck color="var(--soft)" />
              <strong>Sin check-ins todavía.</strong>
              <p>Aparecerán aquí cuando el cliente envíe peso, medidas y sensaciones.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
