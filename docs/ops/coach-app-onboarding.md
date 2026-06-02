# Onboarding de un coach a su app en tiendas

> Pasos para meter la app de UN coach en App Store + Google Play con la App Factory
> (`mobile/`). Repetible por cada coach (1→1000). Cada app va bajo **la cuenta del coach**.

## Lo que hace el coach (una vez)

1. **Apple Developer Program** — cuenta de **Organización** (necesita D-U-N-S) o Individual.
   $99/año. Nos añade en **App Store Connect → Users** con rol *App Manager* (o nos genera una
   **API Key**: Issuer ID + Key ID + archivo `.p8`).
2. **Google Play Console** — $25 (pago único). Activa **Play App Signing**. Nos da acceso o un
   **service account JSON** con permiso de publicación.
3. (Opcional) Su **bundle id** propio si no quiere `app.performlabs.<slug>`.
4. Política de privacidad publicada (URL) — Apple/Google la exigen en la ficha.

## Lo que configura el operador (una vez por coach)

1. **GitHub Environment** con el nombre = `slug` del coach (p. ej. `marca-blanca-fitness`).
   Añade los secrets del coach:
   - iOS: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT` (el `.p8` en base64).
   - Android: `PLAY_JSON` (contenido del service-account JSON).
2. **Sync del registro**: `node mobile/scripts/sync-coaches.mjs <slug>` → revisa
   `mobile/coaches/<slug>.json` (host, branding, `appId`). Rellena `stores.appleTeamId` y el
   `iconSource` (logo 1024px) si el sync no lo trajo. Commit del registro.

## Publicar

`Actions → Publish coach app` → `coach_slug=<slug>`, `platform=both`, `track=internal`.
El workflow genera el proyecto, construye, firma y sube a las dos tiendas bajo la cuenta del
coach. Luego, en cada consola de tienda: completar metadatos restantes y **enviar a revisión**.

## Checklist por coach

- [ ] Cuenta Apple + Play del coach creadas y acceso/credenciales entregados.
- [ ] GitHub Environment `<slug>` con los 4 secrets.
- [ ] `mobile/coaches/<slug>.json` correcto (host = dominio real del coach, icono 1024px).
- [ ] Workflow lanzado; builds verdes; apps en estado *draft* en ambas consolas.
- [ ] Capturas + descripción + política de privacidad en cada ficha.
- [ ] Enviado a revisión (Apple + Google).

## Notas

- **Escala / Apple 4.3:** al publicar cada app bajo la cuenta del coach evitamos el rechazo por
  apps duplicadas — es lo que permite llegar a cientos sin que Apple lo marque como spam.
- **Sin build web por coach:** la web ya es multi-tenant por host; el shell solo carga el host
  del coach.
