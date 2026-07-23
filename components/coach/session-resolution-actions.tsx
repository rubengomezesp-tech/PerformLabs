"use client";

import { Ban, CheckCircle2, XCircle } from "lucide-react";
import { resolvePersonalTrainingSessionAction } from "@/app/coach/sessions/actions";
import { SubmitButton } from "@/components/ui";

type Resolution = "completed" | "cancel_policy" | "no_show";

export function SessionResolutionActions({
  workspaceId,
  sessionId,
  canClose,
  cancellationConsumes,
  eventIds,
  locale,
}: {
  workspaceId: string;
  sessionId: string;
  canClose: boolean;
  cancellationConsumes: boolean;
  eventIds: Record<Resolution, string>;
  locale: "es" | "en";
}) {
  const english = locale === "en";
  const actions: Array<{ resolution: Resolution; label: string; confirm: string; icon: typeof CheckCircle2; tone: string; disabled?: boolean }> = [
    {
      resolution: "completed",
      label: english ? "Completed" : "Realizada",
      confirm: english ? "Mark completed and consume one session?" : "¿Marcar como realizada y consumir una sesión?",
      icon: CheckCircle2,
      tone: "primary",
      disabled: !canClose,
    },
    {
      resolution: "cancel_policy",
      label: cancellationConsumes
        ? (english ? "Late cancellation" : "Cancelación tardía")
        : (english ? "Cancel on time" : "Cancelar a tiempo"),
      confirm: cancellationConsumes
        ? (english ? "The policy will consume one session. Continue?" : "La política consumirá una sesión. ¿Continuar?")
        : (english ? "Cancel and release the reserved session?" : "¿Cancelar y liberar la sesión reservada?"),
      icon: XCircle,
      tone: cancellationConsumes ? "danger" : "ghost",
    },
    {
      resolution: "no_show",
      label: "No-show",
      confirm: english ? "Mark no-show and consume one session?" : "¿Marcar no-show y consumir una sesión?",
      icon: Ban,
      tone: "danger",
      disabled: !canClose,
    },
  ];

  return (
    <div className="sessionResolutionActions">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <form
            action={resolvePersonalTrainingSessionAction}
            key={action.resolution}
            onSubmit={(event) => {
              if (!window.confirm(action.confirm)) event.preventDefault();
            }}
          >
            <input name="workspaceId" type="hidden" value={workspaceId} />
            <input name="sessionId" type="hidden" value={sessionId} />
            <input name="resolution" type="hidden" value={action.resolution} />
            <input name="eventId" type="hidden" value={eventIds[action.resolution]} />
            <SubmitButton
              size="sm"
              variant={action.tone as "primary" | "danger" | "ghost"}
              disabled={action.disabled}
              aria-label={`${action.label}${action.disabled ? (english ? ": available after the session starts" : ": disponible cuando empiece la sesión") : ""}`}
              title={action.disabled ? (english ? "Available after the session starts" : "Disponible cuando empiece la sesión") : undefined}
            >
              <Icon size={14} /> {action.label}
            </SubmitButton>
          </form>
        );
      })}
    </div>
  );
}
