import { NextResponse } from "next/server";
import { runCoachAgendaAutomations } from "@/lib/automations/coach-agenda";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const result = await runCoachAgendaAutomations();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
