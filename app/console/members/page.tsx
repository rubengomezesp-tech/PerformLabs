import { UserPlus, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { listManagedDietTemplates } from "@/lib/repositories/nutrition-management";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listManagedWorkoutTemplates } from "@/lib/repositories/training-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { assignMemberPlansAction, createMemberAction } from "./actions";

export const dynamic = "force-dynamic";

type MembersPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [members, workoutTemplates, dietTemplates] = await Promise.all([
    listManagedMembers(selectedWorkspace?.id),
    listManagedWorkoutTemplates(selectedWorkspace?.id),
    listManagedDietTemplates(selectedWorkspace?.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="CRM de miembros"
        title="Clientes, estado de plan y seguimiento."
        text="Gestiona altas, onboarding, asignación de rutinas, nutrición, estado de suscripción y tareas pendientes."
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/members" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver clientes</button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <article className="card span12">
            <h2>Nuevo cliente</h2>
            <form action={createMemberAction} className="memberForm">
              <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
              <label>
                Nombre
                <input name="fullName" placeholder="Cliente demo" required />
              </label>
              <label>
                Email
                <input name="email" placeholder="cliente@email.com" required type="email" />
              </label>
              <label>
                Teléfono
                <input name="phone" placeholder="+34..." />
              </label>
              <label>
                Objetivo
                <input name="goal" placeholder="Definición, fuerza, recomposición..." />
              </label>
              <label>
                Altura cm
                <input name="heightCm" placeholder="178" type="number" />
              </label>
              <label>
                Peso inicial kg
                <input name="startingWeightKg" placeholder="82" />
              </label>
              <label>
                Sexo
                <select name="sex" defaultValue="">
                  <option value="">Sin definir</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Zona horaria
                <input name="timezone" defaultValue="Europe/Madrid" />
              </label>
              <SubmitButton className="btn primary" pendingLabel="Creando…">Crear cliente <UserPlus size={18} /></SubmitButton>
            </form>
          </article>
        ) : null}

        {members.length ? (
          <article className="card span12">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Objetivo</th>
                  <th>Estado</th>
                  <th>Onboarding</th>
                  <th>Asignar planes</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.fullName}</td>
                    <td>{member.email}</td>
                    <td>{member.goal || "Pendiente"}</td>
                    <td><span className="tag">{member.subscriptionStatus}</span></td>
                    <td>{member.onboardingStatus}</td>
                    <td>
                      <form action={assignMemberPlansAction} className="tableInlineForm">
                        <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
                        <input name="memberProfileId" type="hidden" value={member.id} />
                        <select name="workoutTemplateId" defaultValue="">
                          <option value="">Entreno</option>
                          {workoutTemplates.map((template) => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                        <select name="dietTemplateId" defaultValue="">
                          <option value="">Dieta</option>
                          {dietTemplates.map((template) => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                        <button className="btn" type="submit">Asignar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : (
          <EmptyState
            icon={Users}
            title="Todavía no hay clientes en esta marca."
            text="Crea el primer cliente para poder asignarle rutina, nutrición y seguimiento."
          />
        )}
      </section>
    </>
  );
}
