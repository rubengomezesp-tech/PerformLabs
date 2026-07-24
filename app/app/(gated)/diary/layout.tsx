import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function DiaryModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="nutrition">{children}</WorkspaceModuleLayout>;
}
