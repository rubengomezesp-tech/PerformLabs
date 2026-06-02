import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export type CoachInquiryInput = {
  workspaceId: string;
  fullName: string;
  email: string;
  message?: string;
  kind?: "contact" | "coaching";
};

/**
 * Capture a contact message or a 1-1 coaching application from a coach's public sales
 * site, scoped to that coach's workspace. Validates before writing; throws a friendly
 * message the form surfaces. `coach_inquiries` post-dates the generated database.types,
 * so the client is cast (same pattern as the rest of the post-types tables).
 */
export async function createCoachInquiry(input: CoachInquiryInput): Promise<void> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!input.workspaceId || input.workspaceId === ZERO_UUID) throw new Error("Marca no válida.");
  if (!fullName) throw new Error("Escribe tu nombre.");
  if (!email || !email.includes("@")) throw new Error("Introduce un email válido.");
  if (!getSupabaseServiceEnv().ok) throw new Error("El formulario no está disponible ahora mismo.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceSupabaseClient() as any;
  const { error } = await supabase.from("coach_inquiries").insert({
    workspace_id: input.workspaceId,
    full_name: fullName,
    email,
    message: input.message?.trim() || "",
    kind: input.kind === "coaching" ? "coaching" : "contact",
  });

  if (error) throw new Error(`No se pudo enviar tu mensaje: ${error.message}`);
}
