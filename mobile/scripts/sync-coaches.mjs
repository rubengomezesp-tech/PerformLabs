#!/usr/bin/env node
/**
 * sync-coaches.mjs — refresh the per-coach registry from Supabase.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node mobile/scripts/sync-coaches.mjs [slug]
 *
 * Run from the repo ROOT so it resolves @supabase/supabase-js from root node_modules.
 * Writes/merges mobile/coaches/<slug>.json for each (non-internal) workspace, deriving
 * the member URL + branding the same way the app does (lib/repositories/workspaces.ts:
 * domainsFor + the brand.* / pwa.* app_settings keys). Existing `appId` and `stores.*`
 * refs are PRESERVED (those are provisioned per coach, not derived).
 *
 * Defensive on schema: selects `*` and picks fields that exist, so a column rename in
 * `workspaces` degrades gracefully instead of throwing.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COACHES_DIR = join(ROOT, "coaches");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const onlySlug = process.argv[2] || null;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const slugify = (value) =>
  String(value || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const normalizeDomain = (d) => (d ? String(d).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") : "");

function memberHostFor(ws) {
  const member = normalizeDomain(ws.member_domain);
  if (member) return member;
  const publicD = normalizeDomain(ws.public_domain || ws.custom_domain);
  if (publicD) return `app.${publicD}`;
  const fallback = normalizeDomain(ws.fallback_subdomain);
  if (fallback) return fallback;
  return `${slugify(ws.slug || ws.name)}.performlabs.app`;
}

function isInternal(ws) {
  const name = String(ws.name || "").toLowerCase();
  return ws.slug === "platform" || name.includes("operativa") || name.includes("mother platform");
}

async function loadExisting(slug) {
  try {
    return JSON.parse(await readFile(join(COACHES_DIR, `${slug}.json`), "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const { data: workspaces, error } = await supabase.from("workspaces").select("*");
  if (error) {
    console.error(`✗ Could not read workspaces: ${error.message}`);
    console.error("  (Check the service role key and that the table is named `workspaces`.)");
    process.exit(1);
  }

  // Branding lives in app_settings (key/value per workspace). Tolerate its absence.
  const settingsByWs = new Map();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("workspace_id,key,value")
    .in("key", ["brand.accent_color", "brand.background_color", "pwa.theme_color", "brand.logo_url"]);
  for (const row of settings || []) {
    const map = settingsByWs.get(row.workspace_id) || {};
    map[row.key] = row.value;
    settingsByWs.set(row.workspace_id, map);
  }

  await mkdir(COACHES_DIR, { recursive: true });
  let written = 0;

  for (const ws of workspaces) {
    if (isInternal(ws)) continue;
    const slug = ws.slug || slugify(ws.name);
    if (!slug) continue;
    if (onlySlug && slug !== onlySlug) continue;

    const brand = settingsByWs.get(ws.id) || {};
    const accent = brand["brand.accent_color"] || "#078df2";
    const background = brand["brand.background_color"] || "#0d0d10";
    const theme = brand["pwa.theme_color"] || background;
    const icon = brand["brand.logo_url"] || null;

    const existing = await loadExisting(slug);
    const record = {
      slug,
      appId: existing.appId || `app.performlabs.${slug.replace(/[^a-z0-9]/g, "")}`,
      appName: ws.app_name || ws.name || existing.appName || "App",
      shortName: (existing.shortName || ws.app_name || ws.name || "App").slice(0, 12),
      memberUrl: `https://${memberHostFor(ws)}/app`,
      themeColor: theme,
      accentColor: accent,
      backgroundColor: background,
      iconSource: icon || existing.iconSource || null,
      stores: existing.stores || {
        appleTeamId: "REPLACE_APPLE_TEAM_ID",
        appleAscKeyRef: `ASC_KEY_${slug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}`,
        playServiceAccountRef: `PLAY_JSON_${slug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}`,
      },
    };

    await writeFile(join(COACHES_DIR, `${slug}.json`), JSON.stringify(record, null, 2) + "\n", "utf8");
    written += 1;
    console.log(`✓ ${slug} → ${record.memberUrl}`);
  }

  console.log(`\nSynced ${written} coach registr${written === 1 ? "y" : "ies"} into mobile/coaches/.`);
}

main().catch((err) => {
  console.error(`✗ ${err?.message || err}`);
  process.exit(1);
});
