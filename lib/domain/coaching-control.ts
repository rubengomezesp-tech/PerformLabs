import type { ActivityLevel, NutritionGoal } from "@/lib/domain/nutrition-engine";

export type CoachingSignalCheckin = {
  submittedAt: string;
  weightKg?: number | null;
  waistCm?: number | null;
  trainingAdherence?: string | null;
  nutritionAdherence?: string | null;
};

export type DataConfidence = "high" | "medium" | "low";

export type CoachingSignals = {
  latestCheckinAt: string | null;
  latestCheckinDays: number | null;
  latestWeightKg: number | null;
  latestWaistCm: number | null;
  weightChangeKg: number | null;
  weightChangePercent: number | null;
  trainingAdherence: number | null;
  nutritionAdherence: number | null;
  confidence: DataConfidence;
  confidenceReasons: string[];
  weightReadings14d: number;
};

const DAY_MS = 86_400_000;

function validTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function parseAdherence(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return null;
  const ratio = parsed > 1 ? parsed / 100 : parsed;
  return Math.max(0, Math.min(1, ratio));
}

export function buildCoachingSignals(
  checkins: CoachingSignalCheckin[],
  startingWeightKg: number | null,
  now = Date.now(),
): CoachingSignals {
  const ordered = checkins
    .map((checkin) => ({ ...checkin, time: validTime(checkin.submittedAt) }))
    .filter((checkin): checkin is typeof checkin & { time: number } => checkin.time !== null)
    .sort((left, right) => right.time - left.time);

  const latest = ordered[0] ?? null;
  const latestCheckinDays = latest ? Math.max(0, Math.floor((now - latest.time) / DAY_MS)) : null;
  const latestWithWeight = ordered.find((checkin) => typeof checkin.weightKg === "number") ?? null;
  const latestWithWaist = ordered.find((checkin) => typeof checkin.waistCm === "number") ?? null;
  const newestWeight = latestWithWeight?.weightKg ?? startingWeightKg;
  const fourteenDaysAgo = now - (14 * DAY_MS);
  const weights14d = ordered.filter(
    (checkin) => checkin.time >= fourteenDaysAgo && typeof checkin.weightKg === "number",
  );
  const baselineWeight = weights14d.length > 1
    ? weights14d[weights14d.length - 1]!.weightKg
    : startingWeightKg;
  const canCompare = typeof newestWeight === "number"
    && typeof baselineWeight === "number"
    && newestWeight !== baselineWeight;
  const weightChangeKg = canCompare ? round(newestWeight - baselineWeight, 2) : null;
  const weightChangePercent = canCompare && baselineWeight > 0
    ? round(((newestWeight - baselineWeight) / baselineWeight) * 100, 2)
    : null;
  const latestWithAdherence = ordered.find((checkin) => (
    parseAdherence(checkin.trainingAdherence) !== null
    || parseAdherence(checkin.nutritionAdherence) !== null
  )) ?? null;

  let confidence: DataConfidence = "low";
  const confidenceReasons: string[] = [];
  if (latestCheckinDays !== null && latestCheckinDays <= 7 && weights14d.length >= 2) {
    confidence = "high";
    confidenceReasons.push("checkin_recent", "weight_trend_available");
  } else if (latestCheckinDays !== null && latestCheckinDays <= 14) {
    confidence = "medium";
    confidenceReasons.push("checkin_recent");
    if (weights14d.length < 2) confidenceReasons.push("single_weight_reading");
  } else {
    confidenceReasons.push(latest ? "checkin_outdated" : "no_checkins");
  }

  if (!latestWithAdherence) confidenceReasons.push("no_adherence_reading");

  return {
    latestCheckinAt: latest?.submittedAt ?? null,
    latestCheckinDays,
    latestWeightKg: typeof newestWeight === "number" ? newestWeight : null,
    latestWaistCm: latestWithWaist?.waistCm ?? null,
    weightChangeKg,
    weightChangePercent,
    trainingAdherence: parseAdherence(latestWithAdherence?.trainingAdherence),
    nutritionAdherence: parseAdherence(latestWithAdherence?.nutritionAdherence),
    confidence,
    confidenceReasons,
    weightReadings14d: weights14d.length,
  };
}

export function ageFromBirthDate(value: string | null, now = new Date()): number {
  if (!value) return 35;
  const birth = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return 35;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return Math.max(12, Math.min(90, age));
}

export function normalizeCoachingGoal(value: string | null | undefined): NutritionGoal {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized.includes("maint") || normalized.includes("manten")) return "maintenance";
  if (normalized.includes("gain") || normalized.includes("ganancia limpia")) return "lean_gain";
  if (normalized.includes("masa") || normalized.includes("volumen") || normalized.includes("bulk")) return "gain";
  return "fat_loss";
}

export function normalizeActivityLevel(value: number | null | undefined): ActivityLevel {
  if (!value) return "moderate";
  if (value < 1.3) return "sedentary";
  if (value < 1.5) return "light";
  if (value < 1.7) return "moderate";
  if (value < 1.85) return "active";
  return "athlete";
}
