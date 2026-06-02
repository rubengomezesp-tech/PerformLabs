// Stripe configuration, read from the environment. Mirrors the Supabase/IA
// pattern: a single accessor returns the values plus an `ok` flag, so every
// surface can degrade gracefully until the founder wires the keys in.

export type StripeEnv = {
  secretKey: string;
  publishableKey: string;
  connectClientId: string;
  webhookSecret: string;
  platformPriceId: string;
  /** Percentage the platform keeps from each connected-account charge. */
  applicationFeePercent: number;
  ok: boolean;
};

/**
 * Clamp a raw fee percentage to the 0–100 range Stripe accepts. A typo like "250"
 * must never reach Stripe as application_fee_percent; non-finite input → 25 default.
 */
export function clampFeePercent(raw: number): number {
  return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 25;
}

export function getStripeEnv(): StripeEnv {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const platformPriceId = process.env.STRIPE_PLATFORM_PRICE_ID ?? "";
  const applicationFeePercent = clampFeePercent(Number(process.env.STRIPE_APPLICATION_FEE_PERCENT ?? "25"));

  return {
    secretKey,
    publishableKey,
    connectClientId,
    webhookSecret,
    platformPriceId,
    applicationFeePercent,
    ok: Boolean(secretKey),
  };
}

/** True once the secret key exists — enough to talk to the Stripe API. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True once Connect onboarding (OAuth) can run end to end. */
export function isStripeConnectConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID);
}

/** True once the platform monthly subscription can be sold. */
export function isPlatformBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PLATFORM_PRICE_ID);
}
