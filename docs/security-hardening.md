# Security Hardening Baseline

## Objetivo

PerformLabs debe operar varias marcas desde una consola central sin mezclar permisos, datos ni trazabilidad. Esta fase establece la base de gobierno antes de abrir acceso a equipo, entrenadores o clientes reales.

## Decisiones implementadas

- La consola pasa por `requireConsoleAccess`.
- Las acciones internas pasan por permisos de plataforma o permisos por marca.
- El modo local sigue abierto si `COACHOS_AUTH_REQUIRED` no es `true`.
- En producción, la sesión se valida contra Supabase Auth con la cookie `performlabs_access_token`.
- Los roles operativos son `platform_owner`, `agency_admin`, `coach_admin` y `coach_staff`.
- El rol `member` no puede entrar a consola.
- Las acciones críticas escriben en `audit_log`.
- El login conserva el destino interno con `next` y evita redirects externos.
- El login aplica rate limit por IP/email y registra intentos fallidos/rate-limited en `audit_log` con hashes.
- La app sirve headers base de seguridad: CSP, frame deny, nosniff, referrer policy, permissions policy y HSTS.
- Las reglas puras de roles y rate limiting tienen tests automatizados con Vitest.
- CI fuerza acciones JavaScript en Node 24 para anticipar el cambio de GitHub Actions de junio de 2026.
- `/console/security` agrupa alertas de login fallido/rate-limited sin exponer emails ni IPs reales.
- La base incluye buckets/policies de Storage por marca: `brand-assets`, `exercise-media` y `member-progress`.
- Las tablas de registro de entreno/comida tienen políticas RLS preparadas para miembro real y equipo de la marca.

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
- Rediseñar funciones `SECURITY DEFINER` (`is_platform_owner`, `is_workspace_member`, `has_workspace_role`) para eliminar exposición RPC sin romper políticas RLS.
- Aplicar advisor real de Supabase cuando el MCP esté autenticado o `SUPABASE_DB_URL` tenga contraseña real.
