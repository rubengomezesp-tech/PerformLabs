"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Layers, Mail, MessageSquareText, Search, SlidersHorizontal, UserRound, Users } from "lucide-react";
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
  bulkAssignAction,
  resendInvitationAction,
}: {
  brandId: string;
  members: ManagedMember[];
  workoutTemplates: PlanOption[];
  dietTemplates: DietOption[];
  bulkAssignAction: (formData: FormData) => void | Promise<void>;
  resendInvitationAction?: (formData: FormData) => void | Promise<void>;
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

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const filteredIds = filtered.map((member) => member.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });
  const selectedIds = [...selected];

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
        <label className="membersSelectAll">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAllFiltered}
            aria-label="Seleccionar todos los miembros filtrados"
          />
          <span>Seleccionar todos</span>
        </label>
      </div>

      {selected.size > 0 ? (
        <div className="card span12 membersBulkBar" role="region" aria-label="Acciones en lote">
          <span><strong>{selected.size}</strong> seleccionado(s)</span>
          <div className="bulkActions">
            <Dialog
              triggerClassName="btn primary"
              trigger={<><Layers size={16} /> Asignar plan</>}
              title={`Asignar plan a ${selected.size} miembro(s)`}
              description="Se aplica el mismo entrenamiento y/o nutrición a todos los seleccionados."
            >
              <form action={bulkAssignAction} className="coachAssignForm">
                <input name="workspaceId" type="hidden" value={brandId} />
                {selectedIds.map((id) => (
                  <input key={id} name="memberProfileIds" type="hidden" value={id} />
                ))}
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
                  Nutrición
                  <select name="dietTemplateId" defaultValue="">
                    <option value="">Sin cambio</option>
                    {dietTemplates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </label>
                <label className="spanFull">
                  Objetivo de fase
                  <input name="assignmentGoal" placeholder="Definición, fuerza, adherencia..." />
                </label>
                <p className="membersBulkHint spanFull">Solo se publicará en clientes con valoración profesional completa · Mes 1 · Semana 1.</p>
                <SubmitButton variant="primary" className="spanFull" successToast="Asignación en lote procesada">
                  Asignar a {selected.size}
                </SubmitButton>
              </form>
            </Dialog>
            <button type="button" className="btn ghost sm" onClick={clearSelection}>Limpiar selección</button>
          </div>
        </div>
      ) : null}

      {filtered.length ? filtered.map((member) => (
        <article className={`card span4 motionCard memberCard${selected.has(member.id) ? " memberCardSelected" : ""}`} key={member.id}>
          <label className="memberSelect">
            <input
              type="checkbox"
              checked={selected.has(member.id)}
              onChange={() => toggle(member.id)}
              aria-label={`Seleccionar ${member.fullName}`}
            />
          </label>
          <UserRound color="var(--gold)" aria-hidden="true" />
          <h2>{member.fullName}</h2>
          <p><Mail size={15} /> {member.email}</p>
          <ul className="list">
            <li className="row">Objetivo <span>{member.goal || "Pendiente"}</span></li>
            <li className="row">Estado <span className="tag">{member.subscriptionStatus}</span></li>
            <li className="row">Onboarding <span>{member.onboardingStatus === "invited" ? (member.invitationSentAt ? `Invitado · enviada ${member.invitationSentAt.slice(0, 10)}` : "Invitado · sin enviar") : member.onboardingStatus}</span></li>
            {member.onboardingStatus === "invited" && resendInvitationAction ? (
              <li className="row">
                Invitación
                <form action={resendInvitationAction}>
                  <input name="workspaceId" type="hidden" value={brandId} />
                  <input name="memberProfileId" type="hidden" value={member.id} />
                  <SubmitButton variant="ghost" successToast="Invitación enviada">{member.invitationSentAt ? "Reenviar" : "Enviar invitación"}</SubmitButton>
                </form>
              </li>
            ) : null}
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
            <Link className="btn ghost sm" href={`/coach/members/${member.id}`}><UserRound size={15} /> Ver ficha</Link>
            <Link className="btn ghost sm" href="/coach/messages"><MessageSquareText size={15} /> Mensajes</Link>
            <Link className="btn ghost sm" href="/coach/checkins"><ClipboardCheck size={15} /> Check-ins</Link>
          </div>
          <Link className="btn primary" href={`/coach/members/${member.id}/control`}><SlidersHorizontal size={16} /> Preparar y publicar plan</Link>
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
