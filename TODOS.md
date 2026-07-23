# TODOS

## Diferidos por /autoplan 2026-07-23 (aula de clientes RG)

- [ ] **Web-push al coach** (P3, M) — email inmediato cubre la urgencia para n=1 coach; revisar si el email se queda corto. Contexto: `push_subscriptions` es member-céntrica; extenderla a coaches implica schema + UI de suscripción en /coach. Depende de: Lote A en producción y datos reales de latencia de lectura.
- [ ] **Bus de eventos de dominio (`member_events`)** (P3, L) — sustituiría los notify puntuales por suscriptores genéricos. Construir cuando exista un 2º coach de pago; hoy es sobre-ingeniería. Contexto: alternativa C del 0C-bis del plan.
- [ ] **Generalización multi-workspace del alta** (P3, M) — branding por slug y colas genéricas de aprobación. Los lotes se implementan RG-specific; generalizar con el 2º coach. Depende de: decisión UC2.
- [ ] **APNs/FCM para la app nativa** (P3, L) — el push nativo real; hoy el canal nativo es la bandeja `member_notifications`. Contexto: push.ts:6-8 ya documenta el swap de transporte.
- [ ] **Recordatorio automático de check-in vencido (JITAI)** (P2, M) — la "jugada diferencial" del posicionamiento: radar de retención detecta, Coach Brain redacta, coach envía. Fase 2 natural tras los lotes.
