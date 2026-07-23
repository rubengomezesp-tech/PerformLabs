import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberProfileSummary } from "@/lib/repositories/member-profile";
import { getOnboardingDraft } from "@/lib/repositories/member-onboarding-drafts";
import { OnboardingQuiz } from "./onboarding-quiz";

export const dynamic = "force-dynamic";

export default async function MemberOnboardingPage({ searchParams }: { searchParams: Promise<{ submitted?: string; review?: string; error?: string; gate?: string }> }) {
  const query = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const profile = await getMemberProfileSummary(brand.id);
  const draft = query.submitted ? null : await getOnboardingDraft(brand.id);

  if (query.submitted) {
    const medicalReview = query.review === "medical";
    return <section className={`onboardingSubmitted ${medicalReview ? "medical" : ""}`}>
      <span className="onboardingSubmittedIcon">{medicalReview ? <ShieldAlert size={28} /> : <CheckCircle2 size={28} />}</span>
      <span className="eyebrow">Valoración enviada</span>
      <h1>{medicalReview ? "Tu coach revisará primero la parte de salud." : "Tu coach ya tiene toda la información."}</h1>
      <p>{medicalReview ? "Has indicado una respuesta que merece revisión antes de activar el entrenamiento. Esto es una medida de seguridad, no un diagnóstico." : "Ahora revisará tus respuestas y ajustará personalmente entrenamiento, alimentación y hábitos antes de publicarlos."}</p>
      <ol><li><ClipboardCheck size={17} /><span><strong>Cuestionario recibido</strong><small>Tus respuestas quedan organizadas en tu ficha.</small></span></li><li><ShieldCheck size={17} /><span><strong>Revisión privada del coach</strong><small>Comprobará seguridad, objetivo y disponibilidad.</small></span></li><li><ArrowRight size={17} /><span><strong>Publicación del plan</strong><small>Lo verás en la app cuando esté aprobado.</small></span></li></ol>
      <Link className="btn primary" href="/app">Volver al inicio <ArrowRight size={17} /></Link>
    </section>;
  }

  return <OnboardingQuiz workspaceId={brand.id} appName={brand.appName} defaultTimezone={profile?.timezone ?? "America/New_York"} initialFullName={profile?.fullName ?? ""} error={query.error} gated={query.gate === "1"} draftAnswers={draft?.answers} draftStep={draft?.step} />;
}
