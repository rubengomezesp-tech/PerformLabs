import { AlertTriangle, ArrowRight, Check, CircleDollarSign, Clock3, ReceiptText, UserCheck } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getLocale } from "@/lib/i18n/server";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listRevenueCatPurchases } from "@/lib/repositories/revenuecat-purchases";
import { assignRevenueCatPurchaseAction } from "./actions";

export const dynamic = "force-dynamic";

type PurchasesPageProps = { searchParams?: Promise<{ status?: string }> };

function money(amountCents: number | null, currency: string | null, locale: string): string {
  if (amountCents === null || !currency) return "—";
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function shortId(value: string | null): string {
  if (!value) return "—";
  return value.length > 16 ? `${value.slice(0, 7)}…${value.slice(-6)}` : value;
}

export default async function CoachPurchasesPage({ searchParams }: PurchasesPageProps) {
  const [brand, locale, params] = await Promise.all([
    getSelectedMemberAppBrand(),
    getLocale(),
    searchParams,
  ]);
  const [purchases, members] = await Promise.all([
    listRevenueCatPurchases(brand.id),
    listManagedMembers(brand.id),
  ]);
  const isEn = locale === "en";
  const pending = purchases.filter((purchase) => !purchase.memberProfileId || purchase.processingStatus === "pending_assignment");
  const identified = purchases.filter((purchase) => Boolean(purchase.memberProfileId)).length;
  const activated = purchases.filter((purchase) => purchase.processingStatus === "processed" && purchase.memberProfileId).length;
  const formatter = new Intl.DateTimeFormat(isEn ? "en-US" : "es-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
  const copy = isEn ? {
    eyebrow: "Payment operations",
    title: "Every payment, with an owner.",
    text: "Identify, activate and audit every RG purchase from one private workflow.",
    charged: "Charged",
    identified: "Identified",
    activated: "Activated",
    pending: "Needs your attention",
    pendingText: "Match each payment once. Future renewals will be linked automatically.",
    history: "Purchase history",
    historyText: "A clear record of payment, customer and activation status.",
    noPending: "Everything is reconciled",
    noPendingText: "There are no payments waiting to be assigned.",
    noPurchases: "No RG purchases have been received yet.",
    buyer: "Buyer",
    assignTo: "Assign to client",
    choose: "Choose a client",
    assign: "Assign and activate",
    create: "Create client",
    sessions: "sessions",
    pendingTag: "Unidentified",
    assignedTag: "Activated",
    failedTag: "Review",
    event: "Event",
  } : {
    eyebrow: "Operaciones de cobro",
    title: "Cada pago, con dueño.",
    text: "Identifica, activa y audita cada compra RG desde un único flujo privado.",
    charged: "Cobrado",
    identified: "Identificado",
    activated: "Activado",
    pending: "Requiere tu atención",
    pendingText: "Vincula cada pago una sola vez. Las próximas renovaciones se asignarán solas.",
    history: "Historial de compras",
    historyText: "Registro claro del cobro, el cliente y su estado de activación.",
    noPending: "Todo está conciliado",
    noPendingText: "No hay pagos esperando asignación.",
    noPurchases: "Todavía no se han recibido compras RG.",
    buyer: "Comprador",
    assignTo: "Asignar al cliente",
    choose: "Elige un cliente",
    assign: "Asignar y activar",
    create: "Crear cliente",
    sessions: "sesiones",
    pendingTag: "Sin identificar",
    assignedTag: "Activado",
    failedTag: "Revisar",
    event: "Evento",
  };

  return (
    <>
      <Topbar eyebrow={copy.eyebrow} title={copy.title} text={copy.text} />
      <section className="grid revenueOps">
        {params?.status ? (
          <article className={`card span12 revenueOpsBanner ${params.status === "assigned" ? "ok" : "err"}`}>
            {params.status === "assigned" ? <Check size={17} /> : <AlertTriangle size={17} />}
            {params.status === "assigned"
              ? (isEn ? "Purchase assigned. Access and session balance are now active." : "Compra asignada. El acceso y el saldo de sesiones ya están activos.")
              : (isEn ? "The purchase could not be assigned. Check the client and try again." : "No se pudo asignar la compra. Revisa el cliente e inténtalo de nuevo.")}
          </article>
        ) : null}

        <article className="card span12 revenueRail" aria-label={isEn ? "Payment reconciliation" : "Conciliación de pagos"}>
          <div className="revenueRailStep done"><CircleDollarSign /><span><b>{purchases.length}</b>{copy.charged}</span></div>
          <ArrowRight className="revenueRailArrow" />
          <div className={`revenueRailStep ${identified === purchases.length ? "done" : "current"}`}><UserCheck /><span><b>{identified}</b>{copy.identified}</span></div>
          <ArrowRight className="revenueRailArrow" />
          <div className={`revenueRailStep ${activated === purchases.length ? "done" : "current"}`}><Check /><span><b>{activated}</b>{copy.activated}</span></div>
        </article>

        <article className="card span12 revenuePendingPanel">
          <div className="sectionHeader">
            <div>
              <Clock3 color="var(--accent)" aria-hidden="true" />
              <h2>{copy.pending}</h2>
              <p>{copy.pendingText}</p>
            </div>
            <span className={`tag ${pending.length ? "danger" : ""}`}>{pending.length}</span>
          </div>

          {pending.length ? (
            <div className="revenuePendingList">
              {pending.map((purchase) => (
                <article className="revenuePendingItem" key={purchase.id}>
                  <div className="revenuePurchaseIdentity">
                    <div className="revenueProductMark"><ReceiptText size={20} /></div>
                    <div>
                      <div className="revenuePurchaseTitle">
                        <strong>{purchase.productLabel}</strong>
                        <span className="tag danger">{purchase.processingStatus === "failed" ? copy.failedTag : copy.pendingTag}</span>
                      </div>
                      <p>{money(purchase.amountCents, purchase.currency, locale)}{purchase.sessions ? ` · ${purchase.sessions} ${copy.sessions}` : ""}</p>
                    </div>
                  </div>
                  <dl className="revenuePurchaseFacts">
                    <div><dt>{copy.buyer}</dt><dd>{purchase.customerEmail ?? shortId(purchase.appUserId)}</dd></div>
                    <div><dt>{isEn ? "Paid" : "Pagado"}</dt><dd>{formatter.format(new Date(purchase.purchasedAt))}</dd></div>
                    <div><dt>ID</dt><dd title={purchase.transactionId ?? purchase.id}>{shortId(purchase.transactionId ?? purchase.id)}</dd></div>
                  </dl>
                  <form action={assignRevenueCatPurchaseAction} className="revenueAssignForm">
                    <input type="hidden" name="workspaceId" value={brand.id} />
                    <input type="hidden" name="eventId" value={purchase.id} />
                    <label>
                      {copy.assignTo}
                      <select name="memberProfileId" required defaultValue="">
                        <option value="" disabled>{copy.choose}</option>
                        {members.map((member) => <option value={member.id} key={member.id}>{member.fullName} · {member.email}</option>)}
                      </select>
                    </label>
                    <button className="btn primary" type="submit" disabled={!members.length}><UserCheck size={16} /> {copy.assign}</button>
                    <Link className="btn ghost" href="/coach/members"><span>+</span> {copy.create}</Link>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="revenueEmpty"><Check size={22} /><div><strong>{copy.noPending}</strong><p>{copy.noPendingText}</p></div></div>
          )}
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <ReceiptText color="var(--accent)" aria-hidden="true" />
              <h2>{copy.history}</h2>
              <p>{copy.historyText}</p>
            </div>
            <span className="tag">{purchases.length}</span>
          </div>
          {purchases.length ? (
            <div className="revenueHistory" role="table">
              {purchases.map((purchase) => (
                <div className="revenueHistoryRow" role="row" key={purchase.id}>
                  <div><strong>{purchase.productLabel}</strong><span>{formatter.format(new Date(purchase.purchasedAt))}</span></div>
                  <div><strong>{purchase.memberName ?? purchase.customerEmail ?? copy.pendingTag}</strong><span>{shortId(purchase.transactionId)}</span></div>
                  <div className="revenueHistoryAmount"><strong>{money(purchase.amountCents, purchase.currency, locale)}</strong><span>{purchase.eventType === "RENEWAL" ? (isEn ? "Renewal" : "Renovación") : copy.event}</span></div>
                  <span className={`tag ${purchase.processingStatus === "processed" && purchase.memberProfileId ? "" : "danger"}`}>
                    {purchase.processingStatus === "processed" && purchase.memberProfileId ? copy.assignedTag : copy.pendingTag}
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="muted">{copy.noPurchases}</p>}
        </article>
      </section>
    </>
  );
}
