import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function CoachCheckinsModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="checkins">{children}</WorkspaceModuleLayout>;
}
