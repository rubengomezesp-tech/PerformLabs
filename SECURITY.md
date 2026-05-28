# Security posture — PerformLabs

Last reviewed: 2026-05-28. This is a defensive review of the application
attack surface (auth, access control, data isolation, secrets, headers,
dependencies). It is honest about what is hardened and what still needs a
decision — "100% secure" is not a claim any system can make.

## ✅ Strong by design

- **Token-verified sessions.** Cookies are never trusted blindly: the access
  token is validated server-side via `supabase.auth.getUser()` before any
  identity is established (`lib/auth/access-control.ts`, `app/auth/session/route.ts`).
- **HttpOnly + Secure + SameSite=Lax cookies** for both access and refresh
  tokens (`lib/auth/session.ts`); `Secure` is enforced in production.
- **Role hierarchy + per-workspace authorization.** `requireWorkspaceMutationAccess`
  checks workspace membership before every console/coach mutation
  (`lib/auth/access-control.ts`).
- **IDOR-safe queries.** Repositories scope by `workspace_id` *and* entity `id`
  together, so an id from another tenant cannot be acted on
  (e.g. `lib/repositories/member-onboarding.ts`).
- **Brute-force throttling.** Login is rate-limited per `ip:email`, with audit
  events and a generic error (no user enumeration) (`app/auth/actions.ts`,
  `lib/auth/login-rate-limit.ts`).
- **Open-redirect protection.** `next` params are validated against `//` and
  `://` before redirecting.
- **Invite-only.** Public sign-up is disabled (`signUpAction` only records a
  request); accounts are provisioned by invitation.
- **Privacy-aware audit log.** Emails and IPs are SHA-256 hashed before logging.
- **Service role key is server-only** (never `NEXT_PUBLIC_*`); RLS-bypassing
  client lives only in `lib/supabase/server.ts`.
- **Security headers** are set globally (`next.config.ts`): CSP, HSTS (2y,
  preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`.
- **No dangerous sinks.** No `dangerouslySetInnerHTML`, `eval`, or `innerHTML`
  in the codebase; no hardcoded secrets; `.env*` is git-ignored.

## 🔧 Fixed in this pass

- Patched a moderate dependency CVE (`postcss < 8.5.10`,
  [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)) via a
  pnpm override → `pnpm audit` is now clean.
- Broadened `.gitignore` env/secret coverage (`.env.*`, `*.pem`, `*.key`).

## ⚠️ Open findings (need a decision)

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| 1 | **High** | The member app `/app` has **no end-user authentication** (middleware only guards `/console` and `/coach`). It renders the workspace's *first* member profile (`getDefaultMemberProfile`) — real PII (name, training, nutrition, progress) — to any anonymous visitor of the brand's host. | Decide whether `/app` is a public preview or a real member portal. If real: add Supabase member auth + bind data to the authenticated member instead of "default profile", and add `/app` to the middleware matcher. **This is a feature, not a patch — left for your call.** |
| 2 | Medium | Rate-limit state is in-process (`Map`). On serverless/Vercel each instance has its own counter, so the effective limit is `5 × instances`. | Back it with a shared store (Supabase table or Upstash Redis) for a global limit. |
| 3 | Medium | CSP allows `script-src 'unsafe-inline' 'unsafe-eval'` and `style-src 'unsafe-inline'`, which weakens XSS mitigation. | Move to nonce-based script CSP and drop `unsafe-eval` if no runtime dependency needs it. Requires careful runtime testing — do not change blindly. |
| 4 | Low | Rate-limit IP comes from `x-forwarded-for`. If ever deployed without a trusted proxy, the header is client-spoofable. | Confirm the platform (Vercel/Cloudflare) sets XFF and is the only ingress. |

## How to re-run the basics

```bash
pnpm audit --prod          # dependency CVEs
pnpm typecheck && pnpm test # type + unit safety net
```
