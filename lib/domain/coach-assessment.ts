export const assessmentAnswerKeys = [
  "primaryGoal",
  "goalWhy",
  "targetTimeline",
  "motivation",
  "trainingExperience",
  "trainingBreak",
  "weeklyAvailability",
  "sessionMinutes",
  "preferredTraining",
  "dislikedTraining",
  "currentPain",
  "painDetails",
  "medicalConditions",
  "medications",
  "medicalRestrictions",
  "chestPain",
  "fainting",
  "uncontrolledBloodPressure",
  "eatingDisorderHistory",
  "averageSleep",
  "stressLevel",
  "dailySteps",
  "workActivity",
  "mealPattern",
  "dayOfEating",
  "foodPreferences",
  "foodAvoidances",
  "allergies",
  "weekendChallenges",
  "alcoholFrequency",
  "waterIntake",
  "dietApproach",
  "bodyWeightKg",
  "waistCm",
  "restingHeartRate",
  "bloodPressure",
  "movementNotes",
] as const;

export type AssessmentAnswerKey = (typeof assessmentAnswerKeys)[number];
export type CoachAssessmentAnswers = Partial<Record<AssessmentAnswerKey, string>>;

const requiredKeys: AssessmentAnswerKey[] = [
  "primaryGoal",
  "goalWhy",
  "motivation",
  "trainingExperience",
  "trainingBreak",
  "weeklyAvailability",
  "sessionMinutes",
  "currentPain",
  "medicalConditions",
  "medications",
  "medicalRestrictions",
  "chestPain",
  "fainting",
  "uncontrolledBloodPressure",
  "eatingDisorderHistory",
  "averageSleep",
  "stressLevel",
  "workActivity",
  "mealPattern",
  "dayOfEating",
  "foodPreferences",
  "foodAvoidances",
  "allergies",
  "dietApproach",
];

export const criticalAssessmentRiskFlags = [
  "chest_pain",
  "fainting",
  "uncontrolled_blood_pressure",
  "medical_restriction",
] as const;

export type AssessmentStatus = "draft" | "complete" | "medical_clearance_required";

function normalized(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isYes(value: unknown) {
  return ["yes", "si", "sí", "true", "1"].includes(normalized(value).toLowerCase());
}

function hasMeaningfulText(value: unknown) {
  const text = normalized(value).toLowerCase();
  return Boolean(text && !["no", "ninguna", "ninguno", "none", "n/a", "na"].includes(text));
}

export function readAssessmentAnswers(input: FormData | Record<string, unknown>): CoachAssessmentAnswers {
  const answers: CoachAssessmentAnswers = {};
  for (const key of assessmentAnswerKeys) {
    const value = input instanceof FormData ? input.get(key) : input[key];
    const text = normalized(value);
    if (text) answers[key] = text;
  }
  return answers;
}

export function calculateAssessmentCompletion(answers: CoachAssessmentAnswers) {
  const completed = requiredKeys.filter((key) => normalized(answers[key])).length;
  return Math.round((completed / requiredKeys.length) * 100);
}

export function calculateAssessmentRiskFlags(answers: CoachAssessmentAnswers) {
  const flags: string[] = [];
  if (isYes(answers.chestPain)) flags.push("chest_pain");
  if (isYes(answers.fainting)) flags.push("fainting");
  if (isYes(answers.uncontrolledBloodPressure)) flags.push("uncontrolled_blood_pressure");
  if (isYes(answers.medicalRestrictions)) flags.push("medical_restriction");
  if (isYes(answers.currentPain)) flags.push("current_pain");
  if (hasMeaningfulText(answers.medicalConditions)) flags.push("medical_condition_review");
  if (hasMeaningfulText(answers.medications)) flags.push("medication_review");
  if (isYes(answers.eatingDisorderHistory)) flags.push("eating_disorder_referral");
  return [...new Set(flags)];
}

export function resolveAssessmentStatus(
  answers: CoachAssessmentAnswers,
  intent: "draft" | "complete",
): AssessmentStatus {
  const flags = calculateAssessmentRiskFlags(answers);
  if (flags.some((flag) => (criticalAssessmentRiskFlags as readonly string[]).includes(flag))) {
    return "medical_clearance_required";
  }
  return intent === "complete" && calculateAssessmentCompletion(answers) === 100 ? "complete" : "draft";
}
