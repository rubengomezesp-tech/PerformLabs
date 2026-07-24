import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ClipboardCheck,
  HeartPulse,
  MessageSquareText,
  Users,
  Wallet,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { SignalCard, type SignalTone } from "@/components/ui";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachDashboard } from "@/lib/repositories/coach-dashboard";
import { getActivationStats, getMemberCheckinSummary } from "@/lib/repositories/checkin-management";
import { getRetentionRadar } from "@/lib/repositories/member-retention";
import { getWorkspaceBillingSummary } from "@/lib/repositories/member-subscriptions";

export const dynamic = "force-dynamic";

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${Math.round(cents / 100)} ${currency || "EUR"}`;
  }
}

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function prettyDate(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function DistRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const share = pct(count, total);
  return (
    <div className="analyticsBar">
      <div className="analyticsBarHead">
        <span>{label}</span>
        <span>
          <strong>{count}</strong> · {share}%
        </span>
      </div>
      <div className="analyticsBarTrack" aria-hidden="true">
        <div className="analyticsBarFill" style={{ width: `${share}%`, background: color }} />
      </div>
    </div>
  );
}

export default async function CoachAnalyticsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [dashboard, radar, checkins, billing, activation] = await Promise.all([
    getCoachDashboard(brand.id),
    getRetentionRadar(brand.id),
    getMemberCheckinSummary(brand.id),
    getWorkspaceBillingSummary(brand.id),
    getActivationStats(brand.id),
  ]);
  const { summary } = radar;

  const adherenceTone: SignalTone =
    summary.avgAdherence >= 60 ? "good" : summary.avgAdherence >= 40 ? "warning" : "danger";
  const riskTone: SignalTone = summary.atRisk > 0 ? "danger" : "good";

  return (
    <>
      <Topbar
        eyebrow="Analítica"
        title="Lectura rápida del negocio del coach."
        text="Retención, adherencia, facturación y check-ins desde la perspectiva del entrenador — con datos reales de tu cartera."
      />
      <section className="grid">
        <SignalCard
          icon={Users}
          label="Clientes activos"
          value={summary.activeMembers}
          detail={`${summary.healthy} sanos · ${summary.watch} a vigilar`}
        />
        <SignalCard
          icon={Wallet}
          tone={billing.mrrCents > 0 ? "good" : "neutral"}
          label="Ingreso recurrente"
          value={formatMoney(billing.mrrCents, billing.currency)}
          detail={
            billing.active > 0
              ? `${billing.active} activas · ARPU ${formatMoney(billing.arpuCents, billing.currency)}`
              : "Aún sin suscripciones activas"
          }
        />
        <SignalCard
          icon={AlertTriangle}
          tone={riskTone}
          label="En riesgo"
          value={summary.atRisk}
          detail={`${pct(summary.atRisk, summary.activeMembers)}% de la cartera`}
        />
        <SignalCard
          icon={Activity}
          tone={adherenceTone}
          label="Adherencia 14 días"
          value={`${summary.avgAdherence}%`}
          detail="Entrenando en las últimas 2 semanas"
        />
        <SignalCard
          icon={Activity}
          tone={activation.recentMembers === 0 || activation.activated === activation.recentMembers ? "good" : "warning"}
          label="Activación (90 días)"
          value={activation.averageDaysToFirstCheckin !== null ? `${activation.averageDaysToFirstCheckin} días` : "—"}
          detail={`Alta → primer check-in · ${activation.activated}/${activation.recentMembers} activados · ${activation.withinTwoDays} en <48h`}
        />

        {/* Retención y adherencia */}
        <article className="card span6 motionCard">
          <div className="sectionHeader">
            <div>
              <HeartPulse color="var(--accent)" aria-hidden="true" />
              <h2>Adherencia y retención</h2>
              <p>Cómo se reparte tu cartera por riesgo de abandono.</p>
            </div>
          </div>
          {summary.activeMembers > 0 ? (
            <div className="analyticsBars">
              <DistRow label="Sanos" count={summary.healthy} total={summary.activeMembers} color="var(--success)" />
              <DistRow label="A vigilar" count={summary.watch} total={summary.activeMembers} color="var(--warning)" />
              <DistRow label="En riesgo" count={summary.atRisk} total={summary.activeMembers} color="var(--danger)" />
              <p className="analyticsFoot">
                {summary.atRisk > 0 ? (
                  <Link href="/coach/retention" className="analyticsInlineLink">
                    Ver radar de retención <ArrowUpRight size={14} />
                  </Link>
                ) : (
                  "Cartera saludable. Mantén el contacto."
                )}
              </p>
            </div>
          ) : (
            <div className="coachEmptyPanel compact">
              <Users color="var(--soft)" />
              <strong>Sin clientes activos todavía.</strong>
              <p>Cuando tengas miembros, aquí verás su salud de retención de un vistazo.</p>
            </div>
          )}
        </article>

        {/* Facturación */}
        <article className="card span6 motionCard">
          <div className="sectionHeader">
            <div>
              <Wallet color="var(--accent)" aria-hidden="true" />
              <h2>Facturación</h2>
              <p>Suscripciones de tus miembros (Stripe Connect).</p>
            </div>
          </div>
          {billing.total > 0 ? (
            <div className="analyticsBars">
              <p className="analyticsBig">
                {formatMoney(billing.mrrCents, billing.currency)}
                <span> / mes recurrente</span>
              </p>
              <DistRow label="Activas" count={billing.active} total={billing.total} color="var(--success)" />
              <DistRow label="En prueba" count={billing.trialing} total={billing.total} color="var(--accent)" />
              <DistRow label="Pago pendiente" count={billing.pastDue} total={billing.total} color="var(--warning)" />
              <DistRow label="Inactivas" count={billing.inactive} total={billing.total} color="var(--text-soft)" />
            </div>
          ) : (
            <div className="coachEmptyPanel compact">
              <Wallet color="var(--soft)" />
              <strong>Aún no hay suscripciones.</strong>
              <p>Configura tus planes y comparte tu página de ventas para empezar a cobrar.</p>
              <Link href="/coach/billing" className="btn sm">
                Ir a facturación <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </article>

        {/* Check-ins */}
        <article className="card span6 motionCard">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--accent)" aria-hidden="true" />
              <h2>Check-ins</h2>
              <p>Seguimiento de progreso de tus clientes.</p>
            </div>
          </div>
          {checkins.total > 0 ? (
            <div className="analyticsKpiRow">
              <div className="analyticsKpi">
                <strong>{checkins.total}</strong>
                <span>Total recibidos</span>
              </div>
              <div className="analyticsKpi">
                <strong className={checkins.pendingCoachReview > 0 ? "isWarning" : undefined}>
                  {checkins.pendingCoachReview}
                </strong>
                <span>Pendientes de revisar</span>
              </div>
              <div className="analyticsKpi">
                <strong>{prettyDate(checkins.latest?.submittedAt ?? null)}</strong>
                <span>Último check-in</span>
              </div>
              {checkins.pendingCoachReview > 0 ? (
                <p className="analyticsFoot">
                  <Link href="/coach/checkins" className="analyticsInlineLink">
                    Revisar check-ins <ArrowUpRight size={14} />
                  </Link>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="coachEmptyPanel compact">
              <ClipboardCheck color="var(--soft)" />
              <strong>Sin check-ins todavía.</strong>
              <p>Tus clientes pueden enviar peso, medidas y fotos desde su app.</p>
            </div>
          )}
        </article>

        {/* Actividad reciente */}
        <article className="card span6 motionCard">
          <div className="sectionHeader">
            <div>
              <MessageSquareText color="var(--accent)" aria-hidden="true" />
              <h2>Actividad reciente</h2>
              <p>Lo último que han hecho tus clientes.</p>
            </div>
          </div>
          <div className="coachActivityList">
            {dashboard.recentActivity.length ? (
              dashboard.recentActivity.slice(0, 6).map((event) => (
                <div className="coachActivityEvent" key={event.id}>
                  <span />
                  <div>
                    <strong>{event.label}</strong>
                    <p>
                      {event.memberName} · {event.detail}
                    </p>
                    <small>
                      {event.source} · {prettyDate(event.occurredAt)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="coachEmptyPanel compact">
                <MessageSquareText color="var(--soft)" />
                <strong>Aún no hay actividad.</strong>
                <p>Se llenará cuando tus clientes registren entrenos, comidas o formularios.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
