# Spec: PerformLabs App Factory (white-label apps en tiendas, 1→1000)

> Diseño aprobado por el CEO (2026-06-02). Cada coach que compra obtiene **su propia app
> nativa** en App Store + Google Play, con su identidad y branding, **bajo la cuenta de
> desarrollador del propio coach**, repetible hasta ~1000. Cierre del flujo `brainstorming`.

## Problema

Vender a entrenadores una app de marca propia, publicada en ambas tiendas, y poder repetirlo
cientos de veces sin: (a) recompilar la web por coach, (b) que Apple rechace por apps
duplicadas (guideline **4.3**), (c) trabajo manual no escalable.

## Decisiones (tomadas)

1. **Cuentas por coach.** Cada app entra bajo el **Apple Developer + Google Play del coach**.
   Evita el 4.3 a escala y la ficha es legalmente suya (modelo MacroActive). El pipeline usa
   **credenciales por coach**.
2. **Ambas plataformas** (iOS + Android) vía **Capacitor** (no TWA-only): única vía a iOS y
   da valor nativo (push APNs/FCM, splash, status bar) → pasa el **4.2** de Apple.
3. **Shell fino en modo server.** La app nativa **carga la web del coach** (su host), no
   empaqueta la web. PerformLabs ya es **multi-tenant por host**
   (`lib/member-app.ts` → `getSelectedMemberAppBrand` resuelve la marca desde el host;
   `lib/repositories/workspaces.ts` → `domainsFor`), así que **no hay build web por coach**.

## Arquitectura

```
Supabase workspaces ──sync──> mobile/coaches/<slug>.json ──generate──> mobile/generated/<slug>/
   (slug, dominios,            (registro por coach:                      capacitor.config.ts
    branding)                   appId, appName, host, colores, icono)     + iconos/splash
                                                                              │
                                                          cap sync + Fastlane (ios|android)
                                                                              │
                                              App Store Connect / Play  (cuenta DEL coach)
```

### Componentes (todo en `mobile/`, aislado del tooling del producto)

| Unidad | Qué hace | Entradas | Salidas |
|---|---|---|---|
| `scripts/sync-coaches.mjs` | Lee Supabase y escribe/actualiza el registro por coach | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `mobile/coaches/<slug>.json` |
| `mobile/coaches/<slug>.json` | Registro: identidad + branding + URL de un coach | — | consumido por `generate` |
| `scripts/generate-app.mjs` | Materializa el proyecto nativo de un coach | `<slug>` + registro | `mobile/generated/<slug>/capacitor.config.ts` + `assets.json` |
| `capacitor.config.template.ts` | Plantilla de config (server.url, appId, appName) | env | base del config generado |
| `fastlane/Fastfile` | Lanes `ios`/`android`: build, firma, subida | credenciales del coach (secrets) | app en revisión |
| `.github/workflows/publish-coach-app.yml` | Orquesta por coach (macOS+ubuntu) | `coach_slug`, `platform`, `track` | publica |

### Registro por coach (`mobile/coaches/<slug>.json`)

```json
{
  "slug": "marca-blanca-fitness",
  "appId": "app.performlabs.marcablancafitness",
  "appName": "Marca Blanca Fitness",
  "shortName": "Marca Blanca",
  "memberUrl": "https://marca-blanca.performlabs.app/app",
  "themeColor": "#0d0d10",
  "accentColor": "#078df2",
  "backgroundColor": "#0d0d10",
  "iconSource": "https://.../logo-1024.png",
  "stores": { "appleTeamId": "TEAMID", "appleAscKeyRef": "ASC_KEY_MARCA_BLANCA", "playServiceAccountRef": "PLAY_JSON_MARCA_BLANCA" }
}
```

- `slug`, `appName`, dominios y branding salen de `workspaces` + `app_settings` (mismo origen
  que `domainsFor` / `getWorkspaceBrand`).
- `appId` por defecto `app.performlabs.<slugsincaracteres>` (el coach puede usar su propio bundle id).
- `stores.*Ref` apuntan a **nombres de secrets** (no valores) → el pipeline resuelve las
  credenciales del coach en CI.

## Flujo de datos (1 coach)

1. El coach compra → su `workspace` ya existe (branding ya configurado).
2. El coach abre **su** Apple Developer + Google Play y nos da acceso (App Store Connect API key
   + Play service-account JSON). Se guardan como **secrets** con el `*Ref` del registro.
3. `pnpm --dir mobile sync` (o el workflow) refresca `mobile/coaches/<slug>.json`.
4. `workflow_dispatch publish-coach-app (coach_slug, platform, track)` → genera, construye, firma
   y sube **bajo la cuenta del coach**.
5. Revisión de tienda → app publicada. Repetir para el siguiente coach.

## Qué es automático vs manual

- **Automático:** sync de branding, generación de config + iconos/splash, build, firma, subida,
  metadatos de ficha (Fastlane `deliver`/`supply`).
- **Manual (lo exige Apple/Google):** el coach crea su cuenta y nos invita; primer registro de la
  app + respuestas de privacidad; aceptar el envío a revisión.

## Restricción de entorno

El contenedor remoto **no** tiene Xcode/Android SDK ni las cuentas → los builds nativos corren
en **Mac/CI** con runners (macOS para iOS, ubuntu para Android). Este repo entrega el **scaffold
verificable** (registro, scripts, plantilla, Fastlane, workflow, docs); el primer build real lo
dispara el CEO/CI con las credenciales del primer coach.

## Aislamiento del tooling

`mobile/` tiene su **propio `package.json`** (Capacitor/Fastlane) y se **excluye** de
`tsconfig` y ESLint del producto (como `.claude`), para no afectar a `typecheck`/`build`/`lint`.

## No-objetivos (YAGNI)

- No recompilar la web por coach (ya es multi-tenant por host).
- No panel propio de submission (Fastlane + CI lo cubren).
- No push nativo en v1 del shell si retrasa: el push web ya existe; el plugin nativo se añade
  cuando se conecten APNs/FCM del coach.

## Criterios de aceptación (del scaffold)

- `pnpm lint/test/typecheck/build` del producto siguen verdes (mobile excluido).
- `node mobile/scripts/generate-app.mjs <slug>` produce un `capacitor.config.ts` válido a partir
  de un registro de ejemplo.
- El workflow existe y documenta los secrets por coach.
- Doc de onboarding del coach completa.
