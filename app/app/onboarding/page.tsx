import { AlertTriangle } from "lucide-react";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { OnboardingQuiz } from "./onboarding-quiz";

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function MemberOnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const error = typeof params?.error === "string" ? params.error.trim() : "";

  return (
    <>
      {error ? (
        <div className="onboardingNotice" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>No se pudo completar el guardado.</strong>
            <span>{error}</span>
          </div>
        </div>
      ) : null}
      <OnboardingQuiz workspaceId={brand.id} appName={brand.appName} />
    </>
  );
}
