import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function CoachProgramsModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="training">{children}</WorkspaceModuleLayout>;
}
