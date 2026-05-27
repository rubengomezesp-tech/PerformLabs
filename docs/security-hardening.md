# Security Hardening Baseline

## Objetivo

CoachOS debe operar varias marcas desde una consola central sin mezclar permisos, datos ni trazabilidad. Esta fase establece la base de gobierno antes de abrir acceso a equipo, entrenadores o clientes reales.

## Decisiones implementadas

- La consola pasa por `requireConsoleAccess`.
- Las acciones internas pasan por permisos de plataforma o permisos por marca.
- El modo local sigue abierto si `COACHOS_AUTH_REQUIRED` no es `true`.
- En producción, la sesión se valida contra Supabase Auth con la cookie `coachos_access_token`.
- Los roles operativos son `platform_owner`, `agency_admin`, `coach_admin` y `coach_staff`.
- El rol `member` no puede entrar a consola.
- Las acciones críticas escriben en `audit_log`.
- El login conserva el destino interno con `next` y evita redirects externos.

## Roles

| Rol | Alcance |
| --- | --- |
| `platform_owner` | Control total de plataforma y marcas |
| `agency_admin` | Operación de plataforma y marcas |
| `coach_admin` | Gestión de su marca |
| `coach_staff` | Operación de contenido, clientes y planes de su marca |
| `member` | App cliente, sin consola |

## Activación en producción

Configurar:

```env
COACHOS_AUTH_REQUIRED=true
COACHOS_OWNER_EMAIL=correo-del-propietario
```

Después, cada usuario operativo necesita una fila en `workspace_memberships`.

## Pendiente siguiente

- Crear UI para invitar equipo y asignar roles sin tocar base de datos.
- Proteger `/app` por miembro real cuando dejemos la demo pública.
- Añadir tests e2e para login, bloqueo de consola y mutaciones protegidas.
- Revisar políticas RLS tabla por tabla antes de abrir tráfico real.
