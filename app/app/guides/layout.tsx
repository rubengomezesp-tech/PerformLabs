import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function GuidesModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="content">{children}</WorkspaceModuleLayout>;
}
