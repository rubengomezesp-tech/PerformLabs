// Pure churn-risk scoring for the coach retention radar. Extracted from
// getRetentionRadar so the heuristic can be reasoned about and table-tested
// without a database. getRetentionRadar gathers the per-member signals from
// Supabase and feeds them here.

export type RetentionTier = "high" | "medium" | "low";

export type RetentionSignals = {
  /** Raw subscription status (case-insensitive). */
  subscriptionStatus: string;
  /** Whole days since the member's last activity, or null if never active. */
  daysSinceActivity: number | null;
  /** Workout sessions logged in the last 14 days. */
  workoutsLast14: number;
  /** Whole days since the last check-in, or null if never. */
  lastCheckinDays: number | null;
  /** Days since the member profile was created. */
  memberAgeDays: number;
  /** Raw onboarding status (case-insensitive), or null. */
  onboardingStatus: string | null;
};

export type RetentionScore = {
  /** 0–100, higher = more likely to churn. */
  riskScore: number;
  tier: RetentionTier;
  reasons: string[];
  recommendedAction: string;
};

export function tierFor(score: number): RetentionTier {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

const ONBOARDING_DONE = ["complete", "completed", "applied", "reviewed"];

export function scoreMemberRetention(signals: RetentionSignals): RetentionScore {
  const status = (signals.subscriptionStatus ?? "").toLowerCase();
  const { daysSinceActivity, workoutsLast14, lastCheckinDays, memberAgeDays } = signals;

  let score = 0;
  const reasons: string[] = [];

  // Inactivity (strongest churn signal)
  if (daysSinceActivity === null || daysSinceActivity >= 14) {
    score += 40;
    reasons.push(daysSinceActivity === null ? "Sin actividad reciente" : `Sin actividad hace ${daysSinceActivity} días`);
  } else if (daysSinceActivity >= 7) {
    score += 25;
    reasons.push(`Sin actividad hace ${daysSinceActivity} días`);
  } else if (daysSinceActivity >= 3) {
    score += 10;
  }

  // Training adherence
  if (memberAgeDays >= 7) {
    if (workoutsLast14 === 0) {
      score += 20;
      reasons.push("0 entrenos en 2 semanas");
    } else if (workoutsLast14 <= 2) {
      score += 10;
      reasons.push(`Solo ${workoutsLast14} entreno(s) en 2 semanas`);
    }
  }

  // Check-in cadence
  if (memberAgeDays >= 14) {
    if (lastCheckinDays === null) {
      score += 15;
      reasons.push("Nunca ha hecho check-in");
    } else if (lastCheckinDays >= 21) {
      score += 15;
      reasons.push(`Check-in atrasado ${lastCheckinDays} días`);
    } else if (lastCheckinDays >= 14) {
      score += 8;
    }
  }

  // Billing
  if (status === "past_due" || status === "unpaid") {
    score += 25;
    reasons.push("Pago pendiente");
  } else if (status === "trialing") {
    score += 5;
  }

  // Onboarding never completed
  if (memberAgeDays >= 7 && signals.onboardingStatus && !ONBOARDING_DONE.includes(signals.onboardingStatus.toLowerCase())) {
    score += 15;
    reasons.push("Onboarding sin completar");
  }

  score = Math.min(100, score);
  const tier = tierFor(score);

  let recommendedAction = "Todo en orden, mantén el contacto.";
  if (status === "past_due" || status === "unpaid") recommendedAction = "Resuelve el pago y contacta hoy.";
  else if (daysSinceActivity === null || daysSinceActivity >= 14) recommendedAction = "Mensaje de reactivación urgente.";
  else if (workoutsLast14 === 0 && memberAgeDays >= 7) recommendedAction = "Pregúntale qué le frena a entrenar.";
  else if (lastCheckinDays !== null && lastCheckinDays >= 21) recommendedAction = "Programa un check-in esta semana.";
  else if (tier === "medium") recommendedAction = "Mándale un mensaje de seguimiento.";

  return { riskScore: score, tier, reasons, recommendedAction };
}
