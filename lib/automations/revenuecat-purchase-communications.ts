import type { Json } from "@/lib/supabase/database.types";
import {
  claimRevenueCatPurchaseDeliveries,
  markRevenueCatPurchaseDelivery,
  type RevenueCatPurchaseDelivery,
} from "@/lib/repositories/revenuecat-purchases";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RG_LOGO_URL = "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-lockup-horizontal-white-1024.png";
const MEMBER_ACCESS_URL = "https://miembros.rubengomezcoaching.com/acceso";
const COACH_PURCHASES_URL = "https://miembros.rubengomezcoaching.com/coach/purchases";

type PurchaseMessage = { subject: string; html: string; text: string };

function textValue(payload: Record<string, Json | undefined>, key: string, fallback = "") {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

function numberValue(payload: Record<string, Json | undefined>, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function row(label: string, value: string) {
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #1b2940;color:#8290a6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.7px">${escapeHtml(label)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #1b2940;color:#fff;font-size:14px;font-weight:800">${escapeHtml(value)}</td></tr>`;
}

function shell(input: { preheader: string; eyebrow: string; title: string; intro: string; rows: string; ctaLabel: string; ctaUrl: string; footer: string }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;background:#eef2f8;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.preheader)}</div><table role="presentation" width="100%"><tr><td align="center" style="padding:38px 14px"><table role="presentation" width="100%" style="max-width:620px;background:#050914;border:1px solid #1b2940;border-radius:22px;overflow:hidden"><tr><td style="height:5px;background:linear-gradient(90deg,#2f6bff,#00d4ff)"></td></tr><tr><td style="padding:36px 40px"><img src="${RG_LOGO_URL}" width="250" alt="RG Coach" style="max-width:100%;height:auto"><p style="margin:30px 0 10px;color:#00d4ff;font-size:11px;font-weight:900;letter-spacing:1.6px">${escapeHtml(input.eyebrow)}</p><h1 style="margin:0;color:#fff;font-size:36px;line-height:1.08">${escapeHtml(input.title)}</h1><p style="margin:15px 0 0;color:#a9b4c7;font-size:16px;line-height:1.65">${escapeHtml(input.intro)}</p><table role="presentation" width="100%" style="margin-top:24px;border-collapse:collapse">${input.rows}</table><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;margin-top:26px;padding:15px 22px;border-radius:11px;background:#2f6bff;color:#fff;text-decoration:none;font-weight:900">${escapeHtml(input.ctaLabel)} →</a><p style="margin:28px 0 0;padding:16px;border-left:3px solid #00d4ff;background:#0b1323;color:#cbd5e1;font-size:12px;line-height:1.6">${escapeHtml(input.footer)}</p></td></tr></table></td></tr></table></body></html>`;
}

function purchaseDetails(delivery: RevenueCatPurchaseDelivery) {
  const payload = delivery.payload;
  const product = textValue(payload, "productLabel", "Programa RG");
  const currency = textValue(payload, "currency", "USD");
  const priceCents = numberValue(payload, "priceCents");
  const sessions = numberValue(payload, "sessions");
  const unit = numberValue(payload, "sessionUnitPriceCents");
  const training = numberValue(payload, "trainingSubtotalCents");
  const coaching = numberValue(payload, "coachingSubtotalCents");
  const validityDays = numberValue(payload, "sessionValidityDays");
  const transactionId = textValue(payload, "transactionId", delivery.eventId);
  const termsUrl = textValue(payload, "termsUrl", "https://rubengomezcoaching.com/terminos-compra");
  const assigned = textValue(payload, "processingStatus") === "processed";
  const breakdown = [
    sessions && unit ? row("Entrenamientos", `${sessions} × ${money(unit, currency)} = ${money(training, currency)}`) : "",
    coaching ? row("App + seguimiento", money(coaching, currency)) : "",
  ].join("");
  return { product, currency, priceCents, sessions, validityDays, transactionId, termsUrl, assigned, breakdown };
}

export function buildCustomerPurchaseMessage(delivery: RevenueCatPurchaseDelivery): PurchaseMessage {
  const detail = purchaseDetails(delivery);
  const status = detail.assigned ? "Activo en tu perfil" : "Pendiente de vincular con tu cuenta";
  return {
    subject: `Compra confirmada · ${detail.product} · RG Coach`,
    html: shell({
      preheader: `Tu pago de ${money(detail.priceCents, detail.currency)} está confirmado.`,
      eyebrow: "PAGO CONFIRMADO",
      title: "Tu compra RG está registrada.",
      intro: "RevenueCat confirmó el pago. Entra usando el mismo email de la compra para ver tus sesiones y el seguimiento del coach.",
      rows: [
        row("Programa", detail.product),
        detail.breakdown,
        row("Total · un solo pago", money(detail.priceCents, detail.currency)),
        detail.validityDays ? row("Validez del bono", `${detail.validityDays} días`) : "",
        row("Estado", status),
        row("Referencia", detail.transactionId),
      ].join(""),
      ctaLabel: "ENTRAR EN MI ÁREA",
      ctaUrl: MEMBER_ACCESS_URL,
      footer: `El recibo fiscal lo emite el proveedor de pago. Condiciones asociadas a la compra: ${detail.termsUrl}. Conserva este correo y la referencia de transacción.`,
    }),
    text: [`Compra confirmada · ${detail.product}`, `Total: ${money(detail.priceCents, detail.currency)} · un solo pago`, detail.sessions ? `Entrenamientos: ${detail.sessions}` : "", `Estado: ${status}`, `Referencia: ${detail.transactionId}`, `Acceso: ${MEMBER_ACCESS_URL}`, `Condiciones: ${detail.termsUrl}`].filter(Boolean).join("\n"),
  };
}

export function buildCoachPurchaseMessage(delivery: RevenueCatPurchaseDelivery): PurchaseMessage {
  const detail = purchaseDetails(delivery);
  const customer = textValue(delivery.payload, "customerEmail", "Cliente sin email");
  const status = detail.assigned ? "ASIGNADO AUTOMÁTICAMENTE" : "REQUIERE VINCULAR CLIENTE";
  return {
    subject: `IMPORTANTE · PAGO CONFIRMADO · ${detail.product} · ${money(detail.priceCents, detail.currency)}`,
    html: shell({
      preheader: `${customer} compró ${detail.product}.`,
      eyebrow: "NUEVO COBRO RG",
      title: "Pago confirmado.",
      intro: "La compra ya está registrada y protegida contra duplicados. Revisa el propietario y programa la primera sesión.",
      rows: [
        row("Cliente", customer),
        row("Programa", detail.product),
        detail.breakdown,
        row("Total cobrado", money(detail.priceCents, detail.currency)),
        row("Activación", status),
        row("Referencia", detail.transactionId),
      ].join(""),
      ctaLabel: "ABRIR COMPRAS RG",
      ctaUrl: COACH_PURCHASES_URL,
      footer: `Control interno RG. Condiciones mostradas en checkout: ${detail.termsUrl}. La asignación manual queda auditada si el email no coincide con una cuenta existente.`,
    }),
    text: [`PAGO CONFIRMADO`, `Cliente: ${customer}`, `Programa: ${detail.product}`, `Total: ${money(detail.priceCents, detail.currency)}`, `Activación: ${status}`, `Referencia: ${detail.transactionId}`, COACH_PURCHASES_URL].join("\n"),
  };
}

async function send(delivery: RevenueCatPurchaseDelivery, apiKey: string, from: string) {
  const message = delivery.audience === "customer" ? buildCustomerPurchaseMessage(delivery) : buildCoachPurchaseMessage(delivery);
  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "rg-coach-purchase-automation/1.0" },
      body: JSON.stringify({
        from,
        to: [delivery.recipientEmail],
        reply_to: "rubengomezesp@gmail.com",
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: delivery.audience === "coach" ? { "X-Priority": "1", Importance: "high", "X-MSMail-Priority": "High" } : undefined,
        tags: [{ name: "workspace", value: "rg-coach" }, { name: "message_type", value: delivery.deliveryType }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false as const, error: `provider_${response.status}` };
    const body = await response.json() as { id?: string };
    return { ok: true as const, id: body.id ?? null };
  } catch {
    return { ok: false as const, error: "provider_unreachable" };
  }
}

export async function runRevenueCatPurchaseCommunications(limit = 20) {
  const apiKey = process.env.RG_COACH_RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RG_COACH_RESEND_FROM?.trim() ?? "";
  if (!apiKey || !from) return { ok: false, configured: false, claimed: 0, sent: 0, failed: 0 };

  const deliveries = await claimRevenueCatPurchaseDeliveries(limit);
  const result = { ok: true, configured: true, claimed: deliveries.length, sent: 0, failed: 0 };
  for (const delivery of deliveries) {
    const outcome = await send(delivery, apiKey, from);
    await markRevenueCatPurchaseDelivery({
      id: delivery.id,
      status: outcome.ok ? "sent" : "failed",
      providerMessageId: outcome.ok ? outcome.id : null,
      error: outcome.ok ? null : outcome.error,
      attemptCount: delivery.attemptCount,
    });
    if (outcome.ok) result.sent += 1;
    else result.failed += 1;
  }
  result.ok = result.failed === 0;
  return result;
}
