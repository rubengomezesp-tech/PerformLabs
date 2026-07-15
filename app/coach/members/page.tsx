import { ArrowRight, ClipboardCheck, Plus, UserPlus } from "lucide-react";
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
        title="Clientes"
        text="Da de alta, valora y activa el plan de cada cliente desde un único recorrido."
        actions={
          <Dialog
            triggerClassName="btn primary"
            trigger={<>Nuevo cliente <Plus size={18} /></>}
            title={`Nuevo cliente en ${brand.name}`}
            description="Nombre y email bastan para empezar. Al crearle, se abrirá directamente su primera valoración."
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
              <SubmitButton variant="primary" className="spanFull" successToast="Cliente creado">Crear y empezar valoración <ArrowRight size={18} /></SubmitButton>
            </form>
          </Dialog>
        }
      />
      <section className="grid">
        <article className="span12 coachQuickStartBar">
          <span><UserPlus size={18} /><strong>Alta express</strong></span>
          <ol><li><b>1</b> Crear cliente</li><li><b>2</b> Completar valoración</li><li><b>3</b> Publicar plan y abrir su acceso</li></ol>
          <span className="coachQuickStartHint"><ClipboardCheck size={16} /> Al crearle, irás automáticamente al formulario.</span>
        </article>
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
