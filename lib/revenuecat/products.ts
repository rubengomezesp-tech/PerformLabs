export const REVENUECAT_PRODUCTS = {
  rg_10_bundle_usd_799: {
    name: "RG 10",
    priceCents: 79_900,
    currency: "USD",
    purchaseType: "one_time",
    purchaseEvents: ["NON_RENEWING_PURCHASE"],
    sessions: 10,
    sessionValidityDays: 90,
    coachingAccessDays: 30,
  },
  rg_20_monthly_usd_1399: {
    name: "RG 20 mensual",
    priceCents: 139_900,
    currency: "USD",
    purchaseType: "subscription",
    purchaseEvents: ["INITIAL_PURCHASE", "RENEWAL"],
    sessions: 20,
    sessionValidityDays: 35,
    coachingAccessDays: null,
  },
  rg_360_monthly_usd_199: {
    name: "RG 360 mensual",
    priceCents: 19_900,
    currency: "USD",
    purchaseType: "subscription",
    purchaseEvents: ["INITIAL_PURCHASE", "RENEWAL"],
    sessions: 0,
    sessionValidityDays: null,
    coachingAccessDays: null,
  },
} as const;

export type RevenueCatProductId = keyof typeof REVENUECAT_PRODUCTS;
export type RevenueCatProduct = (typeof REVENUECAT_PRODUCTS)[RevenueCatProductId];

export function getRevenueCatProduct(productId: string | null | undefined): RevenueCatProduct | null {
  if (!productId) return null;
  return REVENUECAT_PRODUCTS[productId as RevenueCatProductId] ?? null;
}

export function isRevenueCatPurchaseEvent(productId: string | null | undefined, eventType: string): boolean {
  const product = getRevenueCatProduct(productId);
  return Boolean(product && (product.purchaseEvents as readonly string[]).includes(eventType));
}

export function revenueCatAccessEnd(input: {
  productId: string;
  purchasedAtMs: number;
  expirationAtMs?: number | null;
}): string | null {
  const product = getRevenueCatProduct(input.productId);
  if (!product) return null;
  if (input.expirationAtMs) return new Date(input.expirationAtMs).toISOString();
  if (product.coachingAccessDays) {
    return new Date(input.purchasedAtMs + product.coachingAccessDays * 86_400_000).toISOString();
  }
  return null;
}

export function revenueCatProductLabel(productId: string | null | undefined): string {
  return getRevenueCatProduct(productId)?.name ?? productId ?? "Producto sin identificar";
}
