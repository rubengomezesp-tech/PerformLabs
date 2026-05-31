# Diet types — model + macro profiles

> How PerformLabs extends the nutrition engine beyond `omnivora`/`vegetariana` to
> cover the eight diet styles the onboarding quiz already offers
> (`app/app/onboarding/onboarding-quiz.tsx`): **Sin restricciones, Vegetariana,
> Vegana, Pescetariana, Sin gluten, Sin lactosa, Halal, Keto**.
>
> Companion to `lib/domain/diet-matcher.ts` (matching logic),
> `scripts/data/diet-types.sql` (idempotent seed), and `docs/nutrition-engine.md`.

## TL;DR — three orthogonal dimensions

A member's nutrition is **not** one enum. The quiz lets a member pick several diet
chips at once (`dietStyle: string[]`, multi-select), so the engine treats diet
choice as **three independent dimensions** that compose:

| Dimension | What it controls | Types | How it is enforced |
|-----------|------------------|-------|--------------------|
| **STYLE** (protein-source hierarchy) | which animal proteins are allowed | omnivore ⊃ pescetarian ⊃ vegetarian ⊃ vegan | hard filter `styleOk` (a plan must be *no less restrictive* than the member) |
| **EXCLUSION** (`sin-<x>` / cert tags) | a single ingredient family removed, orthogonal to style | gluten-free, dairy-free, **halal** | hard filter `allergiesOk` + `halalOk` (template must carry the `sin-<x>` / `halal` tag) |
| **MACRO** (calorie split) | fat/carb ratio, independent of goal | **keto** | hard filter `ketoOk` (exact match) + `protein_ratio`/`fat_ratio` on the template feeding `calculateNutritionTargets` |

This keeps the existing two-layer matcher (hard exclusions → soft goal/meals score)
intact: STYLE and EXCLUSION were already exclusion filters; keto adds one more hard
dimension plus a macro profile on the template. Nothing about
`calculateNutritionTargets` changes except which template ratios it reads.

---

## Per-type mapping

### STYLE dimension — the restrictiveness hierarchy

A pescetarian eats "like an ovo-lacto-vegetarian **plus** fish and shellfish"
([Healthline](https://www.healthline.com/nutrition/pescatarian-diet),
[Wikipedia](https://en.wikipedia.org/wiki/Pescetarianism)). So fish is *more*
permissive than vegetarian but *less* than full omnivore. The hierarchy and its
rank (higher = stricter; a stricter plan is safe for a more permissive member):

```
omnivore (0)  ⊃  pescetarian (1)  ⊃  vegetarian (2)  ⊃  vegan (3)
```

| Quiz label | `diet_style` | Accepts plans of style | Notes |
|------------|--------------|------------------------|-------|
| Sin restricciones | `omnivore` | any | default |
| Pescetariana | `pescetarian` | pescetarian, vegetarian, vegan | **new** rank between omnivore and vegetarian |
| Vegetariana | `vegetarian` | vegetarian, vegan | unchanged |
| Vegana | `vegan` | vegan | unchanged; still gated on recipe coverage |

`styleOk(template, need)` keeps its existing rule: `RANK[template] >= RANK[need]`.
A vegetarian is **not** served a pescetarian plan (it contains fish); a pescetarian
**is** served a vegetarian or vegan plan.

### EXCLUSION dimension — orthogonal `sin-<x>` / certification tags

These do not change the protein hierarchy; they remove one ingredient family and can
combine with any style. The matcher already supports `sin-<x>` via `allergiesOk`
(trusts an explicit `sin-<allergen>` tag on the template).

| Quiz label | Model | Tag the template must carry | Canonical exclusion | Source |
|------------|-------|-----------------------------|---------------------|--------|
| Sin gluten | exclusion | `sin-gluten` | gluten (wheat, barley, rye + malt/derivatives) | [Wikipedia](https://en.wikipedia.org/wiki/Gluten-free_diet), [Cleveland Clinic](https://health.clevelandclinic.org/diagnosed-with-celiac-disease-how-and-why-to-follow-a-gluten-free-diet) |
| Sin lactosa | exclusion | `sin-lactosa` | lactosa / dairy (milk, cheese, yogurt) | [Healthline](https://www.healthline.com/nutrition/lactose-free-diet), [MGH](https://www.massgeneral.org/children/nutrition/lactose-free-v-dairy-free-how-to-tell-the-difference) |
| Halal | exclusion (positive cert) | `halal` | pork + alcohol (+ blood, non-zabiha meat) | [Wikipedia: Islamic dietary laws](https://en.wikipedia.org/wiki/Islamic_dietary_laws), [Halal Foundation](https://halalfoundation.org/what-can-muslim-not-eat/) |

**Halal is modelled as a *positive* certification tag, not a `sin-<x>` exclusion**,
because "halal" asserts a property (no pork, no alcohol, permissible slaughter)
rather than removing a named allergen. Practically, none of the 24 base recipes
contain pork or alcohol — the proteins are chicken, turkey, lean beef, fish,
shellfish, eggs and dairy — so every current recipe is halal-compatible **as a
recipe**. (Strict *zabiha* slaughter of the meat is a sourcing/labelling concern the
coach handles, not something the engine can assert; we tag the recipes that are
intrinsically halal-safe.) Most scholars treat all seafood as halal, with some
differing on shellfish — we keep shellfish in, matching the majority view and the
quiz's own framing.

### MACRO dimension — keto

Keto is **not** a protein-source style and **not** an allergen; it is a
macronutrient split that is independent of the cut/bulk/recomp goal. Canonical
profile from the literature: very-low-carb, high-fat.

| Macro | Typical keto range | Value we seed |
|-------|--------------------|---------------|
| Fat | 60–75% of kcal (research diets 70–80%) | **`fat_ratio = 0.70`** |
| Protein | 20–25% of kcal (~1.6 g/kg) | `protein_ratio = 0.18` → `proteinPerKg = 1.8` |
| Carbs | 5–10% of kcal, **≤ 50 g/day** (often ≤ 30 g) | remainder (≈ 5–10%), capped by recipe selection |

Sources: [Harvard Nutrition Source](https://nutritionsource.hsph.harvard.edu/healthy-weight/diet-reviews/ketogenic-diet/),
[StatPearls / NCBI](https://www.ncbi.nlm.nih.gov/books/NBK499830/),
[MyKetoCal](https://www.myketocal.com/keto-blog/ketogenic-ratios-explained/).

How it flows: `assignDietTemplateToMember` already reads `protein_ratio` (×10 →
`proteinPerKg`) and `fat_ratio` and passes them to `calculateNutritionTargets`; carbs
are the remainder. A keto template = `fat_ratio 0.70` + `protein_ratio 0.18`, so the
engine derives carbs ≈ the small leftover automatically — **no engine code change**.
Keto matching is an **exact** flag, not a hierarchy: a keto member must only get keto
plans, and a non-keto member must never be handed a keto plan (it is a macro profile
they did not ask for). One nuance worth flagging: `nutritionTargetSchema` currently
clamps `fatRatio` to `[0.15, 0.40]` and `assignDietTemplateToMember` clamps
`proteinPerKg` to `[1.2, 3]` — see "Risk: fatRatio clamp" below. Keto needs the
fatRatio ceiling raised to ≥ 0.70 to render its real split; until then the engine
silently caps a keto plan at 40% fat. The matcher/templates are correct regardless;
this is an engine follow-up.

---

## Buildable from the current 24 base recipes?

Coverage measured live against `recipes` (is_base_library) — recipes per `meal_slot`
that satisfy each type (6 recipes per slot):

| Type | desayuno | comida | cena | snack | Buildable now? |
|------|:-:|:-:|:-:|:-:|----------------|
| omnivore (existing) | 6 | 6 | 6 | 6 | yes |
| vegetarian (existing) | 4 | 1 | 1 | 5 | yes (already seeded) |
| **pescetarian** | 4 | 3 | 5 | 5 | **yes** — ≥1 (in fact ≥3) every slot |
| **halal** | 6 | 6 | 6 | 6 | **yes** — no pork/alcohol anywhere |
| **dairy-free (sin-lactosa)** | 1 | 5 | 4 | 1 | **thin** — ≥1 every slot, but only 1 desayuno + 1 snack; add 2 recipes for variety |
| **gluten-free (sin-gluten)** | **0** | 4 | 4 | 4 | **no** — 0 tagged gluten-free breakfasts; needs ≥1 desayuno |
| **keto** | 0 | 0 | 0 | 0 | **no** — lowest-carb base recipe is 23% carbs; needs new low-carb recipes |
| **vegana** | **0** | 1 | **0** | 1 | **no** — 0 vegan desayuno + 0 vegan cena (already noted in diet-matrix.sql) |

### New recipes authored (`scripts/data/extra-recipes.json`)

To unblock keto, gluten-free, dairy-free and vegana, we add **9 recipes**:

- **Keto (4, one per slot)** — `keto` + `sin-gluten` + `sin-lactosa` tags, carbs ≤ ~10%:
  - desayuno: huevos revueltos con aguacate y salmón (eggs + avocado + smoked salmon + olive oil)
  - comida: salmón con aguacate y espinacas salteadas
  - cena: pollo al horno con brócoli y aceite de oliva (very low carb)
  - snack: huevos cocidos con aguacate y nueces
- **Vegan desayuno + cena (2)** — `vegana`/`vegetariana` + `sin-lactosa`, also unblocks the vegan template:
  - desayuno: porridge vegano de avena, bebida de soja y plátano
  - cena: tofu salteado con quinoa y verduras
- **Gluten-free desayuno (1)** — `sin-gluten` + `vegetariana`:
  - desayuno: bowl de yogur griego con frutos rojos y semillas (no oats/bread; dairy present so not dairy-free)
- **Dairy-free desayuno + snack (2)** — `sin-lactosa` (+ `vegana` where it fits):
  - desayuno: revuelto de tofu con espinacas y tomate
  - snack: batido vegano de proteína, plátano y bebida de soja

### New ingredients required (`scripts/data/diet-types.sql`, step a)

Keto/vegan need fats and plant proteins absent from the 40-item palette. Already
present and reused: `aguacate`, `huevo-entero`, `clara-de-huevo`, `salmon`,
`aceite-de-oliva`, `nueces`, `almendras`, `espinacas`, `brocoli`, `pechuga-de-pollo`,
`tomate`, `frutos-rojos`, `platano`, `proteina-whey-polvo`, `quinoa-cocida`,
`yogur-griego-natural`, `calabacin`, `pimiento`. New (per 100 g, USDA-ish):

| slug | name | kcal | P | C | F | allergens | why |
|------|------|-----:|--:|--:|--:|-----------|-----|
| `salmon-ahumado` | Salmón ahumado | 117 | 18 | 0 | 4.3 | pescado | keto desayuno |
| `tofu-firme` | Tofu firme | 144 | 17 | 2.8 | 9 | soja | vegan protein |
| `bebida-de-soja` | Bebida de soja | 43 | 3.3 | 1.8 | 1.8 | soja | vegan milk |
| `proteina-vegetal-polvo` | Proteína vegetal (polvo) | 375 | 78 | 6 | 5 | soja | vegan shake |
| `semillas-de-chia` | Semillas de chía | 486 | 17 | 42 | 31 | — | GF/vegan topping (small grams) |
| `aceite-de-coco` | Aceite de coco | 862 | 0 | 0 | 100 | — | optional keto fat |

(`aceite-de-coco` is seeded for completeness/MCT but the keto recipes lean on olive
oil + avocado + eggs, so it is optional. `semillas-de-chia` is high-carb per 100 g
but used at 10–15 g.)

All new recipes keep an `image_prompt` (Gemini offline this run — images are seeded
as `/seed/recipes/<slug>.webp` placeholders, generated later by the media pipeline).

---

## The full base-library template matrix after this change

`diet-matrix.sql` seeds omnivore × {definicion,volumen,recomp} and vegetarian × same
(6 templates). `diet-types.sql` adds, with ratios feeding `calculateNutritionTargets`:

| Style / profile | goals | protein_ratio (→ g/kg) | fat_ratio | carbs | extra tag |
|-----------------|-------|------------------------|-----------|-------|-----------|
| pescetarian | 3 | 0.24 / 0.20 / 0.22 | 0.25 / 0.27 / 0.26 | remainder | — |
| gluten-free (omnivore base) | 3 | same as omnivore | same | remainder | `sin-gluten` |
| dairy-free (omnivore base) | 3 | same as omnivore | same | remainder | `sin-lactosa` |
| halal (omnivore base) | 3 | same as omnivore | same | remainder | `halal` |
| **keto** | 3 | **0.18 (→1.8 g/kg)** | **0.70** | **≈5–10%** | `keto`,`sin-gluten`,`sin-lactosa` |
| vegan | 3 | 0.20 / 0.18 / 0.19 | 0.27 / 0.28 / 0.27 | remainder | `vegana` |

= **18 new templates** (6 styles/profiles × 3 goals). Combined with the existing 6 →
24 base diet templates. `diet_template_meals` is populated from style/tag-compatible
recipes (≤ 2 per slot), exactly like `diet-matrix.sql`.

> **Combination caveat (documented, not auto-built):** the quiz allows e.g.
> "Pescetariana + Sin gluten + Keto" simultaneously. We seed each dimension's base
> templates, not the full cross-product (that would be dozens of near-empty
> templates with no recipes to fill them). The matcher picks the best single
> template per the hard filters; when a member stacks dimensions with no matching
> template, `selectDietTemplate` returns `null` and the member's nutrition stays
> *pending* for the coach — the existing, safe fallback. Expanding to combinations is
> a future recipe-authoring effort, not an engine change.
