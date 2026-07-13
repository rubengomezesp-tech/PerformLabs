import { describe, expect, it } from "vitest";
import { coachInquiryAttributionSchema } from "./coach-inquiry";
import { coachInquiryAttributionRows } from "./attribution-display";

describe("coachInquiryAttributionRows", () => {
  it("exposes every campaign dimension and available click identifier to the coach CRM", () => {
    const attribution = coachInquiryAttributionSchema.parse({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "miami-search",
      utmContent: "rsa-1",
      utmTerm: "personal trainer brickell",
      utmId: "21098765432",
      utmMatchtype: "e",
      utmDevice: "m",
      utmNetwork: "g",
      utmAdgroup: "brickell-exact",
      gclid: "gclid-123",
      gbraid: "gbraid-456",
      wbraid: "wbraid-789",
      fbclid: "fbclid-012",
      landingPath: "/entrenador-personal-brickell-miami",
      referrerHost: "google.com",
    });

    const rows = coachInquiryAttributionRows(attribution);
    expect(Object.fromEntries(rows.map((row) => [row.label, row.value]))).toEqual({
      Canal: "google / cpc",
      Campaña: "miami-search",
      "ID campaña": "21098765432",
      "Grupo de anuncios": "brickell-exact",
      "Palabra clave": "personal trainer brickell",
      "Contenido / anuncio": "rsa-1",
      Coincidencia: "e",
      Dispositivo: "m",
      Red: "g",
      GCLID: "gclid-123",
      GBRAID: "gbraid-456",
      WBRAID: "wbraid-789",
      FBCLID: "fbclid-012",
      Landing: "/entrenador-personal-brickell-miami",
      Referente: "google.com",
    });
    expect(rows.filter((row) => row.opaque).map((row) => row.label)).toEqual([
      "GCLID", "GBRAID", "WBRAID", "FBCLID",
    ]);
  });

  it("omits empty attribution values for legacy/direct leads", () => {
    expect(coachInquiryAttributionRows(coachInquiryAttributionSchema.parse({}))).toEqual([]);
  });
});
