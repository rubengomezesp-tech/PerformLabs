import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { OnboardingQuiz } from "./onboarding-quiz";

export const dynamic = "force-dynamic";

export default async function MemberOnboardingPage() {
  const brand = await getSelectedMemberAppBrand();

  return <OnboardingQuiz workspaceId={brand.id} appName={brand.appName} />;
}
