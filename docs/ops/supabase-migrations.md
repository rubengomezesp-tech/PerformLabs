# Migraciones de Supabase (automáticas en producción)

El workflow `.github/workflows/deploy-migrations.yml` aplica
`supabase/migrations/**` a la Supabase de **producción** automáticamente cuando
una migración llega a `main` (y también a mano con *Run workflow*). Así el
esquema de producción siempre va sincronizado con el código y dejamos de tener
500 por columnas/tablas que faltan.

## Secretos del repo (una sola vez)

GitHub → Settings → Secrets and variables → Actions → **New repository secret**:

| Secreto | Dónde sacarlo |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens (Personal access token) |
| `SUPABASE_PROJECT_REF` | Project Settings → General → *Reference ID* (el `xxxxxxxx` del proyecto de prod) |
| `SUPABASE_DB_PASSWORD` | Project Settings → Database → *Database password* |

En cuanto estén los 3, lanza el workflow a mano una vez (**Actions → Deploy
Supabase migrations → Run workflow**) para validar la conexión. A partir de ahí
corre solo en cada merge a `main` que toque `supabase/migrations/`.

## Notas

- `supabase db push` es **idempotente**: solo aplica las migraciones que aún no
  constan en `supabase_migrations.schema_migrations` del proyecto remoto.
- Si alguna migración se aplicó **a mano** (SQL Editor) sin quedar registrada,
  márcala como aplicada con `supabase migration repair --status applied <version>`
  para que `db push` no intente repetirla.
- Migraciones nuevas: créalas en `supabase/migrations/` con el formato
  `<timestamp>_nombre.sql` y usa `create table if not exists` /
  `add column if not exists` para que sean re-ejecutables sin romper.
