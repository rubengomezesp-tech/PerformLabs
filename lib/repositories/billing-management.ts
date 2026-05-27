import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type ManagedProduct = {
  id: string;
  name: string;
  description: string;
  includedModules: string[];
  status: string;
};

export type ManagedPricingPlan = {
  id: string;
  productId: string;
  name: string;
  priceCents: number;
  currency: string;
  billingInterval: string;
  trialDays: number;
  status: string;
};

export type ProductInput = {
  workspaceId: string;
  name: string;
  description: string;
  includedModules: string;
};

export type PricingPlanInput = {
  workspaceId: string;
  productId: string;
  name: string;
  price: string;
  currency: string;
  billingInterval: string;
  trialDays: string;
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePriceToCents(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function parseInteger(value: string, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function listManagedProducts(workspaceId?: string): Promise<ManagedProduct[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("product_catalog_items")
    .select("id,name,description,included_modules,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load products", error.message);
    return [];
  }

  return (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    includedModules: product.included_modules,
    status: product.status,
  }));
}

export async function listManagedPricingPlans(workspaceId?: string): Promise<ManagedPricingPlan[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("id,product_id,name,price_cents,currency,billing_interval,trial_days,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load pricing plans", error.message);
    return [];
  }

  return (data ?? []).map((plan) => ({
    id: plan.id,
    productId: plan.product_id,
    name: plan.name,
    priceCents: plan.price_cents,
    currency: plan.currency,
    billingInterval: plan.billing_interval,
    trialDays: plan.trial_days,
    status: plan.status,
  }));
}

export async function createManagedProduct(input: ProductInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de crear productos.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("product_catalog_items").insert({
    workspace_id: input.workspaceId,
    name,
    description: input.description.trim() || null,
    included_modules: splitList(input.includedModules),
    status: "draft",
  });

  if (error) {
    throw new Error(`No se pudo crear el producto: ${error.message}`);
  }
}

export async function createManagedPricingPlan(input: PricingPlanInput) {
  if (!input.workspaceId || !input.productId) {
    throw new Error("Selecciona marca y producto antes de crear un plan.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del plan es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("pricing_plans").insert({
    workspace_id: input.workspaceId,
    product_id: input.productId,
    name,
    price_cents: parsePriceToCents(input.price),
    currency: input.currency.trim().toLowerCase() || "eur",
    billing_interval: input.billingInterval.trim() || "month",
    trial_days: parseInteger(input.trialDays),
    status: "draft",
  });

  if (error) {
    throw new Error(`No se pudo crear el plan: ${error.message}`);
  }
}
