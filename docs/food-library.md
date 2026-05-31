# Food Library — escalado a miles de alimentos (white-label / base-library)

> Cómo pasamos los **36 alimentos starter hardcoded** a **miles**, compartidos por
> todas las marcas, con el mismo patrón base-library que ya usamos en
> `workout_templates`, `recipes`, `exercises` e `ingredients`.

## TL;DR — el patrón

`food_library_items` ahora admite filas **base-library**: `workspace_id = null` +
`is_base_library = true`. `listFoodLibrary` (en `lib/repositories/food-library.ts`)
las mezcla con las filas propias de cada marca vía
`.or(workspace_id.eq.<ws>,workspace_id.is.null)` — exactamente como
`training-management.ts` / `nutrition-management.ts`. Así un dataset grande se
importa **una vez** y lo hereda toda marca, sin tocar las server actions.

- Los **36 starter** siguen como *fallback* en código: solo se muestran cuando la
  tabla está totalmente vacía (sin filas base ni de marca). Conservan su foto
  generada (`/seed/foods/<slug>.webp`).
- Las filas base son **no borrables** desde un workspace (la UI del coach muestra un
  chip "Base" en vez del botón eliminar; `deleteFoodItem` filtra por `workspace_id`
  y nunca tocaría una fila base). Los miembros sí pueden marcarlas como favoritas y
  hacer quick-add (resuelto en `resolveFood`).

## Las 3 vías para crecer

| Vía | Cuándo | Red | Quién | Volumen |
|-----|--------|-----|-------|---------|
| **1. Seed curado** | Ahora mismo, salto 36→~250 | No | MCP Supabase | 253 alimentos genéricos ES con macros precisas |
| **2. Open Food Facts** | Productos de marca españoles | Sí | Fundador | miles (con foto a veces) |
| **3. USDA / BEDCA** | Genéricos lab-grade | Sí (USDA) / fichero | Fundador | cientos-miles |

> El contenedor de la sesión **no tiene red de salida**. Por eso los importadores
> (vías 2 y 3) los ejecuta el **fundador** en una máquina con red (como ya se hace
> con la program-matrix). Aquí se **construyen y validan** con dry-run; no se corre
> el fetch real desde la sesión.

---

## Paso 0 — Migración (obligatoria, primero)

`supabase/migrations/20260531100000_food_library_base_library.sql` (espeja
`20260531080000_workout_templates_base_library.sql`):

- `workspace_id` → nullable.
- `is_base_library boolean not null default false`.
- Índice parcial `food_library_items_base_idx` (filas base).
- Índice parcial `food_library_items_base_name_idx` (orden por nombre en el merge).
- **Índice único parcial** `food_library_items_base_identity_idx` sobre
  `(lower(name), lower(coalesce(brand,'')), lower(serving_label)) where workspace_id is null`
  — clave natural estable para que seeds/importadores sean **idempotentes** y un
  alimento pueda tener entrada "por 100 g" y "por ración" (p. ej. Plátano 100 g vs
  Plátano 1 unidad). Las filas importadas son todas "100 g", así que en la práctica
  deduplican por nombre+marca.

Aplicar (vía MCP Supabase `apply_migration`, o `supabase db push`):

```sql
-- Contenido del fichero de migración. NO está auto-aplicado.
alter table public.food_library_items alter column workspace_id drop not null;
alter table public.food_library_items add column if not exists is_base_library boolean not null default false;
-- + índices (ver el .sql)
```

No requiere cambios de RLS: las lecturas/escrituras de food van por el **service
client** (RLS habilitado sin políticas públicas), igual que hoy.

---

## Vía 1 — Seed curado (~250) AHORA, sin red

La forma más rápida de saltar 36→~250. Datos en
`scripts/data/food-library-seed.json` (fuente de la verdad) y SQL idempotente
generado en `scripts/data/food-library-seed.sql`.

- **253 alimentos** genéricos comunes en España, macros **por 100 g** (o por la
  ración indicada en `serving_label`), `category` mapeada, `verified = true`,
  `is_base_library = true`, `workspace_id = null`.
- Valores estándar (alineados BEDCA / USDA SR Legacy), spot-checkeados contra
  referencias conocidas (pollo a la plancha 165 kcal/31P; lentejas cocidas
  116/9/20/0.4; AOVE 884; plátano 89/1.1/23/0.3).
- Reparto por categoría: protein 48 · carb 46 · veg 32 · fruit 32 · dairy 27 ·
  snack 23 · fat 23 · drink 12 · other 10.
- Guard **NOT EXISTS** sobre la clave natural base → re-aplicar nunca duplica.

Aplicar **vía MCP Supabase** (`execute_sql` / `apply_migration` con el contenido de
`scripts/data/food-library-seed.sql`). No necesita red ni Node. Requiere el Paso 0
hecho antes (usa `is_base_library` y la clave única).

Para regenerar el `.sql` tras editar el JSON, el bloque generador está documentado
en el commit; el `.sql` es un simple `with v(...) as (values ...) insert ... select
... where not exists (...)` (mismo patrón que `scripts/data/base-recipes.sql`).

---

## Vía 2 — Open Food Facts (productos de marca españoles)

Script: `scripts/import-open-food-facts.mjs` (`pnpm import:foods-off`).

- **Fuente**: OFF API v2 search,
  `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=spain&states_tags_en=nutrition-facts-completed&fields=code,product_name,product_name_es,brands,nutriments,categories_tags,image_small_url,serving_size&page_size=100&page=N&sort_by=unique_scans_n`.
- **Licencia**: Open Database License (**ODbL**) para datos; fotos CC-BY-SA. Solo
  guardamos la URL de la foto OFF (hotlink), no rehospedamos.
- **Mapeo → `food_library_items`**:
  - `name` ← `product_name_es || product_name` (limpio, ≤120).
  - `brand` ← primer valor de `brands` (≤80) o `null`.
  - `protein_g/carbs_g/fat_g` ← `nutriments.{proteins,carbohydrates,fat}_100g`.
  - `calories` ← `nutriments.energy-kcal_100g`; si falta, se deriva 4/4/9.
  - `serving_label` = **"100 g"** siempre (las macros OFF son por 100 g;
    `serving_size` es texto libre poco fiable → solo va al informe dry-run).
  - `category` ← `categories_tags` mapeadas a nuestro enum (reglas por substring,
    orden: dairy→protein→fat→fruit→veg→drink→snack→carb→`other`).
  - `image_url` ← `image_small_url` si es `http…`, si no `null` → **placeholder**.
  - `is_base_library = true`, `workspace_id = null`, `verified = false`
    (crowd-sourced; verificable luego).
- **Se descartan** productos sin los 3 macros, con macros todo-cero y sin kcal, o
  con valores imposibles (>100 g/100 g, kcal>950).
- **Idempotente**: SELECT de las filas base existentes → set por
  `lower(name)+lower(brand)+lower(serving_label)` → solo inserta las nuevas. Chunks
  de 100. No usa `onConflict` (PostgREST no soporta bien el índice de expresión), el
  patrón espeja `seed-nutrition-library.mjs`.

Uso:

```bash
pnpm import:foods-off                      # dry-run, 200 productos (informe JSON)
pnpm import:foods-off -- --limit=500       # dry-run hasta 500
pnpm import:foods-off -- --limit=500 --apply   # escribe (lo corre el fundador, con red)
pnpm import:foods-off -- --pages=20 --apply    # 20 páginas × 100
```

El `--apply` requiere `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` en
`.env.local`. El script identifica al cliente con un User-Agent descriptivo (norma
de OFF).

---

## Vía 3 — USDA FoodData Central (genéricos lab-grade) / BEDCA

Script: `scripts/import-usda-foundation.mjs` (`pnpm import:foods-usda`).

- **Fuente**: FoodData Central, tipos **Foundation** + **SR Legacy** (alimentos
  genéricos de 1 ingrediente, datos de laboratorio). Dos modos:
  1. **API**: `POST https://api.nal.usda.gov/fdc/v1/foods/search` con
     `dataType:["Foundation","SR Legacy"]`, `pageSize` (máx 200), `pageNumber`,
     `api_key` (clave data.gov en `FDC_API_KEY`; `DEMO_KEY` sirve para probar con
     límites bajos).
  2. **FICHERO** (recomendado para carga completa y reproducible, sin rate limits):
     descarga el bulk JSON de Foundation/SR Legacy de
     <https://fdc.nal.usda.gov/download-datasets/> y pásalo con `--file=ruta.json`.
- **Licencia**: USDA FDC es **dominio público** (obra del gobierno de EE. UU., CC0).
- **Mapeo**: macros por `nutrientNumber` **208** (kcal), **203** (proteína), **204**
  (grasa total), **205** (carbohidrato por diferencia), con fallback por nombre;
  soporta ambas formas de respuesta (API `{nutrientNumber,value}` y fichero
  `{nutrient:{number},amount}`). `serving_label = "100 g"`, `brand = null`,
  `verified = true`. Nombres en inglés con un mapa EN→ES para los staples más
  comunes; el resto conserva la descripción USDA (el coach renombra su copia).
- **Se descartan** descripciones procesadas/compuestas (babyfood, fast food,
  restaurant, prepared, with sauce…) e items sin los 3 macros.
- **Idempotente**: misma estrategia que OFF (set de existentes por nombre+marca+
  ración). Como ambos comparten la clave, si el seed curado ya metió "Lentejas
  cocidas (100 g)", USDA no la duplica — **el curado tiene prioridad** por aplicarse
  primero. (Nota: las reglas de categoría difieren un poco entre fuentes —p. ej.
  USDA clasifica legumbres como `protein` y el curado las pone en `carb`—; al
  deduplicar por nombre, gana la entrada que ya exista.)

Uso:

```bash
pnpm import:foods-usda                                         # dry-run (API, 200)
pnpm import:foods-usda -- --limit=400 --apply                  # escribe (API)
pnpm import:foods-usda -- --file=FoodData_foundation.json      # dry-run (fichero)
pnpm import:foods-usda -- --file=FoodData_foundation.json --apply
```

**BEDCA** (Base de Datos Española de Composición de Alimentos, oficial AESAN):
no publica un dataset estático descargable limpio (solo web `bedca.net` + una API
XML algo frágil; existe `pybedca` como cliente). Por eso **priorizamos el seed
curado (vía 1) para los genéricos españoles** —que ya recoge valores tipo BEDCA— y
USDA para ampliar genéricos con datos de laboratorio. Si en el futuro AESAN libera
un export estático, se añade un `--file` adapter aquí mismo.

---

## Imágenes (como MyFitnessPal)

La gran mayoría de alimentos **no tendrán foto** y eso es lo correcto/esperado:

- **Importados** (OFF/USDA): normalmente `image_url = null` → la UI cae al
  **placeholder on-brand** (icono por categoría). OFF aporta foto a algunos.
- **36 curados**: conservan su foto generada `/seed/foods/<slug>.webp`
  (vía `scripts/seed-starter-food-images.mjs` / `generate-product-images.mjs`).
- El coach puede poner su propia `image_url` por alimento (white-label).

No generamos miles de fotos: el placeholder cubre el caso general, igual que las
apps de referencia.

---

## Orden de aplicación recomendado

1. **Migración** `20260531100000_food_library_base_library.sql` (MCP `apply_migration`).
2. **Seed curado** `scripts/data/food-library-seed.sql` (MCP `execute_sql`/`apply_migration`)
   → salto inmediato 36 → ~253, sin red.
3. *(Opcional, lo corre el fundador con red)* **OFF**:
   `pnpm import:foods-off -- --limit=… --apply`.
4. *(Opcional, lo corre el fundador con red/API key o fichero)* **USDA**:
   `pnpm import:foods-usda -- --apply` o `--file=…`.

Todo es idempotente: repetir cualquier paso no duplica filas.

## Mantenimiento / siguiente fase

1. Marcar `verified = true` en lotes OFF que el equipo valide.
2. Traducir nombres USDA restantes EN→ES (ampliar el mapa `NAME_ES`).
3. Filtros/buscador en la consola por categoría/fuente; subir el `.limit(2000)` de
   `listFoodLibrary` a paginación/búsqueda server-side cuando crezca mucho.
4. Posible columna `source`/`source_id` si se quiere trazar procedencia por fila
   (hoy la idempotencia va por la clave natural nombre+marca+ración).
