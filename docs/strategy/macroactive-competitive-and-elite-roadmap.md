# PerformLabs — Auditoría competitiva (MacroActive) y roadmap a nivel élite

> 2026-06-02 · Auditoría de MacroActive (competidor principal) y del setup real de un
> coach suyo (Rubén Gómez Élite), con el plan para llevar PerformLabs a paridad y
> diferenciación. Lee también `CLAUDE.md`, `PRODUCT.md` y `docs/handoff-2026-06-01-audit-remediation.md`.

## 0. Resumen ejecutivo

MacroActive **no vende "una app"**: vende a cada coach **todo el stack de su negocio
digital con su propia marca** — landing de ventas, checkout, app de miembros (PWA +
app nativa en tiendas), consola de gestión y pagos con revenue-share. Apunta a
**creadores que ya facturan ≥ $10.000/mes** (élite), con servicio full (contenido,
ads, soporte). Es una empresa de ~$4.6M ARR, ~72 personas, FitPros desde 2011.

**PerformLabs ya es un MacroActive funcional al ~75-80%**: la app de miembros y la
consola del coach están a la par. Las dos brechas que importan para **vender en serio**
son: **(1) la landing de ventas premium parametrizable** y **(2) la app en tiendas**.
El hueco de mercado es claro: **los coaches de $0-10k/mes** que MacroActive no atiende.

## 1. MacroActive — modelo

- **Propuesta:** "The operating system for creator-led coaching businesses." White-label
  total: *"Your app does not say MacroActive when clients log in. Your data. Your brand."*
- **Economía:** revenue-share ("we get paid when you get paid"), payout diario al banco
  del coach, el coach conserva el 100% si vende su negocio.
- **Target:** creadores establecidos (≥ $10k/mes). Servicio full: estrategia de contenido,
  edición de vídeo, ads y soporte al cliente "done-for-you".
- **Tiendas:** la PWA web es la base; la **app nativa iOS/Android es un upgrade de pago**
  ("upgrading to a full iOS and Android mobile app unlocks a new level of professionalism").

## 2. Los 3 pilares (blueprint para clonar/igualar)

### Pilar 1 — Landing de ventas del coach (B2C) · ej. rubengomezelite.com
Marca negro+dorado, display uppercase con *glow*, logo monograma serif. Estructura:
1. **Hero** — "Transforma tu cuerpo sin renunciar a tu vida" + subcopy + CTA + foto del coach.
2. **Rompiendo barreras** — 3 dolores (falta de confianza · falta de tiempo · desinformación).
3. **Plan de entrenamiento** — mockups de la app (vídeo, reps/peso, super sets, historial) + "cambia ejercicios" / "registro".
4. **Plan de nutrición** — recetas, ingredientes, macros, lista de compra, intercambio de comidas, opciones (general/vegetariano/vegano).
5. **Beneficios adicionales** — grid de 6: app exclusiva · registro de hábitos · registro de progreso · comunidad · diario de comidas · registro de periodo.
6. **Acerca de mí** — bio en primera persona + firma + foto.
7. **Membresías** — card de precio ($39/mes) + lista de incluidos + CTA "Únete ahora".
8. Páginas extra: **1-1 Coaching** (Typeform de aplicación) y **Contacto** (form).
9. **Checkout** — `/subscribe/.../sign-up`: stepper 1 Regístrate → 2 Pagar → 3 Completo.

### Pilar 2 — Área de miembros (la app) · miembros.rubengomezelite.com
Login (email/password) → app: entreno (vídeo + registro reps/peso), nutrición (plan +
macros + lista compra), check-ins, fotos de progreso, hábitos, comunidad, periodo.
**≈ es nuestro `/app`.**

### Pilar 3 — Consola del coach (back-office) · *.macroactive.io/customers
Sidebar: Cuentas (Equipo · Clientes) · Ajustes · Nutrición · **Fitness** (Programas ·
Sesiones · Metas · **Workout Builder** · Ejercicios · **Bulk Video Uploader** · Lesiones) ·
Productos · Ventas · Área de Miembros · Herramientas · **Chat** · **Community** ·
**Knowledge Base** · **Nutrition Agent (IA)**. Tabla de clientes con filtros + exportar.
**≈ es nuestro `/coach` + `/console`.**

## 3. Gap analysis (PerformLabs)

| Pilar | Hoy | Falta |
|---|---|---|
| Landing de ventas | `/c/[slug]` (`components/sales/sales-page.tsx`): hero + planes, muy básica | **Rehacer como plantilla premium parametrizable** (estructura del Pilar 1) |
| Checkout self-serve | Stripe Connect + `startMemberCheckoutAction` + `/c/[slug]/gracias` | Cose plan→email→pago→alta; pulir el post-pago |
| Área de miembros | `/app`: entreno, nutrición, check-ins, **fotos**, recovery | Registro de hábitos, registro de periodo, comunidad real |
| Consola del coach | `/coach` + `/console`: clientes, programas, workout, nutrición, IA, ventas, mensajes | Bulk Video Uploader, Lesiones, Knowledge Base |
| App en tiendas | PWA instalable (`manifest.ts`) | Wrapper TWA (Android) + Capacitor (iOS) |

## 4. Estrategia de apps en tiendas

- **Android (Google Play):** la PWA → **TWA**. Una app branded por coach, barato y rápido.
- **iOS (App Store):** Apple rechaza apps de plantilla en masa (guidelines **4.2.6 / 4.3**).
  Dos vías legales: (a) app branded **bajo la cuenta Apple Developer del coach** ($99/año,
  con carta de autorización) — lo que hace MacroActive; (b) app **contenedora "picker"**
  única (más simple, menos "marca pura", riesgo 4.3). **Recomendado:** wrapper **Capacitor**
  por coach bajo su cuenta, con pipeline de build branded (icono/nombre/splash/color).
- **No requiere reescribir la app** — solo empaquetarla.

## 5. Posicionamiento

MacroActive = élite (≥$10k/mes), caro, full-service. **PerformLabs entra por debajo**:
coaches que empiezan/crecen ($0-10k/mes), self-serve, fee accesible, "Ethereal Glass"
premium, dominios propios y Stripe Connect ya incluidos. Subimos con ellos.

## 6. Roadmap por fases

1. **Comercial (ingresos ya):** plantilla de **landing de ventas** premium parametrizable
   + **checkout self-serve** cosido. ← *en curso*
2. **Tiendas:** PWA→TWA (Android), Capacitor (iOS) bajo cuenta del coach.
3. **Paridad:** Bulk Video Uploader, Lesiones, hábitos, registro de periodo, comunidad, Knowledge Base.
4. **Diferenciación:** IA (coach-chat / nutrition agent) como ventaja, observabilidad, performance.

> Fuentes: macroactive.com (+ launch/partner), Apple App Review Guidelines (4.2.6/4.3),
> GetLatka (MacroActive $4.6M ARR), y capturas del setup real de rubengomezelite.com.
