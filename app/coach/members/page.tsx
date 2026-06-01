import { Plus, UserPlus } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { MembersExplorer } from "@/components/coach/members-explorer";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listManagedDietTemplates } from "@/lib/repositories/nutrition-management";
import { listManagedWorkoutTemplates } from "@/lib/repositories/training-management";
import { assignCoachMemberPlansAction, bulkAssignCoachMemberPlansAction, createCoachMemberAction } from "./actions";

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
        text="El entrenador ve quién está activo, qué plan tiene asignado y qué necesita revisión."
        actions={
          <Dialog
            triggerClassName="btn primary"
            trigger={<>Crear miembro <Plus size={18} /></>}
            title={`Crear miembro en ${brand.name}`}
            description="Después podrás asignarle entrenamiento, nutrición y check-ins."
          >
            <form action={createCoachMemberAction} className="editForm">
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
                <input name="goal" placeholder="Definición, fuerza..." />
              </label>
              <label>
                Peso inicial (kg)
                <input name="startingWeightKg" placeholder="82" />
              </label>
              <input name="phone" type="hidden" value="" />
              <input name="heightCm" type="hidden" value="" />
              <input name="sex" type="hidden" value="" />
              <input name="timezone" type="hidden" value="Europe/Madrid" />
              <SubmitButton variant="primary" className="spanFull" successToast="Miembro creado">Crear miembro <UserPlus size={18} /></SubmitButton>
            </form>
          </Dialog>
        }
      />
      <section className="grid">
        <MembersExplorer
          brandId={brand.id}
          members={members}
          workoutTemplates={workoutTemplates}
          dietTemplates={dietTemplates}
          assignAction={assignCoachMemberPlansAction}
          bulkAssignAction={bulkAssignCoachMemberPlansAction}
        />
      </section>
    </>
  );
}
