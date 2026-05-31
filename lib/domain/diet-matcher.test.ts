import { describe, expect, it } from "vitest";
import {
  bucketMeals,
  normalizeAllergen,
  normalizeDietStyle,
  normalizeGoal,
  selectDietTemplate,
  type DietMatchTemplate,
  type DietQuizAnswers,
} from "./diet-matcher";

const base: DietQuizAnswers = {
  goal: "fat_loss",
  dietStyle: "omnivore",
  mealsPerDay: 4,
  allergies: [],
};

function tpl(id: string, over: Partial<DietMatchTemplate> = {}): DietMatchTemplate {
  return { id, status: "active", dietStyle: "omnivore", mealsPerDay: 4, ...over };
}

describe("normalizers", () => {
  it("maps Spanish goal labels to canonical tokens", () => {
    expect(normalizeGoal("Definicion")).toBe("fat_loss");
    expect(normalizeGoal("Volumen")).toBe("hypertrophy");
    expect(normalizeGoal("Recomposicion")).toBe("recomposition");
    expect(normalizeGoal("Superavit limpio")).toBe("hypertrophy");
    expect(normalizeGoal("perdida de grasa")).toBe("fat_loss");
  });
  it("maps diet styles (vegan wins over vegetarian) and clamps meals", () => {
    expect(normalizeDietStyle("Vegana")).toBe("vegan");
    expect(normalizeDietStyle("Vegetariana")).toBe("vegetarian");
    expect(normalizeDietStyle("Pescetariana")).toBe("vegetarian");
    expect(normalizeDietStyle("Flexible")).toBe("omnivore");
    expect(bucketMeals(2)).toBe(3);
    expect(bucketMeals(4)).toBe(4);
    expect(bucketMeals(9)).toBe(5);
  });
  it("normalises allergy free-text to canonical tokens", () => {
    expect(normalizeAllergen("Frutos secos")).toBe("frutos-secos");
    expect(normalizeAllergen("Lactosa")).toBe("lactosa");
    expect(normalizeAllergen("Marisco")).toBe("marisco");
    expect(normalizeAllergen("Gluten")).toBe("gluten");
  });
});

describe("selectDietTemplate — soft scoring", () => {
  it("prefers the exact goal + meals match", () => {
    const templates = [
      tpl("cut", { goalTag: "fat_loss", mealsPerDay: 4 }),
      tpl("bulk", { goalTag: "hypertrophy", mealsPerDay: 4 }),
      tpl("cut-5", { goalTag: "fat_loss", mealsPerDay: 5 }),
    ];
    const r = selectDietTemplate(base, templates);
    expect(r.templateId).toBe("cut");
    expect(r.rung).toBe(0);
  });

  it("treats null goal/meals as wildcards", () => {
    const r = selectDietTemplate(base, [tpl("wild", { goalTag: null, mealsPerDay: null })]);
    expect(r.templateId).toBe("wild");
    expect(r.rung).toBe(0);
  });

  it("falls back to meals ±1 when no exact meal count exists", () => {
    const r = selectDietTemplate(base, [tpl("five", { goalTag: "fat_loss", mealsPerDay: 5 })]);
    expect(r.templateId).toBe("five");
    expect(r.rung).toBe(1);
  });

  it("prefers the least-restrictive style when goal/meals tie (omnivore over vegan)", () => {
    const templates = [
      tpl("vegan", { goalTag: "fat_loss", dietStyle: "vegan" }),
      tpl("omni", { goalTag: "fat_loss", dietStyle: "omnivore" }),
    ];
    const r = selectDietTemplate(base, templates);
    expect(r.templateId).toBe("omni");
  });
});

describe("selectDietTemplate — hard exclusions (never relaxed)", () => {
  it("never serves a vegan member an omnivore/vegetarian plan", () => {
    const vegan: DietQuizAnswers = { ...base, dietStyle: "vegan" };
    const templates = [
      tpl("omni", { goalTag: "fat_loss", dietStyle: "omnivore" }),
      tpl("veggie", { goalTag: "fat_loss", dietStyle: "vegetarian" }),
    ];
    expect(selectDietTemplate(vegan, templates).templateId).toBeNull();
  });

  it("a vegetarian accepts vegetarian or vegan, but not omnivore", () => {
    const veggie: DietQuizAnswers = { ...base, dietStyle: "vegetarian" };
    const templates = [
      tpl("omni", { goalTag: "fat_loss", dietStyle: "omnivore" }),
      tpl("vegan", { goalTag: "fat_loss", dietStyle: "vegan" }),
    ];
    expect(selectDietTemplate(veggie, templates).templateId).toBe("vegan");
  });

  it("an omnivore accepts any style", () => {
    const r = selectDietTemplate(base, [tpl("vegan", { goalTag: "fat_loss", dietStyle: "vegan" })]);
    expect(r.templateId).toBe("vegan");
  });

  it("excludes templates whose allergens hit a member allergy", () => {
    const nutFree: DietQuizAnswers = { ...base, allergies: ["Frutos secos"] };
    const templates = [
      tpl("nutty", { goalTag: "fat_loss", allergens: ["frutos-secos"] }),
      tpl("safe", { goalTag: "fat_loss", allergens: ["huevo"] }),
    ];
    expect(selectDietTemplate(nutFree, templates).templateId).toBe("safe");
  });

  it("trusts an explicit sin-<allergen> tag over the allergen union", () => {
    const lactoseFree: DietQuizAnswers = { ...base, allergies: ["Lactosa"] };
    const r = selectDietTemplate(lactoseFree, [
      tpl("ok", { goalTag: "fat_loss", tags: ["sin-lactosa"], allergens: ["lactosa"] }),
    ]);
    expect(r.templateId).toBe("ok");
  });

  it("returns null when nothing safe fits (nutrition stays pending)", () => {
    const nutFree: DietQuizAnswers = { ...base, allergies: ["Frutos secos"] };
    const r = selectDietTemplate(nutFree, [tpl("nutty", { allergens: ["frutos-secos"] })]);
    expect(r.templateId).toBeNull();
    expect(r.rung).toBe(-1);
  });

  it("ignores inactive templates", () => {
    const r = selectDietTemplate(base, [tpl("draft", { status: "draft", goalTag: "fat_loss" })]);
    expect(r.templateId).toBeNull();
  });
});
