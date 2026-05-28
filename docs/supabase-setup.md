# Supabase Setup

## 1. Variables Locales

Crea `.env.local` en la raíz de `apps/coach-platform` con:

```txt
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

No subas `.env.local` a Git.

## 2. Crear Esquema

En Supabase:

1. Abre SQL Editor.
2. Copia el contenido de `supabase/migrations/0001_initial_schema.sql`.
3. Ejecuta.

## 3. Semilla Inicial

Después ejecuta:

```txt
scripts/bootstrap.sql
```

Esto crea:

- Workspace operativo interno.
- App de cliente de marca blanca.
- Categorías base de dieta.
- Categorías base de ejercicios.
- Fórmula nutricional base.

## 4. Comprobación

Arranca:

```bash
pnpm dev
```

Abre:

```txt
http://localhost:3000/console/setup
```

Debe mostrar Supabase configurado.
