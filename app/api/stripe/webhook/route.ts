import { NextResponse, type NextRequest } from "next/server";
import {
  isCoachPlanInWorkspace,
  isMemberInWorkspace,
  recordPlatformFeeEvent,
  setMemberStripeCustomer,
  setMemberSubscriptionStatus,
  upsertMemberSubscription,
} from "@/lib/repositories/member-subscriptions";
import { provisionPaidMember } from "@/lib/repositories/member-management";
import { fireMemberEventNotification } from "@/lib/notifications/events";
import {
  deleteWebhookEvent,
  findWorkspaceByStripeAccount,
  recordWebhookEvent,
  upsertPlatformSubscription,
  upsertStripeAccount,
} from "@/lib/repositories/stripe-billing";
import { retrieveSubscription, verifyStripeSignature } from "@/lib/stripe/client";
import { getStripeEnv, isStripeConfigured } from "@/lib/stripe/env";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  account?: string;
  data: { object: Record<string, any> };
};

function toIso(epochSeconds: unknown): string | null {
  return typeof epochSeconds === "number" ? new Date(epochSeconds * 1000).toISOString() : null;
}

export async function POST(request: NextRequest) {
  const { webhookSecret } = getStripeEnv();
  if (!isStripeConfigured() || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }
  // Without the service-role DB we'd verify the signature, no-op every downstream
  // write, and still ACK 200 — silently dropping paid events. 503 makes Stripe
  // retry later (when the env is fixed) instead of losing the event.
  if (!getSupabaseServiceEnv().ok) {
    return NextResponse.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  // Idempotency: a duplicate delivery (Stripe retries) is acknowledged but skipped.
  const fresh = await recordWebhookEvent({ id: event.id, type: event.type, accountId: event.account ?? null });
  if (!fresh) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);
  } catch (error) {
    // We claimed this event id before processing. Since the handler failed,
    // release the claim and return 500 so Stripe re-delivers and we reprocess
    // (downstream upserts/inserts are idempotent). Without this, a transient
    // failure would permanently drop a paid event.
    console.error("stripe webhook handler failed", (error as Error).message);
    await deleteWebhookEvent(event.id);
    return NextResponse.json({ ok: false, error: "handler_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function handleEvent(event: StripeEvent) {
  // Member/connected events (Direct charges on a coach's account) carry
  // `event.account`. Platform events (the coach's own PerformLabs subscription)
  // do not — those keep the existing handling below, untouched.
  if (event.account) {
    await handleConnectedEvent(event, event.account);
    return;
  }

  const object = event.data.object;

  switch (event.type) {
    case "account.updated": {
      // Reachable only when !event.account (this is the platform branch), so the
      // connected-account id lives on the Account object itself.
      const accountId = object.id as string;
      const workspaceId = await findWorkspaceByStripeAccount(accountId);
      if (!workspaceId) return;
      await upsertStripeAccount({
        workspaceId,
        stripeUserId: accountId,
        chargesEnabled: Boolean(object.charges_enabled),
        payoutsEnabled: Boolean(object.payouts_enabled),
        detailsSubmitted: Boolean(object.details_submitted),
        country: (object.country as string) ?? null,
        defaultCurrency: (object.default_currency as string) ?? null,
      });
      return;
    }

    case "checkout.session.completed": {
      const workspaceId = (object.metadata?.workspace_id as string) ?? (object.client_reference_id as string);
      if (!workspaceId) return;
      const subscriptionId = object.subscription as string | undefined;
      let status = "active";
      let currentPeriodEnd: string | null = null;
      let priceId: string | null = null;
      let cancelAtPeriodEnd = false;
      if (subscriptionId) {
        const sub = (await retrieveSubscription(subscriptionId)) as Record<string, any>;
        status = (sub.status as string) ?? "active";
        currentPeriodEnd = toIso(sub.current_period_end);
        priceId = sub.items?.data?.[0]?.price?.id ?? null;
        cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
      }
      await upsertPlatformSubscription({
        workspaceId,
        stripeCustomerId: (object.customer as string) ?? null,
        stripeSubscriptionId: subscriptionId ?? null,
        priceId,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      });
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const workspaceId = object.metadata?.workspace_id as string | undefined;
      if (!workspaceId) return;
      await upsertPlatformSubscription({
        workspaceId,
        stripeCustomerId: (object.customer as string) ?? null,
        stripeSubscriptionId: (object.id as string) ?? null,
        priceId: object.items?.data?.[0]?.price?.id ?? null,
        status: event.type === "customer.subscription.deleted" ? "canceled" : ((object.status as string) ?? "active"),
        currentPeriodEnd: toIso(object.current_period_end),
        cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
      });
      return;
    }

    default:
      return;
  }
}

// Member -> Coach billing on the connected account. We read every field
// defensively from the webhook payload (no extra Stripe round-trips), gate on a
// resolvable workspace, and only mirror status onto member_profiles when the
// member_profile_id is known (Phase 1 does not create member profiles here).
async function handleConnectedEvent(event: StripeEvent, account: string) {
  const object = event.data.object;
  const workspaceId = await findWorkspaceByStripeAccount(account);
  if (!workspaceId) return;
  const { applicationFeePercent } = getStripeEnv();

  switch (event.type) {
    case "account.updated": {
      // Connect account updates about a connected account arrive HERE (the event
      // carries event.account). Mirror the capability/onboarding flags so the
      // coach is unblocked to charge the moment Stripe enables them. The
      // platform-branch `account.updated` case only fires for events WITHOUT
      // event.account, which a connected-account update never is — so without
      // this case `charges_enabled` was never persisted and the coach stayed
      // locked out of billing despite Stripe having approved them.
      await upsertStripeAccount({
        workspaceId,
        stripeUserId: account,
        chargesEnabled: Boolean(object.charges_enabled),
        payoutsEnabled: Boolean(object.payouts_enabled),
        detailsSubmitted: Boolean(object.details_submitted),
        country: (object.country as string) ?? null,
        defaultCurrency: (object.default_currency as string) ?? null,
      });
      return;
    }

    case "checkout.session.completed": {
      if (object.metadata?.kind !== "member_subscription") return;
      // The metadata is coach-controllable; never trust it to point at another
      // tenant's member/plan. A foreign/forged id is dropped (the checkout path
      // then falls back to provisioning by the paid customer's email, which is
      // workspace-scoped).
      let memberProfileId = (object.metadata?.member_profile_id as string) || null;
      if (memberProfileId && !(await isMemberInWorkspace(memberProfileId, workspaceId))) {
        console.error("stripe webhook: checkout member_profile_id not in workspace; ignoring", { event: event.id });
        memberProfileId = null;
      }
      let coachClientPlanId = (object.metadata?.coach_client_plan_id as string) || null;
      if (coachClientPlanId && !(await isCoachPlanInWorkspace(coachClientPlanId, workspaceId))) {
        coachClientPlanId = null;
      }
      const subscriptionId = (object.subscription as string) || null;
      // The Checkout Session object only exposes its own status ("complete"); the
      // authoritative subscription status/price/period live on the subscription,
      // which sits on the coach's connected account.
      let status = "active";
      let stripePriceId: string | null = null;
      let recurringAmount: number | null = null;
      let currentPeriodStart: string | null = null;
      let currentPeriodEnd: string | null = null;
      let cancelAtPeriodEnd = false;
      if (subscriptionId) {
        const sub = (await retrieveSubscription(subscriptionId, { stripeAccount: account })) as Record<string, any>;
        status = (sub.status as string) || "active";
        stripePriceId = sub.items?.data?.[0]?.price?.id ?? null;
        // Recurring unit price (not the session amount_total, which can include
        // proration/tax) so MRR matches the subscription.* events that also store
        // unit_amount — the same row gets a consistent `amount` whichever lands last.
        recurringAmount = sub.items?.data?.[0]?.price?.unit_amount ?? null;
        currentPeriodStart = toIso(sub.current_period_start);
        currentPeriodEnd = toIso(sub.current_period_end);
        cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
      }
      await upsertMemberSubscription({
        workspaceId,
        memberProfileId,
        coachClientPlanId,
        stripeAccountId: account,
        stripeCustomerId: (object.customer as string) ?? null,
        stripeSubscriptionId: subscriptionId ?? "",
        stripePriceId,
        status,
        applicationFeePercent,
        amount: recurringAmount,
        currency: (object.currency as string) ?? null,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      });
      let resolvedMemberProfileId = memberProfileId;
      if (!resolvedMemberProfileId) {
        // Fase 2 self-serve funnel: no member yet. Provision one from the paid
        // customer's email, then back-patch the subscription row we upserted.
        const email = (object.customer_details?.email as string) || "";
        if (email) {
          resolvedMemberProfileId = await provisionPaidMember({
            workspaceId,
            email,
            fullName: (object.customer_details?.name as string) ?? null,
            status,
          });
          if (resolvedMemberProfileId && subscriptionId) {
            await upsertMemberSubscription({
              stripeSubscriptionId: subscriptionId,
              memberProfileId: resolvedMemberProfileId,
              status,
            });
          }
        }
      }
      if (resolvedMemberProfileId) {
        const customerId = object.customer as string | undefined;
        if (customerId) await setMemberStripeCustomer(resolvedMemberProfileId, customerId);
        await setMemberSubscriptionStatus(resolvedMemberProfileId, status);
        await fireMemberEventNotification({ workspaceId, memberProfileId: resolvedMemberProfileId, eventKey: "customer.account_activated" });
      }
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscriptionId = object.id as string | undefined;
      if (!subscriptionId) return;
      let memberProfileId = (object.metadata?.member_profile_id as string) || null;
      if (memberProfileId && !(await isMemberInWorkspace(memberProfileId, workspaceId))) memberProfileId = null;
      let coachClientPlanId = (object.metadata?.coach_client_plan_id as string) || null;
      if (coachClientPlanId && !(await isCoachPlanInWorkspace(coachClientPlanId, workspaceId))) coachClientPlanId = null;
      const status =
        event.type === "customer.subscription.deleted" ? "cancelled" : ((object.status as string) ?? "active");
      await upsertMemberSubscription({
        workspaceId,
        memberProfileId,
        coachClientPlanId,
        stripeAccountId: account,
        stripeCustomerId: (object.customer as string) ?? null,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: object.items?.data?.[0]?.price?.id ?? null,
        status,
        applicationFeePercent,
        amount: object.items?.data?.[0]?.price?.unit_amount ?? null,
        currency: (object.currency as string) ?? null,
        currentPeriodStart: toIso(object.current_period_start),
        currentPeriodEnd: toIso(object.current_period_end),
        cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
      });
      if (memberProfileId) await setMemberSubscriptionStatus(memberProfileId, status);
      return;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoiceId = object.id as string | undefined;
      if (!invoiceId) return;
      let feeMemberProfileId = (object.subscription_details?.metadata?.member_profile_id as string) || null;
      if (feeMemberProfileId && !(await isMemberInWorkspace(feeMemberProfileId, workspaceId))) feeMemberProfileId = null;
      await recordPlatformFeeEvent({
        id: invoiceId,
        workspaceId,
        memberProfileId: feeMemberProfileId,
        stripeAccountId: account,
        stripeSubscriptionId: (object.subscription as string) ?? null,
        amountTotal: typeof object.amount_paid === "number" ? object.amount_paid : null,
        applicationFeeAmount: typeof object.application_fee_amount === "number" ? object.application_fee_amount : null,
        currency: (object.currency as string) ?? null,
        status: "paid",
      });
      return;
    }

    case "invoice.payment_failed": {
      let memberProfileId = (object.subscription_details?.metadata?.member_profile_id as string) || null;
      if (memberProfileId && !(await isMemberInWorkspace(memberProfileId, workspaceId))) memberProfileId = null;
      if (memberProfileId) await setMemberSubscriptionStatus(memberProfileId, "past_due");
      await fireMemberEventNotification({ workspaceId, memberProfileId, eventKey: "payment.failed" });
      return;
    }

    default:
      return;
  }
}
