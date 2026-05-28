import { PageShell } from "@/components/page-shell";
import { formatRole, requireConsoleAccess } from "@/lib/auth/access-control";
import { consoleNav } from "@/lib/data";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireConsoleAccess();

  return (
    <PageShell
      nav={consoleNav}
      active="/console"
      productLabel="Consola"
      session={{
        mode: session.mode,
        email: session.user.email,
        roleLabel: formatRole(session.topRole),
      }}
    >
      {children}
    </PageShell>
  );
}
