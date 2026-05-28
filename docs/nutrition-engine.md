# Motor Nutricional

La plataforma operativa debe poder generar planes alimenticios para cualquier app de cliente.
La consola controla las fórmulas, plantillas, categorías, recetas, ingredientes y
reglas de sustitución.

## Datos de Entrada

Por miembro:

- Sexo
- Edad
- Altura
- Peso
- Objetivo
- Nivel de actividad
- Días de entrenamiento
- Lesiones o limitaciones
- Preferencias alimentarias
- Alergias
- Ingredientes que no le gustan
- Categorías permitidas: sin gluten, vegana, vegetariana, mediterránea, alta proteína, etc.

## Fórmula Base

Mifflin-St Jeor:

```txt
Hombre: BMR = 10 * pesoKg + 6.25 * alturaCm - 5 * edad + 5
Mujer:  BMR = 10 * pesoKg + 6.25 * alturaCm - 5 * edad - 161
TDEE = BMR * factorActividad
```

## Ajuste Por Objetivo

```txt
definicion:      calorias = TDEE - 10% a 25%
mantenimiento:  calorias = TDEE
volumen_limpio: calorias = TDEE + 5% a 15%
volumen:        calorias = TDEE + 15% a 25%
```

## Macros

Regla inicial editable por app de cliente:

```txt
proteinaG = pesoKg * 1.8 a 2.4
grasaG = calorias * 0.20 a 0.30 / 9
carbosG = caloriasRestantes / 4
```

Cada entrenador podrá guardar sus propias fórmulas en `nutrition_formulas`.

## Selección de Recetas

El generador debe:

1. Filtrar por categoría de dieta.
2. Excluir alergias.
3. Excluir ingredientes no deseados.
4. Elegir recetas compatibles por slot: desayuno, comida, cena, snack.
5. Ajustar porciones para acercarse a calorías y macros.
6. Crear lista de compra agrupada.
7. Guardar `formula_snapshot` en el plan asignado.

## Categorías Iniciales

- Sin gluten
- Sin lactosa
- Vegetariana
- Vegana
- Alta proteína
- Definición
- Volumen
- Mediterránea
- Low carb
- Flexible

## Control Desde La Consola Operativa

La consola suprema puede:

- Crear categorías globales.
- Hacer plantillas base.
- Clonar plantillas a una app de cliente.
- Bloquear o desbloquear funciones por plan.
- Ver qué app de cliente modificó una plantilla.
- Restaurar una plantilla base.
- Publicar cambios a una app de cliente.
