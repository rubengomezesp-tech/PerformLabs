# Exercise Library Import

Base recomendada: Free Exercise DB.

- Fuente: https://github.com/yuhonas/free-exercise-db
- JSON combinado: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
- Licencia: Unlicense / public domain
- Volumen: 800+ ejercicios con nombre, nivel, equipo, musculos, categoria, instrucciones e imagenes.

## Por que esta fuente

Free Exercise DB tiene una licencia sencilla para redistribucion y uso comercial. La usaremos como columna vertebral de biblioteca base. wger puede servir como referencia secundaria de taxonomia, pero al tener licencia AGPL/CC BY-SA debe entrar en una fase separada con atribucion y revision legal.

## Importacion

Modo prueba:

```bash
pnpm import:exercises
```

Importar a Supabase:

```bash
pnpm import:exercises -- --apply
```

Limitar registros para una prueba controlada:

```bash
pnpm import:exercises -- --limit=25 --apply
```

## Campos guardados

La importacion rellena `exercises` con:

- `source_dataset`
- `source_id`
- `source_license`
- `source_url`
- `image_urls`
- `muscle_groups`
- `secondary_muscle_groups`
- `equipment`
- `locations`
- `difficulty`
- `instructions`
- `force_type`
- `mechanic`
- `movement_category`

## Siguiente fase editorial

1. Revisar traduccion ES/EN de musculos y equipamiento.
2. Marcar ejercicios premium propios con videos del entrenador.
3. Crear reglas de sustitucion por lesion/equipamiento.
4. Anadir filtros en consola por musculo, equipo, nivel y fuente.
5. Generar thumbnails propios si no queremos depender de imagenes externas.
