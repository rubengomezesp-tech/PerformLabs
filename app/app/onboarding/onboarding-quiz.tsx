"use client";

import { useState } from "react";
import {
  Activity,
  Apple,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  Home,
  Scale,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { saveMemberOnboardingAction } from "./actions";

type Choice = { value: string; label: string; hint?: string };

type Answers = {
  sex: string;
  ageRange: string;
  ageExact: string;
  heightCm: string;
  weightKg: string;
  weightUnknown: boolean;
  goal: string;
  trainingLocation: string;
  equipment: string[];
  experienceLevel: string;
  daysPerWeek: string;
  sessionMinutes: string;
  injuries: string[];
  injuriesOther: string;
  healthConditions: string[];
  healthOther: string;
  dietStyle: string[];
  allergies: string[];
  allergiesOther: string;
  mealsPerDay: string;
  fullName: string;
  notes: string;
};

const initialAnswers: Answers = {
  sex: "",
  ageRange: "",
  ageExact: "",
  heightCm: "",
  weightKg: "",
  weightUnknown: false,
  goal: "",
  trainingLocation: "",
  equipment: [],
  experienceLevel: "",
  daysPerWeek: "",
  sessionMinutes: "60",
  injuries: [],
  injuriesOther: "",
  healthConditions: [],
  healthOther: "",
  dietStyle: [],
  allergies: [],
  allergiesOther: "",
  mealsPerDay: "",
  fullName: "",
  notes: "",
};

const sexOptions: Choice[] = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
  { value: "na", label: "Prefiero no decirlo" },
];

const ageRanges: Choice[] = [
  { value: "18-24", label: "18 – 24" },
  { value: "25-34", label: "25 – 34" },
  { value: "35-44", label: "35 – 44" },
  { value: "45-54", label: "45 – 54" },
  { value: "55-64", label: "55 – 64" },
  { value: "65+", label: "65 o más" },
];

const goalOptions: Choice[] = [
  { value: "Definicion", label: "Perder grasa", hint: "Definición, bajar % graso" },
  { value: "Volumen", label: "Ganar músculo", hint: "Volumen y fuerza" },
  { value: "Recomposicion", label: "Recomposición", hint: "Perder grasa y ganar músculo" },
  { value: "Rendimiento", label: "Rendimiento", hint: "Más fuerte y atlético" },
  { value: "Salud", label: "Salud y forma", hint: "Sentirme bien y constante" },
];

const locationOptions: Choice[] = [
  { value: "gym", label: "Gimnasio", hint: "Máquinas y peso libre" },
  { value: "home", label: "En casa", hint: "Material limitado o peso corporal" },
  { value: "outdoor", label: "Exterior", hint: "Calistenia, parque, aire libre" },
];

const equipmentOptions: Choice[] = [
  { value: "Mancuernas", label: "Mancuernas" },
  { value: "Barra y discos", label: "Barra y discos" },
  { value: "Bandas elásticas", label: "Bandas elásticas" },
  { value: "Kettlebells", label: "Kettlebells" },
  { value: "Banco", label: "Banco" },
  { value: "Barra de dominadas", label: "Barra de dominadas" },
  { value: "Peso corporal", label: "Solo peso corporal" },
  { value: "Bici/Cinta", label: "Bici o cinta" },
];

const experienceOptions: Choice[] = [
  { value: "Principiante", label: "Principiante", hint: "Menos de 1 año entrenando" },
  { value: "Intermedio", label: "Intermedio", hint: "1 – 3 años constante" },
  { value: "Avanzado", label: "Avanzado", hint: "+3 años, buena técnica" },
];

const daysOptions: Choice[] = [
  { value: "3", label: "3 días" },
  { value: "4", label: "4 días" },
  { value: "5", label: "5 días" },
  { value: "6", label: "6 días" },
  { value: "7", label: "7 días" },
];

const injuryOptions: Choice[] = [
  { value: "Ninguna", label: "Ninguna" },
  { value: "Hombro", label: "Hombro" },
  { value: "Rodilla", label: "Rodilla" },
  { value: "Lumbar", label: "Lumbar / espalda baja" },
  { value: "Codo", label: "Codo" },
  { value: "Cadera", label: "Cadera" },
  { value: "Muñeca", label: "Muñeca" },
  { value: "Tobillo", label: "Tobillo" },
  { value: "Cuello", label: "Cuello" },
];

const healthOptions: Choice[] = [
  { value: "Ninguna", label: "Ninguna" },
  { value: "Hipertensión", label: "Hipertensión" },
  { value: "Diabetes", label: "Diabetes" },
  { value: "Problema cardíaco", label: "Problema cardíaco" },
  { value: "Asma", label: "Asma" },
  { value: "Colesterol alto", label: "Colesterol alto" },
  { value: "Tiroides", label: "Tiroides" },
  { value: "Embarazo / postparto", label: "Embarazo / postparto" },
];

const dietOptions: Choice[] = [
  { value: "Sin restricciones", label: "Sin restricciones" },
  { value: "Vegetariana", label: "Vegetariana" },
  { value: "Vegana", label: "Vegana" },
  { value: "Pescetariana", label: "Pescetariana" },
  { value: "Sin gluten", label: "Sin gluten" },
  { value: "Sin lactosa", label: "Sin lactosa" },
  { value: "Halal", label: "Halal" },
  { value: "Keto", label: "Keto / baja en carbos" },
];

const allergyOptions: Choice[] = [
  { value: "Ninguna", label: "Ninguna" },
  { value: "Frutos secos", label: "Frutos secos" },
  { value: "Lactosa", label: "Lactosa" },
  { value: "Gluten", label: "Gluten" },
  { value: "Marisco", label: "Marisco" },
  { value: "Huevo", label: "Huevo" },
  { value: "Soja", label: "Soja" },
];

const mealsOptions: Choice[] = [
  { value: "3", label: "3 comidas" },
  { value: "4", label: "4 comidas" },
  { value: "5", label: "5 comidas" },
];

function SingleSelect({ options, value, onChange }: { options: Choice[]; value: string; onChange: (next: string) => void }) {
  return (
    <div className="quizOptions">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={`quizOption${value === option.value ? " selected" : ""}`}
          onClick={() => onChange(option.value)}
        >
          <span className="quizOptionLabel">{option.label}</span>
          {option.hint ? <span className="quizOptionHint">{option.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({
  options,
  values,
  onChange,
  exclusiveValue,
}: {
  options: Choice[];
  values: string[];
  onChange: (next: string[]) => void;
  exclusiveValue?: string;
}) {
  function toggle(value: string) {
    if (exclusiveValue && value === exclusiveValue) {
      onChange(values.includes(value) ? [] : [value]);
      return;
    }
    const withoutExclusive = values.filter((item) => item !== exclusiveValue);
    onChange(
      withoutExclusive.includes(value)
        ? withoutExclusive.filter((item) => item !== value)
        : [...withoutExclusive, value],
    );
  }

  return (
    <div className="quizOptions">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={`quizOption${values.includes(option.value) ? " selected" : ""}`}
          onClick={() => toggle(option.value)}
        >
          <span className="quizOptionLabel">{option.label}</span>
          {option.hint ? <span className="quizOptionHint">{option.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

function ageToBirthDate(answers: Answers): string {
  let age: number | null = null;
  const exact = Number.parseInt(answers.ageExact, 10);
  if (Number.isFinite(exact) && exact >= 12 && exact <= 99) {
    age = exact;
  } else if (answers.ageRange === "65+") {
    age = 68;
  } else if (answers.ageRange) {
    const [low, high] = answers.ageRange.split("-").map((part) => Number.parseInt(part, 10));
    if (Number.isFinite(low) && Number.isFinite(high)) age = Math.round((low + high) / 2);
  }
  if (age === null) return "";
  return `${new Date().getFullYear() - age}-01-01`;
}

function joinList(values: string[], other: string, strip: string[] = []) {
  const base = values.filter((value) => !strip.includes(value));
  const extra = other.split(",").map((item) => item.trim()).filter(Boolean);
  return [...base, ...extra].join(", ");
}

/** Maps quiz answers to the exact field names the onboarding action reads. */
function buildFormValues(answers: Answers): Record<string, string> {
  const diet = answers.dietStyle.filter((value) => value !== "Sin restricciones");
  return {
    sex: answers.sex === "na" ? "" : answers.sex,
    birthDate: ageToBirthDate(answers),
    height: answers.heightCm.trim(),
    weight: answers.weightUnknown ? "" : answers.weightKg.trim(),
    goal: answers.goal,
    trainingLocation: answers.trainingLocation,
    availableEquipment: answers.equipment.join(", "),
    experienceLevel: answers.experienceLevel,
    daysPerWeek: answers.daysPerWeek,
    sessionMinutes: answers.sessionMinutes || "60",
    injuries: joinList(answers.injuries, answers.injuriesOther, ["Ninguna"]),
    healthConditions: joinList(answers.healthConditions, answers.healthOther, ["Ninguna"]),
    dietStyle: diet.length ? diet.join(", ") : "Flexible",
    allergies: joinList(answers.allergies, answers.allergiesOther, ["Ninguna"]),
    mealsPerDay: answers.mealsPerDay || "4",
    // Sensible defaults for fields the coach can still refine later.
    timezone: "Europe/Madrid",
    cardioPreference: "Caminar",
    activityLevel: "1.55",
    sleepHours: "",
    stepsTarget: "8000",
    preferredTrainingDays: "",
    preferredFoods: "",
    dislikedFoods: "",
    cookingTimeMinutes: "20",
    budgetLevel: "Medio",
  };
}

type Screen = {
  key: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  valid: boolean;
  content: React.ReactNode;
};

export function OnboardingQuiz({ workspaceId, appName }: { workspaceId: string; appName: string }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState(0);

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const ageValid = (() => {
    const exact = Number.parseInt(answers.ageExact, 10);
    return (Number.isFinite(exact) && exact >= 12 && exact <= 99) || answers.ageRange !== "";
  })();

  const screens: Screen[] = [
    {
      key: "sex",
      icon: UserRound,
      title: "¿Cuál es tu sexo?",
      subtitle: "Ajusta calorías, cargas y referencias de progreso.",
      valid: answers.sex !== "",
      content: <SingleSelect options={sexOptions} value={answers.sex} onChange={(value) => update("sex", value)} />,
    },
    {
      key: "age",
      icon: Target,
      title: "¿Qué edad tienes?",
      subtitle: "Elige un rango o escribe tu edad exacta si la sabes.",
      valid: ageValid,
      content: (
        <>
          <SingleSelect
            options={ageRanges}
            value={answers.ageRange}
            onChange={(value) => setAnswers((prev) => ({ ...prev, ageRange: value, ageExact: "" }))}
          />
          <label className="quizInline">
            O edad exacta
            <input
              type="number"
              min={12}
              max={99}
              value={answers.ageExact}
              placeholder="Ej. 29"
              onChange={(event) => setAnswers((prev) => ({ ...prev, ageExact: event.target.value, ageRange: "" }))}
            />
          </label>
        </>
      ),
    },
    {
      key: "measures",
      icon: Scale,
      title: "Tus medidas",
      subtitle: "Sirven para calcular tus calorías. El peso es opcional si no lo sabes.",
      valid: true,
      content: (
        <div className="quizFields">
          <label>
            Peso actual (kg)
            <input
              type="number"
              min={30}
              max={300}
              value={answers.weightKg}
              disabled={answers.weightUnknown}
              placeholder="Ej. 78"
              onChange={(event) => update("weightKg", event.target.value)}
            />
          </label>
          <label>
            Altura (cm)
            <input
              type="number"
              min={120}
              max={230}
              value={answers.heightCm}
              placeholder="Ej. 178"
              onChange={(event) => update("heightCm", event.target.value)}
            />
          </label>
          <label className="quizCheck">
            <input
              type="checkbox"
              checked={answers.weightUnknown}
              onChange={(event) => update("weightUnknown", event.target.checked)}
            />
            No sé mi peso ahora mismo
          </label>
        </div>
      ),
    },
    {
      key: "goal",
      icon: Target,
      title: "¿Cuál es tu objetivo?",
      subtitle: "Marca la dirección de tu entrenamiento y tu comida.",
      valid: answers.goal !== "",
      content: <SingleSelect options={goalOptions} value={answers.goal} onChange={(value) => update("goal", value)} />,
    },
    {
      key: "location",
      icon: Home,
      title: "¿Dónde vas a entrenar?",
      subtitle: "Es clave: elegimos los ejercicios según tengas gimnasio o entrenes en casa.",
      valid: answers.trainingLocation !== "",
      content: (
        <SingleSelect
          options={locationOptions}
          value={answers.trainingLocation}
          onChange={(value) =>
            setAnswers((prev) => ({
              ...prev,
              trainingLocation: value,
              equipment: prev.equipment.length ? prev.equipment : value === "gym" ? ["Mancuernas", "Barra y discos", "Banco"] : ["Peso corporal"],
            }))
          }
        />
      ),
    },
  ];

  if (answers.trainingLocation !== "gym") {
    screens.push({
      key: "equipment",
      icon: Dumbbell,
      title: "¿Qué material tienes?",
      subtitle: "Marca todo lo que tengas a mano. Con esto adaptamos los ejercicios.",
      valid: answers.equipment.length > 0,
      content: <MultiSelect options={equipmentOptions} values={answers.equipment} onChange={(value) => update("equipment", value)} />,
    });
  }

  screens.push(
    {
      key: "experience",
      icon: Activity,
      title: "¿Cuál es tu nivel?",
      subtitle: "Para ajustar volumen, técnica y progresión.",
      valid: answers.experienceLevel !== "",
      content: <SingleSelect options={experienceOptions} value={answers.experienceLevel} onChange={(value) => update("experienceLevel", value)} />,
    },
    {
      key: "days",
      icon: Activity,
      title: "¿Cuántos días por semana?",
      subtitle: "Sé realista con lo que puedas cumplir cada semana.",
      valid: answers.daysPerWeek !== "",
      content: <SingleSelect options={daysOptions} value={answers.daysPerWeek} onChange={(value) => update("daysPerWeek", value)} />,
    },
    {
      key: "injuries",
      icon: ShieldCheck,
      title: "¿Tienes alguna lesión o molestia?",
      subtitle: "Evitamos ejercicios que te puedan hacer daño.",
      valid: answers.injuries.length > 0 || answers.injuriesOther.trim() !== "",
      content: (
        <>
          <MultiSelect options={injuryOptions} values={answers.injuries} onChange={(value) => update("injuries", value)} exclusiveValue="Ninguna" />
          <label className="quizInline">
            Otra (opcional)
            <input value={answers.injuriesOther} placeholder="Ej. menisco, tendinitis..." onChange={(event) => update("injuriesOther", event.target.value)} />
          </label>
        </>
      ),
    },
    {
      key: "health",
      icon: HeartPulse,
      title: "¿Alguna condición de salud?",
      subtitle: "Importante por seguridad. Tu coach lo revisa antes de activar tu plan.",
      valid: answers.healthConditions.length > 0 || answers.healthOther.trim() !== "",
      content: (
        <>
          <MultiSelect options={healthOptions} values={answers.healthConditions} onChange={(value) => update("healthConditions", value)} exclusiveValue="Ninguna" />
          <label className="quizInline">
            Otra (opcional)
            <input value={answers.healthOther} placeholder="Ej. medicación, condición relevante..." onChange={(event) => update("healthOther", event.target.value)} />
          </label>
        </>
      ),
    },
    {
      key: "diet",
      icon: Apple,
      title: "¿Sigues algún tipo de dieta?",
      subtitle: "Marca todas las que apliquen.",
      valid: answers.dietStyle.length > 0,
      content: <MultiSelect options={dietOptions} values={answers.dietStyle} onChange={(value) => update("dietStyle", value)} exclusiveValue="Sin restricciones" />,
    },
    {
      key: "allergies",
      icon: Apple,
      title: "¿Alergias o intolerancias?",
      subtitle: "No incluiremos estos alimentos en tu plan.",
      valid: answers.allergies.length > 0 || answers.allergiesOther.trim() !== "",
      content: (
        <>
          <MultiSelect options={allergyOptions} values={answers.allergies} onChange={(value) => update("allergies", value)} exclusiveValue="Ninguna" />
          <label className="quizInline">
            Otra (opcional)
            <input value={answers.allergiesOther} placeholder="Ej. fresa, kiwi..." onChange={(event) => update("allergiesOther", event.target.value)} />
          </label>
        </>
      ),
    },
    {
      key: "meals",
      icon: Apple,
      title: "¿Cuántas comidas al día prefieres?",
      subtitle: "Organizamos tus calorías según tu rutina diaria.",
      valid: answers.mealsPerDay !== "",
      content: <SingleSelect options={mealsOptions} value={answers.mealsPerDay} onChange={(value) => update("mealsPerDay", value)} />,
    },
  );

  const formValues = buildFormValues(answers);
  const finalScreen: Screen = {
    key: "final",
    icon: CheckCircle2,
    title: "¡Casi listo!",
    subtitle: "Revisaremos esto para preparar tu entrenamiento y tu comida.",
    valid: true,
    content: (
      <form action={saveMemberOnboardingAction} className="quizFinalForm">
        <input name="workspaceId" type="hidden" value={workspaceId} />
        {Object.entries(formValues).map(([name, value]) => (
          <input key={name} name={name} type="hidden" value={value} />
        ))}
        <label>
          ¿Cómo te llamas? (opcional)
          <input name="fullName" value={answers.fullName} placeholder="Tu nombre" onChange={(event) => update("fullName", event.target.value)} />
        </label>
        <label>
          Algo más que tu coach deba saber (opcional)
          <textarea name="notes" rows={3} value={answers.notes} placeholder="Horarios, trabajo, estrés, lo que te cuesta cumplir..." onChange={(event) => update("notes", event.target.value)} />
        </label>
        <div className="quizSummary">
          <span><strong>Objetivo</strong>{goalOptions.find((option) => option.value === answers.goal)?.label ?? "—"}</span>
          <span><strong>Dónde</strong>{locationOptions.find((option) => option.value === answers.trainingLocation)?.label ?? "—"}</span>
          <span><strong>Días</strong>{answers.daysPerWeek || "—"}/semana</span>
          <span><strong>Nivel</strong>{answers.experienceLevel || "—"}</span>
        </div>
        <button className="btn primary quizSubmit" type="submit">
          Crear mi plan en {appName}
        </button>
      </form>
    ),
  };
  screens.push(finalScreen);

  const safeStep = Math.min(step, screens.length - 1);
  const current = screens[safeStep];
  const Icon = current.icon;
  const isLast = safeStep === screens.length - 1;
  const progress = Math.round(((safeStep + 1) / screens.length) * 100);

  return (
    <div className="onboardingQuiz">
      <div className="quizProgress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="quizStepCount">Paso {safeStep + 1} de {screens.length}</p>

      <div className="quizCard" key={current.key}>
        <span className="quizIcon"><Icon size={22} /></span>
        <h1>{current.title}</h1>
        <p className="quizSubtitle">{current.subtitle}</p>
        {current.content}
      </div>

      <div className="quizNav">
        <button type="button" className="btn ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={safeStep === 0}>
          <ChevronLeft size={16} /> Atrás
        </button>
        {isLast ? null : (
          <button type="button" className="btn primary" onClick={() => setStep((value) => Math.min(screens.length - 1, value + 1))} disabled={!current.valid}>
            Continuar <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
