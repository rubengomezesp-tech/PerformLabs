import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { resolveRevenueCatMemberId } from "@/lib/repositories/session-credits";
import {
  getRevenueCatProduct,
  RG_PURCHASE_TERMS_URL,
  RG_PURCHASE_TERMS_VERSION,
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
  remainingSessions: number | null;
  accessStatus: string | null;
  accessEndsAt: string | null;
  customerDeliveryStatus: string | null;
  coachDeliveryStatus: string | null;
};

export type RevenueCatPurchaseDelivery = {
  id: string;
  workspaceId: string;
  eventId: string;
  memberProfileId: string | null;
  audience: "customer" | "coach";
  deliveryType: "purchase_confirmation" | "coach_purchase_alert";
  recipientEmail: string;
  attemptCount: number;
  payload: Record<string, Json | undefined>;
};

type PurchaseDeliveryRow = {
  id: string;
  workspace_id: string;
  event_id: string;
  member_profile_id: string | null;
  audience: RevenueCatPurchaseDelivery["audience"];
  delivery_type: RevenueCatPurchaseDelivery["deliveryType"];
  recipient_email: string;
  attempt_count: number;
  payload: Json;
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

function validEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export function purchaseEmailFromPayload(payload: Json): string | null {
  const attributes = payloadEvent(payload).subscriber_attributes;
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return null;
  const email = attributes.$email;
  if (!email || typeof email !== "object" || Array.isArray(email)) return null;
  const value = email.value;
  return typeof value === "string" && value.includes("@") ? value.trim().toLowerCase() : null;
}

export async function enqueueRevenueCatPurchaseDeliveries(input: {
  workspaceId: string;
  eventId: string;
  memberProfileId: string | null;
  productIdentifier: string;
  transactionId: string;
  appUserId: string | null;
  customerEmail: string | null;
  purchasedAt: string;
  processingStatus: "processed" | "pending_assignment";
}): Promise<number> {
  const product = getRevenueCatProduct(input.productIdentifier);
  if (!product) return 0;
  const customerEmail = validEmail(input.customerEmail);
  const coachEmail = validEmail(process.env.RG_COACH_PURCHASES_TO) ?? "rubengomezesp@gmail.com";
  const payload = {
    productIdentifier: input.productIdentifier,
    productLabel: product.name,
    priceCents: product.priceCents,
    currency: product.currency,
    purchaseType: product.purchaseType,
    sessions: product.sessions,
    sessionUnitPriceCents: product.sessionUnitPriceCents,
    trainingSubtotalCents: product.trainingSubtotalCents,
    coachingSubtotalCents: product.coachingSubtotalCents,
    sessionValidityDays: product.sessionValidityDays,
    coachingAccessDays: product.coachingAccessDays,
    transactionId: input.transactionId,
    appUserId: input.appUserId,
    customerEmail,
    purchasedAt: input.purchasedAt,
    processingStatus: input.processingStatus,
    termsUrl: RG_PURCHASE_TERMS_URL,
    termsVersion: RG_PURCHASE_TERMS_VERSION,
    checkoutProvider: "RevenueCat Billing",
  } satisfies Record<string, Json | undefined>;
  const rows = [{
    workspace_id: input.workspaceId,
    event_id: input.eventId,
    member_profile_id: input.memberProfileId,
    audience: "coach",
    delivery_type: "coach_purchase_alert",
    recipient_email: coachEmail,
    payload,
  }];
  if (customerEmail) {
    rows.push({
      workspace_id: input.workspaceId,
      event_id: input.eventId,
      member_profile_id: input.memberProfileId,
      audience: "customer",
      delivery_type: "purchase_confirmation",
      recipient_email: customerEmail,
      payload,
    });
  }
  const db: SupabaseClient = createServiceSupabaseClient();
  const { data, error } = await db
    .from("revenuecat_purchase_deliveries")
    .upsert(rows, { onConflict: "event_id,audience", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(`Unable to queue purchase communications: ${error.message}`);
  return data?.length ?? 0;
}

export async function claimRevenueCatPurchaseDeliveries(limit = 20): Promise<RevenueCatPurchaseDelivery[]> {
  const db: SupabaseClient = createServiceSupabaseClient();
  const { data, error } = await db.rpc("claim_revenuecat_purchase_deliveries", { p_limit: limit });
  if (error) throw new Error(`Unable to claim purchase communications: ${error.message}`);
  return ((data ?? []) as PurchaseDeliveryRow[]).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    eventId: row.event_id,
    memberProfileId: row.member_profile_id,
    audience: row.audience,
    deliveryType: row.delivery_type,
    recipientEmail: row.recipient_email,
    attemptCount: row.attempt_count,
    payload: payloadObject(row.payload),
  }));
}

export async function markRevenueCatPurchaseDelivery(input: {
  id: string;
  status: "sent" | "failed";
  providerMessageId?: string | null;
  error?: string | null;
  attemptCount: number;
}): Promise<void> {
  const db: SupabaseClient = createServiceSupabaseClient();
  const retryMinutes = Math.min(240, 5 * 2 ** Math.max(0, input.attemptCount - 1));
  const { error } = await db
    .from("revenuecat_purchase_deliveries")
    .update(input.status === "sent" ? {
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: input.providerMessageId ?? null,
      last_error: null,
      updated_at: new Date().toISOString(),
    } : {
      status: "failed",
      last_error: input.error?.slice(0, 240) || "delivery_failed",
      next_attempt_at: new Date(Date.now() + retryMinutes * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("status", "sending");
  if (error) throw new Error(`Unable to update purchase communication: ${error.message}`);
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
  const eventIds = (data ?? []).map((event) => event.id);
  const transactionIds = [...new Set((data ?? [])
    .map((event) => event.transaction_id)
    .filter((id): id is string => Boolean(id)))];
  const memberNameById = new Map<string, string>();
  if (memberIds.length) {
    const members = await supabase.from("member_profiles").select("id,full_name").in("id", memberIds);
    if (members.error) throw new Error(`Unable to load purchase members: ${members.error.message}`);
    for (const member of members.data ?? []) memberNameById.set(member.id, member.full_name);
  }

  const deliveryStatusByEvent = new Map<string, { customer: string | null; coach: string | null }>();
  const packByTransaction = new Map<string, { remaining: number; status: string }>();
  const accessByTransaction = new Map<string, { status: string; endsAt: string }>();
  const db: SupabaseClient = supabase;
  if (eventIds.length) {
    const deliveries = await db
      .from("revenuecat_purchase_deliveries")
      .select("event_id,audience,status")
      .in("event_id", eventIds);
    if (deliveries.error) throw new Error(`Unable to load purchase deliveries: ${deliveries.error.message}`);
    for (const delivery of deliveries.data ?? []) {
      const state = deliveryStatusByEvent.get(delivery.event_id) ?? { customer: null, coach: null };
      if (delivery.audience === "customer") state.customer = delivery.status;
      if (delivery.audience === "coach") state.coach = delivery.status;
      deliveryStatusByEvent.set(delivery.event_id, state);
    }
  }
  if (transactionIds.length) {
    const [packs, access] = await Promise.all([
      db.from("member_session_packs").select("external_transaction_id,remaining_sessions,status").eq("workspace_id", workspaceId).in("external_transaction_id", transactionIds),
      db.from("member_coaching_access").select("external_transaction_id,status,ends_at").eq("workspace_id", workspaceId).in("external_transaction_id", transactionIds),
    ]);
    if (packs.error || access.error) {
      throw new Error(`Unable to load purchase fulfillment: ${packs.error?.message ?? access.error?.message}`);
    }
    for (const pack of packs.data ?? []) if (pack.external_transaction_id) {
      packByTransaction.set(pack.external_transaction_id, { remaining: pack.remaining_sessions, status: pack.status });
    }
    for (const period of access.data ?? []) if (period.external_transaction_id) {
      accessByTransaction.set(period.external_transaction_id, { status: period.status, endsAt: period.ends_at });
    }
  }

  return (data ?? []).map((event) => {
    const product = getRevenueCatProduct(event.product_identifier);
    const purchasedAtMs = payloadNumber(event.payload, "purchased_at_ms")
      ?? payloadNumber(event.payload, "event_timestamp_ms");
    const delivery = deliveryStatusByEvent.get(event.id);
    const pack = event.transaction_id ? packByTransaction.get(event.transaction_id) : null;
    const access = event.transaction_id ? accessByTransaction.get(event.transaction_id) : null;
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
      remainingSessions: pack?.remaining ?? null,
      accessStatus: access?.status ?? null,
      accessEndsAt: access?.endsAt ?? null,
      customerDeliveryStatus: delivery?.customer ?? null,
      coachDeliveryStatus: delivery?.coach ?? null,
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

export async function reconcilePendingRevenueCatPurchases(limit = 100): Promise<{
  checked: number;
  assigned: number;
  unmatched: number;
  failed: number;
}> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("revenuecat_webhook_events")
    .select("id,workspace_id,app_user_id,payload")
    .eq("processing_status", "pending_assignment")
    .eq("environment", "PRODUCTION")
    .in("event_type", [...PURCHASE_EVENTS])
    .order("created_at", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 250));
  if (error) throw new Error(`Unable to load pending RevenueCat purchases: ${error.message}`);

  const result = { checked: data?.length ?? 0, assigned: 0, unmatched: 0, failed: 0 };
  for (const event of data ?? []) {
    try {
      const email = purchaseEmailFromPayload(event.payload);
      const memberProfileId = await resolveRevenueCatMemberId(event.workspace_id, [event.app_user_id], email);
      if (!memberProfileId) {
        result.unmatched += 1;
        continue;
      }
      await assignRevenueCatPurchase({
        workspaceId: event.workspace_id,
        eventId: event.id,
        memberProfileId,
        actorUserId: null,
      });
      result.assigned += 1;
    } catch (assignmentError) {
      result.failed += 1;
      console.error("Unable to auto-assign RevenueCat purchase", event.id, assignmentError);
    }
  }
  return result;
}
