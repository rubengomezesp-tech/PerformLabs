import { describe, expect, it } from "vitest";
import { pairPhotosByAngle, type PhotoCheckin } from "./photo-consents";

function checkin(id: string, photos: Array<{ path: string; angle: "frontal" | "lateral" | "espalda" | null }>): PhotoCheckin {
  return {
    id,
    submittedAt: "2026-07-01T10:00:00Z",
    weightKg: 80,
    photos: photos.map((photo, index) => ({ path: photo.path, url: `https://signed/${id}/${index}`, angle: photo.angle })),
  };
}

describe("pairPhotosByAngle (comparador antes/después)", () => {
  it("empareja por ángulo, nunca frontal contra lateral", () => {
    const before = checkin("a", [
      { path: "1-frontal-0.jpg", angle: "frontal" },
      { path: "1-lateral-1.jpg", angle: "lateral" },
    ]);
    const after = checkin("b", [
      { path: "2-lateral-0.jpg", angle: "lateral" },
      { path: "2-frontal-1.jpg", angle: "frontal" },
    ]);
    const pairs = pairPhotosByAngle(before, after);
    expect(pairs.map((pair) => pair.angle)).toEqual(["frontal", "lateral"]);
    expect(pairs[0].beforeUrl).toContain("/a/0");
    expect(pairs[0].afterUrl).toContain("/b/1");
  });

  it("ángulo presente solo en un lado: no se empareja", () => {
    const before = checkin("a", [{ path: "1-frontal-0.jpg", angle: "frontal" }]);
    const after = checkin("b", [{ path: "2-espalda-0.jpg", angle: "espalda" }]);
    expect(pairPhotosByAngle(before, after)).toEqual([]);
  });

  it("fotos legacy sin etiqueta: fallback por posición", () => {
    const before = checkin("a", [{ path: "1-0.jpg", angle: null }, { path: "1-1.jpg", angle: null }]);
    const after = checkin("b", [{ path: "2-0.jpg", angle: null }]);
    const pairs = pairPhotosByAngle(before, after);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].angle).toBe("sin etiqueta");
  });
});
