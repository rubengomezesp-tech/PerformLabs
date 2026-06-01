# Sistema de medios (vídeos + imágenes) — runbook

Objetivo: que **cada superficie tenga medios correctos** (coincidentes con lo que es),
con **defaults de plataforma** y **override por entrenador**. Tres niveles, siempre:

```
override del entrenador  →  default de plataforma  →  placeholder on-brand
```

## Ejercicios

- **Imágenes**: `exercises.image_urls` (de free-exercise-db), servidas por Cloudinary.
- **Vídeo — default de plataforma**: **preview animado** generado desde los 2 fotogramas
  (inicio/fin) que ya trae cada ejercicio. Exacto, sin claves ni storage. Componente:
  `components/exercise-preview.tsx`; se ve en la sesión del miembro (`/app/workouts`).
- **Vídeo — override del entrenador**: tabla `exercise_videos` (`workspace_id`,
  `is_default`, `thumbnail_url`). UI del coach: `/coach/exercises` → "Vídeo". El
  resolutor usa `workspaceVideo?.videoUrl || defaultVideoUrl` y, si no hay, el preview.

## Recetas y alimentos

- **Columna de imagen**: `recipes.image_url` y `food_library_items.image_url`
  (migración `20260531060000_food_library_image_url.sql`).
- **Override del entrenador**: campo de URL en los formularios del coach (foods ✅;
  recetas: pendiente de añadir el campo, misma vía).
- **Default de plataforma**: generación con IA (abajo).
- **Sin imagen**: placeholder on-brand con icono según el plato (`components/recipe-image.tsx`).
  Nunca enseña una foto equivocada.

## Generar las fotos de producto (default de plataforma)

Script reutilizable: `scripts/generate-product-images.mjs` (alias `pnpm media:images`).
Genera fotos **coherentes** (un mismo estilo fotográfico) con Gemini, las sube a un
bucket de Supabase Storage (`product-media`, se autocrea público) y escribe `image_url`.
Solo toca filas **sin** imagen (respeta los overrides del coach).

```bash
# Requiere estas variables en el entorno donde lo ejecutes (local / CI):
export GEMINI_API_KEY=...                 # Google AI Studio
export NEXT_PUBLIC_SUPABASE_URL=...        # proyecto Supabase
export SUPABASE_SERVICE_ROLE_KEY=...       # service role (solo servidor)

# Prueba sin llamar a la API (revisa qué generaría):
pnpm media:images -- --type all --limit 10 --dry-run

# Generación real:
pnpm media:images -- --type all --limit 50
# Flags: --type recipes|foods|all · --limit N · --workspace <uuid> · --dry-run
# Modelo configurable: GEMINI_IMAGE_MODEL (def. gemini-2.5-flash-image)
```

Nota: `GEMINI_API_KEY` en **Vercel** sirve a la app/CI desplegada, no al MCP de una
sesión de agente. Para correr el script en local, exporta las 3 variables como arriba.
Para regenerar una imagen, vacía su `image_url` y vuelve a ejecutar.
