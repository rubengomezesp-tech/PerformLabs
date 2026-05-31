import { CheckCircle2, CreditCard, Link2, Plus, ShieldCheck, Trash2, Unplug } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listCoachPlans } from "@/lib/repositories/coach-plans";
import { getPlatformSubscription, getStripeAccount } from "@/lib/repositories/stripe-billing";
import { getStripeEnv, isPlatformBillingConfigured, isStripeConnectConfigured } from "@/lib/stripe/env";
import { archiveCoachPlanAction, createCoachPlanAction, createMemberCheckoutLinkAction, disconnectStripeAction, subscribePlatformAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  connected: { tone: "ok", text: "Cuenta de Stripe conectada correctamente." },
  subscribed: { tone: "ok", text: "Suscripción de plataforma activada." },
  denied: { tone: "err", text: "Cancelaste la conexión con Stripe." },
  invalid_state: { tone: "err", text: "La sesión de conexión caducó. Inténtalo de nuevo." },
  error: { tone: "err", text: "No se pudo completar la conexión. Inténtalo de nuevo." },
  cancelled: { tone: "err", text: "Pago cancelado." },
  not_configured: { tone: "err", text: "Stripe aún no está configurado en la plataforma." },
  connect_first: { tone: "err", text: "Conecta tu Stripe y activa los cobros antes de crear planes." },
  invalid_plan: { tone: "err", text: "Revisa el nombre y el importe del plan (mínimo 0,50)." },
  member_checkout_ok: { tone: "ok", text: "Pago de prueba completado. Revisa Stripe y tu suscripción de cliente." },
  member_checkout_error: { tone: "err", text: "No se pudo generar el enlace de pago. Revisa el plan y tu cuenta de Stripe." },
};

type BillingPageProps = { searchParams?: Promise<{ status?: string }> };

export default async function CoachBillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const banner = params?.status ? STATUS_MESSAGES[params.status] : null;

  const brand = await getSelectedMemberAppBrand();
  const connectReady = isStripeConnectConfigured();
  const billingReady = isPlatformBillingConfigured();
  const [account, subscription, plans] = await Promise.all([
    getStripeAccount(brand.id),
    getPlatformSubscription(brand.id),
    listCoachPlans(brand.id),
  ]);
  const { applicationFeePercent } = getStripeEnv();
  const subscriptionActive = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <>
      <Topbar
        eyebrow="Facturación"
        title="Cobra a tus clientes y gestiona tu plan."
        text={`Conecta tu Stripe para cobrar desde tu marca. PerformLabs aplica una comisión del ${applicationFeePercent}% sobre cada cobro a tus clientes.`}
      />
      <section className="grid">
        {banner ? (
          <article className={`card span12 billingBanner ${banner.tone}`}>
            <CheckCircle2 size={16} /> {banner.text}
          </article>
        ) : null}

        {!connectReady ? (
          <article className="card span12">
            <div className="sectionHeader">
              <div>
                <CreditCard color="var(--accent)" aria-hidden="true" />
                <h2>Pagos en preparación.</h2>
                <p>La conexión con Stripe se activará en cuanto la plataforma termine de configurar las claves. No necesitas hacer nada todavía.</p>
              </div>
              <span className="tag">Próximamente</span>
            </div>
          </article>
        ) : (
          <>
            <article className="card span6">
              <div className="sectionHeader">
                <div>
                  <Link2 color="var(--accent)" aria-hidden="true" />
                  <h2>Tu cuenta de Stripe.</h2>
                  <p>Con Connect (Standard) los cobros van directos a tu cuenta y tú mantienes el control.</p>
                </div>
                <span className={account ? "tag" : "tag danger"}>{account ? "Conectada" : "Sin conectar"}</span>
              </div>
              {account ? (
                <>
                  <div className="catalogChips">
                    <span className={`catalogChip ${account.chargesEnabled ? "accent" : ""}`}>{account.chargesEnabled ? "Cobros activos" : "Cobros pendientes"}</span>
                    <span className={`catalogChip ${account.payoutsEnabled ? "accent" : ""}`}>{account.payoutsEnabled ? "Pagos activos" : "Pagos pendientes"}</span>
                    {account.country ? <span className="catalogChip">{account.country}</span> : null}
                    <span className="catalogChip muted">{account.livemode ? "live" : "test"}</span>
                  </div>
                  {!account.detailsSubmitted ? (
                    <p className="muted">Completa el alta en Stripe para activar los cobros.</p>
                  ) : null}
                  <form action={disconnectStripeAction}>
                    <button className="btn ghost sm" type="submit"><Unplug size={14} /> Desconectar</button>
                  </form>
                </>
              ) : (
                <Link className="btn primary" href="/api/stripe/connect"><Link2 size={16} /> Conectar con Stripe</Link>
              )}
            </article>

            <article className="card span6">
              <div className="sectionHeader">
                <div>
                  <ShieldCheck color="var(--accent)" aria-hidden="true" />
                  <h2>Tu plan en PerformLabs.</h2>
                  <p>La suscripción que mantiene tu app de marca operativa.</p>
                </div>
                <span className={subscriptionActive ? "tag" : "tag danger"}>{subscriptionActive ? "Activa" : "Inactiva"}</span>
              </div>
              <ul className="list">
                <li className="row">Estado <span className="tag">{subscription?.status ?? "inactive"}</span></li>
                {subscription?.currentPeriodEnd ? (
                  <li className="row">Renueva <strong>{subscription.currentPeriodEnd.slice(0, 10)}</strong></li>
                ) : null}
              </ul>
              {!subscriptionActive ? (
                billingReady ? (
                  <form action={subscribePlatformAction}>
                    <button className="btn primary" type="submit"><CreditCard size={16} /> Activar suscripción</button>
                  </form>
                ) : (
                  <p className="muted">El plan de plataforma estará disponible en breve.</p>
                )
              ) : null}
            </article>

            <article className="card span12">
              <div className="sectionHeader">
                <div>
                  <CreditCard color="var(--accent)" aria-hidden="true" />
                  <h2>Planes para tus clientes.</h2>
                  <p>Define lo que cobras a tus clientes. El precio se crea en tu cuenta de Stripe; PerformLabs retiene el {applicationFeePercent}%.</p>
                </div>
                <span className="tag">{plans.length} plan(es)</span>
              </div>

              {plans.length ? (
                <div className="catalogGrid">
                  {plans.map((plan) => (
                    <article className="catalogCard" key={plan.id}>
                      <div className="catalogCardHead">
                        <strong>{plan.name}</strong>
                        <form action={archiveCoachPlanAction}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <button className="btn ghost sm" type="submit" aria-label="Archivar plan"><Trash2 size={14} /></button>
                        </form>
                      </div>
                      {plan.description ? <p className="muted">{plan.description}</p> : null}
                      <div className="catalogChips">
                        <span className="catalogChip accent">{(plan.amountCents / 100).toFixed(2)} {plan.currency.toUpperCase()}</span>
                        <span className="catalogChip">/{plan.interval === "year" ? "año" : "mes"}</span>
                        {plan.stripePriceId ? <span className="catalogChip muted">Stripe</span> : null}
                      </div>
                      {account?.chargesEnabled && plan.stripePriceId ? (
                        <form action={createMemberCheckoutLinkAction} className="editForm">
                          <input type="hidden" name="planId" value={plan.id} />
                          <label className="spanFull">
                            Email del cliente (opcional)
                            <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="cliente@email.com" maxLength={200} />
                          </label>
                          <button className="btn ghost sm spanFull" type="submit"><Link2 size={14} /> Generar enlace de pago de prueba</button>
                        </form>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">Aún no has creado planes de cobro para tus clientes.</p>
              )}

              {account?.chargesEnabled ? (
                <form action={createCoachPlanAction} className="editForm">
                  <label>
                    Nombre del plan
                    <input name="name" placeholder="Coaching mensual" required maxLength={120} />
                  </label>
                  <label>
                    Precio
                    <input name="amount" type="number" inputMode="decimal" min="0.5" step="0.5" placeholder="49.90" required />
                  </label>
                  <label>
                    Periodicidad
                    <select name="interval" defaultValue="month">
                      <option value="month">Mensual</option>
                      <option value="year">Anual</option>
                    </select>
                  </label>
                  <label className="spanFull">
                    Descripción (opcional)
                    <input name="description" placeholder="Qué incluye el plan" maxLength={200} />
                  </label>
                  <button className="btn primary spanFull" type="submit"><Plus size={16} /> Crear plan</button>
                </form>
              ) : (
                <p className="muted">Conecta tu Stripe y activa los cobros para crear planes.</p>
              )}
            </article>
          </>
        )}
      </section>
    </>
  );
}
