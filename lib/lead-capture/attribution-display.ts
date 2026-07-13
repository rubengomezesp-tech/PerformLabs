import type { CoachInquiryAttribution } from "@/lib/lead-capture/coach-inquiry";

export type AttributionDisplayRow = {
  label: string;
  value: string;
  opaque?: boolean;
};

/** Complete, compact campaign context for the access-controlled coach CRM. */
export function coachInquiryAttributionRows(
  attribution: CoachInquiryAttribution,
): AttributionDisplayRow[] {
  return [
    { label: "Canal", value: [attribution.utmSource, attribution.utmMedium].filter(Boolean).join(" / ") },
    { label: "Campaña", value: attribution.utmCampaign },
    { label: "ID campaña", value: attribution.utmId },
    { label: "Grupo de anuncios", value: attribution.utmAdgroup },
    { label: "Palabra clave", value: attribution.utmTerm },
    { label: "Contenido / anuncio", value: attribution.utmContent },
    { label: "Coincidencia", value: attribution.utmMatchtype },
    { label: "Dispositivo", value: attribution.utmDevice },
    { label: "Red", value: attribution.utmNetwork },
    { label: "GCLID", value: attribution.gclid, opaque: true },
    { label: "GBRAID", value: attribution.gbraid, opaque: true },
    { label: "WBRAID", value: attribution.wbraid, opaque: true },
    { label: "FBCLID", value: attribution.fbclid, opaque: true },
    { label: "Landing", value: attribution.landingPath },
    { label: "Referente", value: attribution.referrerHost },
  ].filter((row) => Boolean(row.value));
}
