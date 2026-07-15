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

Cuando Supabase está configurado, la pantalla de acceso conserva un recorrido de demostración independiente con datos ficticios. Apple puede revisar la experiencia sin credenciales y el pago permanece desactivado dentro de ese modo.

## Datos conectados en la fase 1

- Perfil del miembro.
- Programa y semana actual.
- Próximo entrenamiento y número de ejercicios.
- Plan nutricional y objetivos principales.
- Hábitos diarios con marcado optimista y persistencia.
- Bonos, saldo de entrenamientos y próxima caducidad.
- Próxima sesión personal reservada.
- Compra segura del bono activo de 10 sesiones, vinculada al ID privado del miembro para que el webhook asigne los créditos automáticamente.

## Publicación

`eas.json` contiene perfiles de desarrollo, preview y producción. Antes del primer build se debe ejecutar `eas init` para registrar el proyecto, configurar el equipo de Apple y añadir las variables públicas como secretos del proyecto EAS.

`store.config.json` deja preparada la ficha bilingüe de App Store, las categorías, URLs legales y notas para revisión. EAS Metadata podrá sincronizarla cuando la aplicación exista en App Store Connect.

RevenueCat usa el UUID privado del perfil del miembro como App User ID. El bono presencial abre el checkout web seguro con ese identificador, por lo que nunca se utiliza el correo como clave de asignación. Las claves públicas del SDK quedan reservadas en `.env.example` para futuras prestaciones digitales que sí requieran compras nativas.
