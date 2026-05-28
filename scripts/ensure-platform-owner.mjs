import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

for (const envFile of [".env.local", ".env"]) {
  if (!existsSync(envFile)) continue;

  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;

    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const email = process.env.COACHOS_OWNER_EMAIL?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !url || !serviceRoleKey) {
  const missing = [
    ["COACHOS_OWNER_EMAIL", email],
    ["NEXT_PUBLIC_SUPABASE_URL", url],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
  ].filter(([, value]) => !value).map(([key]) => key);
  console.error(`Missing ${missing.join(", ")}.`);
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const workspaceResult = await supabase
  .from("workspaces")
  .upsert({
    name: "PerformLabs Operativa",
    slug: "platform",
    app_name: "PerformLabs",
    support_email: "admin@performlabs.local",
    accent_color: "#078df2",
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "slug" })
  .select("id")
  .single();

if (workspaceResult.error || !workspaceResult.data?.id) {
  console.error(`Unable to ensure platform workspace: ${workspaceResult.error?.message ?? "unknown error"}`);
  process.exit(1);
}

let page = 1;
let user = null;
while (!user && page <= 10) {
  const users = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (users.error) {
    console.error(`Unable to list users: ${users.error.message}`);
    process.exit(1);
  }
  user = users.data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
  if (users.data.users.length < 1000) break;
  page += 1;
}

if (!user) {
  const invite = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login?next=/console/security` : undefined,
    data: {
      invited_role: "platform_owner",
      workspace_id: workspaceResult.data.id,
    },
  });

  if (invite.error || !invite.data.user?.id) {
    console.error(`Unable to invite owner: ${invite.error?.message ?? "unknown error"}`);
    process.exit(1);
  }

  user = invite.data.user;
}

const membership = await supabase
  .from("workspace_memberships")
  .upsert({
    workspace_id: workspaceResult.data.id,
    user_id: user.id,
    role: "platform_owner",
  }, { onConflict: "workspace_id,user_id" })
  .select("id")
  .single();

if (membership.error || !membership.data?.id) {
  console.error(`Unable to ensure owner membership: ${membership.error?.message ?? "unknown error"}`);
  process.exit(1);
}

await supabase.from("audit_log").insert({
  workspace_id: workspaceResult.data.id,
  actor_user_id: user.id,
  action: "security.platform_owner_ensured",
  entity_type: "workspace_membership",
  entity_id: membership.data.id,
  metadata: { email },
});

console.log(`Platform owner ready: ${email}`);
