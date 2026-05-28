import { Clock3, KeyRound, LockKeyhole, MailPlus, ShieldAlert, ShieldCheck, Trash2, Unplug, UsersRound } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { canManageWorkspace, formatRole, requirePlatformAccess } from "@/lib/auth/access-control";
import { entitlementModuleLabels, entitlementStatusLabels } from "@/lib/repositories/entitlements";
import {
  listLoginSecurityAlerts,
  listPendingTeamInvitations,
  listSecurityAuditEvents,
  listSecurityTeamMembers,
} from "@/lib/repositories/security-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import {
  inviteWorkspaceTeamMemberAction,
  revokeWorkspaceTeamAccessAction,
  revokeWorkspaceTeamInvitationAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function metadataPreview(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return "Sin detalle";
  }

  const entries = Object.entries(metadata as Record<string, unknown>);
  if (!entries.length) {
    return "Sin detalle";
  }

  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

function statusLabel(status: string) {
  if (status === "pending") return "Pendiente";
  if (status === "accepted") return "Aceptada";
  if (status === "expired") return "Expirada";
  if (status === "revoked") return "Revocada";
  return status;
}

export default async function SecurityPage() {
  const session = await requirePlatformAccess();
  const workspaceResult = await listWorkspaceSummaries();
  const visibleWorkspaces = workspaceResult.workspaces.filter((workspace) => canManageWorkspace(session, workspace.id));
  const scopedWorkspaceIds = session.topRole === "platform_owner" ? undefined : visibleWorkspaces.map((workspace) => workspace.id);
  const [teamMembers, auditEvents, loginAlerts, teamInvitations] = await Promise.all([
    listSecurityTeamMembers(scopedWorkspaceIds),
    listSecurityAuditEvents(scopedWorkspaceIds),
    session.topRole === "platform_owner" ? listLoginSecurityAlerts() : Promise.resolve([]),
    listPendingTeamInvitations(scopedWorkspaceIds),
  ]);
  const consoleMembers = teamMembers.filter((member) => member.role !== "member");
  const memberOnly = teamMembers.length - consoleMembers.length;
  const restrictedApps = visibleWorkspaces.filter((workspace) => workspace.entitlement.status !== "active" || !workspace.isActive);
  const roleOptions = session?.topRole === "platform_owner"
    ? ["platform_owner", "agency_admin", "coach_admin", "coach_staff"] as const
    : ["coach_admin", "coach_staff"] as const;

  return (
    <>
      <Topbar
        eyebrow="Seguridad"
        title="Control de acceso y auditoría."
        text="Base de gobierno para operar varias marcas con permisos, roles, trazabilidad y separación interna antes de escalar."
      />
      <section className="grid">
        <article className="card span3">
          <LockKeyhole color="var(--gold)" />
          <p className="metric">
            Sesión
            <strong>{session?.mode === "authenticated" ? "Validada" : "Local"}</strong>
          </p>
          <p>{session?.user.email}</p>
        </article>
        <article className="card span3">
          <ShieldCheck color="var(--gold)" />
          <p className="metric">
            Rol superior
            <strong>{session ? formatRole(session.topRole) : "Sin sesión"}</strong>
          </p>
          <p>Se aplica por jerarquía y marca.</p>
        </article>
        <article className="card span3">
          <UsersRound color="var(--gold)" />
          <p className="metric">
            Equipo consola
            <strong>{consoleMembers.length}</strong>
          </p>
          <p>{memberOnly} perfiles solo miembro.</p>
        </article>
        <article className="card span3">
          <Clock3 color="var(--gold)" />
          <p className="metric">
            Auditoría
            <strong>{auditEvents.length}</strong>
          </p>
          <p>Últimos eventos registrados.</p>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <Unplug color="var(--gold)" />
              <h2>Hilo operativo privado</h2>
              <p>Estado de licencia por marca. Esto controla app, consola del entrenador y módulos sin enseñar nuestra capa interna.</p>
            </div>
            <a className="btn" href="/console/apps">Gestionar apps</a>
          </div>
          {visibleWorkspaces.length ? (
            <ul className="list">
              {visibleWorkspaces.map((workspace) => {
                const disabledModules = Object.entries(workspace.entitlement.modules)
                  .filter(([, enabled]) => !enabled)
                  .map(([module]) => entitlementModuleLabels[module as keyof typeof entitlementModuleLabels]);

                return (
                  <li className="row" key={workspace.id}>
                    <div>
                      <strong>{workspace.name}</strong>
                      <p>{workspace.memberDomain || workspace.fallbackSubdomain} · {disabledModules.length ? `Sin ${disabledModules.join(", ")}` : "Todos los módulos activos"}</p>
                    </div>
                    <span className={workspace.entitlement.status === "active" && workspace.isActive ? "tag" : "tag danger"}>
                      {workspace.isActive ? entitlementStatusLabels[workspace.entitlement.status] : "Pausada"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="inlineEmpty">
              <Unplug color="var(--gold)" />
              <h3>No hay marcas conectadas.</h3>
              <p>Cuando creemos una implantación aparecerá aquí con su licencia y módulos activos.</p>
            </div>
          )}
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <KeyRound color="var(--gold)" />
              <h2>Invitar acceso operativo</h2>
              <p>Usuarios con permiso operativo por marca. La consola queda reservada a equipo interno y entrenadores autorizados.</p>
            </div>
            <span className={restrictedApps.length ? "tag danger" : "tag"}>{restrictedApps.length ? `${restrictedApps.length} restringida` : "RBAC"}</span>
          </div>
          <form action={inviteWorkspaceTeamMemberAction} className="accessInviteForm">
            <label>
              Marca
              <select name="workspaceId" required>
                <option value="">Seleccionar marca</option>
                {visibleWorkspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}{workspace.fallbackSubdomain ? ` · ${workspace.fallbackSubdomain}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email
              <input name="email" placeholder="coach@email.com" required type="email" />
            </label>
            <label>
              Rol
              <select name="role" defaultValue="coach_admin">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{formatRole(role)}</option>
                ))}
              </select>
            </label>
            <button className="btn primary" type="submit">
              Invitar acceso <MailPlus size={16} />
            </button>
          </form>
          {consoleMembers.length ? (
            <ul className="list">
              {consoleMembers.map((member) => (
                <li className="row" key={member.id}>
                  <div>
                    <strong>{member.email}</strong>
                    <p>{member.workspaceName}{member.workspaceSlug ? ` · ${member.workspaceSlug}` : ""}</p>
                  </div>
                  <div className="rowActions">
                    <span className="tag">{formatRole(member.role)}</span>
                    <form action={revokeWorkspaceTeamAccessAction}>
                      <input name="workspaceId" type="hidden" value={member.workspaceId} />
                      <input name="membershipId" type="hidden" value={member.id} />
                      <button className="btn iconButton" type="submit" aria-label={`Revocar acceso de ${member.email}`}>
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="inlineEmpty">
              <UsersRound color="var(--gold)" />
              <h3>No hay equipo operativo creado.</h3>
              <p>Cuando activemos acceso obligatorio, cada usuario necesitará rol y marca asignada.</p>
            </div>
          )}
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <MailPlus color="var(--gold)" />
              <h2>Invitaciones operativas</h2>
              <p>Invitaciones de equipo pendientes, expiradas o revocadas. El acceso real queda auditado por usuario, rol y marca.</p>
            </div>
            <span className="tag">{teamInvitations.length} registros</span>
          </div>
          {teamInvitations.length ? (
            <ul className="list">
              {teamInvitations.map((invitation) => (
                <li className="row" key={invitation.id}>
                  <div>
                    <strong>{invitation.email}</strong>
                    <p>{invitation.workspaceName}{invitation.workspaceSlug ? ` · ${invitation.workspaceSlug}` : ""} · expira {formatDate(invitation.expiresAt)}</p>
                  </div>
                  <div className="rowActions">
                    <span className={invitation.status === "pending" ? "tag" : "tag danger"}>{statusLabel(invitation.status)}</span>
                    <span className="tag">{formatRole(invitation.role)}</span>
                    {invitation.status === "pending" ? (
                      <form action={revokeWorkspaceTeamInvitationAction}>
                        <input name="workspaceId" type="hidden" value={invitation.workspaceId} />
                        <input name="invitationId" type="hidden" value={invitation.id} />
                        <button className="btn iconButton" type="submit" aria-label={`Revocar invitación de ${invitation.email}`}>
                          <Trash2 size={16} />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="inlineEmpty">
              <MailPlus color="var(--gold)" />
              <h3>No hay invitaciones pendientes.</h3>
              <p>Cuando invites a un entrenador o miembro del equipo aparecerá aquí hasta que entre o se revoque.</p>
            </div>
          )}
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <ShieldAlert color="var(--gold)" />
              <h2>Alertas de login</h2>
              <p>Intentos fallidos y bloqueos detectados en las últimas 24 horas. No mostramos emails ni IPs reales, solo huellas seguras.</p>
            </div>
            <span className={loginAlerts.some((alert) => alert.severity === "critical") ? "tag danger" : "tag"}>
              {loginAlerts.length ? `${loginAlerts.length} activas` : "Sin alertas"}
            </span>
          </div>
          {loginAlerts.length ? (
            <ul className="list">
              {loginAlerts.map((alert) => (
                <li className="row" key={alert.id}>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.detail} · {alert.userAgent}</p>
                  </div>
                  <span className={alert.severity === "critical" ? "tag danger" : "tag"}>{formatDate(alert.lastSeenAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="inlineEmpty">
              <ShieldAlert color="var(--gold)" />
              <h3>No hay patrones sospechosos.</h3>
              <p>Los intentos fallidos quedarán agrupados aquí cuando aparezcan señales repetidas.</p>
            </div>
          )}
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <ShieldCheck color="var(--gold)" />
              <h2>Registro de auditoría</h2>
              <p>Acciones críticas preparadas para trazabilidad: creación de apps, cambios de proyecto y operaciones de plataforma.</p>
            </div>
            <span className="tag">Últimos 50</span>
          </div>
          {auditEvents.length ? (
            <ul className="list">
              {auditEvents.map((event) => (
                <li className="row" key={event.id}>
                  <div>
                    <strong>{event.action}</strong>
                    <p>{event.workspaceName} · {event.entityType} · {metadataPreview(event.metadata)}</p>
                  </div>
                  <span>{event.actorEmail} · {formatDate(event.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="inlineEmpty">
              <ShieldCheck color="var(--gold)" />
              <h3>Sin eventos todavía.</h3>
              <p>La auditoría empezará a llenarse con operaciones críticas de la consola.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
