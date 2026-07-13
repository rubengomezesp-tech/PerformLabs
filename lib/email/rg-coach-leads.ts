import type { PublicCoachInquiry } from "@/lib/lead-capture/coach-inquiry";
import { coachInquirySource, diagnosticAnswerLabel } from "@/lib/lead-capture/coach-inquiry";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";
import { RG_COACH_WORKSPACE_ID } from "@/lib/workspace-brand-assets";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RG_EMAIL_LOGO_URL = "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-lockup-horizontal-white-1024.png";
const RG_EMAIL_SIGNATURE_URL = "https://miembros.rubengomezcoaching.com/brand/rg-coach/ruben-gomez-signature-white-512.png";
const RG_WHATSAPP_NUMBER = "16452482325";
const DEFAULT_LEADS_TO = "rubengomezesp@gmail.com";

type EmailMessage = {
  subject: string;
  html: string;
  text: string;
};

export type RgCoachLeadEmailDelivery = {
  configured: boolean;
  confirmation: "sent" | "failed" | "skipped";
  notification: "sent" | "failed" | "skipped";
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailAddress(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}

function safeLine(value: string, max = 120) {
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function whatsappUrl(number: string, message: string) {
  const digits = phoneDigits(number);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "";
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:9px 0;color:#7f8ca3;font-size:11px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;border-bottom:1px solid #182338">${escapeHtml(label)}</td>
    <td align="right" style="padding:9px 0;color:#f8fafc;font-size:13px;font-weight:700;border-bottom:1px solid #182338">${escapeHtml(value || "—")}</td>
  </tr>`;
}

function rgEmailShell(input: {
  preheader: string;
  eyebrow: string;
  title: string;
  introHtml: string;
  detailRows: string;
  ctaLabel: string;
  ctaUrl: string;
  coachMessage: string;
  footer: string;
}) {
  const cta = input.ctaUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px"><tr><td bgcolor="#2f6bff" style="background:#2f6bff;border-radius:12px;mso-padding-alt:15px 22px"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:15px 22px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:.2px">${escapeHtml(input.ctaLabel)}&nbsp;&nbsp;→</a></td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(input.title)}</title>
  <style>@media only screen and (max-width:620px){.rg-shell{padding:20px 10px!important}.rg-card{border-radius:18px!important}.rg-main{padding:30px 23px 26px!important}.rg-title{font-size:31px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#eef2f8;color:#f8fafc;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eef2f8" style="width:100%;background:#eef2f8">
    <tr><td class="rg-shell" align="center" style="padding:42px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px">
        <tr><td align="center" style="padding:0 0 14px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:2px">RG COACH · MIAMI + ONLINE</td></tr>
        <tr><td class="rg-card" bgcolor="#050914" style="background:#050914;border:1px solid #182338;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(5,9,20,.18)">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td width="68%" height="5" bgcolor="#2f6bff" style="height:5px;background:#2f6bff;font-size:0;line-height:0">&nbsp;</td><td width="32%" height="5" bgcolor="#00d4ff" style="height:5px;background:#00d4ff;font-size:0;line-height:0">&nbsp;</td></tr>
            <tr><td class="rg-main" colspan="2" style="padding:38px 44px 34px">
              <img src="${RG_EMAIL_LOGO_URL}" width="270" alt="Rubén Gómez Coaching" style="display:block;width:270px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none">
              <div style="margin-top:34px;color:#00d4ff;font-size:11px;font-weight:800;letter-spacing:1.8px">${escapeHtml(input.eyebrow)}</div>
              <h1 class="rg-title" style="margin:10px 0 14px;color:#ffffff;font-size:38px;line-height:1.08;letter-spacing:-1.2px">${escapeHtml(input.title)}</h1>
              <div style="color:#a9b4c7;font-size:16px;line-height:1.65">${input.introHtml}</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px">${input.detailRows}</table>
              ${cta}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px"><tr><td bgcolor="#0b1323" style="background:#0b1323;border-left:3px solid #00d4ff;border-radius:0 12px 12px 0;padding:18px 20px">
                <div style="color:#00d4ff;font-size:10px;font-weight:800;letter-spacing:1.4px">UN MENSAJE DE RUBÉN</div>
                <p style="margin:9px 0 0;color:#d7deea;font-size:14px;line-height:1.6">${escapeHtml(input.coachMessage)}</p>
                <img src="${RG_EMAIL_SIGNATURE_URL}" width="176" alt="Firma de Rubén Gómez" style="display:block;width:176px;max-width:55%;height:auto;margin-top:14px;border:0;outline:none;text-decoration:none">
                <p style="margin:10px 0 0;color:#ffffff;font-size:13px;font-weight:700">Rubén Gómez · RG Coach</p>
              </td></tr></table>
            </td></tr>
            <tr><td colspan="2" bgcolor="#080d19" style="background:#080d19;border-top:1px solid #182338;padding:20px 44px 24px"><p style="margin:0;color:#758198;font-size:12px;line-height:1.6">${escapeHtml(input.footer)}</p></td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:18px 20px 0;color:#7b8799;font-size:11px;line-height:1.5">RG Coach · Entrenamiento personal en Miami y online<br><a href="https://rubengomezcoaching.com" style="color:#64748b;text-decoration:underline">rubengomezcoaching.com</a></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildRgCoachLeadConfirmation(inquiry: PublicCoachInquiry): EmailMessage {
  const english = inquiry.locale === "en";
  const firstName = safeLine(inquiry.fullName.split(/\s+/)[0] || inquiry.fullName, 50);
  const goal = diagnosticAnswerLabel("goal", inquiry.answers.goal, inquiry.locale);
  const format = diagnosticAnswerLabel("place", inquiry.answers.place, inquiry.locale);
  const areaValue = inquiry.answers.place === "online" ? "online" : inquiry.answers.area;
  const area = diagnosticAnswerLabel("area", areaValue, inquiry.locale);
  const ctaUrl = whatsappUrl(
    RG_WHATSAPP_NUMBER,
    english
      ? `Hi Rubén, I just sent my RG diagnostic. My name is ${firstName}.`
      : `Hola Rubén, acabo de enviar mi diagnóstico RG. Soy ${firstName}.`,
  );
  const title = english ? "Your route is with Rubén." : "Tu ruta ya está con Rubén.";
  const intro = english
    ? `Hi ${escapeHtml(firstName)}. Your request has been saved securely. Rubén will review your goal and contact you personally with availability and the best way to start.`
    : `Hola ${escapeHtml(firstName)}. Tu solicitud se ha guardado correctamente. Rubén revisará tu objetivo y te responderá personalmente con disponibilidad y la mejor forma de empezar.`;

  return {
    subject: english ? "Rubén received your RG diagnostic" : "Rubén recibió tu diagnóstico RG",
    html: rgEmailShell({
      preheader: english ? "Your request is saved and Rubén will review it personally." : "Tu solicitud está guardada y Rubén la revisará personalmente.",
      eyebrow: english ? "DIAGNOSTIC RECEIVED" : "DIAGNÓSTICO RECIBIDO",
      title,
      introHtml: `<p style="margin:0">${intro}</p>`,
      detailRows: [
        row(english ? "Goal" : "Objetivo", goal),
        row(english ? "Format" : "Modalidad", format),
        row(english ? "Area" : "Zona", area),
      ].join(""),
      ctaLabel: english ? "CONTINUE ON WHATSAPP" : "CONTINUAR POR WHATSAPP",
      ctaUrl,
      coachMessage: english
        ? "I’ll review your answers personally and get back to you with a clear next step."
        : "Revisaré tus respuestas personalmente y te escribiré con un siguiente paso claro.",
      footer: english
        ? "You received this email because you asked RG Coach to contact you about your diagnostic."
        : "Recibes este correo porque pediste que RG Coach te contactara sobre tu diagnóstico.",
    }),
    text: english
      ? `Hi ${firstName},\n\nRubén received your RG diagnostic.\nGoal: ${goal}\nFormat: ${format}\nArea: ${area}\n\nRubén will review it personally and get back to you.\n\nContinue on WhatsApp: ${ctaUrl}`
      : `Hola ${firstName},\n\nRubén recibió tu diagnóstico RG.\nObjetivo: ${goal}\nModalidad: ${format}\nZona: ${area}\n\nRubén lo revisará personalmente y te responderá.\n\nContinuar por WhatsApp: ${ctaUrl}`,
  };
}

export function buildRgCoachLeadNotification(inquiry: PublicCoachInquiry): EmailMessage {
  const name = safeLine(inquiry.fullName, 80);
  const goal = diagnosticAnswerLabel("goal", inquiry.answers.goal, "es");
  const format = diagnosticAnswerLabel("place", inquiry.answers.place, "es");
  const areaValue = inquiry.answers.place === "online" ? "online" : inquiry.answers.area;
  const area = diagnosticAnswerLabel("area", areaValue, "es");
  const source = safeLine(coachInquirySource(inquiry.attribution), 120);
  const campaign = safeLine(inquiry.attribution.utmCampaign, 120);
  const campaignId = safeLine(inquiry.attribution.utmId, 120);
  const adgroup = safeLine(inquiry.attribution.utmAdgroup, 120);
  const term = safeLine(inquiry.attribution.utmTerm, 120);
  const matchtype = safeLine(inquiry.attribution.utmMatchtype, 120);
  const deviceNetwork = [
    safeLine(inquiry.attribution.utmDevice, 120),
    safeLine(inquiry.attribution.utmNetwork, 120),
  ].filter(Boolean).join(" · ");
  // Campaign context helps Rubén prioritize the lead. Opaque click IDs stay in
  // the access-controlled CRM and are intentionally excluded from email.
  const campaignRows = [
    ["Campaña", campaign],
    ["ID campaña", campaignId],
    ["Grupo", adgroup],
    ["Palabra clave", term],
    ["Coincidencia", matchtype],
    ["Dispositivo / red", deviceNetwork],
  ].filter((entry) => entry[1]).map(([label, value]) => row(label, value)).join("");
  const campaignText = [
    campaign ? `Campaña: ${campaign}` : "",
    campaignId ? `ID campaña: ${campaignId}` : "",
    adgroup ? `Grupo: ${adgroup}` : "",
    term ? `Palabra clave: ${term}` : "",
    matchtype ? `Coincidencia: ${matchtype}` : "",
    deviceNetwork ? `Dispositivo / red: ${deviceNetwork}` : "",
  ].filter(Boolean).join("\n");
  const contactUrl = inquiry.phone
    ? whatsappUrl(inquiry.phone, `Hola ${name}, soy Rubén de RG Coach. He revisado tu diagnóstico.`)
    : `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent("Tu diagnóstico RG Coach")}`;

  return {
    subject: `Nuevo diagnóstico · ${name} · ${area}`,
    html: rgEmailShell({
      preheader: `${name} acaba de enviar un diagnóstico desde ${source}.`,
      eyebrow: "NUEVA OPORTUNIDAD",
      title: "Nuevo diagnóstico recibido.",
      introHtml: `<p style="margin:0"><strong style="color:#ffffff">${escapeHtml(name)}</strong> acaba de completar la ruta RG. El lead ya está guardado en el panel del coach.</p>`,
      detailRows: [
        row("Objetivo", goal),
        row("Modalidad", format),
        row("Zona", area),
        row("Sesiones", diagnosticAnswerLabel("sessions", inquiry.answers.sessions, "es")),
        row("Horario", diagnosticAnswerLabel("schedule", inquiry.answers.schedule, "es")),
        row("Nivel", diagnosticAnswerLabel("level", inquiry.answers.level, "es")),
        row("Bloqueo", diagnosticAnswerLabel("obstacle", inquiry.answers.obstacle, "es")),
        row("Fuente", source),
        campaignRows,
        row("Contacto", inquiry.phone || inquiry.email),
      ].join(""),
      ctaLabel: inquiry.phone ? "RESPONDER POR WHATSAPP" : "RESPONDER POR EMAIL",
      ctaUrl: contactUrl,
      coachMessage: "Responde mientras la intención está fresca y deja la próxima acción registrada en el panel.",
      footer: `Referencia de envío: ${inquiry.submissionId}`,
    }),
    text: `Nuevo diagnóstico RG\n\nNombre: ${name}\nEmail: ${inquiry.email}\nTeléfono: ${inquiry.phone || "—"}\nObjetivo: ${goal}\nModalidad: ${format}\nZona: ${area}\nSesiones: ${inquiry.answers.sessions}\nHorario: ${inquiry.answers.schedule}\nNivel: ${inquiry.answers.level}\nBloqueo: ${inquiry.answers.obstacle}\nFuente: ${source}${campaignText ? `\n${campaignText}` : ""}\nReferencia: ${inquiry.submissionId}\n\nResponder: ${contactUrl}`,
  };
}

async function sendResendMessage(input: {
  apiKey: string;
  from: string;
  to: string;
  replyTo: string;
  message: EmailMessage;
  tag: "lead_confirmation" | "lead_notification";
}) {
  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "rg-coach-lead-capture/1.0",
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        reply_to: input.replyTo || undefined,
        subject: input.message.subject,
        html: input.message.html,
        text: input.message.text,
        tags: [
          { name: "workspace", value: "rg-coach" },
          { name: "message_type", value: input.tag },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error("RG lead email provider rejected a message", { type: input.tag, status: response.status });
      return false;
    }
    return true;
  } catch {
    console.error("RG lead email provider was unreachable", { type: input.tag });
    return false;
  }
}

/** Best-effort transactional delivery. A provider failure never rolls back the lead. */
export async function sendRgCoachLeadEmails(input: {
  workspace: WorkspaceBrand;
  inquiry: PublicCoachInquiry;
}): Promise<RgCoachLeadEmailDelivery> {
  if (input.workspace.id !== RG_COACH_WORKSPACE_ID) {
    return { configured: false, confirmation: "skipped", notification: "skipped" };
  }

  const apiKey = process.env.RG_COACH_RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RG_COACH_RESEND_FROM?.trim() ?? "";
  const leadsTo = emailAddress(process.env.RG_COACH_LEADS_TO) || DEFAULT_LEADS_TO;
  if (!apiKey || !from) {
    return { configured: false, confirmation: "skipped", notification: "skipped" };
  }

  const confirmation = buildRgCoachLeadConfirmation(input.inquiry);
  const notification = buildRgCoachLeadNotification(input.inquiry);
  const [confirmationSent, notificationSent] = await Promise.all([
    sendResendMessage({
      apiKey,
      from,
      to: input.inquiry.email,
      replyTo: leadsTo,
      message: confirmation,
      tag: "lead_confirmation",
    }),
    sendResendMessage({
      apiKey,
      from,
      to: leadsTo,
      replyTo: input.inquiry.email,
      message: notification,
      tag: "lead_notification",
    }),
  ]);

  return {
    configured: true,
    confirmation: confirmationSent ? "sent" : "failed",
    notification: notificationSent ? "sent" : "failed",
  };
}
