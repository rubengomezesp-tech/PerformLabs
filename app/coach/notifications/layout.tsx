import { WorkspaceModuleLayout } from "@/components/workspace-module-layout";

export default function CoachNotificationsModuleLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceModuleLayout module="notifications">{children}</WorkspaceModuleLayout>;
}
