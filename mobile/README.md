# RG Coach · app nativa del cliente

Aplicación Expo/React Native controlada por la consola web del coach. La consola publica entrenamiento, nutrición, hábitos, revisiones y saldo de sesiones; la app cliente los consume con la identidad del miembro y las políticas RLS de Supabase.

## Arquitectura

- `app/`: rutas y presentación nativa con Expo Router.
- `src/domain/`: contratos de negocio sin dependencias de Expo ni Supabase.
- `src/infrastructure/`: adaptadores de Supabase y datos de demostración.
- `src/providers/`: sesión y estado de la experiencia del miembro.
- `src/theme/`: identidad visual RG Coach.

La app nunca contiene la service-role key. Solo utiliza la clave publicable y las políticas RLS existentes para limitar cada consulta al cliente autenticado.

## Configuración local

1. Copia `.env.example` como `.env.local`.
2. Usa `NEXT_PUBLIC_SUPABASE_URL` como `EXPO_PUBLIC_SUPABASE_URL`.
3. Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` como `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Ejecuta desde la raíz:

```bash
pnpm mobile:start
pnpm mobile:ios
pnpm mobile:typecheck
```

Sin variables de Supabase la aplicación abre automáticamente el modo demostración. Esto permite revisar la experiencia y después servirá como base para la cuenta de demostración de App Review.

## Datos conectados en la fase 1

- Perfil del miembro.
- Programa y semana actual.
- Próximo entrenamiento y número de ejercicios.
- Plan nutricional y objetivos principales.
- Hábitos diarios con marcado optimista y persistencia.
- Bonos, saldo de entrenamientos y próxima caducidad.
- Próxima sesión personal reservada.

## Publicación

`eas.json` contiene perfiles de desarrollo, preview y producción. Antes del primer build se debe ejecutar `eas init` para registrar el proyecto, configurar el equipo de Apple y añadir las variables públicas como secretos del proyecto EAS.

RevenueCat se integrará sobre el UUID privado del miembro como App User ID. Sus claves públicas ya están reservadas en `.env.example`; no se utilizarán correos electrónicos como identificador.
