"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Mail, MessageSquareText, Plus, Search, UserRound, Users } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/ui";
import type { ManagedMember } from "@/lib/repositories/member-management";
import type { ManagedDietTemplate } from "@/lib/repositories/nutrition-management";
import type { ManagedWorkoutTemplate } from "@/lib/repositories/training-management";

type PlanOption = Pick<ManagedWorkoutTemplate, "id" | "name">;
type DietOption = Pick<ManagedDietTemplate, "id" | "name">;

/**
 * Client-side search/filter over the coach's members. Renders the same member
 * cards as before — every form, Dialog, server action and hidden input is
 * preserved verbatim, just relocated here and filtered by a name/email query
 * and a subscription-status select. The assign-plans server action is passed
 * in from the server page.
 */
export function MembersExplorer({
  brandId,
  members,
  workoutTemplates,
  dietTemplates,
  assignAction,
}: {
  brandId: string;
  members: ManagedMember[];
  workoutTemplates: PlanOption[];
  dietTemplates: DietOption[];
  assignAction: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const statuses = useMemo(
    () => Array.from(new Set(members.map((member) => member.subscriptionStatus))).sort(),
    [members],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      if (status !== "all" && member.subscriptionStatus !== status) return false;
      if (!q) return true;
      return (
        member.fullName.toLowerCase().includes(q) || member.email.toLowerCase().includes(q)
      );
    });
  }, [members, query, status]);

  if (!members.length) {
    return (
      <EmptyState
        icon={Users}
        title="Todavía no hay miembros en esta app."
        text="Crea el primer miembro para asignarle entrenamiento, nutrición y seguimiento."
      />
    );
  }

  return (
    <>
      <div className="card span12 membersFilters">
        <label className="membersSearch">
          <span className="eyebrow">Buscar</span>
          <span className="membersSearchField">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              name="memberQuery"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o email…"
              autoComplete="off"
            />
          </span>
        </label>
        <label className="membersStatus">
          <span className="eyebrow">Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos los estados</option>
            {statuses.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <p className="membersCount" role="status">
          {filtered.length} de {members.length} miembro(s)
        </p>
      </div>

      {filtered.length ? filtered.map((member) => (
        <article className="card span4 motionCard" key={member.id}>
          <UserRound color="var(--gold)" aria-hidden="true" />
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
                  {member.activeWorkoutPlan.daysPerWeek ?? "-"} días/semana · Mes {member.activeWorkoutPlan.currentMonth} · Semana {member.activeWorkoutPlan.currentWeek}
                </p>
                <small>Revisión: {member.activeWorkoutPlan.nextReviewOn || "sin fecha"} · {member.activeWorkoutPlan.reviewStatus}</small>
              </>
            ) : (
              <p>Sin entrenamiento asignado todavía.</p>
            )}
          </div>
          <div className="memberQuickLinks">
            <Link className="btn ghost sm" href="/coach/messages"><MessageSquareText size={15} /> Mensajes</Link>
            <Link className="btn ghost sm" href="/coach/checkins"><ClipboardCheck size={15} /> Check-ins</Link>
          </div>
          <Dialog
            triggerClassName="btn"
            trigger={<>Asignar / editar planes <Plus size={16} /></>}
            title={`Planes de ${member.fullName}`}
            description="Entrenamiento, nutrición, fase del bloque y próxima revisión."
          >
          <form action={assignAction} className="coachAssignForm">
            <input name="workspaceId" type="hidden" value={brandId} />
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
              <input name="assignmentGoal" defaultValue={member.activeWorkoutPlan?.assignmentGoal ?? member.goal} placeholder="Definición, fuerza, adherencia..." />
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
              <input name="currentWeek" defaultValue={String(member.activeWorkoutPlan?.currentWeek ?? 1)} min="1" max="12" type="number" inputMode="numeric" />
            </label>
            <label>
              Próxima revisión
              <input name="nextReviewOn" defaultValue={member.activeWorkoutPlan?.nextReviewOn ?? ""} type="date" />
            </label>
            <label>
              Nutrición
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
            <SubmitButton variant="primary" className="spanFull" successToast="Planes asignados">Asignar planes</SubmitButton>
          </form>
          </Dialog>
        </article>
      )) : (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          text="Ningún miembro coincide con la búsqueda o el filtro. Prueba con otro nombre, email o estado."
        />
      )}
    </>
  );
}
