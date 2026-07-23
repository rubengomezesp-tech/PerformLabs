<!-- /autoplan restore point: /Users/rubenymarina/.gstack/projects/rubengomezesp-tech-PerformLabs/codex-native-client-foundation-autoplan-restore-20260723-160744.md -->
# Plan — Aula de clientes RG Coaching lista para clientes nuevos (v2, post-revisión CEO)

Fecha: 2026-07-23 · Rama: `codex/native-client-foundation` · Repo: PerformLabs (Next.js App Router + Supabase)
Modo de revisión: SELECTIVE EXPANSION vía /autoplan · Voz externa: subagente Claude [subagent-only, Codex no instalado]

## Objetivo de negocio

Cuando Rubén (coach, workspace RG Coaching) le dice a un cliente nuevo "regístrate", el cliente debe:
1. Poder darse de alta sin fricción (vía pendiente de decisión UC2: invitación vs pública vs ambas).
2. Aterrizar en un aula (`/app`) montada, con evaluación inicial obligatoria antes de nada (gate ligero, retomable).
3. Poder mandar reportes/check-ins y que a Rubén **le lleguen al instante** (email inmediato).
4. Saber que su coach lo vio: notificación al cliente cuando el coach revisa su check-in (retención).
5. Ver su evolución (comparativas, antes/después) y que el coach pueda re-evaluar periódicamente.
6. Situarse en el aula en 3 segundos.

## Premisas (confirmadas en gate D3)

1. ✅ El aula es PerformLabs `/app`, no el sitio estático.
2. ✅ Prioridad nº1 = reportes al instante.
3. ✅ Evaluación inicial obligatoria PERO ligera (estudio propio: "la fricción mata", 70-80% abandono en 30 días).
4. ⚠️ Alta de clientes: usuario eligió "ambas vías" (pública + invitación con cola de aprobación) — **desafiada por la revisión, ver UC2**.
5. ✅ Se construye sobre `codex/native-client-foundation` — **desafiada en secuencia por la revisión, ver UC1**.

## USER CHALLENGES (decisión del dueño en el gate final — nunca auto-decididas)

### UC1 — Mergear la fundación a main ANTES de construir los lotes
- **Dijiste:** "el merge se decide al final de los lotes".
- **La revisión recomienda:** merge/PR a `main` YA (la rama es fast-forwardeable: 24 adelante, 0 detrás) o aterrizar el Lote A directamente sobre `main` como PR pequeño. Prod (Vercel) despliega desde `main`, cuyo tip es del 13-jul.
- **Por qué:** si no, el arreglo que el propio plan llama crítico (H1) no llega a ningún cliente real hasta un mega-merge de 40+ commits, irrevisable y rehén del review de App Store.
- **Qué contexto podríamos no tener:** puede que quieras esperar al veredicto de App Store antes de mover main, o que main tenga consumidores que no conocemos.
- **Si nos equivocamos, el coste es:** mover a main algo que App Store te obligue a retocar; revertible con git.

### UC2 — Sustituir la página pública de alta por invitación del coach + pago-como-alta
- **Dijiste (gate D3):** ambas vías (pública + invitación) con cola de aprobación.
- **La revisión recomienda:** matar la página pública con cola; Lote C = (1) link de invitación tokenizado que el coach envía al cerrar la venta (infra medio existe: `onboarding_status:"invited"` en member-management.ts:763, tenant magic-link) y (2) pulir el camino pago→provisión→bienvenida que esta rama acaba de construir (RevenueCat b2eeddb/2e36e32).
- **Por qué:** el código de esta rama es explícitamente pay-first ("Public visitors cannot enroll", onboarding/actions.ts:18-20); una página gratuita canibaliza el pago, añade una máquina de estados de aprobación a todos los caminos de auth y añade trabajo manual y latencia al coach.
- **Qué contexto podríamos no tener:** quizá quieres capturar leads no-pagados dentro del aula como funnel (aunque el sitio estático + `coach_inquiries` ya cumple ese rol).
- **Si nos equivocamos, el coste es:** perder altas espontáneas no pagadas; mitigable después añadiendo la página pública encima de la misma cola de invitados.

## Lo que YA existe (0B — mapa de apalancamiento)

| Sub-problema | Código existente | ¿El plan lo reutiliza? |
|---|---|---|
| Envío de check-in con fotos | `app/app/progress/page.tsx:299-345` + `createMemberCheckin` | Sí — solo se añade notificación |
| Transporte de email | Resend en `lib/automations/coach-agenda.ts` | Sí — mismo transporte para email inmediato |
| Push al cliente | `push_subscriptions` + dispatcher `/api/cron/notifications` | Sí — para "tu coach revisó tu check-in" |
| Intake del cliente | `/app/onboarding` (OnboardingQuiz) + `saveMemberOnboarding` | Sí — se hace obligatorio con gate |
| Resolución segura de perfil | `getMemberContext` por sesión verificada (member-access.ts:152-176) | Sí — H5 ya resuelto aquí; falta test |
| Valoración del coach | `coach_member_assessments` + `/coach/members/[id]/assessment` | Sí — se añade reassessment UI |
| Alta express por coach | `components/coach/member-express-create.tsx` (701d67a) | Sí — base del flujo de invitación |
| Links de acceso de miembro | `app/auth/member-access-link-action` + tenant magic-link | Sí — entrega de la invitación |
| Rate limiting | `shared_rate_limit_counters` | Sí — en endpoints nuevos |
| Auditoría | `recordSecurityAuditEvent` | Sí — en alta/aprobación |

## Estado del sueño (0C)

```
  HOY                          ESTE PLAN                       IDEAL 12 MESES
  Aula rica pero muda:   --->  Bucle vivo coach↔cliente:  ---> Aula que vende sola:
  el coach no se entera        check-in→email <1min,           antes/después exportable
  de los check-ins; el         revisión→push al cliente,       alimenta captación; re-
  cliente no sabe si lo        intake obligatorio ligero,      evaluaciones trimestrales
  vieron; intake opcional      alta sin fricción, re-           automáticas; métricas de
  escondido; alta manual       evaluaciones con comparativa    activación guían el producto
```

## Alternativas de implementación (0C-bis — auto-decidido: enfoque B)

- **A (mínimo viable):** solo email inmediato al coach en `createMemberCheckinAction`. Completeness 4/10. Deja intake, alta y reevaluaciones sin tocar.
- **B (elegido — completo por lotes, reutilización máxima):** los 4 lotes sobre la infra existente (Resend, push cliente, express-create, assessments). Completeness 9/10. Riesgo medio controlado por lotes independientes.
- **C (ideal arquitectónico):** bus de eventos de dominio (`member_events`) + suscriptores de notificación genéricos. Completeness 10/10 pero infra nueva especulativa para n=1 coach — sobre-ingeniería hoy; anotado como TODO si llega el 2º coach de pago.
- Decisión registrada: B por principios P1+P3+P5 (completo, pragmático, explícito) — [AUTO, mecánica].

## Lotes de trabajo (v2 tras auto-decisiones)

### Lote A — Reportes al instante + notificación de vuelta al cliente (H1 + H5-test)

1. **Email inmediato al coach por check-in** en `createMemberCheckinAction` tras persistir: transporte Resend de `coach-agenda.ts`; resumen (miembro, peso y delta vs anterior, adherencia, nº fotos) + enlace a `/coach/checkins`. Fire-and-forget: el fallo de notificación NUNCA rompe el guardado (log estructurado del error).
2. **Check-ins pendientes en el digest nocturno** de agenda (contador + nombres) como red de seguridad.
3. **Notificación al CLIENTE cuando el coach revisa** su check-in (push existente + fila en su dashboard): la capacidad percibida de respuesta retiene. [AUTO-añadido, expansión en blast radius]
4. **Web-push al coach: DIFERIDO a TODOS.md** (P3) — para n=1 coach, el email inmediato entrega ~95% del valor; la tabla `push_subscriptions` es member-céntrica y extenderla es plumbing especulativo. [TASTE — revisable en gate]
5. **Test de regresión H5 primero:** workspace con 2 miembros, cada intake/check-in cae en su perfil (producción resuelve por sesión — member-onboarding.ts:427-435). Si pasa en verde, H5 queda cerrado sin más código. Revisar además el camino open/demo (`firstProfileOfWorkspace`) para que nunca se active con auth de producción.

### Lote B — Evaluación inicial obligatoria con grandfathering (H2)

1. Gate en `app/app/layout.tsx`: miembro autenticado sin intake completado → redirect a `/app/onboarding` (permitidas: onboarding, soporte, logout, legal).
2. **Grandfathering obligatorio:** el gate solo aplica a miembros con `onboarding_status` en estados pre-intake o creados tras el deploy; migración de backfill para clientes RG activos existentes + override del coach por miembro. [AUTO-añadido — evita dejar fuera a los clientes actuales el día del deploy]
3. Gate ligero y retomable (guardado parcial), 5 min percibidos; nunca un muro. **[Gate final]:** el quiz se recorta a ~12 pantallas esenciales (salud/PAR-Q, objetivo, disponibilidad, medidas base); el resto pasa a "completa tu perfil después" no bloqueante.
4. Al completar: pantalla "listo, tu coach prepara el plan" + email al coach (canal del Lote A) para que haga su valoración.
5. Verificar el gate dentro del shell nativo iOS ANTES de reenviar a App Store (guideline-safe). [AUTO-añadido]

### Lote C — Alta de clientes (RESUELTO UC2: solo invitación + pago)

1. Invitación tokenizada del coach sobre express-create + tenant magic-link: el coach crea el miembro (express) → se genera link de invitación → el cliente aterriza en landing con identidad del coach (D-12) → cuenta activada → gate de intake. Trabajo del coach <60s.
2. El camino pago→provisión (RevenueCat/Stripe) sigue siendo la segunda vía de alta automática; pulir el email de bienvenida post-provisión.
3. Aprobación vive en `onboarding_status`; `subscription_status` jamás nace activo sin pago; el auth user no se crea hasta la aceptación de la invitación (E-12).
4. CTA del sitio estático rubengomezcoaching.com → flujo de contacto/pago existente (sin página pública de alta); sin enlaces de alta/precios en el build iOS (guideline 3.1.1).
5. La página pública con cola queda descartada; si algún día hace falta, se construye encima de esta misma infra de invitados (TODOS.md).

### Lote D — Reevaluaciones, antes/después y bucle de captación (H4)

1. UI de reevaluación en `/coach/members/[id]/assessment`: "Nueva reevaluación" (`assessment_kind:"reassessment"`) precargando la última; histórico con comparativa de campos clave.
2. Comparativa de fotos antes/después lado a lado (cliente en `/app/progress`, coach en ficha del miembro): selector de dos check-ins, vista dividida.
3. **Export antes/después con consentimiento** (tarjeta 1080×1350 con marca RG, consentimiento explícito por-uso del cliente, watermark): el mejor activo de marketing de un PT; cierra el bucle retención→captación. [AUTO-añadido, expansión]
4. **Métrica de activación:** tiempo provisión→primer check-in, visible en `/coach/analytics`. [AUTO-añadido]

## NO en alcance (con motivo)

- Bus de eventos de dominio genérico — sobre-ingeniería para n=1 coach; TODO si llega el 2º coach de pago.
- Web-push al coach — diferido (ver Lote A.4); email cubre la urgencia.
- Generalización multi-workspace del alta (branding por slug, colas genéricas) — construir cuando exista un 2º coach; los lotes se implementan RG-specific sobre las abstracciones ya existentes, sin añadir generalidad nueva.
- App nativa (`mobile/`) — cambios web-first; verificación del gate en shell nativo es criterio de aceptación, no desarrollo nuevo.
- Cambios de precios, Stripe Connect, RevenueCat — intocables.
- Chat en tiempo real — existe soporte vía `support_messages`.
- Frecuencia de check-in configurable por el cliente — la fija el coach al revisar (deliberado).

## Registro de errores y rescates (Sección 2 — nuevos codepaths)

```
CODEPATH                        | QUÉ PUEDE FALLAR                  | ¿RESCATADO? | ACCIÓN                                    | USUARIO VE
--------------------------------|-----------------------------------|-------------|-------------------------------------------|------------
notifyCoachOfCheckin (nuevo)    | Resend timeout / 4xx / 5xx        | SÍ          | log estructurado + queda en digest nocturno| nada (check-in guardado OK)
                                | coach sin email configurado       | SÍ          | log warn + digest                          | nada
notifyMemberOfReview (nuevo)    | push endpoint 410 (sub caducada)  | SÍ          | borrar suscripción + fallback fila dashboard| fila en dashboard
                                | VAPID mal configurado             | SÍ          | log error, no bloquea review               | fila en dashboard
gate intake (layout)            | flag intake ausente (legacy)      | SÍ          | grandfathering por onboarding_status/fecha | acceso normal
                                | redirect loop (ruta permitida mal)| SÍ (test)   | test de allowlist de rutas                 | n/a
invitación tokenizada (UC2)     | token caducado/reutilizado        | SÍ          | pantalla "pide un enlace nuevo a tu coach" | mensaje claro
                                | email de invitación rebota        | SÍ          | estado visible en /coach/members           | coach lo ve y reenvía
alta pública (si UC2=ambas)     | spam/bots                         | SÍ          | rate-limit compartido + honeypot + captcha? | error genérico
saveMemberOnboarding            | sesión expira a mitad de quiz     | SÍ          | guardado parcial + retomable               | "sigue donde lo dejaste"
upload fotos check-in           | >8MB / tipo no imagen             | SÍ (existe) | skip silencioso — GAP: avisar al cliente   | ⚠️ hoy nada ← arreglar en Lote A
export antes/después            | sin consentimiento registrado     | SÍ          | botón deshabilitado hasta consentir        | explicación
```
**GAP detectado (auto-añadido a Lote A):** `uploadCheckinPhotos` descarta fotos >8MB en silencio (checkin-management.ts:175) — el cliente cree que envió fotos y no llegaron. Añadir aviso en UI.

## Registro de modos de fallo

```
CODEPATH                  | MODO DE FALLO                | RESC | TEST | USUARIO VE      | LOG
--------------------------|------------------------------|------|------|-----------------|-----
email check-in            | Resend caído                 | Y    | Y    | nada (digest)   | Y
push revisión→cliente     | sub caducada                 | Y    | Y    | fila dashboard  | Y
gate intake               | legacy sin flag              | Y    | Y    | acceso normal   | Y
invitación                | token inválido               | Y    | Y    | mensaje claro   | Y
fotos >8MB                | skip silencioso              | Y*   | Y*   | aviso en form   | Y*   (* tras Lote A)
```
Sin filas RESCUED=N/TEST=N/Silent tras los lotes → 0 CRITICAL GAPS restantes en el diseño.

## Diagramas

### Arquitectura (nuevos componentes sobre existentes)
```
 cliente /app/progress ──form──▶ createMemberCheckinAction
                                    │ persiste (existente)
                                    ├─▶ [NUEVO] notifyCoachOfCheckin ──Resend──▶ email coach <1min
                                    │        └─ fallo → log + digest nocturno (existente, ampliado)
                                    └─▶ revalidatePath (existente)
 coach /coach/checkins ──review──▶ reviewCheckinAction (existente)
                                    └─▶ [NUEVO] notifyMemberOfReview ──web-push existente──▶ cliente
 /acceso · invitación token ──▶ [NUEVO/UC2] alta → member_profiles(pending|invited) ──aprueba──▶ activo
 app/app/layout.tsx ──▶ [NUEVO] gate intake (grandfathered) ──▶ /app/onboarding → saveMemberOnboarding (existente)
 /coach/members/[id]/assessment ──▶ [NUEVO] reassessment UI ──▶ coach_member_assessments (existente)
 /app/progress ──▶ [NUEVO] comparador fotos + export consentido
```

### Máquina de estados del miembro (con alta)
```
 (pago RevenueCat/Stripe) ──▶ provisioned ─┐
 (invitación coach) ──▶ invited ───────────┼─▶ intake_pending ─quiz─▶ intake_done ─coach─▶ plan_active
 (alta pública, si UC2=ambas) ─▶ pending_approval ─aprueba┘                └─ gate /app redirige aquí
 transiciones inválidas: pending_approval→plan_active sin aprobar (bloqueada por entitlement);
 intake_pending→plan_active sin quiz (bloqueada por gate + estado en member_profiles)
```

## Interacciones y edge cases clave (Sección 4)
- Doble submit de check-in → botón disabled en vuelo + idempotencia por (member, submitted_at±1min) [test].
- Navegar fuera a mitad de quiz → guardado parcial retomable [Lote B.3].
- Check-in sin ningún dato numérico (solo notas/fotos) → válido; email lo refleja.
- Cliente envía 2 check-ins seguidos → 2 emails; sin rate-limit (volumen n≈decenas/semana, no problema).
- Coach revisa desde el email link con sesión caducada → login → deep-link de vuelta a /coach/checkins.

## Rendimiento (Sección 7)
Volúmenes RG: decenas de clientes, ≤ cientos de check-ins/mes — sin riesgo N+1 nuevo; el email es 1 llamada Resend por check-in; comparador de fotos usa signed URLs ya existentes (2 por comparación). Índice existente por member_profile_id en customer_checkins cubre las consultas del comparador. Sin hallazgos bloqueantes.

## Observabilidad (Sección 8)
- Log estructurado en notifyCoachOfCheckin / notifyMemberOfReview (entrada, éxito, fallo con contexto member/workspace).
- Métrica día-1: check-ins enviados vs emails entregados (delta = fallos silenciosos) — visible en logs Vercel/Supabase.
- Métrica de activación (Lote D.4) como panel en /coach/analytics.
- Runbook: si el coach no recibe emails → revisar logs de notify* → estado Resend → digest nocturno como respaldo.

## Despliegue y rollback (Sección 9)
- Migraciones nuevas (flag intake / estados de alta / consentimiento export): aditivas, backward-compatible, sin locks (tablas pequeñas).
- Orden: migrar → deploy → backfill grandfathering → activar gate (flag de entorno o release por lote).
- Rollback por lote: git revert del lote; el gate tiene kill-switch (env var) el primer día.
- Verificación post-deploy (5 min): enviar check-in de prueba → email llega; login cliente legacy → sin redirect loop.
- **UC1 condiciona todo esto:** si se aprueba, cada lote = PR pequeño contra main con deploy propio.

## Trayectoria (Sección 10)
Reversibilidad 4/5 (todo aditivo salvo el gate, que lleva kill-switch). Deuda introducida: none estructural; el TODO del bus de eventos queda documentado. Tras esto: fase 2 natural = recordatorios automáticos de check-in vencido al cliente (JITAI del radar de retención, la jugada diferencial del posicionamiento).

## Diseño/UX (Fase 2 — /plan-design-review vía autoplan, [subagent-only])

Puntuaciones (inicial → tras fixes incorporados abajo): IA 4→8 · Estados 5→9 · Journey 4→9 · AI-slop 7→9 · Sistema 8→9 · Responsive/a11y 6→8 · Global 5/10 → 8.5/10.

### Fixes de diseño incorporados al plan (auto-decididos, estructurales)

**D-1 (crítico → Lote A). Estado de confirmación del check-in.** Botón en vuelo → superficie de confirmación reutilizando el patrón `onboardingSubmitted` (recibido → tu coach revisa → recibirás aviso) + redirect a historial. Es el pico emocional del bucle; hoy el form es server-action pelado sin feedback.
**D-2 (crítico → Lote B). Momento "tu plan está listo".** Notificación al cliente al publicar el plan (misma tubería que `notifyMemberOfReview`) + estado de espera definido en /app home (pasos de progreso + plazo prometido). Elimina el "aire muerto" día 0-3 donde muerde el 70-80% de abandono.
**D-3 (crítico → Lote A, era D). Metadatos de ángulo en fotos.** El form pasa de un input multiple sin etiquetar a 3 slots etiquetados (frontal/lateral/espalda) persistiendo el ángulo por path. Sin esto el comparador antes/después empareja frontal-con-lateral y no funciona nunca sobre datos históricos. Irreversible si se retrasa. Regla de emparejamiento del comparador + fallback para fotos legacy sin etiqueta.
**D-4 (alto → Lote B). Guardado parcial real del quiz:** persistencia server por-paso (el quiz actual es useState puro: un refresh pierde 21 pantallas), pantalla de reanudación ("sigue donde lo dejaste", paso N), y definición del gate: quiz a medias sigue gated. Decisión de gusto pendiente en gate: recortar el quiz (ver Taste-2).
**D-5 (alto → Lote A). Deep-link del email del coach:** ancla `#checkin-{id}` con scroll+highlight en /coach/checkins; asunto con triage (`[Check-in] Nombre — 82.4kg (−0.6) · 3 fotos`); variante primer check-in (sin delta); remitente con marca del workspace.
**D-6 (alto → Lote A). La "fila en dashboard" se especifica:** tabla `member_notifications` (id, tipo, payload, read_at) — NO estado derivado; render arriba del /app home; tap → misma vista de feedback que el push; dismiss al leer; apilable. Esta tabla sirve también a D-2 y D-7 (baratas una vez existe).
**D-7 (alto → Lote D). Consentimiento del export, lado cliente:** prompt en /app mostrando la TARJETA RENDERIZADA exacta (consientes una preview, no una abstracción); estados pending/granted/denied/revoked en ambos lados; granularidad por-uso = bucle petición→aprobación con sus estados; plantilla de tarjeta definida (fotos + delta peso + semanas, sin apellido, watermark RG esquina inferior).
**D-8 (alto → Lote A). Momento de permiso de push:** se pide en la pantalla de confirmación del primer check-in ("¿quieres saber al instante cuando tu coach lo revise?") — máxima motivación, contextual; nunca al primer load.
**D-9 (medio → Lote A). Fotos >8MB: validación cliente pre-submit** (error inline en el input) en vez de aviso post-hoc; si falla server-side igualmente, canal searchParams + copy de éxito parcial.
**D-10 (medio → Lote B).** Gate renderiza antes del shell (sin flash); intro del quiz con variante para miembro gated ("antes de continuar, completa tu valoración"); override del coach vive en `/coach/members/[id]` con nota de auditoría.
**D-11 (medio → Lote D). Reevaluación:** campos clave = peso, grasa, cintura/pecho/cadera, marcas de fuerza; vista por defecto = última con acción "comparar con inicial"; deltas reutilizan `DeltaTag`; empty state: sin valoración inicial solo se ofrece "assessment", no "reassessment".
**D-12 (medio → Lote C).** Al resolver UC2: landing de invitación con jerarquía (1) identidad del coach + framing personal ("Rubén te ha invitado a su aula"), (2) qué pasa después en 3 pasos, (3) un solo CTA; estados de reenvío/rebote en lado coach.
**D-13 (medio → Lote B/D).** Nudge de primer check-in en el estado de espera post-intake y en la notificación de plan publicado ("envía tu punto de partida"); "provisión" del métrico definida por vía de alta (pago = webhook, invitación = aceptación).
**D-14. Mapa de reutilización UI** (anti-slop): `DeltaTag`, `Sparkline`, `EmptyState`, `SubmitButton`+toast, patrón `onboardingSubmitted`, `Dialog`, primitivos `components/ui/*`, tokens `globals.css` (.uiGlass/.uiStat). Toda superficie nueva compone de este vocabulario; nada de card-grids genéricos.

### Tabla de estados (superficies nuevas)
```
SUPERFICIE                | LOADING        | EMPTY               | ERROR                  | SUCCESS                    | PARTIAL
--------------------------|----------------|---------------------|------------------------|----------------------------|------------------
Confirmación check-in     | botón en vuelo | n/a                 | inline + reintento     | 3 pasos + prompt push      | fotos descartadas avisadas
Espera post-intake (/app) | skeleton       | pasos + plazo coach | n/a                    | notif plan listo           | quiz a medias → reanudar
Comparador antes/después  | skeleton fotos | <2 check-ins c/foto | foto no carga → placeholder | vista dividida + deltas | solo 1 ángulo común
Consentimiento export     | preview render | sin fotos aptas     | denegado (respetado)   | tarjeta exportada          | pendiente de cliente
Reevaluación (coach)      | skeleton       | sin inicial → CTA assessment | guardar falla → retry | comparativa con inicial | borrador guardado
Landing invitación        | —              | n/a                 | token caducado → pedir nuevo | cuenta creada → gate  | email rebotado (coach ve)
Notificaciones cliente    | —              | sin avisos (quieto) | n/a                    | fila + badge, dismiss al leer | apiladas (máx 3 + contador)
```

### Storyboard emocional (día 0 → primer ciclo)
```
PASO                        | SIENTE            | LO SOSTIENE
Pago/invitación             | compromiso+nervios| landing con identidad del coach (D-12)
Alta → gate                 | "¿y ahora qué?"   | intro del quiz con expectativa honesta (D-4/Taste-2)
Quiz                        | esfuerzo con fin  | progreso visible, retomable, guardado por paso
"Coach prepara tu plan"     | anticipación      | pasos + plazo + nudge punto de partida (D-2/D-13)
Plan publicado              | ¡empieza!         | notificación + aterrizaje en ruta de hoy (D-2)
Primer check-in             | vulnerabilidad    | confirmación 3 pasos + permiso push (D-1/D-8)
Coach revisa                | visto y cuidado   | push + fila con feedback (D-6)
```

- Sin DESIGN.md formal: calibrado contra `PRODUCT.md`, `brain/Sistema de diseño.md` y tokens de `globals.css`; los primitivos `components/ui/*` son obligatorios en superficies nuevas (a11y-críticas).
- Responsive: cliente mobile-first (touch ≥44px, inputMode en numéricos del quiz y check-in); coach desktop-denso. WCAG 2.1 AA innegociable (CLAUDE.md §2).

## Criterios de aceptación (v2)

- Check-in del cliente → email al coach en <1 min; fallo de email nunca bloquea el guardado (test).
- Revisión del coach → notificación al cliente (push o fila) (test).
- Cliente nuevo sin intake → siempre aterriza en onboarding; cliente legacy → jamás bloqueado (test con backfill).
- Test 2-miembros: intake y check-in de cada uno caen en su perfil (regresión H5).
- Fotos >8MB → aviso visible al cliente, no skip silencioso.
- Reevaluación creable y comparable con la inicial; export solo con consentimiento registrado.
- Alta según UC2: invitación end-to-end en <60s de trabajo del coach; (si pública) rate-limit + honeypot testados y RLS de las tablas nuevas con tests.
- Métrica de negocio: provisión→primer check-in <48h visible en analytics.
- `pnpm typecheck` + `pnpm test` verdes; RLS de tablas tocadas con tests explícitos.

## Ingeniería (Fase 3 — /plan-eng-review vía autoplan, [subagent-only])

### Correcciones de arquitectura incorporadas (auto-decididas, con evidencia)

**E-1 (P1, conf 8) → Lote A.** El email NO va fire-and-forget suelto: usar `after()` de `next/server` (Next 16.2.6) con try/catch, o `await` directo — el transporte ya acota coste con `AbortSignal.timeout(10_000)` (coach-agenda.ts:81). Una promesa no esperada en una server action de Vercel puede congelarse: ni email ni log.
**E-2 (P1, conf 9) → Lote B.** El gate NO vive en `app/app/layout.tsx` (sin pathname en servidor; no se re-ejecuta en soft-nav → bypasseable). Vive en `proxy.ts` (el middleware ya calcula `isMemberPath`, proxy.ts:91) o en route-groups `app/app/(gated)`/`(intake)`. El test de allowlist testea el middleware.
**E-3 (P1, conf 8) → Lotes A/B.** `mobile/` es Expo/React Native contra Supabase anon+RLS, NO un WebView de /app. Declarado: (a) el intake obligatorio se aplica también a nativo (las pantallas RN comprueban `onboarding_status` vía contexto; refuerzo RLS donde aplique); (b) el canal día-1 en nativo es la bandeja `member_notifications` leída por RLS — el web-push VAPID no existe en RN (APNs/FCM = fase futura, push.ts:6-8 ya lo documenta).
**E-4 (P1, conf 8) → Lote B.** Gate exento para `isAdmin === true` y `mode === "open"` (el owner en preview tiene `onboarding_status:"not_started"`, member-access.ts:79). `getMemberContext` amplía su select con `onboarding_status` (hoy no lo trae, member-access.ts:160).
**E-5 (P1, conf 9) → Lote A.** El límite real es `bodySizeLimit: "8mb"` POR REQUEST (next.config.ts:33): un envío multi-foto >8MB total se rechaza con 413 ANTES de la action y se pierde el check-in entero. Fix: validación cliente contra presupuesto total (~7MB) + downscale cliente a ~1.5MB/foto; test multi-foto. Reemplaza el enfoque de solo-aviso de D-9.
**E-6 (P2, conf 8) → Lote A.** Reutilizar `fireMemberEventNotification` (lib/notifications/events.ts:12 — pipeline completo: template-gated, poda subs 410, never-throws) en vez de escribir `notifyMemberOfReview` nuevo. Requiere: añadir key `checkin.reviewed` al whitelist (platform-logic.ts:184-200) + seed de plantilla push por workspace (sin fila de plantilla la notificación nace muerta).
**E-7 (P2, conf 8) → Lote A.** Extraer helper de envío del transporte privado de coach-agenda (env vars RG-prefijadas, from/logo hardcodeados). Destinatario del email inmediato definido: `coach_agenda_automation_configs.recipient_email` con fallback a env var. Config ausente → falla email Y digest a la vez: por eso E-9.
**E-8 (P2, conf 7) → Lote A.** Respetar `member_notification_preferences` (`coach_changes`, `quiet_mode` — migración 20260531205659) en el push de revisión. RLS de `member_notifications`: SELECT con `is_member_profile_owner` + `read_at` vía RPC restringida (la app nativa lee con anon+RLS; deny-all mataría la bandeja en nativo). Tests RLS explícitos.
**E-9 (P2, conf 7) → Lote A.** Ledger de entregas para emails inmediatos (espejo de `coach_agenda_digest_deliveries` con status/error_code, coach-agenda.ts:119-130), no solo console.error: permite reintento por el digest, backfill y contador de fallos consultable. "Visible en logs" no es observabilidad un viernes a las 2am.
**E-10 (P2, conf 7) → Lote A.** Idempotencia con mecanismo real: índice único sobre `(member_profile_id, date_trunc('minute', submitted_at))` — con email inmediato, cada duplicado son 2 emails al coach. El botón disabled solo no basta.
**E-11 (P3, conf 7) → Lote A.** Coste real del ángulo por foto: `photoPaths` pasa de `string[]` a `{path, angle}[]` y toca escritura + `listManagedCheckins` + `getCheckinPhotoUrls` + lectura RN. Presupuestado.
**E-12 (P3, conf 6) → Lote C.** La aprobación vive en `onboarding_status`; `subscription_status` jamás nace activo en alta no pagada; NO crear el auth user hasta aprobar (evita enumeración/agotamiento vía `auth.admin.createUser`).
**E-13 → tests añadidos:** entrega de email (mock fetch), gate exento admin/open, rechazo body >8MB, preferencias respetadas, RLS member_notifications (SELECT y read_at), **gating por `VERCEL_ENV === "production"` para no emailear al coach real desde previews**, no-ruptura del claim atómico del digest.
**E-14 (P3, conf 5) → Lote A.** `maxDuration` explícito en la ruta de progress + subidas en paralelo si se toca el body limit.

### Diagrama de cobertura (nuevos codepaths)
```
CODE PATHS                                                USER FLOWS
[+] notify email coach (after()+ledger)                   [+] Ciclo check-in completo
  ├── [GAP→test] envía y escribe ledger                     ├── [GAP→E2E] envío→email→revisión→notif cliente
  ├── [GAP→test] Resend caído → ledger error, guardado OK   ├── [GAP→test] doble submit (índice único)
  └── [GAP→test] config ausente → ledger + aviso            └── [GAP→test] >8MB total (413 evitado en cliente)
[+] fireMemberEventNotification("checkin.reviewed")       [+] Gate de intake (middleware)
  ├── [GAP→test] plantilla seed presente                    ├── [GAP→test] nuevo sin intake → redirect
  ├── [GAP→test] preferencias/quiet_mode respetadas         ├── [GAP→test] legacy/backfill → pasa
  └── [★★ existente] poda subs 410 (events.ts:34)           ├── [GAP→test] admin/open → exento
[+] member_notifications (tabla+RLS)                        └── [GAP→test] soft-nav no bypassea (middleware)
  ├── [GAP→test] RLS SELECT owner / read_at RPC           [+] Quiz por-paso
  └── [GAP→test] lectura RN (anon+RLS)                      ├── [GAP→test] guardado parcial + reanudar
[+] reassessment / comparador / export                      └── [GAP→test] sesión expirada a mitad
  ├── [GAP→test] kind=reassessment precarga última        [+] Regresión H5 (IRON RULE)
  ├── [GAP→test] pairing por ángulo + legacy fallback       └── [GAP→test] 2 miembros, cada uno a su perfil
  └── [GAP→test] export bloqueado sin consentimiento
COVERAGE actual de lo nuevo: 1/22 (5%) — todos los GAP entran al plan como specs de test obligatorios.
```

### Lanes de paralelización (worktrees)
| Lane | Pasos | Módulos | Depende de |
|------|-------|---------|-----------|
| A | Lote A (notify+ledger+fotos+tests H5) | lib/repositories, lib/automations, lib/notifications, app/app/progress, migraciones | — |
| B | Lote B (gate middleware+quiz por-paso+backfill) | proxy.ts, app/app/onboarding, migraciones | — (conflicto potencial en migraciones con A: numerar en serie) |
| C | Lote C (alta según UC2) | app/auth, app/c, components/coach | UC2 + reutiliza notif de A |
| D | Lote D (reassessment+comparador+export+métrica) | app/coach/members, app/app/progress, migraciones | D-3 (ángulos) de A |
Orden: A ∥ B en worktrees paralelos (coordinar timestamps de migraciones) → merge → C ∥ D.

## Decision Audit Trail

| # | Fase | Decisión | Clase | Principio | Racional | Rechazado |
|---|------|----------|-------|-----------|----------|-----------|
| 1 | Pre | Saltar /office-hours | Usuario | — | auditoría previa profunda ya existía | correr office-hours |
| 2 | Pre | Upgrade gstack 1.60.1 | Usuario | — | tooling al día | snooze |
| 3 | CEO-0A | Premisas 1-3,5 confirmadas; P4=ambas vías | Usuario (gate) | — | decisión del dueño | — |
| 4 | CEO | cross_project_learnings=true | Mecánica | P6 | dev solo, recomendado | off |
| 5 | CEO-0C-bis | Enfoque B (lotes sobre infra existente) | Mecánica | P1,P3,P5 | completo sin infra especulativa | A (mínimo), C (bus eventos) |
| 6 | CEO | H5 → test-de-regresión-primero | Mecánica | P3 | código actual ya resuelve por sesión (verificado member-access.ts:152-176) | presupuestar fix |
| 7 | CEO | Lote B + grandfathering/backfill | Mecánica | P1 | evita lockout de clientes existentes | gate universal |
| 8 | CEO | Añadir notificación revisión→cliente | Expansión auto | P2 | blast radius, <1d CC, retención | — |
| 9 | CEO | Diferir web-push del coach a TODOS | TASTE | P3,P5 | email = 95% del valor para n=1 coach | construirlo ya |
| 10 | CEO | Añadir export antes/después consentido | Expansión auto | P2 | blast radius Lote D, activo de captación | — |
| 11 | CEO | Añadir métrica activación | Expansión auto | P2 | pequeña, guía iteración | — |
| 12 | CEO | Fotos >8MB: aviso al cliente | Mecánica | P1 (zero silent failures) | skip silencioso detectado en código | dejarlo |
| 13 | CEO | Lotes RG-specific, sin generalizar | Mecánica | P5 | n=1 coach; generalidad cuando haya 2º | plataforma genérica |
| 14 | CEO | UC1 merge-first | USER CHALLENGE | — | **RESUELTO (gate final): mergear fundación a main YA; cada lote = PR pequeño** | mantener merge al final |
| 15 | CEO | UC2 invitación vs pública | USER CHALLENGE | — | **RESUELTO (gate final): solo invitación + pago; página pública descartada** | ambas vías (decisión D3 revertida por el dueño) |
| 16 | Diseño | 14 fixes estructurales D-1..D-14 | Mecánica | P1,P5 | estados, journey día-0, ángulos de foto, tabla member_notifications | — |
| 17 | Diseño→gate | Recortar quiz a ~12 pantallas esenciales + "completar después" | TASTE | P3 | **RESUELTO (gate final): recortar** | quiz íntegro con intro honesta |
| 18 | Eng | 14 correcciones E-1..E-14 | Mecánica | P1,P4,P5 | gate en middleware, after(), reuso events.ts, RLS nativo, ledger, índice único | — |
| 19 | Gate | Diferir web-push del coach confirmado | TASTE | P3 | **RESUELTO (gate final): diferido a TODOS.md** | construirlo en Lote A |
| 20 | Gate | Plan v2 APPROVED; arrancar Lote A | Usuario | — | aprobación completa con recomendaciones | — |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR (PLAN via /autoplan) | 12 propuestas, 9 aceptadas, 3 diferidas; UC1/UC2 resueltos en gate |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — (Codex no instalado; voz externa = subagente Claude) | outside voice: 10 hallazgos CEO |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN via /autoplan) | 14 issues incorporados, 0 critical gaps restantes |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (PLAN via /autoplan) | score 5/10 → 8.5/10, 14 decisiones |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | SKIPPED | sin alcance developer-facing |

- **VERDICT:** CEO + ENG + DESIGN CLEARED — plan APPROVED en gate final 2026-07-23; listo para implementar (Lote A primero, fundación merge a main por UC1).

NO UNRESOLVED DECISIONS
