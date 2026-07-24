import { ClipboardCheck, UserPlus } from "lucide-react";
import { MemberExpressCreate } from "@/components/coach/member-express-create";
import { MembersExplorer } from "@/components/coach/members-explorer";
import { Topbar } from "@/components/topbar";
import { utcToLocalDateTime } from "@/lib/domain/personal-training-schedule";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listManagedDietTemplates } from "@/lib/repositories/nutrition-management";
import { listManagedWorkoutTemplates } from "@/lib/repositories/training-management";
import { bulkAssignCoachMemberPlansAction, createCoachMemberAction, resendMemberInvitationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachMembersPage() {
  const brand = await getSelectedMemberAppBrand();
  const [members, workoutTemplates, dietTemplates] = await Promise.all([
    listManagedMembers(brand.id),
    listManagedWorkoutTemplates(brand.id),
    listManagedDietTemplates(brand.id),
  ]);
  const now = new Date().getTime();
  const roundedStart = new Date(Math.ceil((now + 30 * 60_000) / 1_800_000) * 1_800_000);

  return (
    <>
      <Topbar
        eyebrow="Miembros"
        title="Clientes"
        text="Da de alta, valora y activa el plan de cada cliente desde un único recorrido."
        actions={
          <MemberExpressCreate brandId={brand.id} brandName={brand.name} defaultStart={utcToLocalDateTime(roundedStart, "America/New_York")} action={createCoachMemberAction} />
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
          bulkAssignAction={bulkAssignCoachMemberPlansAction}
          resendInvitationAction={resendMemberInvitationAction}
        />
      </section>
    </>
  );
}
