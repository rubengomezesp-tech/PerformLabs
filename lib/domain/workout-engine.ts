import { z } from "zod";

export type WorkoutGoal = "fat_loss" | "hypertrophy" | "strength" | "recomposition" | "mobility";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainingLocation = "home" | "gym" | "outdoor";

export type WorkoutGeneratorInput = {
  goals: WorkoutGoal[];
  weeks: number;
  daysPerWeek: number;
  sessionMinutes: number;
  experience: ExperienceLevel;
  location: TrainingLocation;
  injuries?: string[];
};

export type WorkoutDayBlueprint = {
  week: number;
  day: number;
  title: string;
  focus: string;
  phase?: string;
  intensity?: string;
  blocks: Array<{
    type: "warmup" | "main" | "accessory" | "conditioning" | "mobility";
    minutes: number;
    prescription: string;
  }>;
};

export type PeriodizedWorkoutPlan = {
  title: string;
  summary: string;
  weeks: number;
  daysPerWeek: number;
  phases: Array<{
    month: number;
    title: string;
    weeks: string;
    focus: string;
    progression: string;
  }>;
  days: WorkoutDayBlueprint[];
};

export type WeeklyPeriodizationTarget = {
  week: number;
  phase: string;
  volumeMultiplier: number;
  intensityTarget: string;
  rirTarget: string;
  deload: boolean;
  coachCue: string;
};

export type WorkoutAdjustmentInput = {
  adherenceRate: number;
  painFlags: number;
  performanceTrend: "down" | "flat" | "up";
  recoveryScore: number;
  currentVolumeSets: number;
};

export type WorkoutAdjustment = {
  decision: "progress" | "hold" | "deload" | "regress";
  volumeChangePercent: number;
  nextVolumeSets: number;
  reason: string;
  actions: string[];
};

export const workoutGeneratorSchema = z.object({
  goals: z.array(z.enum(["fat_loss", "hypertrophy", "strength", "recomposition", "mobility"])).min(1).max(3),
  weeks: z.number().int().min(1).max(24),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(30).max(150),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  location: z.enum(["home", "gym", "outdoor"]),
  injuries: z.array(z.string().min(1).max(80)).max(8).optional(),
});

const splitByDays: Record<number, string[]> = {
  1: ["Full body"],
  2: ["Upper body", "Lower body"],
  3: ["Push", "Pull", "Legs"],
  4: ["Upper strength", "Lower strength", "Upper volume", "Lower volume"],
  5: ["Push", "Pull", "Legs", "Upper pump", "Conditioning"],
  6: ["Push", "Pull", "Legs", "Push volume", "Pull volume", "Legs volume"],
  7: ["Push strength", "Pull strength", "Legs strength", "Upper volume", "Lower volume", "Conditioning", "Mobility"],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function mainPrescription(input: WorkoutGeneratorInput) {
  if (input.goals.includes("strength")) {
    return "3-5 ejercicios base, 3-5 series, 3-6 reps, descanso largo";
  }

  if (input.goals.includes("hypertrophy")) {
    return "4-6 ejercicios, 3-4 series, 8-15 reps, descanso medio";
  }

  if (input.goals.includes("fat_loss")) {
    return "Circuitos controlados, superseries y trabajo metabolico sin perder tecnica";
  }

  return "Bloque mixto de fuerza, hipertrofia y control tecnico";
}

function phaseForWeek(week: number) {
  if (week <= 4) {
    return {
      month: 1,
      title: "Base tecnica",
      focus: "Aprender patrones, volumen sostenible y control de tempo",
      progression: "Subir reps antes que carga; RIR 2-3",
      intensity: "RIR 2-3 · tempo controlado",
    };
  }

  if (week <= 8) {
    return {
      month: 2,
      title: "Progresion",
      focus: "Sobrecarga progresiva, mas series efectivas y mejor densidad",
      progression: "Subir carga cuando complete rango alto; RIR 1-2",
      intensity: "RIR 1-2 · descanso medio/alto",
    };
  }

  return {
    month: 3,
    title: "Especializacion",
    focus: "Consolidar fuerza/hipertrofia y cerrar con semana de descarga",
    progression: "Semanas 9-11 fuertes, semana 12 descarga al 65-70%",
    intensity: week === 12 ? "Descarga tecnica · RIR 4" : "RIR 0-2 · top set opcional",
  };
}

export function buildWorkoutBlueprint(input: WorkoutGeneratorInput): WorkoutDayBlueprint[] {
  const parsed = workoutGeneratorSchema.parse(input);
  const weeks = clamp(parsed.weeks, 1, 24);
  const daysPerWeek = clamp(parsed.daysPerWeek, 1, 7);
  const focuses = splitByDays[daysPerWeek];
  const warmupMinutes = parsed.sessionMinutes >= 60 ? 10 : 6;
  const mobilityMinutes = parsed.injuries?.length ? 8 : 4;
  const conditioningMinutes = parsed.goals.includes("fat_loss") ? 10 : 0;
  const mainMinutes = Math.max(20, parsed.sessionMinutes - warmupMinutes - mobilityMinutes - conditioningMinutes);

  return Array.from({ length: weeks }).flatMap((_, weekIndex) =>
    focuses.map((focus, dayIndex) => ({
      week: weekIndex + 1,
      day: dayIndex + 1,
      title: `Semana ${weekIndex + 1} - Dia ${dayIndex + 1}`,
      focus,
      phase: phaseForWeek(weekIndex + 1).title,
      intensity: phaseForWeek(weekIndex + 1).intensity,
      blocks: [
        {
          type: "warmup",
          minutes: warmupMinutes,
          prescription: parsed.location === "home" ? "Movilidad, activacion y series de aproximacion sin maquina" : "Movilidad, activacion y aproximaciones",
        },
        {
          type: "main",
          minutes: mainMinutes,
          prescription: mainPrescription(parsed),
        },
        {
          type: "mobility",
          minutes: mobilityMinutes,
          prescription: parsed.injuries?.length ? `Trabajo correctivo evitando: ${parsed.injuries.join(", ")}` : "Movilidad final y respiracion",
        },
        ...(conditioningMinutes
          ? [
              {
                type: "conditioning" as const,
                minutes: conditioningMinutes,
                prescription: "Finisher de bajo impacto ajustable por nivel",
              },
            ]
          : []),
      ],
    })),
  );
}

export function buildPeriodizedWorkoutPlan(input: WorkoutGeneratorInput): PeriodizedWorkoutPlan {
  const parsed = workoutGeneratorSchema.parse(input);
  const weeks = clamp(parsed.weeks, 4, 12);
  const daysPerWeek = clamp(parsed.daysPerWeek, 1, 7);
  const days = buildWorkoutBlueprint({ ...parsed, weeks, daysPerWeek });

  return {
    title: `${parsed.goals.includes("hypertrophy") ? "Hipertrofia" : parsed.goals.includes("strength") ? "Fuerza" : "Transformacion"} ${weeks} semanas`,
    summary: `${weeks} semanas · ${daysPerWeek} dias/semana · ${parsed.sessionMinutes} min · ${parsed.experience} · ${parsed.location}`,
    weeks,
    daysPerWeek,
    phases: [
      { month: 1, title: "Base tecnica", weeks: "1-4", focus: "Patrones, volumen base y adherencia", progression: "Doble progresion con margen tecnico" },
      { month: 2, title: "Progresion", weeks: "5-8", focus: "Sobrecarga medible y mas series efectivas", progression: "Subir carga o reps cada semana viable" },
      { month: 3, title: "Especializacion", weeks: "9-12", focus: "Bloques fuertes, consolidacion y descarga", progression: "Intensificar 9-11 y descargar en semana 12" },
    ],
    days: days.map((day) => {
      const phase = phaseForWeek(day.week);
      return {
        ...day,
        phase: phase.title,
        intensity: phase.intensity,
        blocks: day.blocks.map((block) => block.type === "main"
          ? { ...block, prescription: `${block.prescription}. ${phase.progression}` }
          : block),
      };
    }),
  };
}

export type WorkoutRotationInput = {
  currentDaysPerWeek: number;
  adherenceRate: number;
  volumeTrend: "down" | "flat" | "up";
  painFlags: number;
};

export function recommendNextQuarterlyModule(input: WorkoutRotationInput) {
  const currentDays = clamp(input.currentDaysPerWeek, 3, 7);
  const shouldDeload = input.painFlags >= 2 || input.adherenceRate < 0.55;
  const canProgress = input.adherenceRate >= 0.85 && input.volumeTrend === "up" && input.painFlags === 0;
  const shouldHold = input.adherenceRate >= 0.65 && input.painFlags <= 1;
  const nextDaysPerWeek = shouldDeload
    ? Math.max(3, currentDays - 1)
    : canProgress
      ? Math.min(7, currentDays + 1)
      : shouldHold
        ? currentDays
        : Math.max(3, currentDays - 1);

  return {
    nextDaysPerWeek,
    decision: shouldDeload ? "deload" : canProgress ? "progress" : shouldHold ? "hold" : "regress",
    reason: shouldDeload
      ? "Baja adherencia o molestias: reducimos carga semanal y priorizamos tecnica."
      : canProgress
        ? "Buena adherencia y volumen subiendo: puede progresar al siguiente modulo."
        : shouldHold
          ? "Progreso estable: repetimos dias/semana con bloque mas avanzado."
          : "Adherencia irregular: simplificamos para recuperar consistencia.",
  };
}

export function buildWeeklyPeriodizationTargets(weeks = 12): WeeklyPeriodizationTarget[] {
  return Array.from({ length: weeks }).map((_, index) => {
    const week = index + 1;
    const phase = phaseForWeek(week);
    const deload = week === 4 || week === 8 || week === 12;
    const volumeMultiplier = deload
      ? 0.7
      : week <= 4
        ? 0.85 + week * 0.04
        : week <= 8
          ? 0.98 + (week - 4) * 0.045
          : 1.08 + (week - 8) * 0.035;

    return {
      week,
      phase: phase.title,
      volumeMultiplier: Number(volumeMultiplier.toFixed(2)),
      intensityTarget: phase.intensity,
      rirTarget: deload ? "RIR 3-4" : week <= 4 ? "RIR 2-3" : week <= 8 ? "RIR 1-2" : "RIR 0-2",
      deload,
      coachCue: deload
        ? "Bajar volumen, limpiar técnica y preparar siguiente bloque."
        : phase.progression,
    };
  });
}

export function estimateTrainingStress(input: {
  daysPerWeek: number;
  sessionMinutes: number;
  experience: ExperienceLevel;
  goal: WorkoutGoal;
}) {
  const experienceFactor = input.experience === "advanced" ? 1.15 : input.experience === "beginner" ? 0.82 : 1;
  const goalFactor = input.goal === "strength" ? 1.12 : input.goal === "fat_loss" ? 1.06 : input.goal === "mobility" ? 0.72 : 1;
  const raw = input.daysPerWeek * input.sessionMinutes * experienceFactor * goalFactor;
  const score = clamp(Math.round(raw / 6), 25, 100);

  return {
    score,
    label: score >= 82 ? "Carga alta" : score >= 62 ? "Carga media-alta" : score >= 42 ? "Carga sostenible" : "Carga ligera",
    recoveryNeed: score >= 82 ? "2-3 estrategias de recuperación/semana" : score >= 62 ? "1-2 días con control de fatiga" : "Recuperación estándar",
  };
}

export function recommendWorkoutAdjustment(input: WorkoutAdjustmentInput): WorkoutAdjustment {
  if (input.painFlags >= 2 || input.recoveryScore < 45) {
    const nextVolumeSets = Math.max(6, Math.round(input.currentVolumeSets * 0.72));
    return {
      decision: "deload",
      volumeChangePercent: -28,
      nextVolumeSets,
      reason: "Molestias o recuperación baja: conviene descargar antes de progresar.",
      actions: ["Reducir series efectivas", "Mantener patrón técnico", "Evitar fallo", "Revisar sueño y dolor en 7 días"],
    };
  }

  if (input.adherenceRate >= 0.85 && input.performanceTrend === "up" && input.recoveryScore >= 70) {
    const nextVolumeSets = Math.round(input.currentVolumeSets * 1.08);
    return {
      decision: "progress",
      volumeChangePercent: 8,
      nextVolumeSets,
      reason: "Alta adherencia, rendimiento subiendo y recuperación suficiente.",
      actions: ["Subir 1 serie en músculos prioritarios", "Mantener RIR objetivo", "Progresar carga si completa rango alto"],
    };
  }

  if (input.adherenceRate < 0.6) {
    const nextVolumeSets = Math.max(6, Math.round(input.currentVolumeSets * 0.85));
    return {
      decision: "regress",
      volumeChangePercent: -15,
      nextVolumeSets,
      reason: "Adherencia baja: el plan debe ser más ejecutable antes de ser más duro.",
      actions: ["Reducir días o volumen", "Priorizar básicos", "Eliminar técnicas avanzadas temporalmente"],
    };
  }

  return {
    decision: "hold",
    volumeChangePercent: 0,
    nextVolumeSets: input.currentVolumeSets,
    reason: "Progreso estable: mantener y observar la siguiente semana.",
    actions: ["Mantener volumen", "Buscar mejora técnica", "Revisar reps y cargas antes de cambiar programa"],
  };
}
