"use server";

import { redirect } from "next/navigation";
import { createSalesLead } from "@/lib/repositories/sales-leads";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitLeadAction(formData: FormData) {
  await createSalesLead({
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    brandName: readText(formData, "brandName"),
    websiteUrl: readText(formData, "websiteUrl"),
    monthlyClients: readText(formData, "monthlyClients"),
    mainGoal: readText(formData, "mainGoal"),
    notes: readText(formData, "notes"),
  });

  redirect("/gracias");
}
