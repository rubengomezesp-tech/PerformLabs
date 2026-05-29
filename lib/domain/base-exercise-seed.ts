// Canonical base exercise library (~85 Spanish exercises) shared between the
// in-app "Cargar librería base" action and scripts/sql/base-exercise-library.sql.
// is_base_library = true, workspace_id = null. Idempotent upsert by slug.

export type BaseExerciseSeed = {
  name: string;
  slug: string;
  muscles: string[];
  equipment: string[];
  locations: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
};

export const baseExerciseSeed: BaseExerciseSeed[] = [
  // Pierna
  { name: "Sentadilla con barra", slug: "sentadilla-barra", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Sentadilla frontal", slug: "sentadilla-frontal", muscles: ["Cuádriceps"], equipment: ["Barra"], locations: ["gym"], difficulty: "advanced" },
  { name: "Sentadilla goblet", slug: "sentadilla-goblet", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Prensa de piernas", slug: "prensa-piernas", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Hack squat", slug: "hack-squat", muscles: ["Cuádriceps"], equipment: ["Máquina"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Zancadas", slug: "zancadas", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Zancada caminando", slug: "zancada-caminando", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Sentadilla búlgara", slug: "sentadilla-bulgara", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "intermediate" },
  { name: "Step-up", slug: "step-up", muscles: ["Cuádriceps", "Glúteos"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Peso muerto", slug: "peso-muerto", muscles: ["Isquios", "Glúteos", "Espalda"], equipment: ["Barra"], locations: ["gym"], difficulty: "advanced" },
  { name: "Peso muerto rumano", slug: "peso-muerto-rumano", muscles: ["Isquios", "Glúteos"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Peso muerto sumo", slug: "peso-muerto-sumo", muscles: ["Isquios", "Glúteos"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Hip thrust", slug: "hip-thrust", muscles: ["Glúteos"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Puente de glúteo", slug: "puente-gluteo", muscles: ["Glúteos"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Patada de glúteo en polea", slug: "patada-gluteo-polea", muscles: ["Glúteos"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Abducción de cadera en máquina", slug: "abduccion-cadera-maquina", muscles: ["Glúteos"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Curl femoral tumbado", slug: "curl-femoral-tumbado", muscles: ["Isquios"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Curl femoral sentado", slug: "curl-femoral-sentado", muscles: ["Isquios"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Extensión de cuádriceps", slug: "extension-cuadriceps", muscles: ["Cuádriceps"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Elevación de gemelos de pie", slug: "elevacion-gemelos-pie", muscles: ["Gemelos"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Elevación de gemelos sentado", slug: "elevacion-gemelos-sentado", muscles: ["Gemelos"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  // Pecho
  { name: "Press de banca", slug: "press-banca", muscles: ["Pecho", "Tríceps"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Press inclinado con barra", slug: "press-inclinado-barra", muscles: ["Pecho"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Press de banca con mancuernas", slug: "press-banca-mancuernas", muscles: ["Pecho", "Tríceps"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  { name: "Press inclinado con mancuernas", slug: "press-inclinado-mancuernas", muscles: ["Pecho"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Aperturas con mancuernas", slug: "aperturas-mancuernas", muscles: ["Pecho"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  { name: "Cruce de poleas", slug: "cruce-poleas", muscles: ["Pecho"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Contractora (pec deck)", slug: "contractora-pec-deck", muscles: ["Pecho"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Press de pecho en máquina", slug: "press-pecho-maquina", muscles: ["Pecho"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Fondos en paralelas", slug: "fondos-paralelas", muscles: ["Pecho", "Tríceps"], equipment: ["Peso corporal"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Flexiones", slug: "flexiones", muscles: ["Pecho", "Tríceps"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  // Espalda
  { name: "Dominadas", slug: "dominadas", muscles: ["Espalda", "Bíceps"], equipment: ["Peso corporal"], locations: ["gym"], difficulty: "advanced" },
  { name: "Dominadas asistidas", slug: "dominadas-asistidas", muscles: ["Espalda", "Bíceps"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Jalón al pecho", slug: "jalon-pecho", muscles: ["Espalda"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Jalón agarre cerrado", slug: "jalon-agarre-cerrado", muscles: ["Espalda"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Remo con barra", slug: "remo-barra", muscles: ["Espalda"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Remo con mancuerna", slug: "remo-mancuerna", muscles: ["Espalda"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  { name: "Remo en polea baja", slug: "remo-polea-baja", muscles: ["Espalda"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Remo en máquina", slug: "remo-maquina", muscles: ["Espalda"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Pullover en polea", slug: "pullover-polea", muscles: ["Espalda"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Hiperextensiones", slug: "hiperextensiones", muscles: ["Espalda baja", "Glúteos"], equipment: ["Peso corporal"], locations: ["gym"], difficulty: "beginner" },
  // Hombro / trapecio
  { name: "Press militar de pie", slug: "press-militar-pie", muscles: ["Hombros"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Press de hombros con mancuernas", slug: "press-hombros-mancuernas", muscles: ["Hombros"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  { name: "Press Arnold", slug: "press-arnold", muscles: ["Hombros"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Press de hombros en máquina", slug: "press-hombros-maquina", muscles: ["Hombros"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Elevaciones laterales", slug: "elevaciones-laterales", muscles: ["Hombros"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Elevaciones laterales en polea", slug: "elevaciones-laterales-polea", muscles: ["Hombros"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Elevaciones frontales", slug: "elevaciones-frontales", muscles: ["Hombros"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Pájaros (deltoide posterior)", slug: "pajaros-deltoide-posterior", muscles: ["Hombros"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  { name: "Face pull", slug: "face-pull", muscles: ["Hombros", "Espalda"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Encogimientos (trapecio)", slug: "encogimientos-trapecio", muscles: ["Trapecio"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  // Bíceps
  { name: "Curl con barra", slug: "curl-barra", muscles: ["Bíceps"], equipment: ["Barra"], locations: ["gym"], difficulty: "beginner" },
  { name: "Curl con mancuernas", slug: "curl-mancuernas", muscles: ["Bíceps"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Curl martillo", slug: "curl-martillo", muscles: ["Bíceps", "Antebrazo"], equipment: ["Mancuernas"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Curl predicador", slug: "curl-predicador", muscles: ["Bíceps"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Curl en polea", slug: "curl-polea", muscles: ["Bíceps"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Curl concentrado", slug: "curl-concentrado", muscles: ["Bíceps"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  // Tríceps
  { name: "Extensión de tríceps en polea", slug: "extension-triceps-polea", muscles: ["Tríceps"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Press francés", slug: "press-frances", muscles: ["Tríceps"], equipment: ["Barra"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Extensión por encima de la cabeza", slug: "extension-triceps-encima-cabeza", muscles: ["Tríceps"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  { name: "Fondos en banco", slug: "fondos-banco", muscles: ["Tríceps"], equipment: ["Peso corporal"], locations: ["gym", "home"], difficulty: "beginner" },
  { name: "Patada de tríceps", slug: "patada-triceps", muscles: ["Tríceps"], equipment: ["Mancuernas"], locations: ["gym"], difficulty: "beginner" },
  // Core
  { name: "Plancha", slug: "plancha", muscles: ["Core"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Plancha lateral", slug: "plancha-lateral", muscles: ["Core"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Elevación de piernas colgado", slug: "elevacion-piernas-colgado", muscles: ["Core"], equipment: ["Peso corporal"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Crunch en polea", slug: "crunch-polea", muscles: ["Core"], equipment: ["Polea"], locations: ["gym"], difficulty: "beginner" },
  { name: "Crunch abdominal", slug: "crunch-abdominal", muscles: ["Core"], equipment: ["Peso corporal"], locations: ["home"], difficulty: "beginner" },
  { name: "Rueda abdominal", slug: "rueda-abdominal", muscles: ["Core"], equipment: ["Rueda"], locations: ["gym", "home"], difficulty: "advanced" },
  { name: "Mountain climbers", slug: "mountain-climbers", muscles: ["Core", "Cardio"], equipment: ["Peso corporal"], locations: ["home"], difficulty: "beginner" },
  { name: "Russian twist", slug: "russian-twist", muscles: ["Core"], equipment: ["Peso corporal"], locations: ["home"], difficulty: "beginner" },
  // Cardio / acondicionamiento
  { name: "Cinta de correr", slug: "cinta-correr", muscles: ["Cardio"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Bicicleta estática", slug: "bicicleta-estatica", muscles: ["Cardio"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Remo (máquina cardio)", slug: "remo-maquina-cardio", muscles: ["Cardio", "Espalda"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Elíptica", slug: "eliptica", muscles: ["Cardio"], equipment: ["Máquina"], locations: ["gym"], difficulty: "beginner" },
  { name: "Battle ropes", slug: "battle-ropes", muscles: ["Cardio", "Hombros"], equipment: ["Cuerda"], locations: ["gym"], difficulty: "intermediate" },
  { name: "Burpees", slug: "burpees", muscles: ["Cardio"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "intermediate" },
  { name: "Saltar a la comba", slug: "saltar-comba", muscles: ["Cardio"], equipment: ["Comba"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Swing con kettlebell", slug: "swing-kettlebell", muscles: ["Glúteos", "Isquios", "Cardio"], equipment: ["Kettlebell"], locations: ["gym"], difficulty: "intermediate" },
  // Movilidad / calentamiento
  { name: "Movilidad de cadera", slug: "movilidad-cadera", muscles: ["Movilidad"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Movilidad de hombro", slug: "movilidad-hombro", muscles: ["Movilidad"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Estiramiento de isquios", slug: "estiramiento-isquios", muscles: ["Movilidad"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Gato-camello", slug: "gato-camello", muscles: ["Movilidad", "Core"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
  { name: "Calentamiento dinámico", slug: "calentamiento-dinamico", muscles: ["Movilidad"], equipment: ["Peso corporal"], locations: ["home", "gym"], difficulty: "beginner" },
];
