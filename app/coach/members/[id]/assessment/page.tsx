import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, Dumbbell, LockKeyhole, Mail, ShieldAlert, TicketCheck, Utensils } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { calculateAssessmentCompletion, type AssessmentAnswerKey, type CoachAssessmentAnswers } from "@/lib/domain/coach-assessment";
import { getLocale } from "@/lib/i18n/server";
import { getCoachAssessmentDictionary } from "@/lib/i18n/coach-assessment";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachMemberAssessment, getCoachMemberAssessmentById, listCoachMemberAssessments } from "@/lib/repositories/coach-assessments";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { getManagedMemberOnboardingBrief } from "@/lib/repositories/member-onboarding";
import { saveCoachAssessmentAction, startReassessmentAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; new?: string; setup?: string; access?: string; pack?: string; session?: string; aid?: string }>;
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

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function listValue(value: unknown) {
  return Array.isArray(value) ? value.map(textValue).filter(Boolean).join(", ") : textValue(value);
}

function yesNoValue(value: unknown) {
  const normalized = textValue(value).toLowerCase();
  if (["yes", "si", "sí", "true", "1"].includes(normalized)) return "yes";
  if (["no", "false", "0"].includes(normalized)) return "no";
  return "";
}

export default async function CoachAssessmentPage({ params, searchParams }: Props) {
  const [{ id: rawId }, query, locale, brand] = await Promise.all([params, searchParams, getLocale(), getSelectedMemberAppBrand()]);
  const id = decodeURIComponent(rawId);
  const [members, initialAssessment, clientBrief, history] = await Promise.all([
    listManagedMembers(brand.id),
    getCoachMemberAssessment(brand.id, id),
    getManagedMemberOnboardingBrief(brand.id, id),
    listCoachMemberAssessments(brand.id, id),
  ]);
  const assessment = query.aid
    ? await getCoachMemberAssessmentById(brand.id, id, query.aid)
    : initialAssessment;
  const isReassessment = assessment?.assessmentKind === "reassessment";
  const member = members.find((candidate) => candidate.id === id);
  if (!member) notFound();

  const t = getCoachAssessmentDictionary(locale);
  const english = locale === "en";
  const storedAnswers = assessment?.answers ?? {};
  const clientAnswers: CoachAssessmentAnswers = clientBrief ? {
    primaryGoal: clientBrief.goal,
    weeklyAvailability: textValue(clientBrief.trainingDaysPerWeek),
    sessionMinutes: textValue(clientBrief.sessionMinutes),
    trainingExperience: textValue(clientBrief.training.experienceLevel),
    currentPain: yesNoValue(clientBrief.health.currentPain),
    medicalConditions: listValue(clientBrief.health.conditions),
    medications: textValue(clientBrief.health.medications),
    medicalRestrictions: yesNoValue(clientBrief.health.medicalRestrictions),
    chestPain: yesNoValue(clientBrief.health.chestPain),
    fainting: yesNoValue(clientBrief.health.fainting),
    uncontrolledBloodPressure: yesNoValue(clientBrief.health.uncontrolledBloodPressure),
    eatingDisorderHistory: yesNoValue(clientBrief.health.eatingDisorderHistory),
    averageSleep: textValue(clientBrief.training.sleepHours),
    dailySteps: textValue(clientBrief.training.stepsTarget),
    mealPattern: clientBrief.mealsPerDay ? `${clientBrief.mealsPerDay} comidas al día` : "",
    foodPreferences: listValue(clientBrief.nutrition.preferredFoods),
    foodAvoidances: listValue(clientBrief.nutrition.dislikedFoods),
    allergies: listValue(clientBrief.nutrition.allergies),
    dietApproach: textValue(clientBrief.nutrition.dietStyle).toLowerCase().includes("flex") ? "flexible" : "discuss",
    bodyWeightKg: textValue(clientBrief.profile.weightKg),
  } : {};
  const answers: CoachAssessmentAnswers = {
    ...clientAnswers,
    ...storedAnswers,
    primaryGoal: storedAnswers.primaryGoal || member.goal || "",
    bodyWeightKg: storedAnswers.bodyWeightKg || (member.startingWeightKg ? String(member.startingWeightKg) : ""),
  };
  const clientCriticalRiskLabels = clientBrief ? [
    [clientBrief.health.chestPain, english ? "Chest pain during exertion" : "Dolor en el pecho con esfuerzo"],
    [clientBrief.health.fainting, english ? "Recent dizziness or fainting" : "Mareos o desmayos recientes"],
    [clientBrief.health.uncontrolledBloodPressure, english ? "Uncontrolled blood pressure" : "Tensión arterial sin controlar"],
    [clientBrief.health.medicalRestrictions, english ? "Declared medical restriction" : "Restricción médica declarada"],
  ].filter(([value]) => yesNoValue(value) === "yes").map(([, label]) => String(label)) : [];
  const clientRiskLabels = clientBrief && yesNoValue(clientBrief.health.currentPain) === "yes"
    ? [...clientCriticalRiskLabels, english ? "Current pain" : "Dolor actual"]
    : clientCriticalRiskLabels;
  const statusLabel = assessment?.status === "complete" ? t.complete : assessment?.status === "medical_clearance_required" ? t.clearance : t.draft;
  const hasCriticalRisk = assessment?.status === "medical_clearance_required" || clientCriticalRiskLabels.length > 0;
  const visibleCompletion = assessment?.completionPercent ?? calculateAssessmentCompletion(answers);
  const interviewAt = assessment?.interviewAt ? assessment.interviewAt.slice(0, 16) : new Date().toISOString().slice(0, 16);

  return <>
    <Topbar
      eyebrow={t.eyebrow}
      title={`${t.title} · ${member.fullName}`}
      text={t.subtitle}
      actions={<><LocaleSwitcher current={locale} label={t.language} changeLabel={t.changeLanguage} supportedLocales={["es", "en"]} /><Link className="btn" href={`/coach/members/${member.id}/photos`}>{english ? "Before/after" : "Antes/después"}</Link><Link className="btn" href={`/coach/members/${member.id}`}><ArrowLeft size={16} />{t.back}</Link></>}
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

    <section className={`assessmentClientBrief ${clientBrief ? "ready" : "pending"}`} aria-label={english ? "Client questionnaire" : "Cuestionario del cliente"}>
      <header><div><ClipboardCheck size={20} /><span><small>{english ? "CLIENT DECLARED" : "DECLARADO POR EL CLIENTE"}</small><strong>{clientBrief ? (english ? "Questionnaire received" : "Cuestionario recibido") : (english ? "Questionnaire pending" : "Cuestionario pendiente")}</strong></span></div>{clientBrief ? <time>{new Intl.DateTimeFormat(english ? "en-US" : "es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(clientBrief.submittedAt))}</time> : <Link className="btn ghost sm" href={`/coach/members/${member.id}`}>{english ? "Open profile" : "Abrir ficha"}</Link>}</header>
      {clientBrief ? <>
        <dl>
          <div><TicketCheck size={16} /><dt>{english ? "Goal" : "Objetivo"}</dt><dd>{clientBrief.goal || "—"}</dd></div>
          <div><Dumbbell size={16} /><dt>{english ? "Training" : "Entreno"}</dt><dd>{clientBrief.trainingDaysPerWeek ?? "—"} {english ? "days" : "días"} · {clientBrief.sessionMinutes ?? "—"} min</dd></div>
          <div><Clock3 size={16} /><dt>{english ? "Location" : "Lugar"}</dt><dd>{clientBrief.trainingLocation || "—"}</dd></div>
          <div><Utensils size={16} /><dt>{english ? "Meals" : "Comidas"}</dt><dd>{clientBrief.mealsPerDay ?? "—"} / {english ? "day" : "día"}</dd></div>
        </dl>
        <div className={`assessmentClientSafety ${clientRiskLabels.length ? "review" : "clear"}`}><ShieldAlert size={18} /><span><strong>{clientRiskLabels.length ? (english ? "Review before prescribing" : "Revisar antes de prescribir") : (english ? "No declared safety alerts" : "Sin alertas de seguridad declaradas")}</strong><p>{clientRiskLabels.length ? clientRiskLabels.join(" · ") : (english ? "Confirm during the interview and continue with your private assessment." : "Confírmalo en la entrevista y continúa con tu valoración privada.")}</p></span></div>
        {clientBrief.notes ? <p className="assessmentClientNotes"><strong>{english ? "Client note:" : "Nota del cliente:"}</strong> {clientBrief.notes}</p> : null}
      </> : <p className="assessmentClientEmpty">{english ? "The private assessment is ready, but client answers will appear here once submitted." : "La valoración privada está preparada; las respuestas aparecerán aquí cuando el cliente las envíe."}</p>}
    </section>

    <section className="assessmentStatusBar" aria-label={statusLabel}>
      <div><ClipboardCheck aria-hidden="true" size={18} /><strong>{statusLabel}</strong><span>{visibleCompletion}% {t.progress.toLowerCase()}</span></div>
      <p><LockKeyhole aria-hidden="true" size={15} />{t.privateNote}</p>
    </section>

    <section className="assessmentHistoryBar" aria-label={english ? "Assessment history" : "Histórico de valoraciones"}>
      <div className="assessmentHistoryChips">
        <Link className={!query.aid ? "assessmentChip active" : "assessmentChip"} href={`/coach/members/${member.id}/assessment`}>
          {english ? "Initial" : "Inicial"}{initialAssessment?.interviewAt ? ` · ${initialAssessment.interviewAt.slice(0, 10)}` : ""}
        </Link>
        {history.filter((entry) => entry.assessmentKind === "reassessment").map((entry) => (
          <Link className={query.aid === entry.id ? "assessmentChip active" : "assessmentChip"} href={`/coach/members/${member.id}/assessment?aid=${entry.id}`} key={entry.id}>
            {english ? "Re-eval" : "Reeval"} · {entry.interviewAt.slice(0, 10)}
          </Link>
        ))}
      </div>
      <form action={startReassessmentAction}>
        <input name="workspaceId" type="hidden" value={brand.id} />
        <input name="memberProfileId" type="hidden" value={member.id} />
        <input name="fromAssessmentId" type="hidden" value={assessment?.id ?? ""} />
        <SubmitButton variant="secondary">{english ? "New reassessment" : "Nueva reevaluación"}</SubmitButton>
      </form>
    </section>

    {isReassessment && initialAssessment ? (
      <section className="assessmentCompareStrip" aria-label={english ? "Compared to initial" : "Comparativa con la inicial"}>
        <span className="eyebrow">{english ? "VS INITIAL" : "VS INICIAL"} · {initialAssessment.interviewAt.slice(0, 10)}</span>
        <ul>
          {([
            ["bodyWeightKg", english ? "Weight" : "Peso", "kg"],
            ["waistCm", english ? "Waist" : "Cintura", "cm"],
            ["restingHeartRate", english ? "Resting HR" : "FC reposo", "ppm"],
            ["averageSleep", english ? "Sleep" : "Sueño", "h"],
            ["dailySteps", english ? "Steps" : "Pasos", ""],
            ["stressLevel", english ? "Stress" : "Estrés", "/10"],
          ] as const).map(([key, label, unit]) => {
            const before = Number.parseFloat(initialAssessment.answers[key] ?? "");
            const after = Number.parseFloat(assessment?.answers[key] ?? "");
            const delta = Number.isFinite(before) && Number.isFinite(after) ? after - before : null;
            return (
              <li key={key}>
                <strong>{label}</strong>
                <span>{Number.isFinite(before) ? before : "—"} → {Number.isFinite(after) ? after : "—"} {unit}</span>
                {delta !== null && delta !== 0 ? <em className={delta < 0 ? "down" : "up"}>{delta > 0 ? "+" : ""}{Math.round(delta * 10) / 10}</em> : null}
              </li>
            );
          })}
        </ul>
      </section>
    ) : null}

    {query.saved ? <div className="assessmentSaved" role="status"><CheckCircle2 size={18} />{t.saved}</div> : null}
    {hasCriticalRisk ? <div className="assessmentRiskAlert" role="alert"><ShieldAlert size={22} /><div><strong>{t.clearance}</strong><p>{t.safetyAlert}</p></div></div> : null}

    <form action={saveCoachAssessmentAction} className="assessmentForm">
      <input name="workspaceId" type="hidden" value={brand.id} />
      <input name="memberProfileId" type="hidden" value={member.id} />
      <input name="locale" type="hidden" value={locale === "en" ? "en" : "es"} />
      <input name="assessmentId" type="hidden" value={query.aid ? assessment?.id ?? "" : ""} />
      <input name="assessmentKind" type="hidden" value={isReassessment ? "reassessment" : "initial"} />

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

      <Section title={t.sections.visit[0]} description={t.sections.visit[1]}>
        <label>{t.labels.interviewAt}<input defaultValue={interviewAt} name="interviewAt" type="datetime-local" /></label>
        <TextField name="primaryGoal" labels={t.labels} answers={answers} placeholder={t.placeholders.primaryGoal} />
        <LongField name="goalWhy" labels={t.labels} answers={answers} placeholder={t.placeholders.goalWhy} />
        <TextField name="targetTimeline" labels={t.labels} answers={answers} />
        <TextField name="motivation" labels={t.labels} answers={answers} type="number" min="1" max="10" />
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
