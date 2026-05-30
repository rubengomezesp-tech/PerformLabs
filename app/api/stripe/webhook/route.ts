import { NextResponse, type NextRequest } from "next/server";
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
