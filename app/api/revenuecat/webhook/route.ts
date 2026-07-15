import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import {
  getSessionCreditProduct,
  recordRevenueCatSessionPurchase,
  recordRevenueCatWebhookEvent,
  refundRevenueCatSessionPurchase,
  resolveRevenueCatMemberId,
  resolveRevenueCatWorkspaceId,
  revenueCatCustomerEmail,
  type SessionCreditProductId,
} from "@/lib/repositories/session-credits";
import { setMemberSubscriptionStatus } from "@/lib/repositories/member-subscriptions";

export const runtime = "nodejs";

const RevenueCatEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  app_id: z.string().nullish(),
  app_user_id: z.string().nullish(),
  original_app_user_id: z.string().nullish(),
  aliases: z.array(z.string()).nullish(),
  product_id: z.string().nullish(),
  transaction_id: z.string().nullish(),
  original_transaction_id: z.string().nullish(),
  environment: z.string().nullish(),
  purchased_at_ms: z.number().int().positive().nullish(),
  expiration_at_ms: z.number().int().positive().nullish(),
  event_timestamp_ms: z.number().int().positive().nullish(),
  cancel_reason: z.string().nullish(),
  subscriber_attributes: z.record(z.string(), z.unknown()).nullish(),
}).passthrough();

const RevenueCatWebhookSchema = z.object({
  api_version: z.string().min(1),
  event: RevenueCatEventSchema,
}).passthrough();

function secureEquals(received: string, expected: string): boolean {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isRevenueCatWebhookAuthorized(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  return secureEquals(header, secret) || secureEquals(header, `Bearer ${secret}`);
}

function isAcceptedEnvironment(environment: string | null | undefined): boolean {
  return environment !== "SANDBOX" || process.env.REVENUECAT_ACCEPT_SANDBOX === "true";
}

export async function POST(request: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN?.trim() ?? "";
  if (!secret) {
    return NextResponse.json({ error: "RevenueCat webhook is not configured" }, { status: 503 });
  }
  if (!isRevenueCatWebhookAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = RevenueCatWebhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid RevenueCat payload" }, { status: 400 });
  }

  const payload = parsed.data as unknown as Json;
  const event = parsed.data.event;
  const expectedAppId = process.env.REVENUECAT_APP_ID?.trim() || "app50094ffcb3";
  if (event.app_id && event.app_id !== expectedAppId) {
    return NextResponse.json({ error: "Unexpected RevenueCat app" }, { status: 403 });
  }

  const workspaceId = await resolveRevenueCatWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "RevenueCat workspace is not configured" }, { status: 503 });
  }

  const memberProfileId = await resolveRevenueCatMemberId(workspaceId, [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
  ]);
  const product = getSessionCreditProduct(event.product_id);
  const transactionId = event.transaction_id ?? event.original_transaction_id ?? null;

  try {
    if (!isAcceptedEnvironment(event.environment)) {
      await recordRevenueCatWebhookEvent({
        id: event.id,
        workspaceId,
        memberProfileId,
        appUserId: event.app_user_id ?? null,
        eventType: event.type,
        productIdentifier: event.product_id ?? null,
        transactionId,
        environment: event.environment ?? null,
        processingStatus: "ignored",
        payload,
      });
      return NextResponse.json({ received: true, ignored: "sandbox" });
    }

    let processingStatus: "processed" | "pending_assignment" | "ignored" = "ignored";

    if (event.type === "NON_RENEWING_PURCHASE" && product && transactionId) {
      const result = await recordRevenueCatSessionPurchase({
        workspaceId,
        memberProfileId,
        productIdentifier: event.product_id as SessionCreditProductId,
        transactionId,
        eventId: event.id,
        appUserId: event.app_user_id ?? event.original_app_user_id ?? "unknown",
        customerEmail: revenueCatCustomerEmail(event.subscriber_attributes),
        purchasedAtMs: event.purchased_at_ms ?? event.event_timestamp_ms ?? Date.now(),
        payload,
      });
      processingStatus = result.assigned ? "processed" : "pending_assignment";
    } else if (event.type === "CANCELLATION" && product && transactionId) {
      let refunded = false;
      const refundCandidates = [...new Set([event.original_transaction_id, event.transaction_id].filter((value): value is string => Boolean(value)))];
      for (const candidate of refundCandidates) {
        refunded = await refundRevenueCatSessionPurchase({
          workspaceId,
          transactionId: candidate,
          eventId: event.id,
          payload,
        });
        if (refunded) break;
      }
      processingStatus = refunded ? "processed" : "pending_assignment";
    } else if (memberProfileId && (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL")) {
      await setMemberSubscriptionStatus(memberProfileId, "active");
      processingStatus = "processed";
    } else if (memberProfileId && event.type === "BILLING_ISSUE") {
      await setMemberSubscriptionStatus(memberProfileId, "past_due");
      processingStatus = "processed";
    } else if (memberProfileId && event.type === "EXPIRATION") {
      await setMemberSubscriptionStatus(memberProfileId, "expired");
      processingStatus = "processed";
    } else if (!memberProfileId && ["INITIAL_PURCHASE", "RENEWAL"].includes(event.type)) {
      processingStatus = "pending_assignment";
    }

    await recordRevenueCatWebhookEvent({
      id: event.id,
      workspaceId,
      memberProfileId,
      appUserId: event.app_user_id ?? null,
      eventType: event.type,
      productIdentifier: event.product_id ?? null,
      transactionId,
      environment: event.environment ?? null,
      processingStatus,
      payload,
    });

    return NextResponse.json({ received: true, status: processingStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RevenueCat processing error";
    await recordRevenueCatWebhookEvent({
      id: event.id,
      workspaceId,
      memberProfileId,
      appUserId: event.app_user_id ?? null,
      eventType: event.type,
      productIdentifier: event.product_id ?? null,
      transactionId,
      environment: event.environment ?? null,
      processingStatus: "failed",
      payload,
      errorMessage: message,
    }).catch(() => undefined);
    return NextResponse.json({ error: "RevenueCat processing failed" }, { status: 500 });
  }
}
