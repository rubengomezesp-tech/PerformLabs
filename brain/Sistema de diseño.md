---
tags: [diseno, ui, frontend]
updated: 2026-05-30
---

# Sistema de diseño (2026)

Lenguaje visual "Ethereal Glass" sobre fondo casi-OLED, un solo acento azul.
Aplicado en **toda la plataforma** vía primitivos compartidos en `app/globals.css`.

## Tokens

- Acento (base de marca): **`#078df2`** (cada entrenador lo sobreescribe).
- Fondo `#080909`. Superficies tintadas, hairlines `white/10`.
- Radios suaves (cards 16px), sombras **teñidas** (no negro duro), brillo interior.

## Tipografía (la que más se pide hoy)

- **Geist** — UI y cuerpo (`--font-sans`).
- **Bricolage Grotesque** — titulares con carácter (`--font-display`).
- **Geist Mono** — números tabulares en métricas/datos (`--font-mono`).

## Patrones

- Doble-bisel, botón-en-botón (flecha en círculo), eyebrows tipo pill, mucho aire.
- Motion: `framer-motion` + `lenis`, easing ease-out (cubic-bezier propio), sin
  rebotes, reduced-motion siempre. Galerías **deslizables** (drag).
- El móvil 3D del hero recorre pantallas reales (Entreno/Comida/Progreso).

## Consola: densidad legible (rediseño 2026-05-30)

La landing respira; la **consola es una herramienta** (estilo Linear/Stripe). Pase
sistémico (fases 1-5) hacia **densidad legible**: más información útil por pantalla,
cards planas (no glossy, sin gradiente+glow+stripe lateral), formularios responsive
(`auto-fit`, sin breakpoints), formularios largos **colapsables** (`<details>`),
empty states que enseñan, densidad por página. Sin cards anidadas. El control de
licencia se sube al frente en `/console/apps`. Anclado en **`PRODUCT.md`** (raíz:
register `product`, principios y objetivo **WCAG AA**). Ver [[Decisiones]].

## Skills de diseño usadas

`impeccable` (Peter Bakaus), `high-end-visual-design`, `redesign-existing-projects`
y filosofía de motion de Emil Kowalski. Instaladas en `.agents/skills`
(gitignored). **`PRODUCT.md`** ya formalizado en la raíz (ver arriba); pendiente
`DESIGN.md`.

Relacionado: [[Posicionamiento]] (el landing aplica esto), [[Arquitectura]].
