import type { Json } from "@/lib/supabase/database.types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  getRevenueCatProduct,
  revenueCatProductLabel,
} from "@/lib/revenuecat/products";

const PURCHASE_EVENTS = ["NON_RENEWING_PURCHASE", "INITIAL_PURCHASE", "RENEWAL"] as const;
const LIVE_ACCESS_STATUSES = ["active", "past_due", "cancelled"] as const;

export type RevenueCatPurchase = {
  id: string;
  eventType: string;
  productIdentifier: string | null;
  productLabel: string;
  amountCents: number | null;
  currency: string | null;
  sessions: number;
  appUserId: string | null;
  customerEmail: string | null;
  transactionId: string | null;
  memberProfileId: string | null;
  memberName: string | null;
  processingStatus: string;
  purchasedAt: string;
  createdAt: string;
  errorMessage: string | null;
};

function payloadObject(payload: Json): Record<string, Json | undefined> {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : {};
}

function payloadEvent(payload: Json): Record<string, Json | undefined> {
  const event = payloadObject(payload).event;
  return event && typeof event === "object" && !Array.isArray(event) ? event : {};
}

function payloadNumber(payload: Json, key: string): number | null {
  const value = payloadEvent(payload)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function purchaseEmailFromPayload(payload: Json): string | null {
  const attributes = payloadEvent(payload).subscriber_attributes;
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return null;
  const email = attributes.$email;
  if (!email || typeof email !== "object" || Array.isArray(email)) return null;
  const value = email.value;
  return typeof value === "string" && value.includes("@") ? value.trim().toLowerCase() : null;
}

export async function listRevenueCatPurchases(workspaceId: string): Promise<RevenueCatPurchase[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("revenuecat_webhook_events")
    .select("id,event_type,product_identifier,app_user_id,transaction_id,member_profile_id,processing_status,payload,created_at,error_message")
    .eq("workspace_id", workspaceId)
    .in("event_type", [...PURCHASE_EVENTS])
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to load RevenueCat purchases: ${error.message}`);

  const memberIds = [...new Set((data ?? [])
    .map((event) => event.member_profile_id)
    .filter((id): id is string => Boolean(id)))];
  const memberNameById = new Map<string, string>();
  if (memberIds.length) {
    const members = await supabase.from("member_profiles").select("id,full_name").in("id", memberIds);
    if (members.error) throw new Error(`Unable to load purchase members: ${members.error.message}`);
    for (const member of members.data ?? []) memberNameById.set(member.id, member.full_name);
  }

  return (data ?? []).map((event) => {
    const product = getRevenueCatProduct(event.product_identifier);
    const purchasedAtMs = payloadNumber(event.payload, "purchased_at_ms")
      ?? payloadNumber(event.payload, "event_timestamp_ms");
    return {
      id: event.id,
      eventType: event.event_type,
      productIdentifier: event.product_identifier,
      productLabel: revenueCatProductLabel(event.product_identifier),
      amountCents: product?.priceCents ?? null,
      currency: product?.currency ?? null,
      sessions: product?.sessions ?? 0,
      appUserId: event.app_user_id,
      customerEmail: purchaseEmailFromPayload(event.payload),
      transactionId: event.transaction_id,
      memberProfileId: event.member_profile_id,
      memberName: event.member_profile_id ? memberNameById.get(event.member_profile_id) ?? null : null,
      processingStatus: event.processing_status,
      purchasedAt: purchasedAtMs ? new Date(purchasedAtMs).toISOString() : event.created_at,
      createdAt: event.created_at,
      errorMessage: event.error_message,
    };
  });
}

export async function linkRevenueCatCustomer(input: {
  workspaceId: string;
  appUserIds: Array<string | null | undefined>;
  memberProfileId: string;
  customerEmail: string | null;
  source: "automatic" | "manual" | "direct_id" | "email";
  actorUserId?: string | null;
}): Promise<void> {
  const appUserIds = [...new Set(input.appUserIds
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value)))];
  if (!appUserIds.length) return;
  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("revenuecat_customer_links")
    .select("app_user_id,member_profile_id")
    .eq("workspace_id", input.workspaceId)
    .in("app_user_id", appUserIds);
  if (existing.error) throw new Error(`Unable to verify RevenueCat identity links: ${existing.error.message}`);
  if ((existing.data ?? []).some((link) => link.member_profile_id !== input.memberProfileId)) {
    throw new Error("RevenueCat identity is already assigned to a different member");
  }
  const { error } = await supabase.from("revenuecat_customer_links").upsert(
    appUserIds.map((appUserId) => ({
      workspace_id: input.workspaceId,
      app_user_id: appUserId,
      member_profile_id: input.memberProfileId,
      customer_email: input.customerEmail,
      assignment_source: input.source,
      assigned_by: input.actorUserId ?? null,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "workspace_id,app_user_id" },
  );
  if (error) throw new Error(`Unable to save RevenueCat identity link: ${error.message}`);
}

export async function recordRevenueCatCoachingAccess(input: {
  workspaceId: string;
  memberProfileId: string | null;
  productIdentifier: string;
  transactionId: string;
  originalTransactionId: string | null;
  appUserId: string | null;
  customerEmail: string | null;
  startsAt: string;
  endsAt: string;
  payload: Json;
}): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("member_coaching_access")
    .select("member_profile_id")
    .eq("workspace_id", input.workspaceId)
    .eq("source", "revenuecat")
    .eq("external_transaction_id", input.transactionId)
    .maybeSingle();
  if (existing.error) throw new Error(`Unable to verify coaching access: ${existing.error.message}`);
  const { error } = await supabase.from("member_coaching_access").upsert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId ?? existing.data?.member_profile_id ?? null,
    source: "revenuecat",
    product_identifier: input.productIdentifier,
    external_transaction_id: input.transactionId,
    original_transaction_id: input.originalTransactionId,
    revenuecat_app_user_id: input.appUserId,
    customer_email: input.customerEmail,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: new Date(input.endsAt).getTime() > Date.now() ? "active" : "expired",
    metadata: input.payload,
    updated_at: new Date().toISOString(),
  }, { onConflict: "workspace_id,source,external_transaction_id" });
  if (error) throw new Error(`Unable to record coaching access: ${error.message}`);
}

async function syncMemberAccessStatus(workspaceId: string, memberProfileId: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { count, error } = await supabase
    .from("member_coaching_access")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .in("status", [...LIVE_ACCESS_STATUSES])
    .gt("ends_at", new Date().toISOString());
  if (error) throw new Error(`Unable to verify coaching access: ${error.message}`);
  const { error: updateError } = await supabase
    .from("member_profiles")
    .update({ subscription_status: (count ?? 0) > 0 ? "active" : "expired", updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", memberProfileId);
  if (updateError) throw new Error(`Unable to sync member access: ${updateError.message}`);
}

export async function updateRevenueCatCoachingAccess(input: {
  workspaceId: string;
  appUserIds: Array<string | null | undefined>;
  transactionIds: Array<string | null | undefined>;
  status: "past_due" | "cancelled" | "expired" | "refunded";
}): Promise<number> {
  const supabase = createServiceSupabaseClient();
  const appUserIds = [...new Set(input.appUserIds.filter((value): value is string => Boolean(value)))];
  const transactionIds = [...new Set(input.transactionIds.filter((value): value is string => Boolean(value)))];
  const accessIds = new Set<string>();
  if (appUserIds.length) {
    const byUser = await supabase
      .from("member_coaching_access")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .in("revenuecat_app_user_id", appUserIds);
    if (byUser.error) throw new Error(`Unable to locate coaching access: ${byUser.error.message}`);
    for (const row of byUser.data ?? []) accessIds.add(row.id);
  }
  if (transactionIds.length) {
    const [byTransaction, byOriginal] = await Promise.all([
      supabase.from("member_coaching_access").select("id").eq("workspace_id", input.workspaceId).in("external_transaction_id", transactionIds),
      supabase.from("member_coaching_access").select("id").eq("workspace_id", input.workspaceId).in("original_transaction_id", transactionIds),
    ]);
    if (byTransaction.error || byOriginal.error) {
      throw new Error(`Unable to locate coaching access: ${byTransaction.error?.message ?? byOriginal.error?.message}`);
    }
    for (const row of [...(byTransaction.data ?? []), ...(byOriginal.data ?? [])]) accessIds.add(row.id);
  }
  if (!accessIds.size) return 0;
  const { data, error } = await supabase
    .from("member_coaching_access")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .in("id", [...accessIds])
    .select("member_profile_id");
  if (error) throw new Error(`Unable to update coaching access: ${error.message}`);
  const memberIds = [...new Set((data ?? []).map((row) => row.member_profile_id).filter((id): id is string => Boolean(id)))];
  await Promise.all(memberIds.map((memberId) => syncMemberAccessStatus(input.workspaceId, memberId)));
  return data?.length ?? 0;
}

export async function assignRevenueCatPurchase(input: {
  workspaceId: string;
  eventId: string;
  memberProfileId: string;
  actorUserId: string | null;
}): Promise<{ assignedEvents: number; assignedPacks: number; assignedAccess: number }> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("assign_revenuecat_purchase", {
    p_workspace_id: input.workspaceId,
    p_event_id: input.eventId,
    p_member_profile_id: input.memberProfileId,
    p_actor_user_id: input.actorUserId,
  });
  if (error) throw new Error(`Unable to assign RevenueCat purchase: ${error.message}`);
  const result = data?.[0];
  if (!result) throw new Error("RevenueCat assignment returned no result");
  return {
    assignedEvents: result.assigned_events,
    assignedPacks: result.assigned_packs,
    assignedAccess: result.assigned_access,
  };
}

export async function reconcileExpiredRevenueCatAccess(): Promise<{ expired: number; members: number }> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("member_coaching_access")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .in("status", [...LIVE_ACCESS_STATUSES])
    .lte("ends_at", new Date().toISOString())
    .select("workspace_id,member_profile_id");
  if (error) throw new Error(`Unable to expire coaching access: ${error.message}`);
  const members = new Map<string, string>();
  for (const row of data ?? []) if (row.member_profile_id) members.set(row.member_profile_id, row.workspace_id);
  await Promise.all([...members].map(([memberId, workspaceId]) => syncMemberAccessStatus(workspaceId, memberId)));
  return { expired: data?.length ?? 0, members: members.size };
}
