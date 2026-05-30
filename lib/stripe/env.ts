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

export function getStripeEnv(): StripeEnv {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const platformPriceId = process.env.STRIPE_PLATFORM_PRICE_ID ?? "";
  const feeRaw = Number(process.env.STRIPE_APPLICATION_FEE_PERCENT ?? "25");

  return {
    secretKey,
    publishableKey,
    connectClientId,
    webhookSecret,
    platformPriceId,
    applicationFeePercent: Number.isFinite(feeRaw) ? feeRaw : 25,
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
