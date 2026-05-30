# Product

## Register

product

## Users
PerformLabs es una plataforma white-label de coaching de fitness con tres roles en el mismo sistema:
- **Dueño de plataforma (operador):** gestiona workspaces, licencias, leads, seguridad y catálogos desde `/console`. Uso diario, muchas secciones y datos densos; necesita orientarse y actuar rápido.
- **Entrenador (coach):** opera su marca desde `/coach` (clientes, programas, nutrición, IA, contenido, facturación).
- **Cliente final:** usa su app de marca en `/app` (entrenos, comidas, progreso, check-ins).

## Product Purpose
Permitir que un entrenador lance su propia app de marca y cobre a sus clientes vía Stripe Connect, mientras el operador gestiona licencias y negocio. El éxito: cada rol entra, encuentra lo que busca y completa su tarea sin fricción.

## Brand Personality
Profesional, eficiente, moderno, de confianza. Voz directa y concreta, sin jerga de marketing. La interfaz se siente como una herramienta seria (Linear, Stripe, Notion), no como una landing.

## Anti-references
- Cards grandes y espaciadas que muestran poca información y obligan a hacer scroll.
- Dashboards "hero-metric" decorativos.
- Texto gris de bajo contraste sobre fondos tintados.
- Navegación plana con decenas de enlaces sin agrupar.

## Design Principles
1. **Densidad legible:** más información útil por pantalla, recogida y ordenada, sin sacrificar contraste ni jerarquía.
2. **Orientación inmediata:** la navegación agrupa por intención; en cualquier pantalla se sabe dónde estás y qué puedes hacer.
3. **La herramienta desaparece:** afordancias estándar y consistentes (mismo botón, mismo campo, mismo estado) en las tres superficies.
4. **Accesible de serie:** foco visible, contraste AA, labels reales, teclado y móvil.
5. **No romper lo que funciona:** el rediseño es de presentación; las server actions y endpoints existentes se preservan intactos.

## Accessibility & Inclusion
Objetivo WCAG 2.1 AA: contraste de texto ≥4.5:1 (≥3:1 en texto grande), foco visible en cada elemento interactivo, labels asociados a cada control, navegación por teclado y `prefers-reduced-motion` respetado. Pensado para uso denso en escritorio y para móvil.
