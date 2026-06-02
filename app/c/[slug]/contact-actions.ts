"use server";

import { redirect } from "next/navigation";
import { createCoachInquiry } from "@/lib/repositories/coach-inquiries";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Contact / 1-1 coaching application from a coach's public site. Resolves the workspace
 * from the slug (never trusts a posted id), captures the inquiry, and redirects back with
 * a status. redirect() is called outside the try so its control-flow throw isn't swallowed.
 */
export async function submitCoachInquiryAction(formData: FormData): Promise<void> {
  const slug = readText(formData, "slug");
  const kind = readText(formData, "kind") === "coaching" ? "coaching" : "contact";
  const basePath = kind === "coaching" ? `/c/${slug}/1-1-coaching` : `/c/${slug}/contacto`;

  const brand = await getWorkspaceBrand(slug);
  let ok = false;
  if (brand.id !== ZERO_UUID) {
    try {
      await createCoachInquiry({
        workspaceId: brand.id,
        fullName: readText(formData, "fullName"),
        email: readText(formData, "email"),
        message: readText(formData, "message"),
        kind,
      });
      ok = true;
    } catch {
      ok = false;
    }
  }

  redirect(`${basePath}?status=${ok ? "sent" : "error"}`);
}
