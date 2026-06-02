# Runbook: publicar la app en App Store y Google Play (Fase 2 · Tiendas)

> **Objetivo:** que la app de miembro (`/app`) de cada coach pueda instalarse desde
> **Google Play** y la **App Store**, igual que hace MacroActive. Este documento deja
> el plan llave‑en‑mano: qué hay ya hecho, la decisión de arquitectura que debe tomar
> el CEO, el camino técnico paso a paso y lo que un humano tiene que provisionar
> (cuentas, certificados, fichas) porque **no se puede hacer desde el entorno de Claude**.

---

## 0. Estado actual (lo que ya tenemos — el cimiento)

La app ya es una **PWA grado‑tienda**, que es exactamente lo que envuelven TWA y Capacitor:

- `app/manifest.ts` — manifest **dinámico por marca**: `id` estable, `name`/`short_name`,
  `display: standalone`, `orientation: portrait`, `theme/background_color` del coach,
  iconos `any` 192/512 + **maskable** 512, `categories` (health/fitness/lifestyle),
  `lang`/`dir` y **shortcuts** (Entreno/Comidas/Progreso/Coach).
- Service worker (`public/sw.js`) + **offline** (`public/offline.html`) + registro
  (`components/sw-register.tsx`).
- iOS standalone: `appleWebApp` (capable, `black-translucent`), `viewport-fit: cover`,
  `apple-icon`.
- **Push web** ya integrado (engine de notificaciones) → suma "valor nativo" para
  pasar la revisión de Apple (ver §4).

> Conclusión: **no falta producto, falta el envoltorio nativo + las fichas de tienda.**

---

## 1. Decisión de arquitectura (esto lo valida el CEO)

Cómo se mapea "un SaaS multi‑coach" a "apps en las tiendas":

| | **A. Una app por coach** (estilo MacroActive) | **B. Una app multi‑tenant** "PerformLabs" |
|---|---|---|
| Ficha en tienda | 1 por coach (su marca, su icono) | 1 sola; el usuario elige coach al entrar |
| Marca | Máxima (la app ES del coach) | Compartida |
| Coste cuentas | **1 sola** org Apple ($99/año) + **1** Play ($25 único) cubren TODAS | Igual |
| Esfuerzo por alta | Generar build parametrizado por coach + subir ficha | Cero (ya está publicada) |
| Revisión Apple | N revisiones | 1 |
| Mantenimiento | Pipeline de builds por marca | Trivial |

**Recomendación:** **híbrido por fases.**
1. **Arrancar con B** (una app "PerformLabs", el login elige coach) → estamos en tiendas
   en días, sin pipeline por marca. Sirve de MVP de tiendas y de "modo prueba".
2. **Ofrecer A como upsell premium** ("tu app con tu marca en las tiendas") para coaches
   que lo paguen → se activa el pipeline de build por marca.

> Todo lo demás del runbook vale para A y para B; la única diferencia es si el build se
> parametriza por coach (A) o es único (B).

---

## 2. Camino técnico

### 2a. Android — vía rápida (TWA con PWABuilder / Bubblewrap)

Trusted Web Activity = la PWA a pantalla completa, sin barra de navegador, empaquetada
como `.aab` para Play.

1. Generar el proyecto: subir la URL de producción a **PWABuilder.com** (usa Bubblewrap
   por debajo) → descarga el proyecto Android + el `.aab`.
2. **Digital Asset Links**: publicar en el dominio del coach
   `/.well-known/assetlinks.json` con el **SHA‑256** de la clave de firma (lo da Play o el
   keystore). Sin esto, la TWA muestra la barra de Chrome.
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": { "namespace": "android_app",
       "package_name": "com.performlabs.<coach>",
       "sha256_cert_fingerprints": ["<SHA256_DE_PLAY_APP_SIGNING>"] }
   }]
   ```
   > Se puede servir dinámico desde Next (`app/.well-known/assetlinks.json/route.ts`)
   > leyendo los fingerprints por dominio. Se añade cuando tengamos el keystore.
3. Subir el `.aab` a **Play Console** → ficha → revisión.

**Salida:** en Play en ~días. iOS NO sale por esta vía.

### 2b. iOS + Android — vía completa (Capacitor)

Shell nativo que carga la PWA y añade plugins nativos (push APNs/FCM, splash, status bar,
háptica). Es lo que da "valor nativo" y permite iOS.

```bash
pnpm add -D @capacitor/cli && pnpm add @capacitor/core @capacitor/ios @capacitor/android \
  @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar @capacitor/haptics
npx cap init "PerformLabs" "com.performlabs.app"   # (por coach en modo A)
```

`capacitor.config.ts` (modo *server*: el shell carga la web desplegada del coach):

```ts
import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: process.env.APP_ID ?? "com.performlabs.app",
  appName: process.env.APP_NAME ?? "PerformLabs",
  webDir: "public", // no se usa en modo server, pero es obligatorio
  server: { url: process.env.APP_URL ?? "https://app.performlabs.com", cleartext: false },
  ios: { contentInset: "always" },
  plugins: { SplashScreen: { launchAutoHide: true } },
};
export default config;
```

```bash
npx cap add ios && npx cap add android
npx cap sync
npx cap open ios       # Xcode → firmar → Archive → App Store Connect
npx cap open android   # Android Studio → firmar → .aab → Play
```

> **Modo A (por coach):** el pipeline corre este bloque con `APP_ID`, `APP_NAME`,
> `APP_URL` y los iconos/splash de cada coach como variables → un build por marca.

### 2c. Por qué NO se puede terminar desde aquí

- El contenedor de Claude no tiene **Xcode** ni **Android SDK/Studio** ni acceso a las
  **cuentas** Apple/Google → los builds nativos y el envío se hacen en tu Mac o en CI con
  runners macOS. Por eso este turno entrega **el cimiento (PWA) + este plan**, no un `.ipa`.

---

## 3. Lo que tienes que provisionar tú (humano)

- [ ] **Apple Developer Program** (cuenta **Organización**, no individual) — $99/año, cubre
      todas las apps. Crear App ID, certificados y perfiles en App Store Connect.
- [ ] **Google Play Console** — $25 pago único. Crear app, activar **Play App Signing**.
- [ ] **Keystore** de firma (o delegar en Play App Signing) → de ahí sale el SHA‑256 para
      `assetlinks.json`.
- [ ] **Assets de ficha** por app: icono 1024×1024, capturas (varios tamaños), descripción,
      **URL de política de privacidad** (obligatoria), categoría, clasificación por edad.
- [ ] **Cuenta de push nativo**: APNs key (iOS) + proyecto **Firebase/FCM** (Android) si
      pasamos de push web a push nativo en Capacitor.
- [ ] Dominio por coach con HTTPS (ya lo tenemos en Vercel) para Asset Links / Universal Links.

## 4. Cumplir la revisión de Apple (guía 4.2 "minimum functionality")

Apple rechaza "una web metida en un webview". Lo evitamos porque la app aporta **función
nativa real**:

- **Push nativo** (APNs vía Capacitor) — recordatorios de entreno/comida.
- **Offline** (service worker + `offline.html`).
- **Shortcuts** + integración de sistema (status bar, splash, háptica, cámara para fotos de
  progreso vía plugin nativo).
- Experiencia **standalone** pulida (sin chrome de navegador), sesión de entreno tipo app.

## 5. CI sugerido (cuando arranquemos builds)

- **Fastlane** (`match`/`gym`/`supply`) o **EAS Build** para automatizar firma y subida.
- GitHub Actions con runner **macOS** para iOS; runner Linux para el `.aab` de Android.
- En **modo A**, el workflow itera sobre la lista de coaches y construye por marca con sus
  variables de entorno.

## 6. Checklist "listo para enviar"

- [ ] Lighthouse PWA installable ✅ en el dominio de producción.
- [ ] `assetlinks.json` servido y verificado (Android TWA).
- [ ] Iconos/splash por plataforma generados (HIG iOS / adaptive icon Android).
- [ ] Push nativo probado en dispositivo real.
- [ ] Política de privacidad publicada y enlazada.
- [ ] Fichas (capturas + textos) cargadas en App Store Connect y Play Console.

---

### Resumen para el CEO

El producto ya está a nivel de tienda como **PWA**. Falta **(1)** que decidas **A vs B**
(recomiendo híbrido: empezar con una app y vender la marca propia como upsell) y **(2)**
abrir las cuentas Apple/Google. Con eso, el camino Capacitor de §2b nos pone en **ambas
tiendas**; mientras, la vía TWA de §2a nos mete en **Play en días**.
