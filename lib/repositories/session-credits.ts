import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { isUuid } from "@/lib/utils/uuid";

export const SESSION_CREDIT_PRODUCTS = {
  rg_session_single_usd_70: { sessions: 1, validityDays: 30 },
  rg_pack_8_usd_440: { sessions: 8, validityDays: 90 },
  rg_pack_12_usd_600: { sessions: 12, validityDays: 90 },
} as const;

export type SessionCreditProductId = keyof typeof SESSION_CREDIT_PRODUCTS;
export type SessionLedgerEventType =
  | "purchase"
  | "session_used"
  | "coach_credit"
  | "coach_debit"
  | "refund"
  | "pack_assigned"
  | "void";

export type SessionCreditPack = {
  id: string;
  productIdentifier: string;
  source: string;
  total: number;
  remaining: number;
  purchasedAt: string;
  expiresAt: string | null;
  status: string;
};

export type SessionCreditMovement = {
  id: string;
  eventType: SessionLedgerEventType;
  delta: number;
  note: string | null;
  createdAt: string;
};

export type MemberSessionBalance = {
  remaining: number;
  reserved: number;
  available: number;
  totalGranted: number;
  totalUsed: number;
  nextExpiryAt: string | null;
  packs: SessionCreditPack[];
  movements: SessionCreditMovement[];
};

const EMPTY_BALANCE: MemberSessionBalance = {
  remaining: 0,
  reserved: 0,
  available: 0,
  totalGranted: 0,
  totalUsed: 0,
  nextExpiryAt: null,
  packs: [],
  movements: [],
};

export function getSessionCreditProduct(productId: string | null | undefined) {
  if (!productId) return null;
  return SESSION_CREDIT_PRODUCTS[productId as SessionCreditProductId] ?? null;
}

export function sessionPackExpiry(purchasedAtMs: number, validityDays: number): string {
  return new Date(purchasedAtMs + validityDays * 86_400_000).toISOString();
}

export function revenueCatCustomerEmail(attributes: unknown): string | null {
  if (!attributes || typeof attributes !== "object") return null;
  const record = attributes as Record<string, unknown>;
  const email = record.$email;
  if (!email || typeof email !== "object") return null;
  const value = (email as { value?: unknown }).value;
  return typeof value === "string" && value.includes("@") ? value.trim().toLowerCase() : null;
}

async function readMemberBalance(workspaceId: string, memberProfileId: string): Promise<MemberSessionBalance> {
  if (!getSupabaseServiceEnv().ok || !isUuid(workspaceId) || !isUuid(memberProfileId)) return EMPTY_BALANCE;
  const supabase = createServiceSupabaseClient();
  const [packResult, ledgerResult, reservationResult] = await Promise.all([
    supabase
      .from("member_session_packs")
      .select("id,product_identifier,source,total_sessions,remaining_sessions,purchased_at,expires_at,status")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("member_session_ledger")
      .select("id,event_type,delta,note,created_at")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .order("created_at", { ascending: false }),
    supabase
      .from("personal_training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .eq("status", "scheduled")
      .eq("credit_state", "reserved"),
  ]);

  if (packResult.error) throw new Error(`Unable to load session packs: ${packResult.error.message}`);
  if (ledgerResult.error) throw new Error(`Unable to load session movements: ${ledgerResult.error.message}`);
  if (reservationResult.error) throw new Error(`Unable to load session reservations: ${reservationResult.error.message}`);

  const now = Date.now();
  const packs = (packResult.data ?? []).map((pack) => ({
    id: pack.id,
    productIdentifier: pack.product_identifier,
    source: pack.source,
    total: pack.total_sessions,
    remaining: pack.remaining_sessions,
    purchasedAt: pack.purchased_at,
    expiresAt: pack.expires_at,
    status: pack.status,
  }));
  const allMovements = (ledgerResult.data ?? []).map((movement) => ({
    id: movement.id,
    eventType: movement.event_type as SessionLedgerEventType,
    delta: movement.delta,
    note: movement.note,
    createdAt: movement.created_at,
  }));
  const active = packs.filter((pack) =>
    pack.status === "active"
    && pack.remaining > 0
    && (!pack.expiresAt || new Date(pack.expiresAt).getTime() > now),
  );
  const nextExpiryAt = active
    .map((pack) => pack.expiresAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0] ?? null;

  const remaining = active.reduce((sum, pack) => sum + pack.remaining, 0);
  const reserved = reservationResult.count ?? 0;
  return {
    remaining,
    reserved,
    available: Math.max(remaining - reserved, 0),
    totalGranted: allMovements.filter((movement) => movement.delta > 0).reduce((sum, movement) => sum + movement.delta, 0),
    totalUsed: Math.abs(allMovements
      .filter((movement) => movement.eventType === "session_used" || movement.eventType === "coach_debit")
      .reduce((sum, movement) => sum + movement.delta, 0)),
    nextExpiryAt,
    packs,
    movements: allMovements.slice(0, 20),
  };
}

export async function getMemberSessionBalance(workspaceIdHint?: string): Promise<MemberSessionBalance> {
  const context = await getMemberContext(workspaceIdHint);
  if (!context) return EMPTY_BALANCE;
  return readMemberBalance(context.workspaceId, context.memberProfileId);
}

export async function getManagedMemberSessionBalance(
  workspaceId: string,
  memberProfileId: string,
): Promise<MemberSessionBalance> {
  return readMemberBalance(workspaceId, memberProfileId);
}

export async function adjustManagedMemberSessions(input: {
  workspaceId: string;
  memberProfileId: string;
  delta: number;
  note?: string | null;
  expiresAt?: string | null;
  actorUserId?: string | null;
  eventType?: "session_used" | "coach_credit" | "coach_debit";
}): Promise<number> {
  if (!getSupabaseServiceEnv().ok) return 0;
  if (!isUuid(input.workspaceId) || !isUuid(input.memberProfileId)) throw new Error("Invalid member scope");
  if (!Number.isInteger(input.delta) || input.delta === 0 || Math.abs(input.delta) > 500) {
    throw new Error("Session adjustment must be a non-zero whole number");
  }
  const eventType = input.eventType ?? (input.delta > 0 ? "coach_credit" : "coach_debit");
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("adjust_member_session_balance", {
    p_workspace_id: input.workspaceId,
    p_member_profile_id: input.memberProfileId,
    p_delta: input.delta,
    p_event_type: eventType,
    p_note: input.note ?? (null as unknown as string),
    p_expires_at: input.expiresAt ?? (null as unknown as string),
    p_actor_user_id: input.actorUserId ?? (null as unknown as string),
  });
  if (error) throw new Error(`Unable to adjust session balance: ${error.message}`);
  return Number(data ?? 0);
}

export async function resolveRevenueCatWorkspaceId(): Promise<string | null> {
  const explicit = process.env.REVENUECAT_WORKSPACE_ID?.trim();
  if (isUuid(explicit)) return explicit;
  if (!getSupabaseServiceEnv().ok) return null;
  const domain = (process.env.REVENUECAT_WORKSPACE_DOMAIN || "miembros.rubengomezcoaching.com").trim().toLowerCase();
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("workspace_domains")
    .select("workspace_id")
    .eq("domain", domain)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

export async function resolveRevenueCatMemberId(
  workspaceId: string,
  appUserIds: Array<string | null | undefined>,
): Promise<string | null> {
  const candidates = [...new Set(appUserIds.filter((value): value is string => isUuid(value)))];
  if (!candidates.length || !getSupabaseServiceEnv().ok) return null;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("id", candidates)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function recordRevenueCatSessionPurchase(input: {
  workspaceId: string;
  memberProfileId: string | null;
  productIdentifier: SessionCreditProductId;
  transactionId: string;
  eventId: string;
  appUserId: string;
  customerEmail: string | null;
  purchasedAtMs: number;
  payload: Json;
}): Promise<{ packId: string; created: boolean; assigned: boolean }> {
  const product = SESSION_CREDIT_PRODUCTS[input.productIdentifier];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("record_revenuecat_session_purchase", {
    p_workspace_id: input.workspaceId,
    p_member_profile_id: input.memberProfileId ?? (null as unknown as string),
    p_product_identifier: input.productIdentifier,
    p_external_transaction_id: input.transactionId,
    p_external_event_id: input.eventId,
    p_revenuecat_app_user_id: input.appUserId,
    p_customer_email: input.customerEmail ?? (null as unknown as string),
    p_total_sessions: product.sessions,
    p_purchased_at: new Date(input.purchasedAtMs).toISOString(),
    p_expires_at: sessionPackExpiry(input.purchasedAtMs, product.validityDays),
    p_metadata: input.payload,
  });
  if (error) throw new Error(`Unable to record RevenueCat pack: ${error.message}`);
  const result = data?.[0];
  if (!result) throw new Error("RevenueCat pack RPC returned no result");
  return { packId: result.pack_id, created: result.created, assigned: result.assigned };
}

export async function refundRevenueCatSessionPurchase(input: {
  workspaceId: string;
  transactionId: string;
  eventId: string;
  payload: Json;
}): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("refund_revenuecat_session_purchase", {
    p_workspace_id: input.workspaceId,
    p_external_transaction_id: input.transactionId,
    p_external_event_id: input.eventId,
    p_metadata: input.payload,
  });
  if (error) throw new Error(`Unable to refund RevenueCat pack: ${error.message}`);
  return Boolean(data);
}

export async function recordRevenueCatWebhookEvent(input: {
  id: string;
  workspaceId: string;
  memberProfileId: string | null;
  appUserId: string | null;
  eventType: string;
  productIdentifier: string | null;
  transactionId: string | null;
  environment: string | null;
  processingStatus: "processed" | "pending_assignment" | "ignored" | "failed";
  payload: Json;
  errorMessage?: string | null;
}): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("revenuecat_webhook_events").upsert({
    id: input.id,
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    app_user_id: input.appUserId,
    event_type: input.eventType,
    product_identifier: input.productIdentifier,
    transaction_id: input.transactionId,
    environment: input.environment,
    processing_status: input.processingStatus,
    payload: input.payload,
    error_message: input.errorMessage ?? null,
    processed_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Unable to record RevenueCat webhook: ${error.message}`);
}
