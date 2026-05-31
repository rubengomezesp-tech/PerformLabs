import { describe, expect, it } from "vitest";
import {
  bucketMinutes,
  normalizeGoal,
  normalizeLevel,
  selectProgram,
  type MatchTemplate,
  type QuizAnswers,
} from "./program-matcher";

const base: QuizAnswers = {
  sex: "male",
  goal: "hypertrophy",
  place: "gym",
  daysPerWeek: 5,
  sessionMinutes: 60,
  experience: "intermediate",
  equipment: [],
};

function tpl(id: string, over: Partial<MatchTemplate> = {}): MatchTemplate {
  return { id, status: "active", daysPerWeek: 5, ...over };
}

describe("normalizers", () => {
  it("maps Spanish goal labels to canonical tokens", () => {
    expect(normalizeGoal("Definicion")).toBe("fat_loss");
    expect(normalizeGoal("Volumen")).toBe("hypertrophy");
    expect(normalizeGoal("Recomposicion")).toBe("recomposition");
    expect(normalizeGoal("Rendimiento")).toBe("strength");
    expect(normalizeGoal("Salud")).toBe("mobility");
    expect(normalizeGoal("hypertrophy")).toBe("hypertrophy");
  });
  it("maps levels and buckets minutes", () => {
    expect(normalizeLevel("Avanzado")).toBe("advanced");
    expect(normalizeLevel("Principiante")).toBe("beginner");
    expect(bucketMinutes(30)).toBe(30);
    expect(bucketMinutes(45)).toBe(30);
    expect(bucketMinutes(60)).toBe(60);
    expect(bucketMinutes(90)).toBe(60);
  });
});

describe("selectProgram", () => {
  it("prefers the exact goal/sex/place/days/minutes match", () => {
    const templates = [
      tpl("a", { goalTag: "fat_loss", targetSex: "male", location: "gym", sessionMinutes: 60, level: "intermediate" }),
      tpl("b", { goalTag: "hypertrophy", targetSex: "male", location: "gym", sessionMinutes: 60, level: "intermediate" }),
      tpl("c", { goalTag: "hypertrophy", targetSex: "female", location: "gym", sessionMinutes: 60 }),
    ];
    const r = selectProgram(base, templates);
    expect(r.templateId).toBe("b");
    expect(r.rung).toBe(0);
  });

  it("treats null sex/location/minutes as wildcards", () => {
    const templates = [tpl("wild", { goalTag: "hypertrophy" })];
    const r = selectProgram(base, templates);
    expect(r.templateId).toBe("wild");
    expect(r.rung).toBe(0);
  });

  it("hard-filters out the wrong number of days, then falls back to ±1", () => {
    const templates = [
      tpl("six", { daysPerWeek: 6, goalTag: "hypertrophy" }),
      tpl("four", { daysPerWeek: 4, goalTag: "fat_loss" }),
    ];
    const r = selectProgram(base, templates); // wants 5 days; none exact
    expect(["six", "four"]).toContain(r.templateId);
    expect(r.rung).toBe(5); // matched only on the ±1 days rung
  });

  it("respects required equipment for home templates", () => {
    const home: QuizAnswers = { ...base, place: "home", equipment: ["Mancuernas"] };
    const templates = [
      tpl("needs-barbell", { location: "home", requiredEquipment: ["Barra y discos"], goalTag: "hypertrophy" }),
      tpl("needs-dumbbells", { location: "home", requiredEquipment: ["Mancuernas"], goalTag: "hypertrophy" }),
    ];
    const r = selectProgram(home, templates);
    expect(r.templateId).toBe("needs-dumbbells");
  });

  it("returns null when nothing fits (member stays pending)", () => {
    const r = selectProgram(base, [tpl("x", { daysPerWeek: 2 })]);
    expect(r.templateId).toBeNull();
    expect(r.rung).toBe(-1);
  });

  it("ignores inactive templates", () => {
    const r = selectProgram(base, [tpl("draft", { status: "draft", goalTag: "hypertrophy" })]);
    expect(r.templateId).toBeNull();
  });
});
