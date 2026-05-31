"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { sendMemberSupportMessageAction } from "./actions";

/**
 * Member chat composer. Submits the message via the server action, then clears
 * the field and refocuses so the member can keep typing — and supports
 * Enter-to-send (Shift+Enter for a newline) like a real messenger.
 */
export function ChatComposer({ workspaceId }: { workspaceId: string }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await sendMemberSupportMessageAction(formData);
        formRef.current?.reset();
        textareaRef.current?.focus();
      }}
      className="chatComposer"
    >
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <textarea
        ref={textareaRef}
        name="body"
        rows={1}
        placeholder="Escribe a tu coach…"
        required
        maxLength={2000}
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      />
      <SubmitButton className="btn primary chatSend" pendingLabel="">
        <Send size={16} />
      </SubmitButton>
    </form>
  );
}
