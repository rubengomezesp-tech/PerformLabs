import { Topbar } from "@/components/topbar";
import { isNutritionAgentConfigured } from "@/lib/ai/nutrition-agent";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { NutritionAgentClient } from "@/components/nutrition-agent";

export const dynamic = "force-dynamic";

type AgentPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

export default async function NutritionAgentPage({ searchParams }: AgentPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];

  return (
    <>
      <Topbar
        eyebrow="Nutrición · IA"
        title="Agente de recetas con IA."
        text="Describe una receta en lenguaje natural y la IA la genera con macros, lista para enviar a tu librería."
      />
      <NutritionAgentClient workspaceId={selectedWorkspace?.id ?? ""} configured={isNutritionAgentConfigured()} />
    </>
  );
}
