import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function WorkoutsModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="training">{children}</WorkspaceModuleLayout>;
}
