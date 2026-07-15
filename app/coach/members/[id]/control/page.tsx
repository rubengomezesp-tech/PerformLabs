import { ArrowLeft, ClipboardCheck, Dumbbell, History, LockKeyhole, Salad, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoachingControlForm, type CoachingControlDefaults } from "@/components/coach/coaching-control-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Topbar } from "@/components/topbar";
import { calculateNutritionTargets } from "@/lib/domain/nutrition-engine";
import { getLocale } from "@/lib/i18n/server";
import { getCoachingControlDictionary } from "@/lib/i18n/coaching-control";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachMemberControlSnapshot } from "@/lib/repositories/coaching-control";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; scope?: string }>;
};

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function CoachMemberControlPage({ params, searchParams }: Props) {
  const [{ id: rawId }, query, locale, brand] = await Promise.all([params, searchParams, getLocale(), getSelectedMemberAppBrand()]);
  const memberId = decodeURIComponent(rawId);
  const snapshot = await getCoachMemberControlSnapshot(brand.id, memberId);
  if (!snapshot) notFound();
  const t = getCoachingControlDictionary(locale);
  const latest = snapshot.history[0] ?? null;
  const weightKg = snapshot.signals.latestWeightKg ?? snapshot.member.startingWeightKg ?? 75;
  const heightCm = snapshot.member.heightCm ?? 175;
  const goal = latest?.goal ?? (snapshot.member.goal.toLowerCase().includes("manten") ? "maintenance" : "fat_loss");
  const trainingDays = latest?.trainingDaysPerWeek
    ?? snapshot.workoutPlan?.daysPerWeek
    ?? snapshot.preferences.daysPerWeek
    ?? snapshot.onboarding?.trainingDaysPerWeek
    ?? 4;
  const base = calculateNutritionTargets({
    gender: snapshot.member.sex,
    age: snapshot.member.age,
    heightCm,
    weightKg,
    activityLevel: snapshot.member.activityLevel,
    goal,
    proteinPerKg: 2.1,
    fatRatio: 0.25,
    mealsPerDay: snapshot.mealPlan?.mealsPerDay ?? snapshot.onboarding?.mealsPerDay ?? 4,
    trainingDaysPerWeek: trainingDays,
  });
  const currentCalories = latest?.targetCalories ?? snapshot.mealPlan?.targetCalories ?? base.targetCalories;
  const defaults: CoachingControlDefaults = {
    goal,
    gender: snapshot.member.sex,
    age: snapshot.member.age,
    heightCm,
    weightKg,
    activityLevel: snapshot.member.activityLevel,
    proteinPerKg: 2.1,
    fatRatioPercent: 25,
    mealsPerDay: snapshot.mealPlan?.mealsPerDay ?? snapshot.onboarding?.mealsPerDay ?? 4,
    calorieOffset: Math.max(-750, Math.min(750, currentCalories - base.targetCalories)),
    trainingDaysPerWeek: trainingDays,
    dailyStepsTarget: latest?.dailyStepsTarget ?? snapshot.preferences.dailyStepsTarget ?? 8000,
    currentTrainingWeek: latest?.currentTrainingWeek ?? snapshot.workoutPlan?.currentWeek ?? 1,
    effectiveOn: addDays(0),
    nextReviewOn: latest?.nextReviewOn || snapshot.assessment?.nextReviewOn || snapshot.workoutPlan?.nextReviewOn || snapshot.mealPlan?.nextReviewOn || addDays(7),
    rationale: latest?.status === "draft" ? latest.rationale : "",
    memberMessage: latest?.status === "draft" ? latest.memberMessage : "",
  };
  const confidence = snapshot.signals.confidence;
  const dateLocale = locale === "en" ? "en-US" : "es-ES";

  return <>
    <Topbar
      eyebrow={t.eyebrow}
      title={`${t.title} · ${snapshot.member.fullName}`}
      text={t.subtitle}
      actions={<><LocaleSwitcher current={locale} label={t.language} changeLabel={t.changeLanguage} supportedLocales={["es", "en"]} /><Link className="btn" href={`/coach/members/${memberId}`}><ArrowLeft size={16} />{t.back}</Link></>}
    />

    <section className="controlPrivacyBar"><LockKeyhole aria-hidden="true" size={18} /><div><strong>{t.privateTitle}</strong><p>{t.privateText}</p></div><Link href={`/coach/members/${memberId}/assessment`}><ClipboardCheck size={15} />{t.assessment}</Link></section>

    {query.saved ? <div className={`controlSaved ${query.saved === "published" ? "published" : ""}`} role="status"><ShieldCheck size={19} /><div><strong>{query.saved === "published" ? t.savedPublished : t.savedDraft}</strong>{query.saved === "published" && query.scope === "partial" ? <p>{t.partialPublish}</p> : null}</div></div> : null}

    <nav aria-label="Workflow" className="controlRoute">{t.route.map((step, index) => <span className={index === 0 ? "active" : ""} key={step}>{step}</span>)}</nav>

    <section className="controlReadingPanel">
      <div className="controlReadingHeader"><div><span className="controlStepNumber">1</span><div><h2>{t.reading}</h2><p>{t.readingText}</p></div></div><span className={`controlConfidence ${confidence}`}>{t.confidenceLabels[confidence]}</span></div>
      <div className="controlSignalGrid">
        <article><span>{t.weight}</span><strong>{snapshot.signals.latestWeightKg != null ? `${snapshot.signals.latestWeightKg} kg` : t.noReading}</strong><small>{snapshot.signals.latestCheckinDays != null ? `${t.latest}: ${snapshot.signals.latestCheckinDays} ${t.daysAgo}` : t.noReading}</small></article>
        <article><span>{t.waist}</span><strong>{snapshot.signals.latestWaistCm != null ? `${snapshot.signals.latestWaistCm} cm` : t.noReading}</strong><small>{snapshot.checkinCount} {t.checkins.toLowerCase()}</small></article>
        <article><span>{t.trend}</span><strong className={snapshot.signals.weightChangeKg != null && snapshot.signals.weightChangeKg < 0 ? "positive" : undefined}>{snapshot.signals.weightChangeKg != null ? `${snapshot.signals.weightChangeKg > 0 ? "+" : ""}${snapshot.signals.weightChangeKg} kg` : t.noTrend}</strong><small>{snapshot.signals.weightChangePercent != null ? `${snapshot.signals.weightChangePercent}%` : "—"}</small></article>
        <article className={`confidence ${confidence}`}><span>{t.confidence}</span><strong>{t.confidenceLabels[confidence]}</strong><small>{t.confidenceText[confidence]}</small></article>
      </div>
      <div className="controlConnectedPlans">
        <div><Salad size={17} /><span><small>{t.mealPlan}</small><strong>{snapshot.mealPlan?.name ?? t.noPlan}</strong>{snapshot.mealPlan ? <em>{snapshot.mealPlan.targetCalories ?? "—"} kcal · {t.version} {snapshot.mealPlan.version}</em> : null}</span></div>
        <div><Dumbbell size={17} /><span><small>{t.workoutPlan}</small><strong>{snapshot.workoutPlan?.name ?? t.noPlan}</strong>{snapshot.workoutPlan ? <em>{snapshot.workoutPlan.daysPerWeek ?? "—"} d · S{snapshot.workoutPlan.currentWeek} · {t.version} {snapshot.workoutPlan.version}</em> : null}</span></div>
      </div>
    </section>

    <CoachingControlForm workspaceId={brand.id} memberProfileId={memberId} defaults={defaults} dict={t} />

    <section className="controlHistoryPanel">
      <div className="controlReadingHeader"><div><History size={20} /><div><h2>{t.history}</h2><p>{t.historyText}</p></div></div></div>
      {snapshot.history.length ? <ol className="controlHistoryList">{snapshot.history.map((item) => <li key={item.id}><span className={`controlHistoryStatus ${item.status}`}>{item.status === "published" ? t.publishedStatus : t.draftStatus}</span><div><strong>v{item.version} · {t.goals[item.goal]}</strong><p>{item.targetCalories ?? "—"} kcal · P {item.targetProteinG ?? "—"} · C {item.targetCarbsG ?? "—"} · G {item.targetFatG ?? "—"}</p>{item.rationale ? <small>{item.rationale}</small> : null}</div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}</time></li>)}</ol> : <div className="controlEmptyHistory"><History size={22} /><p>{t.noHistory}</p></div>}
    </section>
  </>;
}
