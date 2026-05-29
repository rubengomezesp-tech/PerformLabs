# Term sheet + borrador de contrato — PerformLabs ↔ Entrenador

> ⚠️ **Borrador de trabajo, NO asesoramiento legal.** Lo redacto para que tu
> **abogado** (España/UE) lo finalice y un **asesor fiscal** valide el IVA/Connect.
> No firmar ni cobrar sin revisión profesional. Marcas `[REVISAR ABOGADO]` = decisión
> jurídica.

## 1. Term sheet (condiciones comerciales)

| Concepto | Condición |
|---|---|
| **Cuota de implementación (setup)** | **Variable, a presupuestar por el equipo** según alcance. No es precio público fijo. *Referencia interna ~$5.000.* Pago único al inicio, a PerformLabs. |
| **Mantenimiento** | **$100/año** (operación/hosting), a PerformLabs. |
| **Revenue-share** | **25%** de los ingresos brutos que la app genera al entrenador, vía **Stripe Connect** (application fee automática). |
| **Reparto** | Entrenador **75%** + su propio Stripe; PerformLabs **25%** automático. |
| **Acompañamiento** | Soporte continuo + equipo de marketing (campañas, impulso). Sin garantía de resultados. |
| **Duración** | Mientras el servicio esté activo, con renovación y cláusulas de salida `[REVISAR ABOGADO]` (evitar "perpetuo" sin salida). |
| **Ley aplicable** | España / UE `[REVISAR ABOGADO]`. |

## 2. Cláusulas del contrato (esqueleto orientativo)

1. **Objeto.** PerformLabs diseña, implanta y opera una app de marca para el
   entrenador, y presta acompañamiento de negocio/marketing continuo.
2. **Cuota de implementación.** Importe presupuestado caso a caso (anexo de precio
   firmado). Pago previo al inicio. No reembolsable una vez iniciada la
   construcción `[REVISAR ABOGADO]`.
3. **Mantenimiento anual.** $100/año, factura recurrente.
4. **Revenue-share (25%).**
   - Se calcula sobre los **ingresos brutos** cobrados a los clientes del
     entrenador a través de la app `[DECIDIR: bruto vs neto tras comisiones Stripe/reembolsos]`.
   - Se percibe automáticamente como **application fee del 25%** mediante Stripe
     Connect; el entrenador **autoriza** expresamente dicha comisión.
   - Reembolsos/chargebacks: tratamiento `[REVISAR ABOGADO]` (ajuste del fee).
5. **Stripe / cuentas.** El entrenador usa **su propia cuenta de Stripe** conectada
   a la plataforma (Connect Standard). Recibe el 75% directamente. PerformLabs **no**
   accede con credenciales del entrenador; el acceso "team member" (si lo hay) es
   solo para soporte operativo, no para mover fondos.
6. **Servicios de marketing.** Alcance descrito en anexo; esfuerzo razonable, **sin
   garantía de ingresos ni resultados**.
7. **Propiedad y datos.** El entrenador es titular de su marca, su contenido y los
   datos de sus clientes. PerformLabs es titular de la plataforma/software. A la
   terminación: **exportación de datos** del entrenador y plan de salida ordenado
   `[REVISAR ABOGADO: no lock-in abusivo]`.
8. **Protección de datos (RGPD).** Roles responsable/encargado, DPA, finalidades,
   seguridad `[REVISAR ABOGADO]`.
9. **Duración y terminación.** Plazo inicial + renovación; causas de resolución;
   qué pasa con el 25% y la app al terminar `[REVISAR ABOGADO]`.
10. **Responsabilidad y límites.** Limitación de responsabilidad, fuerza mayor,
    confidencialidad `[REVISAR ABOGADO]`.
11. **Fiscalidad.** IVA del setup, del mantenimiento y del application fee en
    esquema marketplace `[REVISAR ASESOR FISCAL]`.
12. **Ley y jurisdicción.** `[REVISAR ABOGADO]`.

## 3. Firma online
- E-signature válida en UE (DocuSign / Signaturit / similar).
- Estructura: contrato marco + **anexo de precio** (setup cotizado) + **autorización
  Stripe Connect**. Todo firmado antes de empezar a construir y de conectar cobros.

## 4. Checklist antes de ir en vivo
- [ ] Abogado revisa y cierra el contrato (España/UE).
- [ ] Asesor fiscal valida IVA en Connect (bruto vs neto, facturación del fee).
- [ ] Definido **bruto vs neto** para el 25% (recomendado: bruto, claro en contrato).
- [ ] Definida duración + salida (sin "perpetuo" sin cláusula de terminación).
- [ ] Flujo de firma online + anexo de precio operativo.
- [ ] Stripe Connect (Express/Standard) implementado con application fee 25%.

> Modelo a seguir internamente: **A (setup ~$5k variable + $100/año + 25%)**, con el
> setup siempre como "consultar con el equipo" de cara al entrenador.
