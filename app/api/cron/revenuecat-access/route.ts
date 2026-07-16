import { NextResponse } from "next/server";
import { reconcileExpiredRevenueCatAccess } from "@/lib/repositories/revenuecat-purchases";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await reconcileExpiredRevenueCatAccess();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Unable to reconcile RevenueCat access", error);
    return NextResponse.json({ ok: false, error: "reconciliation_failed" }, { status: 500 });
  }
}
