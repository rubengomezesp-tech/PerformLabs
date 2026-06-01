import crypto from "node:crypto";
import { getStripeEnv } from "./env";

// Minimal Stripe client over the REST API. We talk HTTP directly (form-encoded,
// Bearer auth) instead of pulling the SDK, so the integration stays dependency
// free and works the same in every runtime. Webhook signatures are verified
// with Node crypto.

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_CONNECT = "https://connect.stripe.com";
const STRIPE_VERSION = "2024-06-20";
const WEBHOOK_TOLERANCE_SECONDS = 300;

type ParamValue = string | number | boolean | undefined | null;
export type StripeParams = Record<string, ParamValue>;

function encodeForm(params: StripeParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  return search.toString();
}

export async function stripeRequest<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  params: StripeParams = {},
  options: { stripeAccount?: string; idempotencyKey?: string } = {},
): Promise<T> {
  const { secretKey } = getStripeEnv();
  if (!secretKey) throw new Error("stripe_not_configured");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Stripe-Version": STRIPE_VERSION,
  };
  if (options.stripeAccount) headers["Stripe-Account"] = options.stripeAccount;
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  let url = `${STRIPE_API}${path}`;
  let body: string | undefined;
  if (method === "GET") {
    const query = encodeForm(params);
    if (query) url += `?${query}`;
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = encodeForm(params);
  }

  const response = await fetch(url, { method, headers, body });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = json.error as { message?: string } | undefined;
    throw new Error(`stripe_error: ${error?.message ?? response.statusText}`);
  }
  return json as T;
}

// ---- Connect (Standard) OAuth ----

export function buildConnectAuthorizeUrl(state: string, redirectUri: string): string {
  const { connectClientId } = getStripeEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: connectClientId,
    scope: "read_write",
    state,
    redirect_uri: redirectUri,
  });
  return `${STRIPE_CONNECT}/oauth/authorize?${params.toString()}`;
}

export type ConnectTokenResponse = {
  stripe_user_id: string;
  scope?: string;
  livemode?: boolean;
};

export async function exchangeConnectCode(code: string): Promise<ConnectTokenResponse> {
  const { secretKey } = getStripeEnv();
  const response = await fetch(`${STRIPE_CONNECT}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_secret: secretKey, code, grant_type: "authorization_code" }).toString(),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`stripe_oauth_error: ${json.error_description ?? json.error ?? response.statusText}`);
  }
  return json as ConnectTokenResponse;
}

export async function deauthorizeConnect(stripeUserId: string): Promise<void> {
  const { secretKey, connectClientId } = getStripeEnv();
  await fetch(`${STRIPE_CONNECT}/oauth/deauthorize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: connectClientId, stripe_user_id: stripeUserId }).toString(),
  });
}

// ---- Account / subscription reads ----

export type StripeAccountResponse = {
  id: string;
  country?: string;
  default_currency?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
};

export function retrieveAccount(stripeUserId: string): Promise<StripeAccountResponse> {
  return stripeRequest<StripeAccountResponse>("GET", `/accounts/${stripeUserId}`);
}

export function retrieveSubscription(subscriptionId: string, options: { stripeAccount?: string } = {}) {
  return stripeRequest("GET", `/subscriptions/${subscriptionId}`, {}, options);
}

export function retrieveCheckoutSession(sessionId: string) {
  return stripeRequest("GET", `/checkout/sessions/${sessionId}`, { "expand[0]": "subscription" });
}

// ---- Platform subscription checkout ----

export async function createPlatformCheckoutSession(opts: {
  workspaceId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
}): Promise<{ id: string; url: string }> {
  return stripeRequest("POST", "/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": 1,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    customer: opts.customerId,
    customer_email: opts.customerId ? undefined : opts.customerEmail,
    client_reference_id: opts.workspaceId,
    "metadata[workspace_id]": opts.workspaceId,
    "subscription_data[metadata][workspace_id]": opts.workspaceId,
  });
}

// ---- Connected (Direct charge) checkout ----

/**
 * Create a Checkout Session on a coach's connected account (Direct charge).
 * Thin wrapper over `stripeRequest` — same form-encoded HTTP path as every other
 * call; `options.stripeAccount` sets the `Stripe-Account` header so the charge
 * runs on the coach's account, and `applicationFeePercent` lets the platform keep
 * its cut of each subscription invoice.
 */
export async function createConnectedCheckoutSession(
  input: {
    mode: "subscription" | "payment";
    lineItems: Array<{ price: string; quantity?: number }>;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    applicationFeePercent?: number;
    clientReferenceId?: string;
    metadata?: Record<string, string>;
    subscriptionMetadata?: Record<string, string>;
  },
  options: { stripeAccount: string },
): Promise<{ id: string; url: string }> {
  const params: StripeParams = {
    mode: input.mode,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    client_reference_id: input.clientReferenceId,
  };

  input.lineItems.forEach((item, index) => {
    params[`line_items[${index}][price]`] = item.price;
    params[`line_items[${index}][quantity]`] = item.quantity ?? 1;
  });

  if (input.mode === "subscription" && typeof input.applicationFeePercent === "number") {
    params["subscription_data[application_fee_percent]"] = input.applicationFeePercent;
  }

  for (const [key, value] of Object.entries(input.metadata ?? {})) {
    params[`metadata[${key}]`] = value;
  }
  for (const [key, value] of Object.entries(input.subscriptionMetadata ?? {})) {
    params[`subscription_data[metadata][${key}]`] = value;
  }

  return stripeRequest<{ id: string; url: string }>("POST", "/checkout/sessions", params, {
    stripeAccount: options.stripeAccount,
  });
}

// ---- Client plans on the coach's connected account (Direct charges) ----

export async function createConnectedProduct(
  stripeAccount: string,
  name: string,
  description?: string | null,
): Promise<{ id: string }> {
  return stripeRequest<{ id: string }>(
    "POST",
    "/products",
    { name, description: description || undefined },
    { stripeAccount },
  );
}

export async function createConnectedPrice(
  stripeAccount: string,
  opts: { product: string; amountCents: number; currency: string; interval: string },
): Promise<{ id: string }> {
  return stripeRequest<{ id: string }>(
    "POST",
    "/prices",
    {
      product: opts.product,
      unit_amount: opts.amountCents,
      currency: opts.currency,
      "recurring[interval]": opts.interval,
    },
    { stripeAccount },
  );
}

// ---- Webhook signature verification ----

export function verifyStripeSignature(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((piece) => {
      const index = piece.indexOf("=");
      return [piece.slice(0, index), piece.slice(index + 1)] as const;
    }),
  );
  const timestamp = parts.t;
  const provided = parts.v1;
  if (!timestamp || !provided) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  return Number.isFinite(age) && age < WEBHOOK_TOLERANCE_SECONDS;
}
