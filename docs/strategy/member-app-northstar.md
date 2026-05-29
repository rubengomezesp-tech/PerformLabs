# Member app — north star (mockup de referencia)

Guía de diseño del producto final de la app del miembro (PWA), aportada por el
fundador. Toda construcción de la app del cliente debe converger hacia esto.

## Formato
- **PWA instalable**, mobile-first, modo `standalone` (sin chrome del navegador).
- Tema **oscuro casi-negro** + **acento dorado** (editable por marca).
- Tipografía limpia, tarjetas redondeadas, **fotografía** real en entreno y comida.
- **Barra de pestañas inferior** (no menú lateral en móvil).

## Navegación: 5 pestañas (bottom-nav)
`Panel · Entreno · Comida · Progreso · Soporte` — activo en dorado.
IA condensada (lo demás vive dentro de estas 5):
- **Panel** ← Hábitos, Perfil, "Mi Recorrido"
- **Entreno** ← Cardio
- **Comida** ← Recetas, Diario, Smart Add
- **Progreso** ← Fotos, Medidas, Historial
- **Soporte** ← Guías, mensajes del equipo

## Pantallas (contenido objetivo)
1. **Panel (home)**: "Bienvenido a {marca}" + logo · **Mi Recorrido** (Semana X de
   12 + barra %) · **Hábitos de hoy** (checklist inline, N/total) · **Actualización
   de plan** (próximo check-in con fecha).
2. **Entreno**: **Plan semanal** (N días/semana) con tarjeta + **foto** por día
   (título, duración) · **Próximo entrenamiento** (Hoy) + botón **Iniciar
   entrenamiento**.
3. **Comida**: **Nutrición diaria** = tiles de macros (kcal, Proteína, Carbo,
   Grasa) · lista de comidas con **foto** (Desayuno/Almuerzo/Cena/Snack) y macros
   por comida.
4. **Progreso**: tabs **Resumen / Fotos / Medidas / Historial** · **Peso actual**
   y **Grasa corporal** con delta vs inicio · **Evolución** (gráfico 30 días) ·
   **Fotos de progreso** (miniaturas + subir).
5. **Soporte**: "¿Necesitas ayuda?" + **Enviar mensaje** · **Guías** (Guía inicial,
   Cómo usar la app, Nutrición, Entrenamiento) · **Mensajes del equipo**.

## Estado de construcción (vs north star)
- ✅ PWA instalable: manifest por marca, iconos generados, theme-color, service worker.
- ✅ Bottom-nav de 5 pestañas (activo dorado, safe-area).
- ✅ Branding editable por entrenador (acento, logo, fondo, hero, bienvenida).
- ✅ Comida cercana (tiles/anillos de macros + recetas con foto + Smart Add IA).
- 🟡 **Panel**: falta "Mi Recorrido" (semana del programa) + Hábitos de hoy inline + próximo check-in.
- 🟡 **Entreno**: falta tarjeta con foto por día del plan semanal.
- 🟡 **Progreso**: falta estructura tabs + peso/grasa con delta + gráfico.
- 🟡 Top header móvil (☰ + título + 🔔) como en el mockup.

## Principios
Premium de verdad (¿lo firmaría el líder de categoría?), mobile-first, marca del
entrenador en todo, y cero métricas inventadas.
