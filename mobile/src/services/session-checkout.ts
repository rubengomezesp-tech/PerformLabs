const DEFAULT_PURCHASE_URL = "https://pay.rev.cat/yvcgmrwpgqphcyyq";

export const SESSION_PACK = Object.freeze({
  packageId: "rg_10_bundle",
  productId: "rg_10_bundle_usd_799",
  sessions: 10,
  priceUsd: 799,
  coachingAccessDays: 30,
  validityDays: 90,
});

export function sessionPackCheckoutUrl(memberProfileId: string, purchaseUrl = process.env.EXPO_PUBLIC_REVENUECAT_PURCHASE_URL): string {
  const memberId = memberProfileId.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberId)) {
    throw new Error("INVALID_MEMBER_PROFILE_ID");
  }

  const base = (purchaseUrl?.trim() || DEFAULT_PURCHASE_URL).replace(/\/+$/, "");
  if (!/^https:\/\/pay\.rev\.cat\/[a-z0-9]+$/i.test(base)) {
    throw new Error("INVALID_REVENUECAT_PURCHASE_URL");
  }

  return `${base}/${encodeURIComponent(memberId)}?package_id=${SESSION_PACK.packageId}`;
}
