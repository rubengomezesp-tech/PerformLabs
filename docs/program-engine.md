# Motor de programas (quiz → plantilla → render)

> Objetivo: que al registrarse, el **quiz** del cliente determine de forma
> determinista la **plantilla de entrenamiento** correcta dentro de una matriz
> MacroActive-style, y que esa elección **renderice por toda la app** (entreno +
> nutrición coherente) **sin código de render nuevo**.

## La matriz (taxonomía)

`objetivo × sexo × lugar × días/semana (3-7) × minutos (30/60) × duración(meses/90d) × día 1..N`

| Dimensión | Valores canónicos | Dónde vive |
|---|---|---|
| objetivo | `fat_loss · hypertrophy · strength · recomposition · mobility` | `workout_templates.goal_tag` (**nuevo**) |
| sexo | `male · female · any` | `workout_templates.target_sex` (**nuevo**, default `any`) |
| lugar | `gym · home · outdoor` | `workout_templates.location` (**nuevo**, null=comodín) |
| días/semana | 3-7 | `workout_templates.days_per_week` (existente) |
| minutos | bucket `30 · 60` | `workout_templates.session_minutes` (**nuevo**) |
| duración | 12 sem ≈ 90 días | `workout_templates.duration_weeks` (existente) |
| equipo | set | `workout_templates.required_equipment[]` (**nuevo**) |
| día 1..N | filas | `workout_template_days` + `workout_template_exercises` (existente) |

Migración: `20260531070000_workout_template_matching_tags.sql` (aditiva, con backfill
de `goal_tag` y `target_sex` desde el nombre/goal existentes; índice de filtrado).

## El quiz (ya recoge todo)

`app/app/onboarding/onboarding-quiz.tsx` ya pregunta sexo, edad, medidas, actividad,
objetivo, lugar, equipo, experiencia, días/semana, minutos/sesión, lesiones, salud,
sueño/pasos y preferencias de dieta. Se guarda en `member_profiles`,
`member_fitness_preferences`, `member_diet_preferences`, `member_onboarding_responses`.
**No faltan preguntas; faltaba normalizar** las etiquetas ES → tokens canónicos.

`QuizAnswers` (entrada del matcher): `{ sex, goal, place, daysPerWeek, sessionMinutes,
experience, equipment[] }`. Normalizadores ES→canónico en `lib/domain/program-matcher.ts`
(`normalizeGoal`: Definicion→fat_loss, Volumen→hypertrophy, Recomposicion→recomposition,
Rendimiento→strength, Salud→mobility; `bucketMinutes`: ≤45→30, resto→60).

## El algoritmo — `selectProgram(quiz, templates)`

Función **pura y testeada** (`lib/domain/program-matcher.ts`, 8 tests):
1. **Filtro duro** (escalera de fallback): sexo → lugar → días → minutos → equipo.
   Campos `null`/`any` de la plantilla son comodín. Si el escalón queda vacío, se
   relaja una restricción (minutos → sexo → lugar → solo días → días ±1).
2. **Score blando** dentro del pool: objetivo (100), nivel (30), minutos (15),
   sexo (12), lugar (10); penaliza días ±1.
3. Devuelve `{ templateId, score, rung }`; `null` si nada encaja → el cliente queda
   "pendiente" para el coach (igual que hoy).

## El render (se reutiliza tal cual)

El `templateId` elegido entra en el camino ya construido:
`assignWorkoutTemplateToMember` → `materializeWorkoutAssignment` (copia días/ejercicios
a `assigned_workout_*`, resuelve el vídeo override del coach) → el cliente lo lee con
`getMemberTrainingContext`. **Cero código de render nuevo.**

**Nutrición coherente (casi gratis):** `calculateNutritionTargets` (Mifflin-St Jeor ×
actividad × ajuste de objetivo) ya convierte `{sexo, edad, altura, peso, actividad,
objetivo}` en kcal+macros y `assignDietTemplateToMember` los persiste. Basta enrutar el
**mismo objetivo canónico** del matcher a la nutrición para que un programa `fat_loss`
empareje con déficit.

## Estado y siguientes pasos

- ✅ **Fase 0** — columnas de matching + backfill + índice (migración aplicada a prod).
- ✅ **Fase 1** — `program-matcher.ts` (algoritmo puro + normalizadores) + tests.
- ⏭️ **Fase 2 (wiring)** — sustituir `findQuarterlyTemplate` por `selectProgram` en
  `assignQuarterlyWorkoutModule` (`lib/repositories/member-onboarding.ts:382`), pasando
  los `QuizAnswers` normalizados; mantener el lookup por días como último escalón.
- ⏭️ **Fase 3 (contenido)** — **el verdadero gran lift**: poblar la matriz de plantillas
  (variantes male/female × 30/60 × objetivos × días) para que los filtros duros tengan
  filas que acertar. El código ya está; falta el catálogo (como se hizo con las recetas:
  autoría asistida por agentes + builder de entreno existente).
