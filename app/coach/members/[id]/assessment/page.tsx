import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, LockKeyhole, Mail, ShieldAlert, TicketCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import type { AssessmentAnswerKey, CoachAssessmentAnswers } from "@/lib/domain/coach-assessment";
import { getLocale } from "@/lib/i18n/server";
import { getCoachAssessmentDictionary } from "@/lib/i18n/coach-assessment";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachMemberAssessment } from "@/lib/repositories/coach-assessments";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { saveCoachAssessmentAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; new?: string; setup?: string; access?: string; pack?: string; session?: string }>;
};

type Labels = ReturnType<typeof getCoachAssessmentDictionary>["labels"];

function TextField({ name, labels, answers, type = "text", min, max, placeholder, step }: {
  name: AssessmentAnswerKey; labels: Labels; answers: CoachAssessmentAnswers; type?: string;
  min?: string; max?: string; placeholder?: string; step?: string;
}) {
  return <label>{labels[name]}<input defaultValue={answers[name] ?? ""} inputMode={type === "number" ? "decimal" : undefined} max={max} min={min} name={name} placeholder={placeholder} step={step} type={type} /></label>;
}

function LongField({ name, labels, answers, placeholder, wide = false }: {
  name: AssessmentAnswerKey; labels: Labels; answers: CoachAssessmentAnswers; placeholder?: string; wide?: boolean;
}) {
  return <label className={wide ? "assessmentWide" : undefined}>{labels[name]}<textarea defaultValue={answers[name] ?? ""} name={name} placeholder={placeholder} rows={4} /></label>;
}

function YesNo({ name, labels, answers, yes, no, unknown }: {
  name: AssessmentAnswerKey; labels: Labels; answers: CoachAssessmentAnswers; yes: string; no: string; unknown?: string;
}) {
  return <label>{labels[name]}<select defaultValue={answers[name] ?? ""} name={name}><option value="">—</option><option value="no">{no}</option><option value="yes">{yes}</option>{unknown ? <option value="unknown">{unknown}</option> : null}</select></label>;
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <fieldset className="assessmentSection"><legend>{title}</legend><p className="assessmentSectionIntro">{description}</p><div className="assessmentFields">{children}</div></fieldset>;
}

export default async function CoachAssessmentPage({ params, searchParams }: Props) {
  const [{ id: rawId }, query, locale, brand] = await Promise.all([params, searchParams, getLocale(), getSelectedMemberAppBrand()]);
  const id = decodeURIComponent(rawId);
  const [members, assessment] = await Promise.all([
    listManagedMembers(brand.id),
    getCoachMemberAssessment(brand.id, id),
  ]);
  const member = members.find((candidate) => candidate.id === id);
  if (!member) notFound();

  const t = getCoachAssessmentDictionary(locale);
  const storedAnswers = assessment?.answers ?? {};
  const answers: CoachAssessmentAnswers = {
    ...storedAnswers,
    primaryGoal: storedAnswers.primaryGoal || member.goal || "",
    bodyWeightKg: storedAnswers.bodyWeightKg || (member.startingWeightKg ? String(member.startingWeightKg) : ""),
  };
  const statusLabel = assessment?.status === "complete" ? t.complete : assessment?.status === "medical_clearance_required" ? t.clearance : t.draft;
  const hasCriticalRisk = assessment?.status === "medical_clearance_required";
  const interviewAt = assessment?.interviewAt ? assessment.interviewAt.slice(0, 16) : new Date().toISOString().slice(0, 16);

  return <>
    <Topbar
      eyebrow={t.eyebrow}
      title={`${t.title} · ${member.fullName}`}
      text={t.subtitle}
      actions={<><LocaleSwitcher current={locale} label={t.language} changeLabel={t.changeLanguage} supportedLocales={["es", "en"]} /><Link className="btn" href={`/coach/members/${member.id}`}><ArrowLeft size={16} />{t.back}</Link></>}
    />

    {query.new ? <section className={`memberExpressResult ${query.setup === "partial" ? "warning" : "success"}`} role="status">
      {query.setup === "partial" ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
      <div>
        <strong>{query.setup === "partial" ? `${member.fullName} está creado; falta revisar parte de la preparación.` : `${member.fullName} ya está dentro del sistema.`}</strong>
        <p>Los datos introducidos ya están guardados. Ahora completa la valoración sin repetirlos.</p>
        <ul>
          <li><TicketCheck size={15} /> {Number(query.pack) > 0 ? `Bono de ${query.pack} sesión${query.pack === "1" ? "" : "es"} registrado` : "Bono pendiente de pago"}</li>
          <li><CalendarDays size={15} /> {query.session === "reserved" ? "Primera sesión reservada" : "Primera sesión pendiente"}</li>
          <li><Mail size={15} /> {query.access === "sent" ? "Acceso privado enviado" : query.access === "failed" ? "Acceso no enviado: inténtalo desde su ficha" : "Acceso preparado para entrega manual"}</li>
        </ul>
      </div>
      {query.setup === "partial" || query.access === "failed" ? <Link className="btn ghost" href={`/coach/members/${member.id}`}>Revisar ficha</Link> : null}
    </section> : null}

    <section className="assessmentStatusBar" aria-label={statusLabel}>
      <div><ClipboardCheck aria-hidden="true" size={18} /><strong>{statusLabel}</strong><span>{assessment?.completionPercent ?? 0}% {t.progress.toLowerCase()}</span></div>
      <p><LockKeyhole aria-hidden="true" size={15} />{t.privateNote}</p>
    </section>

    {query.saved ? <div className="assessmentSaved" role="status"><CheckCircle2 size={18} />{t.saved}</div> : null}
    {hasCriticalRisk ? <div className="assessmentRiskAlert" role="alert"><ShieldAlert size={22} /><div><strong>{t.clearance}</strong><p>{t.safetyAlert}</p></div></div> : null}

    <form action={saveCoachAssessmentAction} className="assessmentForm">
      <input name="workspaceId" type="hidden" value={brand.id} />
      <input name="memberProfileId" type="hidden" value={member.id} />
      <input name="locale" type="hidden" value={locale === "en" ? "en" : "es"} />

      <Section title={t.sections.visit[0]} description={t.sections.visit[1]}>
        <label>{t.labels.interviewAt}<input defaultValue={interviewAt} name="interviewAt" type="datetime-local" /></label>
        <TextField name="primaryGoal" labels={t.labels} answers={answers} placeholder={t.placeholders.primaryGoal} />
        <LongField name="goalWhy" labels={t.labels} answers={answers} placeholder={t.placeholders.goalWhy} />
        <TextField name="targetTimeline" labels={t.labels} answers={answers} />
        <TextField name="motivation" labels={t.labels} answers={answers} type="number" min="1" max="10" />
      </Section>

      <Section title={t.sections.safety[0]} description={t.sections.safety[1]}>
        <YesNo name="currentPain" labels={t.labels} answers={answers} yes={t.yes} no={t.no} />
        <LongField name="painDetails" labels={t.labels} answers={answers} />
        <LongField name="medicalConditions" labels={t.labels} answers={answers} />
        <LongField name="medications" labels={t.labels} answers={answers} />
        <YesNo name="medicalRestrictions" labels={t.labels} answers={answers} yes={t.yes} no={t.no} unknown={t.unknown} />
        <YesNo name="chestPain" labels={t.labels} answers={answers} yes={t.yes} no={t.no} />
        <YesNo name="fainting" labels={t.labels} answers={answers} yes={t.yes} no={t.no} />
        <YesNo name="uncontrolledBloodPressure" labels={t.labels} answers={answers} yes={t.yes} no={t.no} unknown={t.unknown} />
        <YesNo name="eatingDisorderHistory" labels={t.labels} answers={answers} yes={t.yes} no={t.no} />
      </Section>

      <Section title={t.sections.training[0]} description={t.sections.training[1]}>
        <LongField name="trainingExperience" labels={t.labels} answers={answers} />
        <TextField name="trainingBreak" labels={t.labels} answers={answers} />
        <TextField name="weeklyAvailability" labels={t.labels} answers={answers} type="number" min="1" max="7" />
        <TextField name="sessionMinutes" labels={t.labels} answers={answers} type="number" min="20" max="180" />
        <LongField name="preferredTraining" labels={t.labels} answers={answers} />
        <LongField name="dislikedTraining" labels={t.labels} answers={answers} />
      </Section>

      <Section title={t.sections.lifestyle[0]} description={t.sections.lifestyle[1]}>
        <TextField name="averageSleep" labels={t.labels} answers={answers} type="number" min="0" max="16" step="0.5" />
        <TextField name="stressLevel" labels={t.labels} answers={answers} type="number" min="1" max="10" />
        <TextField name="dailySteps" labels={t.labels} answers={answers} type="number" min="0" max="100000" />
        <LongField name="workActivity" labels={t.labels} answers={answers} />
      </Section>

      <Section title={t.sections.nutrition[0]} description={t.sections.nutrition[1]}>
        <TextField name="mealPattern" labels={t.labels} answers={answers} />
        <LongField name="dayOfEating" labels={t.labels} answers={answers} placeholder={t.placeholders.dayOfEating} wide />
        <LongField name="foodPreferences" labels={t.labels} answers={answers} />
        <LongField name="foodAvoidances" labels={t.labels} answers={answers} />
        <LongField name="allergies" labels={t.labels} answers={answers} />
        <LongField name="weekendChallenges" labels={t.labels} answers={answers} />
        <TextField name="alcoholFrequency" labels={t.labels} answers={answers} />
        <TextField name="waterIntake" labels={t.labels} answers={answers} />
        <label>{t.labels.dietApproach}<select defaultValue={answers.dietApproach ?? ""} name="dietApproach"><option value="">{t.select}</option><option value="flexible">{t.flexible}</option><option value="structured">{t.structured}</option><option value="hybrid">{t.hybrid}</option><option value="discuss">{t.discuss}</option></select></label>
      </Section>

      <Section title={t.sections.measures[0]} description={t.sections.measures[1]}>
        <TextField name="bodyWeightKg" labels={t.labels} answers={answers} type="number" min="20" max="400" step="0.1" />
        <TextField name="waistCm" labels={t.labels} answers={answers} type="number" min="30" max="250" step="0.1" />
        <TextField name="restingHeartRate" labels={t.labels} answers={answers} type="number" min="30" max="220" />
        <TextField name="bloodPressure" labels={t.labels} answers={answers} placeholder="120/80" />
        <LongField name="movementNotes" labels={t.labels} answers={answers} wide />
      </Section>

      <Section title={t.sections.synthesis[0]} description={t.sections.synthesis[1]}>
        <label className="assessmentWide">{t.labels.coachSummary}<textarea defaultValue={assessment?.coachSummary ?? ""} name="coachSummary" placeholder={t.placeholders.summary} rows={5} /></label>
        <label>{t.labels.trainingPriorities}<textarea defaultValue={assessment?.trainingPriorities ?? ""} name="trainingPriorities" placeholder={t.placeholders.training} rows={5} /></label>
        <label>{t.labels.nutritionStrategy}<textarea defaultValue={assessment?.nutritionStrategy ?? ""} name="nutritionStrategy" placeholder={t.placeholders.nutrition} rows={5} /></label>
        <label>{t.labels.nextReviewOn}<input defaultValue={assessment?.nextReviewOn ?? ""} name="nextReviewOn" type="date" /></label>
      </Section>

      <div className="assessmentActions"><p>{t.requiredHint}</p><div><SubmitButton name="intent" value="draft" variant="secondary">{t.saveDraft}</SubmitButton><SubmitButton name="intent" value="complete" variant="primary">{t.finish}</SubmitButton></div></div>
    </form>
  </>;
}
