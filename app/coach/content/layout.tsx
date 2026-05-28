import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function CoachContentModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="content">{children}</WorkspaceModuleLayout>;
}
