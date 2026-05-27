import { PageShell } from "@/components/page-shell";
import { requireConsoleAccess } from "@/lib/auth/access-control";
import { consoleNav } from "@/lib/data";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireConsoleAccess();

  return (
    <PageShell nav={consoleNav} active="/console" productLabel="Consola">
      {children}
    </PageShell>
  );
}
