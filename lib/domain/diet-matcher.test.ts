import { describe, expect, it } from "vitest";
import {
  bucketMeals,
  isHalalLabel,
  isKetoLabel,
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
  it("maps diet styles by restrictiveness (vegan>vegetarian>pescetarian>omnivore) and clamps meals", () => {
    expect(normalizeDietStyle("Vegana")).toBe("vegan");
    expect(normalizeDietStyle("Vegetariana")).toBe("vegetarian");
    expect(normalizeDietStyle("Ovolactovegetariana")).toBe("vegetarian");
    expect(normalizeDietStyle("Pescetariana")).toBe("pescetarian");
    expect(normalizeDietStyle("Pescatarian")).toBe("pescetarian");
    expect(normalizeDietStyle("Flexible")).toBe("omnivore");
    // exclusion chips are NOT a protein-source style: they leave style = omnivore
    expect(normalizeDietStyle("Sin lactosa")).toBe("omnivore");
    expect(normalizeDietStyle("Sin gluten, Halal")).toBe("omnivore");
    // most-restrictive token wins in a multi-select string
    expect(normalizeDietStyle("Pescetariana, Sin gluten, Vegana")).toBe("vegan");
    expect(bucketMeals(2)).toBe(3);
    expect(bucketMeals(4)).toBe(4);
    expect(bucketMeals(9)).toBe(5);
  });
  it("detects halal and keto chips from free text", () => {
    expect(isHalalLabel("Halal")).toBe(true);
    expect(isHalalLabel("Sin restricciones")).toBe(false);
    expect(isKetoLabel("Keto / baja en carbos")).toBe(true);
    expect(isKetoLabel("Cetogenica")).toBe(true);
    expect(isKetoLabel("Vegana")).toBe(false);
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

describe("selectDietTemplate — pescetarian hierarchy", () => {
  const pesce: DietQuizAnswers = { ...base, dietStyle: "pescetarian" };

  it("a pescetarian accepts pescetarian/vegetarian/vegan but not omnivore", () => {
    const templates = [
      tpl("omni", { goalTag: "fat_loss", dietStyle: "omnivore" }),
      tpl("pesce", { goalTag: "fat_loss", dietStyle: "pescetarian" }),
    ];
    expect(selectDietTemplate(pesce, templates).templateId).toBe("pesce");
    // falls through to vegetarian/vegan when no pescetarian plan exists
    expect(
      selectDietTemplate(pesce, [tpl("veg", { goalTag: "fat_loss", dietStyle: "vegetarian" })]).templateId,
    ).toBe("veg");
    // omnivore-only pool is rejected (pescetarian is stricter than omnivore)
    expect(selectDietTemplate(pesce, [tpl("omni", { goalTag: "fat_loss", dietStyle: "omnivore" })]).templateId).toBeNull();
  });

  it("a vegetarian is never served a pescetarian (fish) plan", () => {
    const veggie: DietQuizAnswers = { ...base, dietStyle: "vegetarian" };
    expect(
      selectDietTemplate(veggie, [tpl("pesce", { goalTag: "fat_loss", dietStyle: "pescetarian" })]).templateId,
    ).toBeNull();
  });

  it("an omnivore still prefers the least-restrictive style across the 4-rung hierarchy", () => {
    const templates = [
      tpl("vegan", { goalTag: "fat_loss", dietStyle: "vegan" }),
      tpl("pesce", { goalTag: "fat_loss", dietStyle: "pescetarian" }),
      tpl("omni", { goalTag: "fat_loss", dietStyle: "omnivore" }),
    ];
    expect(selectDietTemplate(base, templates).templateId).toBe("omni");
  });
});

describe("selectDietTemplate — halal exclusion (one-directional)", () => {
  const halal: DietQuizAnswers = { ...base, halal: true };

  it("a halal member only accepts templates tagged halal", () => {
    const templates = [
      tpl("plain", { goalTag: "fat_loss" }),
      tpl("halal", { goalTag: "fat_loss", tags: ["halal"] }),
    ];
    expect(selectDietTemplate(halal, templates).templateId).toBe("halal");
    expect(selectDietTemplate(halal, [tpl("plain", { goalTag: "fat_loss" })]).templateId).toBeNull();
  });

  it("a non-halal member still accepts a halal-tagged plan (no reverse exclusion)", () => {
    expect(selectDietTemplate(base, [tpl("halal", { goalTag: "fat_loss", tags: ["halal"] })]).templateId).toBe("halal");
  });
});

describe("selectDietTemplate — keto macro flag (exact, two-way)", () => {
  const keto: DietQuizAnswers = { ...base, keto: true };

  it("a keto member only gets keto-tagged plans", () => {
    const templates = [
      tpl("standard", { goalTag: "fat_loss" }),
      tpl("keto", { goalTag: "fat_loss", tags: ["keto", "sin-gluten"] }),
    ];
    expect(selectDietTemplate(keto, templates).templateId).toBe("keto");
    expect(selectDietTemplate(keto, [tpl("standard", { goalTag: "fat_loss" })]).templateId).toBeNull();
  });

  it("a non-keto member is never handed a keto plan (wrong macro profile)", () => {
    expect(selectDietTemplate(base, [tpl("keto", { goalTag: "fat_loss", tags: ["keto"] })]).templateId).toBeNull();
  });

  it("keto composes with the style hierarchy (a vegan keto member needs a vegan keto plan)", () => {
    const veganKeto: DietQuizAnswers = { ...base, dietStyle: "vegan", keto: true };
    const templates = [
      tpl("omni-keto", { goalTag: "fat_loss", dietStyle: "omnivore", tags: ["keto"] }),
      tpl("vegan-keto", { goalTag: "fat_loss", dietStyle: "vegan", tags: ["keto"] }),
    ];
    expect(selectDietTemplate(veganKeto, templates).templateId).toBe("vegan-keto");
  });
});
