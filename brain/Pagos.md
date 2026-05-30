---
tags: [pagos, stripe, negocio, tecnico]
updated: 2026-05-30
---

# Pagos (Stripe Connect)

La infraestructura de cobro que materializa el [[Modelo de negocio]]: el coach
cobra a sus clientes desde **su** marca y PerformLabs retiene el **25%**. Cliente
REST propio, **sin SDK** (`fetch` form-encoded + Bearer), para que la integración
no añada dependencias y degrade igual que [[IA y coste|la IA]] y Supabase.

> **Ships dark:** sin claves todo degrada con elegancia — el webhook responde
> `503`, la página de facturación muestra "Pagos en preparación", las acciones
> redirigen a `not_configured`. El fundador conecta las claves cuando toque.

## Las tres piezas

1. **Onboarding del coach (Connect Standard)** — OAuth: `/api/stripe/connect`
   genera un nonce, lo guarda en cookie `httpOnly` y lo manda como `state`;
   `/api/stripe/connect/callback` valida el `state` (anti-CSRF), canjea el code y
   persiste la cuenta conectada. Los cobros van **directos a la cuenta del coach**
   (él mantiene el control); nunca pedimos acceso admin a su Stripe.
2. **Plan de plataforma (lo que el coach nos paga)** — suscripción mensual vía
   **Checkout** (`subscribePlatformAction`); el webhook sincroniza estado y
   renovación.
3. **Planes del coach para sus clientes** — el coach define producto + precio;
   cada plan crea un **Product + Price recurrente en su cuenta conectada**
   (`Stripe-Account` header) y guardamos un espejo local para listarlos. Es la base
   de los **Direct charges** que aplicarán la `application_fee` del 25% en el
   checkout del cliente (ese checkout, lo siguiente — ver [[Roadmap]]).

## Comisión (25%)

`STRIPE_APPLICATION_FEE_PERCENT` (default `25`); se muestra al coach en la página
de facturación. Es la forma correcta de tomar el % vía Connect (no acceso operativo
de equipo). Ver [[Decisiones]].

## Webhooks (`/api/stripe/webhook`)

- **Firma verificada** con HMAC-SHA256 (`node:crypto`, tolerancia 300 s).
- **Idempotentes**: cada evento se registra en `stripe_webhook_events`; un reintento
  de Stripe se reconoce pero no se reprocesa.
- Maneja `account.updated` (capacidades de la cuenta) y el ciclo de vida de la
  suscripción (`checkout.session.completed`, `customer.subscription.*`).

## Código y datos

- `lib/stripe/env.ts` — accesor + flags `isStripeConfigured` / `isStripeConnectConfigured` / `isPlatformBillingConfigured`.
- `lib/stripe/client.ts` — REST sobre `fetch`, OAuth, Checkout, verificación de firma.
- `app/api/stripe/*` — connect, callback, webhook.
- `app/coach/billing/*` — página + server actions (checkout, desconectar, crear/archivar plan).
- Tablas (solo service-role): `stripe_accounts`, `platform_subscriptions`,
  `stripe_webhook_events`, `coach_client_plans`. Ver [[Arquitectura]].
- Seis `STRIPE_*` documentadas en `.env.example` ([[Infraestructura]]).

Relacionado: [[Features]], [[Modelo de negocio]], [[Glosario]] (application fee).
