"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function enterAppAction(formData: FormData) {
  const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim() : "";

  if (email) {
    const store = await cookies();
    store.set("performlabs_member_email", email, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
  }

  redirect("/app");
}
