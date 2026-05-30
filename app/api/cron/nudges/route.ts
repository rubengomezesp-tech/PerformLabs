import { NextResponse } from "next/server";
import { runInactivityNudges } from "@/lib/notifications/nudges";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Proactive nudge cron. Protected by CRON_SECRET (Vercel Cron sends it as a
 * Bearer token automatically when the env var is set). Returns 503 until the
 * secret is configured so the endpoint is never open.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await runInactivityNudges();
  return NextResponse.json(result);
}
