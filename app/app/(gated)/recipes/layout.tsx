import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function RecipesModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="nutrition">{children}</WorkspaceModuleLayout>;
}
