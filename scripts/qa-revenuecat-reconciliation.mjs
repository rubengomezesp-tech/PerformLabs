import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

if (process.env.QA_ALLOW_REMOTE_MUTATION !== "true") {
  throw new Error("Set QA_ALLOW_REMOTE_MUTATION=true to run the isolated remote reconciliation test.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const workspaceDomain = (process.env.REVENUECAT_WORKSPACE_DOMAIN || "miembros.rubengomezcoaching.com").trim().toLowerCase();
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase production credentials are required.");

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const identity = {
  email: `qa.revenuecat.${stamp}@example.com`,
  appUserId: `qa_app_user_${stamp}`,
  eventId: `qa_event_${stamp}`,
  transactionId: `qa_transaction_${stamp}`,
  refundEventId: `qa_refund_${stamp}`,
};
let userId = null;
let memberId = null;
let packId = null;
let workspaceId = null;

async function expectOk(promise, label) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
}

async function cleanup() {
  if (workspaceId) {
    if (packId) await supabase.from("member_session_ledger").delete().eq("pack_id", packId);
    await supabase.from("revenuecat_webhook_events").delete().eq("id", identity.eventId);
    await supabase.from("revenuecat_customer_links").delete().eq("workspace_id", workspaceId).eq("app_user_id", identity.appUserId);
    await supabase.from("member_coaching_access").delete().eq("workspace_id", workspaceId).eq("external_transaction_id", identity.transactionId);
    await supabase.from("member_session_packs").delete().eq("workspace_id", workspaceId).eq("external_transaction_id", identity.transactionId);
  }
  if (memberId) await supabase.from("member_profiles").delete().eq("id", memberId);
  if (userId) await supabase.auth.admin.deleteUser(userId);
}

try {
  const domain = await expectOk(
    supabase.from("workspace_domains").select("workspace_id").eq("domain", workspaceDomain).maybeSingle(),
    "resolve workspace",
  );
  workspaceId = domain.data?.workspace_id ?? process.env.REVENUECAT_WORKSPACE_ID ?? null;
  assert.ok(workspaceId, `No workspace found for ${workspaceDomain}`);

  const auth = await supabase.auth.admin.createUser({
    email: identity.email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { source: "qa_revenuecat_reconciliation" },
  });
  if (auth.error || !auth.data.user) throw new Error(`create QA user: ${auth.error?.message ?? "no user"}`);
  userId = auth.data.user.id;

  const member = await expectOk(supabase.from("member_profiles").insert({
    workspace_id: workspaceId,
    user_id: userId,
    full_name: "[QA] RevenueCat Reconciliation",
    subscription_status: "expired",
    onboarding_status: "pending",
    timezone: "America/New_York",
  }).select("id").single(), "create QA member");
  memberId = member.data.id;

  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt.getTime() + 90 * 86_400_000);
  const pack = await expectOk(supabase.rpc("record_revenuecat_session_purchase", {
    p_workspace_id: workspaceId,
    p_member_profile_id: null,
    p_product_identifier: "rg_10_bundle_usd_799",
    p_external_transaction_id: identity.transactionId,
    p_external_event_id: identity.eventId,
    p_revenuecat_app_user_id: identity.appUserId,
    p_customer_email: identity.email,
    p_total_sessions: 10,
    p_purchased_at: purchasedAt.toISOString(),
    p_expires_at: expiresAt.toISOString(),
    p_metadata: { qa: true, stamp },
  }), "record pending pack");
  assert.equal(pack.data?.[0]?.created, true);
  assert.equal(pack.data?.[0]?.assigned, false);
  packId = pack.data[0].pack_id;

  await expectOk(supabase.from("member_coaching_access").insert({
    workspace_id: workspaceId,
    member_profile_id: null,
    source: "revenuecat",
    product_identifier: "rg_10_bundle_usd_799",
    external_transaction_id: identity.transactionId,
    revenuecat_app_user_id: identity.appUserId,
    customer_email: identity.email,
    starts_at: purchasedAt.toISOString(),
    ends_at: new Date(purchasedAt.getTime() + 30 * 86_400_000).toISOString(),
    status: "active",
    metadata: { qa: true, stamp },
  }), "record pending access");

  await expectOk(supabase.from("revenuecat_webhook_events").insert({
    id: identity.eventId,
    workspace_id: workspaceId,
    member_profile_id: null,
    app_user_id: identity.appUserId,
    event_type: "NON_RENEWING_PURCHASE",
    product_identifier: "rg_10_bundle_usd_799",
    transaction_id: identity.transactionId,
    environment: "QA",
    processing_status: "pending_assignment",
    payload: { api_version: "1.0", event: { id: identity.eventId, qa: true } },
  }), "record pending event");

  const assignment = await expectOk(supabase.rpc("assign_revenuecat_purchase", {
    p_workspace_id: workspaceId,
    p_event_id: identity.eventId,
    p_member_profile_id: memberId,
    p_actor_user_id: null,
  }), "assign purchase");
  assert.deepEqual(assignment.data?.[0], { assigned_events: 1, assigned_packs: 1, assigned_access: 1 });

  const [packAfter, accessAfter, eventAfter, linkAfter, memberAfter, ledgerAfter] = await Promise.all([
    expectOk(supabase.from("member_session_packs").select("member_profile_id,total_sessions,remaining_sessions,status").eq("id", packId).single(), "verify pack"),
    expectOk(supabase.from("member_coaching_access").select("member_profile_id,status").eq("external_transaction_id", identity.transactionId).single(), "verify access"),
    expectOk(supabase.from("revenuecat_webhook_events").select("member_profile_id,processing_status").eq("id", identity.eventId).single(), "verify event"),
    expectOk(supabase.from("revenuecat_customer_links").select("member_profile_id,assignment_source").eq("app_user_id", identity.appUserId).single(), "verify identity link"),
    expectOk(supabase.from("member_profiles").select("subscription_status").eq("id", memberId).single(), "verify member"),
    expectOk(supabase.from("member_session_ledger").select("event_type,delta").eq("pack_id", packId).order("created_at"), "verify ledger"),
  ]);
  assert.deepEqual(packAfter.data, { member_profile_id: memberId, total_sessions: 10, remaining_sessions: 10, status: "active" });
  assert.deepEqual(accessAfter.data, { member_profile_id: memberId, status: "active" });
  assert.deepEqual(eventAfter.data, { member_profile_id: memberId, processing_status: "processed" });
  assert.deepEqual(linkAfter.data, { member_profile_id: memberId, assignment_source: "manual" });
  assert.equal(memberAfter.data.subscription_status, "active");
  assert.deepEqual(ledgerAfter.data, [{ event_type: "purchase", delta: 10 }, { event_type: "pack_assigned", delta: 0 }]);

  const duplicateAssignment = await expectOk(supabase.rpc("assign_revenuecat_purchase", {
    p_workspace_id: workspaceId,
    p_event_id: identity.eventId,
    p_member_profile_id: memberId,
    p_actor_user_id: null,
  }), "repeat assignment");
  assert.deepEqual(duplicateAssignment.data?.[0], { assigned_events: 1, assigned_packs: 0, assigned_access: 0 });

  const duplicatePack = await expectOk(supabase.rpc("record_revenuecat_session_purchase", {
    p_workspace_id: workspaceId,
    p_member_profile_id: memberId,
    p_product_identifier: "rg_10_bundle_usd_799",
    p_external_transaction_id: identity.transactionId,
    p_external_event_id: identity.eventId,
    p_revenuecat_app_user_id: identity.appUserId,
    p_customer_email: identity.email,
    p_total_sessions: 10,
    p_purchased_at: purchasedAt.toISOString(),
    p_expires_at: expiresAt.toISOString(),
    p_metadata: { qa: true, duplicate: true },
  }), "repeat pack event");
  assert.equal(duplicatePack.data?.[0]?.created, false);
  assert.equal(duplicatePack.data?.[0]?.assigned, true);

  const ledgerBeforeRefund = await expectOk(supabase.from("member_session_ledger").select("id", { count: "exact" }).eq("pack_id", packId), "count ledger before refund");
  assert.equal(ledgerBeforeRefund.count, 2);
  const refund = await expectOk(supabase.rpc("refund_revenuecat_session_purchase", {
    p_workspace_id: workspaceId,
    p_external_transaction_id: identity.transactionId,
    p_external_event_id: identity.refundEventId,
    p_metadata: { qa: true, refund: true },
  }), "refund pack");
  assert.equal(refund.data, true);
  const duplicateRefund = await expectOk(supabase.rpc("refund_revenuecat_session_purchase", {
    p_workspace_id: workspaceId,
    p_external_transaction_id: identity.transactionId,
    p_external_event_id: identity.refundEventId,
    p_metadata: { qa: true, duplicate: true },
  }), "repeat refund");
  assert.equal(duplicateRefund.data, true);

  const [refundedPack, refundedLedger] = await Promise.all([
    expectOk(supabase.from("member_session_packs").select("remaining_sessions,status").eq("id", packId).single(), "verify refunded pack"),
    expectOk(supabase.from("member_session_ledger").select("event_type,delta").eq("pack_id", packId).order("created_at"), "verify refund ledger"),
  ]);
  assert.deepEqual(refundedPack.data, { remaining_sessions: 0, status: "refunded" });
  assert.deepEqual(refundedLedger.data, [
    { event_type: "purchase", delta: 10 },
    { event_type: "pack_assigned", delta: 0 },
    { event_type: "refund", delta: -10 },
  ]);

  console.log(JSON.stringify({
    ok: true,
    workspaceResolved: true,
    pendingPurchaseRecorded: true,
    assignmentActivated: true,
    duplicateAssignmentSafe: true,
    duplicatePackSafe: true,
    duplicateRefundSafe: true,
  }));
} finally {
  await cleanup();
}
