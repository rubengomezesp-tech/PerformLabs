-- ============================================================
-- PerformLabs · Librería base de ejercicios (pegar en Supabase → SQL Editor)
-- ~40 ejercicios comunes como librería base compartida (is_base_library = true,
-- workspace_id = null). Aparecen en el desplegable de "Añadir ejercicio" de
-- todas tus marcas. Idempotente: puedes ejecutarlo más de una vez.
-- ============================================================
insert into exercises (name, slug, muscle_groups, equipment, locations, difficulty, is_base_library, workspace_id, image_urls)
select v.name, v.slug, v.muscles, v.equipment, array['gym']::text[], v.difficulty, true, null, '[]'::jsonb
from (values
  ('Sentadilla con barra','sentadilla-barra', array['Cuádriceps','Glúteos']::text[], array['Barra']::text[], 'intermediate'),
  ('Sentadilla frontal','sentadilla-frontal', array['Cuádriceps']::text[], array['Barra']::text[], 'advanced'),
  ('Prensa de piernas','prensa-piernas', array['Cuádriceps','Glúteos']::text[], array['Máquina']::text[], 'beginner'),
  ('Hack squat','hack-squat', array['Cuádriceps']::text[], array['Máquina']::text[], 'intermediate'),
  ('Peso muerto','peso-muerto', array['Isquios','Glúteos','Espalda']::text[], array['Barra']::text[], 'advanced'),
  ('Peso muerto rumano','peso-muerto-rumano', array['Isquios','Glúteos']::text[], array['Barra']::text[], 'intermediate'),
  ('Hip thrust','hip-thrust', array['Glúteos']::text[], array['Barra']::text[], 'intermediate'),
  ('Zancadas','zancadas', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Sentadilla búlgara','sentadilla-bulgara', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], 'intermediate'),
  ('Curl femoral','curl-femoral', array['Isquios']::text[], array['Máquina']::text[], 'beginner'),
  ('Extensión de cuádriceps','extension-cuadriceps', array['Cuádriceps']::text[], array['Máquina']::text[], 'beginner'),
  ('Elevación de gemelos','elevacion-gemelos', array['Gemelos']::text[], array['Máquina']::text[], 'beginner'),
  ('Press de banca','press-banca', array['Pecho','Tríceps']::text[], array['Barra']::text[], 'intermediate'),
  ('Press inclinado con mancuernas','press-inclinado-mancuernas', array['Pecho']::text[], array['Mancuernas']::text[], 'intermediate'),
  ('Aperturas con mancuernas','aperturas-mancuernas', array['Pecho']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Cruce de poleas','cruce-poleas', array['Pecho']::text[], array['Polea']::text[], 'beginner'),
  ('Press de pecho en máquina','press-pecho-maquina', array['Pecho']::text[], array['Máquina']::text[], 'beginner'),
  ('Fondos en paralelas','fondos-paralelas', array['Pecho','Tríceps']::text[], array['Peso corporal']::text[], 'intermediate'),
  ('Dominadas','dominadas', array['Espalda','Bíceps']::text[], array['Peso corporal']::text[], 'advanced'),
  ('Jalón al pecho','jalon-pecho', array['Espalda']::text[], array['Polea']::text[], 'beginner'),
  ('Remo con barra','remo-barra', array['Espalda']::text[], array['Barra']::text[], 'intermediate'),
  ('Remo con mancuerna','remo-mancuerna', array['Espalda']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Remo en polea baja','remo-polea-baja', array['Espalda']::text[], array['Polea']::text[], 'beginner'),
  ('Remo en máquina','remo-maquina', array['Espalda']::text[], array['Máquina']::text[], 'beginner'),
  ('Press militar','press-militar', array['Hombros']::text[], array['Barra']::text[], 'intermediate'),
  ('Press de hombros con mancuernas','press-hombros-mancuernas', array['Hombros']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Elevaciones laterales','elevaciones-laterales', array['Hombros']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Pájaros (deltoide posterior)','pajaros-deltoide-posterior', array['Hombros']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Face pull','face-pull', array['Hombros','Espalda']::text[], array['Polea']::text[], 'beginner'),
  ('Curl de bíceps con barra','curl-biceps-barra', array['Bíceps']::text[], array['Barra']::text[], 'beginner'),
  ('Curl martillo','curl-martillo', array['Bíceps','Antebrazo']::text[], array['Mancuernas']::text[], 'beginner'),
  ('Curl predicador','curl-predicador', array['Bíceps']::text[], array['Máquina']::text[], 'beginner'),
  ('Extensión de tríceps en polea','extension-triceps-polea', array['Tríceps']::text[], array['Polea']::text[], 'beginner'),
  ('Press francés','press-frances', array['Tríceps']::text[], array['Barra']::text[], 'intermediate'),
  ('Fondos en banco','fondos-banco', array['Tríceps']::text[], array['Peso corporal']::text[], 'beginner'),
  ('Plancha','plancha', array['Core']::text[], array['Peso corporal']::text[], 'beginner'),
  ('Elevación de piernas colgado','elevacion-piernas-colgado', array['Core']::text[], array['Peso corporal']::text[], 'intermediate'),
  ('Crunch en polea','crunch-polea', array['Core']::text[], array['Polea']::text[], 'beginner'),
  ('Rueda abdominal','rueda-abdominal', array['Core']::text[], array['Rueda']::text[], 'advanced'),
  ('Cinta de correr','cinta-correr', array['Cardio']::text[], array['Máquina']::text[], 'beginner')
) as v(name, slug, muscles, equipment, difficulty)
where not exists (
  select 1 from exercises e where e.slug = v.slug and e.is_base_library = true
);
