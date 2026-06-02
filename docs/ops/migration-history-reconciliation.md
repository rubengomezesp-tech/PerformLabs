# Reconciliación del historial de migraciones (2026-06-02)

> El workflow **"Deploy Supabase migrations"** falla en cada push a `main` con
> *"Remote migration versions not found in local migrations directory"*. **No afecta a
> producción** — el esquema está aplicado y correcto; es solo el **historial**
> (`supabase_migrations.schema_migrations`) el que diverge de los archivos del repo.
> Este documento explica por qué y deja los comandos exactos para arreglarlo.

## Por qué pasa

Las migraciones se escribieron como **archivos** con timestamps "redondos"
(`20260531230000_member_billing_connect.sql`) pero se **aplicaron a prod vía el MCP de
Supabase** (`apply_migration`), que las registra en el historial con un timestamp
**exacto** del momento de aplicación (`20260601022651`). Resultado: la misma migración
consta con **dos versiones distintas** (archivo vs historial), y `supabase db push` se
niega a continuar porque ve versiones en remoto que no tienen archivo gemelo.

**Regla de oro a futuro (PREVENCIÓN):** no apliques migraciones del repo con el MCP
`apply_migration`. Crea el **archivo** en `supabase/migrations/` y deja que el workflow
`deploy-migrations` lo aplique al mergear a `main` (`supabase db push`). Si necesitas
aplicar algo a mano para probar, hazlo en una **branch de Supabase**, o reconcilia el
historial después con los comandos de abajo.

## El arreglo (lo corres tú, con el Supabase CLI + `SUPABASE_DB_PASSWORD`)

`supabase migration repair` **solo toca la tabla de historial — NO ejecuta SQL**, así que
es seguro: no altera el esquema, solo alinea el registro.

```bash
supabase link --project-ref gsfzigayzqhzbtrmmiqq

# 1) Registrar como APPLIED los 18 archivos del repo cuyo SQL ya está en prod
#    (con su timestamp "redondo" — el del nombre del archivo):
supabase migration repair --status applied \
  20260530230000 20260531000000 20260531020000 20260531030000 20260531040000 \
  20260531050000 20260531060000 20260531070000 20260531080000 20260531090000 \
  20260531100000 20260531110000 20260531230000 20260601000000 20260601001000 \
  20260601040000 20260601050000 20260602120000

# 2) Quitar del historial las versiones "exactas" que el MCP registró (su SQL ya está
#    en prod; esto NO lo revierte, solo limpia el registro duplicado):
supabase migration repair --status reverted \
  20260530220130 20260531041021 20260531085400 20260531085411 20260531104133 \
  20260531104146 20260531145749 20260531155020 20260531162526 20260531164241 \
  20260531184155 20260531205659 20260601022651 20260601023740 20260601182558 \
  20260601182608 20260601182744 20260602160148

# 3) Verificar: repo y remoto deben coincidir ya
supabase migration list
```

Tras esto, `supabase db push` (el workflow) no verá divergencia → **vuelve a verde**, y las
futuras migraciones (archivos en el repo) se aplicarán solas al mergear a `main`.

## Pendiente aparte: 4 migraciones en prod SIN archivo en el repo

Estas 4 versiones están aplicadas en producción pero **nunca se commiteó su archivo**
(se aplicaron vía MCP en una sesión anterior). Son cambios de **seguridad/RLS**, así que
conviene recuperarlas para que un `db reset` reproduzca el esquema:

| Versión remota | Nombre |
|---|---|
| `20260531023505` | `member_rls_policies_for_mobile` |
| `20260531023951` | `fix_cross_tenant_pii_leaks` |
| `20260531024313` | `member_rls_catalogs_and_subscriptions` |
| `20260531024330` | `enable_realtime_coach_ai_messages` |

Los comandos de arriba **NO** las tocan (no están ni en applied ni en reverted), así que
siguen en el historial — pero `db push` se quejaría de ellas. **Dos opciones:**

- **(A) Recuperar su SQL** (recomendado, preserva reproducibilidad): `supabase db pull`
  genera un archivo con el delta repo↔prod; revísalo, renómbralo/divídelo si quieres y
  commitéalo. Entonces el repo tendrá las 4.
- **(B) Si no las necesitas reproducibles:** añádelas al bloque `--status reverted` del
  paso 2 (su SQL permanece en prod; solo se borra el registro). Más rápido, pero un
  `db reset` no las replicaría.

> Hasta resolver estas 4, el workflow puede seguir fallando por ellas. Lo mínimo para
> ponerlo en verde **ya** es la opción (B); lo correcto a medio plazo es la (A).
