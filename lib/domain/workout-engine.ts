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
  blocks: Array<{
    type: "warmup" | "main" | "accessory" | "conditioning" | "mobility";
    minutes: number;
    prescription: string;
  }>;
};

const splitByDays: Record<number, string[]> = {
  1: ["Full body"],
  2: ["Upper body", "Lower body"],
  3: ["Push", "Pull", "Legs"],
  4: ["Upper strength", "Lower strength", "Upper volume", "Lower volume"],
  5: ["Push", "Pull", "Legs", "Upper pump", "Conditioning"],
  6: ["Push", "Pull", "Legs", "Push volume", "Pull volume", "Legs volume"],
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

export function buildWorkoutBlueprint(input: WorkoutGeneratorInput): WorkoutDayBlueprint[] {
  const weeks = clamp(input.weeks, 1, 24);
  const daysPerWeek = clamp(input.daysPerWeek, 1, 6);
  const focuses = splitByDays[daysPerWeek];
  const warmupMinutes = input.sessionMinutes >= 60 ? 10 : 6;
  const mobilityMinutes = input.injuries?.length ? 8 : 4;
  const conditioningMinutes = input.goals.includes("fat_loss") ? 10 : 0;
  const mainMinutes = Math.max(20, input.sessionMinutes - warmupMinutes - mobilityMinutes - conditioningMinutes);

  return Array.from({ length: weeks }).flatMap((_, weekIndex) =>
    focuses.map((focus, dayIndex) => ({
      week: weekIndex + 1,
      day: dayIndex + 1,
      title: `Semana ${weekIndex + 1} - Dia ${dayIndex + 1}`,
      focus,
      blocks: [
        {
          type: "warmup",
          minutes: warmupMinutes,
          prescription: input.location === "home" ? "Movilidad, activacion y series de aproximacion sin maquina" : "Movilidad, activacion y aproximaciones",
        },
        {
          type: "main",
          minutes: mainMinutes,
          prescription: mainPrescription(input),
        },
        {
          type: "mobility",
          minutes: mobilityMinutes,
          prescription: input.injuries?.length ? `Trabajo correctivo evitando: ${input.injuries.join(", ")}` : "Movilidad final y respiracion",
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
