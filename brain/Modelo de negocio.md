---
tags: [negocio, dinero, legal]
updated: 2026-05-30
---

# Modelo de negocio

> Delicado, sin margen de error, requiere abogado. Persistido y estudiado.

## El modelo

- **25% vitalicio** de los beneficios que el entrenador genera **a través de la
  app** — como acompañamiento, no como herramienta puntual. La forma correcta de
  cobrar ese % es **Stripe Connect** (application fee), **no** acceso admin al
  Stripe del entrenador (eso es acceso operativo de equipo y no toma %).
- **Setup ~5.000 $** (variable; de cara afuera: "consultar precios con el equipo";
  internamente este es el modelo).
- **~100 $/año** de mantenimiento (sin mensualidad alta).
- **Contrato firmado online**. Dejar todo bien preparado legal.

## Coste variable a cubrir

La IA consume API. Se cubre con [[IA y coste|tiering + cuotas]] y una cuota baja
mensual con margen. Hard caps = nunca perdemos dinero por la IA.

## Por qué el % vitalicio se sostiene

No vendemos una herramienta: somos el **socio operativo** cuya plataforma + datos
por creador mejoran el negocio del coach de forma continua. Ver [[Vision]].

## Estado

Stripe es **lo último** (crear la cuenta es trabajo del fundador). El motor de
cuotas ya protege el margen aunque el cobro no esté conectado. Ver [[Roadmap]].

Docs: `docs/strategy/performlabs-business-model.md`,
`docs/strategy/monetization-and-contract.md`, `docs/strategy/financial-model.md`,
`docs/strategy/term-sheet-contract.md`.
