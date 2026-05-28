import { Mail, Plus, UserPlus, UserRound, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listManagedDietTemplates } from "@/lib/repositories/nutrition-management";
import { listManagedWorkoutTemplates } from "@/lib/repositories/training-management";
import { assignCoachMemberPlansAction, createCoachMemberAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachMembersPage() {
  const brand = await getSelectedMemberAppBrand();
  const [members, workoutTemplates, dietTemplates] = await Promise.all([
    listManagedMembers(brand.id),
    listManagedWorkoutTemplates(brand.id),
    listManagedDietTemplates(brand.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="Miembros"
        title="Clientes, acceso y seguimiento."
        text="El entrenador ve quien esta activo, que plan tiene asignado y que necesita revision."
        actions={<a className="btn primary" href="#nuevo-miembro">Invitar miembro <Plus size={18} /></a>}
      />
      <section className="grid">
        <article className="card span12 coachBuilderCard" id="nuevo-miembro">
          <div>
            <span className="eyebrow">Alta rapida</span>
            <h2>Crear miembro dentro de {brand.name}.</h2>
            <p>Despues podras asignarle entrenamiento, comida y check-ins.</p>
          </div>
          <form action={createCoachMemberAction} className="coachMemberCreate">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>
              Nombre
              <input name="fullName" placeholder="Cliente demo" required />
            </label>
            <label>
              Email
              <input name="email" placeholder="cliente@email.com" required type="email" />
            </label>
            <label>
              Objetivo
              <input name="goal" placeholder="Definicion, fuerza..." />
            </label>
            <label>
              Peso inicial
              <input name="startingWeightKg" placeholder="82" />
            </label>
            <input name="phone" type="hidden" value="" />
            <input name="heightCm" type="hidden" value="" />
            <input name="sex" type="hidden" value="" />
            <input name="timezone" type="hidden" value="Europe/Madrid" />
            <button className="btn primary" type="submit">Crear <UserPlus size={18} /></button>
          </form>
        </article>

        {members.length ? members.map((member) => (
          <article className="card span4 motionCard" key={member.id}>
            <UserRound color="var(--gold)" />
            <h2>{member.fullName}</h2>
            <p><Mail size={15} /> {member.email}</p>
            <ul className="list">
              <li className="row">Objetivo <span>{member.goal || "Pendiente"}</span></li>
              <li className="row">Estado <span className="tag">{member.subscriptionStatus}</span></li>
              <li className="row">Onboarding <span>{member.onboardingStatus}</span></li>
              <li className="row">Zona <strong>{member.timezone}</strong></li>
            </ul>
            <div className="memberAssignmentState">
              <span className="eyebrow">Entrenamiento activo</span>
              {member.activeWorkoutPlan ? (
                <>
                  <strong>{member.activeWorkoutPlan.name}</strong>
                  <p>
                    {member.activeWorkoutPlan.daysPerWeek ?? "-"} dias/semana · Mes {member.activeWorkoutPlan.currentMonth} · Semana {member.activeWorkoutPlan.currentWeek}
                  </p>
                  <small>Revision: {member.activeWorkoutPlan.nextReviewOn || "sin fecha"} · {member.activeWorkoutPlan.reviewStatus}</small>
                </>
              ) : (
                <p>Sin entrenamiento asignado todavia.</p>
              )}
            </div>
            <form action={assignCoachMemberPlansAction} className="coachAssignForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="memberProfileId" type="hidden" value={member.id} />
              <label>
                Entrenamiento
                <select name="workoutTemplateId" defaultValue="">
                  <option value="">Sin cambio</option>
                  {workoutTemplates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Objetivo de fase
                <input name="assignmentGoal" defaultValue={member.activeWorkoutPlan?.assignmentGoal ?? member.goal} placeholder="Definicion, fuerza, adherencia..." />
              </label>
              <label>
                Mes
                <select name="currentMonth" defaultValue={String(member.activeWorkoutPlan?.currentMonth ?? 1)}>
                  <option value="1">Mes 1</option>
                  <option value="2">Mes 2</option>
                  <option value="3">Mes 3</option>
                </select>
              </label>
              <label>
                Semana
                <input name="currentWeek" defaultValue={String(member.activeWorkoutPlan?.currentWeek ?? 1)} min="1" max="12" type="number" />
              </label>
              <label>
                Proxima revision
                <input name="nextReviewOn" defaultValue={member.activeWorkoutPlan?.nextReviewOn ?? ""} type="date" />
              </label>
              <label>
                Nutricion
                <select name="dietTemplateId" defaultValue="">
                  <option value="">Sin cambio</option>
                  {dietTemplates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </label>
              <label className="spanFull">
                Notas internas
                <input name="assignmentNotes" placeholder="Contexto, molestias, preferencias, foco de la fase..." />
              </label>
              <button className="btn" type="submit">Asignar planes</button>
            </form>
          </article>
        )) : (
          <EmptyState
            icon={Users}
            title="Todavia no hay miembros en esta app."
            text="Crea el primer miembro para asignarle entrenamiento, nutricion y seguimiento."
          />
        )}
      </section>
    </>
  );
}
