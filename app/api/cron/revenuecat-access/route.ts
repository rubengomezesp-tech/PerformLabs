import { NextResponse } from "next/server";
import { runRevenueCatPurchaseCommunications } from "@/lib/automations/revenuecat-purchase-communications";
import { reconcileExpiredRevenueCatAccess, reconcilePendingRevenueCatPurchases } from "@/lib/repositories/revenuecat-purchases";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const [access, purchases, communications] = await Promise.all([
      reconcileExpiredRevenueCatAccess(),
      reconcilePendingRevenueCatPurchases(),
      runRevenueCatPurchaseCommunications(),
    ]);
    return NextResponse.json({ ok: communications.ok && purchases.failed === 0, access, purchases, communications });
  } catch (error) {
    console.error("Unable to reconcile RevenueCat access", error);
    return NextResponse.json({ ok: false, error: "reconciliation_failed" }, { status: 500 });
  }
}
