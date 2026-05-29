# Monetización y contrato — estudio (delicado, revisar con profesionales)

> Esto toca dinero y legal. **No soy abogado ni asesor fiscal.** Las cifras y la
> mecánica técnica son sólidas, pero el **contrato y el tratamiento fiscal (IVA,
> retenciones) deben revisarlos un abogado y un asesor** (España/UE). Cero margen
> de error = validación profesional antes de firmar/cobrar.

## Modelo propuesto (a validar)
- **Setup**: pago único por construir la app — ej. **5.000 $**.
- **Mantenimiento**: **~100 $/año** (hosting/operación), sin mensualidad.
- **Revenue-share**: **25% de los ingresos que la app genera al entrenador**,
  vitalicio, vía **Stripe Connect** (automático).
- **Acompañamiento**: marketing/campañas continuas — parte del valor del 25%.

## Mecánica de cobro: Stripe Connect (NO acceso admin a su Stripe)
- El entrenador **conecta su cuenta** de Stripe a la plataforma PerformLabs.
- Cobros a sus clientes con **`application_fee_percent: 25`** (suscripciones) o
  `application_fee_amount` (pagos únicos) → el 25% llega a PerformLabs solo,
  el 75% a la cuenta del entrenador. Automático, recurrente, auditable.
- Esto sustituye por completo a "entrar como admin": es seguro, no depende de
  credenciales del entrenador y deja registro contable.

### Decisiones que hay que estudiar (impactan mucho)
1. **Tipo de cuenta Connect**:
   - **Standard**: el entrenador tiene su dashboard Stripe completo; PerformLabs
     toma application fee. *Riesgo*: puede desconectar la cuenta → pierdes el fee.
   - **Express**: onboarding ligero alojado por Stripe; menos control del
     entrenador, retienes mejor el fee. **Probable mejor encaje.**
   - **Custom/Controller**: máximo control de PerformLabs, pero más
     responsabilidad/compliance (disputas, KYC) sobre vosotros.
2. **Tipo de cargo**: *destination charges* (cargo en la plataforma, transfiere
   al entrenador) vs *direct charges* (cargo en la cuenta del entrenador con app
   fee). Afecta a quién es el "merchant of record", IVA y descriptor del recibo.
3. **Base del 25%**: ¿sobre **bruto** o sobre **neto** (tras comisiones Stripe,
   reembolsos, chargebacks)? Definirlo en el contrato sin ambigüedad.
4. **Si el entrenador desconecta** (posible en Standard): cómo se protege el share
   (contrato + tipo de cuenta + cláusulas).
5. **Quién asume**: comisiones Stripe, reembolsos, disputas, impuestos.

## El contrato (firma online)
- **E-sign**: DocuSign / Signaturit / similar (válido en UE).
- **Debe cubrir, como mínimo**:
  - Setup (5.000 $), mantenimiento anual (100 $), **25% revenue-share**.
  - **Definición exacta de "ingresos"** (bruto/neto, qué cuenta).
  - **Autorización Connect** (el entrenador autoriza la application fee).
  - **Duración**: ojo con "vitalicio" — jurídicamente mejor "mientras el servicio
    esté activo" + **cláusulas de terminación** y qué pasa al salir.
  - **Propiedad**: datos del entrenador y sus clientes, marca, contenido; qué se
    llevan al terminar (export, no lock-in abusivo).
  - **Servicios de marketing**: alcance y expectativas (sin prometer resultados).
  - Protección de datos (RGPD), responsabilidades, ley aplicable.

## Riesgos / cero-margen-de-error
- "Vitalicio" + revenue-share perpetuo: revisar enforceability con abogado.
- IVA en marketplace (Connect) es delicado: validar con asesor + docs Stripe.
- No prometer ingresos/resultados en el contrato ni en el marketing.

## Pendiente de implementación (cuando haya claves + contrato validado)
1. Stripe **Connect onboarding** del entrenador (OAuth/Express).
2. Cobros con **application_fee del 25%** + suscripciones.
3. **Vista de ingresos** en consola (bruto / 25% PerformLabs / 75% neto).
4. Flujo de **firma de contrato online** integrado en el alta de la marca.
