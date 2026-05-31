import { NextResponse, type NextRequest } from "next/server";
import {
  recordPlatformFeeEvent,
  setMemberStripeCustomer,
  setMemberSubscriptionStatus,
  upsertMemberSubscription,
} from "@/lib/repositories/member-subscriptions";
import {
  findWorkspaceByStripeAccount,
  recordWebhookEvent,
  upsertPlatformSubscription,
  upsertStripeAccount,
} from "@/lib/repositories/stripe-billing";
import { retrieveSubscription, verifyStripeSignature } from "@/lib/stripe/client";
import { getStripeEnv, isStripeConfigured } from "@/lib/stripe/env";

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
    // The event is already recorded; swallow handler bugs so Stripe does not retry forever.
    console.error("stripe webhook handler failed", (error as Error).message);
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
      const accountId = event.account ?? (object.id as string);
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
    case "checkout.session.completed": {
      if (object.metadata?.kind !== "member_subscription") return;
      const memberProfileId = (object.metadata?.member_profile_id as string) || null;
      const subscriptionId = (object.subscription as string) ?? null;
      await upsertMemberSubscription({
        workspaceId,
        memberProfileId,
        coachClientPlanId: (object.metadata?.coach_client_plan_id as string) ?? null,
        stripeAccountId: account,
        stripeCustomerId: (object.customer as string) ?? null,
        stripeSubscriptionId: subscriptionId ?? "",
        stripePriceId: (object.metadata?.stripe_price_id as string) ?? null,
        status: (object.status as string) || "active",
        applicationFeePercent,
        amount: typeof object.amount_total === "number" ? object.amount_total : null,
        currency: (object.currency as string) ?? null,
      });
      if (memberProfileId) {
        const customerId = object.customer as string | undefined;
        if (customerId) await setMemberStripeCustomer(memberProfileId, customerId);
        await setMemberSubscriptionStatus(memberProfileId, "active");
      }
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscriptionId = object.id as string | undefined;
      if (!subscriptionId) return;
      const memberProfileId = (object.metadata?.member_profile_id as string) || null;
      const status =
        event.type === "customer.subscription.deleted" ? "cancelled" : ((object.status as string) ?? "active");
      await upsertMemberSubscription({
        workspaceId,
        memberProfileId,
        coachClientPlanId: (object.metadata?.coach_client_plan_id as string) ?? null,
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
      await recordPlatformFeeEvent({
        id: invoiceId,
        workspaceId,
        memberProfileId: (object.subscription_details?.metadata?.member_profile_id as string) ?? null,
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
      const memberProfileId = (object.subscription_details?.metadata?.member_profile_id as string) || null;
      if (memberProfileId) await setMemberSubscriptionStatus(memberProfileId, "past_due");
      return;
    }

    default:
      return;
  }
}
