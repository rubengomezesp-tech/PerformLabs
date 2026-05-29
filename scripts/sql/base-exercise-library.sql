-- ============================================================
-- PerformLabs · Librería base de ejercicios (pegar en Supabase → SQL Editor)
-- ~85 ejercicios en español como librería base compartida
-- (is_base_library = true, workspace_id = null). Aparecen en el desplegable
-- de "Añadir ejercicio" y en el generador. Idempotente: re-ejecutable.
-- ============================================================
insert into exercises (name, slug, muscle_groups, equipment, locations, difficulty, is_base_library, workspace_id, image_urls)
select v.name, v.slug, v.muscles, v.equipment, v.locations, v.difficulty, true, null, '[]'::jsonb
from (values
  -- Pierna
  ('Sentadilla con barra','sentadilla-barra', array['Cuádriceps','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Sentadilla frontal','sentadilla-frontal', array['Cuádriceps']::text[], array['Barra']::text[], array['gym']::text[], 'advanced'),
  ('Sentadilla goblet','sentadilla-goblet', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Prensa de piernas','prensa-piernas', array['Cuádriceps','Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Hack squat','hack-squat', array['Cuádriceps']::text[], array['Máquina']::text[], array['gym']::text[], 'intermediate'),
  ('Zancadas','zancadas', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Zancada caminando','zancada-caminando', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate'),
  ('Sentadilla búlgara','sentadilla-bulgara', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'intermediate'),
  ('Step-up','step-up', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Peso muerto','peso-muerto', array['Isquios','Glúteos','Espalda']::text[], array['Barra']::text[], array['gym']::text[], 'advanced'),
  ('Peso muerto rumano','peso-muerto-rumano', array['Isquios','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Peso muerto sumo','peso-muerto-sumo', array['Isquios','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Hip thrust','hip-thrust', array['Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Puente de glúteo','puente-gluteo', array['Glúteos']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Patada de glúteo en polea','patada-gluteo-polea', array['Glúteos']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Abducción de cadera en máquina','abduccion-cadera-maquina', array['Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Curl femoral tumbado','curl-femoral-tumbado', array['Isquios']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Curl femoral sentado','curl-femoral-sentado', array['Isquios']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Extensión de cuádriceps','extension-cuadriceps', array['Cuádriceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Elevación de gemelos de pie','elevacion-gemelos-pie', array['Gemelos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Elevación de gemelos sentado','elevacion-gemelos-sentado', array['Gemelos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  -- Pecho
  ('Press de banca','press-banca', array['Pecho','Tríceps']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Press inclinado con barra','press-inclinado-barra', array['Pecho']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Press de banca con mancuernas','press-banca-mancuernas', array['Pecho','Tríceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  ('Press inclinado con mancuernas','press-inclinado-mancuernas', array['Pecho']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate'),
  ('Aperturas con mancuernas','aperturas-mancuernas', array['Pecho']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  ('Cruce de poleas','cruce-poleas', array['Pecho']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Contractora (pec deck)','contractora-pec-deck', array['Pecho']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Press de pecho en máquina','press-pecho-maquina', array['Pecho']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Fondos en paralelas','fondos-paralelas', array['Pecho','Tríceps']::text[], array['Peso corporal']::text[], array['gym']::text[], 'intermediate'),
  ('Flexiones','flexiones', array['Pecho','Tríceps']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  -- Espalda
  ('Dominadas','dominadas', array['Espalda','Bíceps']::text[], array['Peso corporal']::text[], array['gym']::text[], 'advanced'),
  ('Dominadas asistidas','dominadas-asistidas', array['Espalda','Bíceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Jalón al pecho','jalon-pecho', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Jalón agarre cerrado','jalon-agarre-cerrado', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Remo con barra','remo-barra', array['Espalda']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Remo con mancuerna','remo-mancuerna', array['Espalda']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  ('Remo en polea baja','remo-polea-baja', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Remo en máquina','remo-maquina', array['Espalda']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Pullover en polea','pullover-polea', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Hiperextensiones','hiperextensiones', array['Espalda baja','Glúteos']::text[], array['Peso corporal']::text[], array['gym']::text[], 'beginner'),
  -- Hombro / trapecio
  ('Press militar de pie','press-militar-pie', array['Hombros']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Press de hombros con mancuernas','press-hombros-mancuernas', array['Hombros']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  ('Press Arnold','press-arnold', array['Hombros']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate'),
  ('Press de hombros en máquina','press-hombros-maquina', array['Hombros']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Elevaciones laterales','elevaciones-laterales', array['Hombros']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Elevaciones laterales en polea','elevaciones-laterales-polea', array['Hombros']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Elevaciones frontales','elevaciones-frontales', array['Hombros']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Pájaros (deltoide posterior)','pajaros-deltoide-posterior', array['Hombros']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  ('Face pull','face-pull', array['Hombros','Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Encogimientos (trapecio)','encogimientos-trapecio', array['Trapecio']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  -- Bíceps
  ('Curl con barra','curl-barra', array['Bíceps']::text[], array['Barra']::text[], array['gym']::text[], 'beginner'),
  ('Curl con mancuernas','curl-mancuernas', array['Bíceps']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Curl martillo','curl-martillo', array['Bíceps','Antebrazo']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner'),
  ('Curl predicador','curl-predicador', array['Bíceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Curl en polea','curl-polea', array['Bíceps']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Curl concentrado','curl-concentrado', array['Bíceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  -- Tríceps
  ('Extensión de tríceps en polea','extension-triceps-polea', array['Tríceps']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Press francés','press-frances', array['Tríceps']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate'),
  ('Extensión por encima de la cabeza','extension-triceps-encima-cabeza', array['Tríceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  ('Fondos en banco','fondos-banco', array['Tríceps']::text[], array['Peso corporal']::text[], array['gym','home']::text[], 'beginner'),
  ('Patada de tríceps','patada-triceps', array['Tríceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner'),
  -- Core
  ('Plancha','plancha', array['Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Plancha lateral','plancha-lateral', array['Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Elevación de piernas colgado','elevacion-piernas-colgado', array['Core']::text[], array['Peso corporal']::text[], array['gym']::text[], 'intermediate'),
  ('Crunch en polea','crunch-polea', array['Core']::text[], array['Polea']::text[], array['gym']::text[], 'beginner'),
  ('Crunch abdominal','crunch-abdominal', array['Core']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner'),
  ('Rueda abdominal','rueda-abdominal', array['Core']::text[], array['Rueda']::text[], array['gym','home']::text[], 'advanced'),
  ('Mountain climbers','mountain-climbers', array['Core','Cardio']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner'),
  ('Russian twist','russian-twist', array['Core']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner'),
  -- Cardio / acondicionamiento
  ('Cinta de correr','cinta-correr', array['Cardio']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Bicicleta estática','bicicleta-estatica', array['Cardio']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Remo (máquina cardio)','remo-maquina-cardio', array['Cardio','Espalda']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Elíptica','eliptica', array['Cardio']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner'),
  ('Battle ropes','battle-ropes', array['Cardio','Hombros']::text[], array['Cuerda']::text[], array['gym']::text[], 'intermediate'),
  ('Burpees','burpees', array['Cardio']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'intermediate'),
  ('Saltar a la comba','saltar-comba', array['Cardio']::text[], array['Comba']::text[], array['home','gym']::text[], 'beginner'),
  ('Swing con kettlebell','swing-kettlebell', array['Glúteos','Isquios','Cardio']::text[], array['Kettlebell']::text[], array['gym']::text[], 'intermediate'),
  -- Movilidad / calentamiento
  ('Movilidad de cadera','movilidad-cadera', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Movilidad de hombro','movilidad-hombro', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Estiramiento de isquios','estiramiento-isquios', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Gato-camello','gato-camello', array['Movilidad','Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner'),
  ('Calentamiento dinámico','calentamiento-dinamico', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner')
) as v(name, slug, muscles, equipment, locations, difficulty)
where not exists (
  select 1 from exercises e where e.slug = v.slug and e.is_base_library = true
);
