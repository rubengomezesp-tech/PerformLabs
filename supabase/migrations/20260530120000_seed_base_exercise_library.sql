-- ============================================================
-- PerformLabs · Librería base profesional de ejercicios (~150)
-- Se instala automáticamente al desplegar (no hace falta pegar SQL a mano).
-- is_base_library = true, workspace_id = null → compartida por todas las marcas.
-- Aparece en la consola del coach, en el desplegable de programas y la usa el
-- generador de rutinas. Cada ejercicio lleva grupo muscular, equipo, ubicación,
-- nivel y un cue de técnica. Idempotente: re-ejecutable y sin duplicar.
--
-- Tokens de músculo alineados con el generador (lib/repositories/training-
-- management.ts → focusMuscleMap): pecho, espalda, hombros, biceps, triceps,
-- cuadriceps, gluteos, femoral, gemelos, core, cardio, movilidad, trapecio.
-- ============================================================
insert into public.exercises
  (name, slug, muscle_groups, equipment, locations, difficulty, instructions,
   is_base_library, workspace_id, source_dataset, source_id, image_urls)
select
  v.name, v.slug, v.muscles, v.equipment, v.locations, v.difficulty, v.cues,
  true, null, 'performlabs', v.slug, '[]'::jsonb
from (values
  -- ---------- Cuádriceps ----------
  ('Sentadilla con barra','sentadilla-barra', array['Cuádriceps','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Pecho alto y cadera atrás hasta romper paralela; empuja el suelo para subir.'),
  ('Sentadilla frontal','sentadilla-frontal', array['Cuádriceps']::text[], array['Barra']::text[], array['gym']::text[], 'advanced', 'Codos altos y torso vertical; mantén la barra sobre el mediopié.'),
  ('Sentadilla goblet','sentadilla-goblet', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Sujeta la mancuerna al pecho y baja entre las rodillas con la espalda neutra.'),
  ('Sentadilla en Smith','sentadilla-smith', array['Cuádriceps','Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Pies algo adelantados; aprovecha la guía para enfocar el cuádriceps.'),
  ('Prensa de piernas','prensa-piernas', array['Cuádriceps','Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'No bloquees rodillas arriba; baja a 90 grados sin despegar la lumbar.'),
  ('Hack squat','hack-squat', array['Cuádriceps']::text[], array['Máquina']::text[], array['gym']::text[], 'intermediate', 'Pies a media altura, baja controlado y empuja con el talón.'),
  ('Sentadilla búlgara','sentadilla-bulgara', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'intermediate', 'Pie trasero elevado; baja en vertical cargando la pierna delantera.'),
  ('Zancadas','zancadas', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Paso largo, rodilla trasera cerca del suelo y empuje con el talón delantero.'),
  ('Zancada caminando','zancada-caminando', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate', 'Avanza alternando piernas manteniendo el torso erguido.'),
  ('Step-up al cajón','step-up', array['Cuádriceps','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Sube apoyando toda la planta y controla la bajada sin impulso.'),
  ('Extensión de cuádriceps','extension-cuadriceps', array['Cuádriceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Extiende sin tirones y aprieta arriba un segundo.'),
  ('Sentadilla sissy','sentadilla-sissy', array['Cuádriceps']::text[], array['Peso corporal']::text[], array['gym','home']::text[], 'advanced', 'Lleva las rodillas al frente inclinando el torso atrás; rango controlado.'),
  ('Sentadilla en pared','sentadilla-pared', array['Cuádriceps']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Espalda en la pared, muslos paralelos al suelo y aguanta el tiempo pautado.'),
  -- ---------- Femoral / isquios ----------
  ('Peso muerto convencional','peso-muerto', array['Femoral','Glúteos','Espalda']::text[], array['Barra']::text[], array['gym']::text[], 'advanced', 'Barra pegada al cuerpo, empuja el suelo y bloquea cadera arriba sin arquear.'),
  ('Peso muerto rumano','peso-muerto-rumano', array['Femoral','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Cadera atrás con piernas casi rectas; estira el femoral y vuelve.'),
  ('Peso muerto sumo','peso-muerto-sumo', array['Femoral','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Pies anchos y rodillas hacia fuera; mantén el pecho alto al tirar.'),
  ('Peso muerto con mancuernas','peso-muerto-mancuernas', array['Femoral','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Cadera atrás bajando las mancuernas pegadas a las piernas.'),
  ('Peso muerto a una pierna','peso-muerto-una-pierna', array['Femoral','Glúteos']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'intermediate', 'Bisagra sobre una pierna manteniendo la cadera nivelada.'),
  ('Curl femoral tumbado','curl-femoral-tumbado', array['Femoral']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Lleva el talón al glúteo sin despegar la cadera del apoyo.'),
  ('Curl femoral sentado','curl-femoral-sentado', array['Femoral']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Flexiona con control y aprieta abajo un instante.'),
  ('Curl nórdico','curl-nordico', array['Femoral']::text[], array['Peso corporal']::text[], array['gym','home']::text[], 'advanced', 'Baja lo más lento posible resistiendo con los isquios.'),
  ('Buenos días','buenos-dias', array['Femoral','Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Bisagra de cadera con la barra en la espalda y lumbar neutra.'),
  -- ---------- Glúteos ----------
  ('Hip thrust','hip-thrust', array['Glúteos']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Escápulas en el banco, empuja con el talón y aprieta glúteo arriba.'),
  ('Hip thrust en máquina','hip-thrust-maquina', array['Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Mismo patrón que el hip thrust con resistencia guiada.'),
  ('Puente de glúteo','puente-gluteo', array['Glúteos']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Eleva la cadera apretando glúteo sin arquear la lumbar.'),
  ('Patada de glúteo en polea','patada-gluteo-polea', array['Glúteos']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Lleva la pierna atrás con control y aprieta arriba.'),
  ('Extensión de cadera en polea','extension-cadera-polea', array['Glúteos','Femoral']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Bisagra desde la polea baja extendiendo la cadera.'),
  ('Abducción de cadera en máquina','abduccion-cadera-maquina', array['Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Abre las piernas contra la resistencia y vuelve despacio.'),
  ('Abducción con banda','abduccion-banda', array['Glúteos']::text[], array['Banda elástica']::text[], array['home','gym']::text[], 'beginner', 'Banda sobre las rodillas; abre sin dejar caer el arco.'),
  -- ---------- Gemelos / lumbar ----------
  ('Elevación de gemelos de pie','elevacion-gemelos-pie', array['Gemelos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Sube a punta y estira abajo en el rango completo.'),
  ('Elevación de gemelos sentado','elevacion-gemelos-sentado', array['Gemelos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Enfoca el sóleo con la rodilla flexionada; pausa arriba.'),
  ('Elevación de gemelos en prensa','elevacion-gemelos-prensa', array['Gemelos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Empuja con la punta del pie en la plataforma de la prensa.'),
  ('Hiperextensiones','hiperextensiones', array['Lumbar','Glúteos']::text[], array['Peso corporal']::text[], array['gym']::text[], 'beginner', 'Sube hasta alinear el tronco sin hiperextender la espalda.'),
  -- ---------- Pecho ----------
  ('Press de banca','press-banca', array['Pecho','Tríceps']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Baja la barra al esternón con codos a 45 grados y empuja en línea.'),
  ('Press inclinado con barra','press-inclinado-barra', array['Pecho','Hombros']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Banco a 30 grados; baja a la clavícula y empuja hacia atrás.'),
  ('Press declinado con barra','press-declinado-barra', array['Pecho']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Enfoca el pecho inferior; controla la bajada.'),
  ('Press de banca con mancuernas','press-banca-mancuernas', array['Pecho','Tríceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner', 'Baja hasta sentir estiramiento y junta arriba sin chocar.'),
  ('Press inclinado con mancuernas','press-inclinado-mancuernas', array['Pecho','Hombros']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate', 'Banco inclinado; describe un arco y aprieta arriba.'),
  ('Aperturas con mancuernas','aperturas-mancuernas', array['Pecho']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner', 'Abre con codos semiflexionados en arco amplio y controla la vuelta.'),
  ('Cruce de poleas','cruce-poleas', array['Pecho']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Junta las manos al frente apretando el pecho; vuelta lenta.'),
  ('Contractora (pec deck)','contractora-pec-deck', array['Pecho']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Junta los brazos apretando el pecho un segundo.'),
  ('Press de pecho en máquina','press-pecho-maquina', array['Pecho','Tríceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Empuja en línea sin bloquear de golpe; controla la vuelta.'),
  ('Pullover con mancuerna','pullover-mancuerna', array['Pecho','Espalda']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate', 'Lleva la mancuerna por detrás de la cabeza estirando el pecho.'),
  ('Fondos en paralelas','fondos-paralelas', array['Pecho','Tríceps']::text[], array['Peso corporal']::text[], array['gym']::text[], 'intermediate', 'Inclínate al frente para enfocar pecho; baja hasta estirar.'),
  ('Flexiones','flexiones', array['Pecho','Tríceps']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Cuerpo en línea, codos a 45 grados; baja el pecho casi al suelo.'),
  ('Flexiones diamante','flexiones-diamante', array['Tríceps','Pecho']::text[], array['Peso corporal']::text[], array['home']::text[], 'intermediate', 'Manos juntas bajo el pecho para cargar el tríceps.'),
  ('Press de pecho con banda','press-pecho-banda', array['Pecho']::text[], array['Banda elástica']::text[], array['home']::text[], 'beginner', 'Banda anclada atrás; empuja al frente apretando el pecho.'),
  -- ---------- Espalda ----------
  ('Dominadas','dominadas', array['Espalda','Bíceps']::text[], array['Peso corporal']::text[], array['gym','home']::text[], 'advanced', 'Tira con los codos hacia abajo llevando el pecho a la barra.'),
  ('Dominadas asistidas','dominadas-asistidas', array['Espalda','Bíceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Misma técnica con asistencia para completar el rango.'),
  ('Jalón al pecho','jalon-pecho', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Lleva la barra al pecho bajando las escápulas, sin balanceo.'),
  ('Jalón agarre neutro','jalon-agarre-neutro', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Agarre paralelo; tira al pecho apretando dorsales.'),
  ('Jalón agarre cerrado','jalon-agarre-cerrado', array['Espalda','Bíceps']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Agarre estrecho enfocando dorsal bajo.'),
  ('Pull-down brazo recto','pulldown-brazo-recto', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Brazos rectos; lleva la barra a los muslos con el dorsal.'),
  ('Remo con barra','remo-barra', array['Espalda']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Torso a 45 grados, lleva la barra al abdomen apretando escápulas.'),
  ('Remo Pendlay','remo-pendlay', array['Espalda']::text[], array['Barra']::text[], array['gym']::text[], 'advanced', 'Cada repetición parte del suelo con torso paralelo.'),
  ('Remo con mancuerna','remo-mancuerna', array['Espalda']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Apoya una mano en el banco y rema llevando el codo atrás.'),
  ('Remo en T','remo-t', array['Espalda']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Pecho firme; tira del peso al abdomen sin redondear.'),
  ('Remo en polea baja','remo-polea-baja', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Tira al abdomen apretando escápulas; no te eches atrás.'),
  ('Remo en máquina','remo-maquina', array['Espalda']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Pecho en el soporte; lleva los codos atrás con control.'),
  ('Remo invertido','remo-invertido', array['Espalda']::text[], array['Peso corporal']::text[], array['gym','home']::text[], 'beginner', 'Cuerpo en línea bajo la barra; lleva el pecho a la barra.'),
  ('Pullover en polea','pullover-polea', array['Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Brazos rectos; baja la barra al muslo activando el dorsal.'),
  ('Remo con banda','remo-banda', array['Espalda']::text[], array['Banda elástica']::text[], array['home']::text[], 'beginner', 'Banda anclada al frente; rema llevando los codos atrás.'),
  ('Encogimientos con barra','encogimientos-barra', array['Trapecio']::text[], array['Barra']::text[], array['gym']::text[], 'beginner', 'Eleva los hombros hacia las orejas y pausa arriba.'),
  ('Encogimientos con mancuernas','encogimientos-mancuernas', array['Trapecio']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Sube los hombros sin rotarlos; baja controlado.'),
  ('Face pull','face-pull', array['Hombros','Espalda']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Tira de la cuerda a la cara abriendo codos; aprieta deltoide posterior.'),
  -- ---------- Hombros ----------
  ('Press militar de pie','press-militar-pie', array['Hombros','Tríceps']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Glúteo y abdomen firmes; empuja la barra sobre la cabeza sin arquear.'),
  ('Press de hombros con mancuernas','press-hombros-mancuernas', array['Hombros']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner', 'Empuja hasta casi juntar arriba; controla la bajada.'),
  ('Press Arnold','press-arnold', array['Hombros']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate', 'Rota de palmas al frente a palmas afuera mientras empujas.'),
  ('Press de hombros en máquina','press-hombros-maquina', array['Hombros']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Empuja en línea guiada sin bloquear de golpe.'),
  ('Elevaciones laterales','elevaciones-laterales', array['Hombros']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Sube con codos algo flexionados hasta la altura del hombro.'),
  ('Elevaciones laterales en polea','elevaciones-laterales-polea', array['Hombros']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Tensión constante; sube al lateral sin balanceo.'),
  ('Elevación lateral en máquina','elevacion-lateral-maquina', array['Hombros']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Empuja con los codos contra los apoyos hasta la horizontal.'),
  ('Elevaciones frontales','elevaciones-frontales', array['Hombros']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Sube al frente hasta la altura de los ojos sin impulso.'),
  ('Pájaros (deltoide posterior)','pajaros-deltoide-posterior', array['Hombros']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Inclinado, abre los brazos apretando el deltoide posterior.'),
  ('Reverse pec deck','reverse-pec-deck', array['Hombros']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Abre los brazos atrás apretando deltoide posterior.'),
  ('Remo al mentón','remo-menton', array['Hombros','Trapecio']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Sube la barra al pecho con los codos por encima de las muñecas.'),
  ('Elevaciones laterales con banda','elevaciones-laterales-banda', array['Hombros']::text[], array['Banda elástica']::text[], array['home']::text[], 'beginner', 'Pisa la banda y sube al lateral con tensión constante.'),
  -- ---------- Bíceps ----------
  ('Curl con barra','curl-barra', array['Bíceps']::text[], array['Barra']::text[], array['gym']::text[], 'beginner', 'Codos pegados al cuerpo; sube sin balancear y baja controlado.'),
  ('Curl con barra Z','curl-barra-z', array['Bíceps']::text[], array['Barra']::text[], array['gym']::text[], 'beginner', 'Agarre cómodo para la muñeca; mismo patrón que el curl con barra.'),
  ('Curl con mancuernas','curl-mancuernas', array['Bíceps']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Sube alternando o a la vez girando la palma arriba.'),
  ('Curl martillo','curl-martillo', array['Bíceps','Antebrazo']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Palmas enfrentadas; trabaja braquial y antebrazo.'),
  ('Curl predicador','curl-predicador', array['Bíceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Brazos apoyados; no rebotes abajo, estira completo.'),
  ('Curl en banco inclinado','curl-inclinado', array['Bíceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate', 'Brazos detrás del torso para máximo estiramiento del bíceps.'),
  ('Curl en polea','curl-polea', array['Bíceps']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Tensión constante; codos fijos a los costados.'),
  ('Curl concentrado','curl-concentrado', array['Bíceps']::text[], array['Mancuernas']::text[], array['gym']::text[], 'beginner', 'Codo apoyado en el muslo; aprieta arriba el pico del bíceps.'),
  ('Curl con banda','curl-banda', array['Bíceps']::text[], array['Banda elástica']::text[], array['home']::text[], 'beginner', 'Pisa la banda y sube con tensión sin mover los codos.'),
  -- ---------- Tríceps ----------
  ('Extensión de tríceps en polea','extension-triceps-polea', array['Tríceps']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Codos fijos; extiende abajo y controla la subida.'),
  ('Extensión con cuerda en polea','extension-triceps-cuerda', array['Tríceps']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Abre la cuerda al final del recorrido para apretar el tríceps.'),
  ('Press francés','press-frances', array['Tríceps']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Baja a la frente con los codos quietos y extiende.'),
  ('Extensión sobre la cabeza','extension-triceps-encima-cabeza', array['Tríceps']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Codos altos; baja la mancuerna tras la nuca y extiende.'),
  ('Press cerrado','press-cerrado', array['Tríceps','Pecho']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Agarre a la anchura de hombros; codos pegados al bajar.'),
  ('Extensión de tríceps en máquina','extension-triceps-maquina', array['Tríceps']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Extiende contra la resistencia guiada con codos fijos.'),
  ('Fondos en banco','fondos-banco', array['Tríceps']::text[], array['Peso corporal']::text[], array['gym','home']::text[], 'beginner', 'Manos en el banco; baja el cuerpo flexionando los codos atrás.'),
  ('Patada de tríceps','patada-triceps', array['Tríceps']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Torso inclinado, codo alto; extiende el brazo atrás.'),
  -- ---------- Core ----------
  ('Plancha','plancha', array['Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Cuerpo en línea, abdomen y glúteo apretados; no hundas la cadera.'),
  ('Plancha lateral','plancha-lateral', array['Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Apoya antebrazo y canto del pie; cadera arriba en línea.'),
  ('Elevación de piernas colgado','elevacion-piernas-colgado', array['Core']::text[], array['Peso corporal']::text[], array['gym']::text[], 'intermediate', 'Sube las piernas rectas sin balanceo; baja con control.'),
  ('Elevación de rodillas colgado','elevacion-rodillas-colgado', array['Core']::text[], array['Peso corporal']::text[], array['gym']::text[], 'beginner', 'Lleva las rodillas al pecho sin impulso.'),
  ('Crunch en polea','crunch-polea', array['Core']::text[], array['Polea']::text[], array['gym']::text[], 'beginner', 'Enrolla la columna llevando los codos a las rodillas.'),
  ('Crunch abdominal','crunch-abdominal', array['Core']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner', 'Despega las escápulas apretando el abdomen; no tires del cuello.'),
  ('Rueda abdominal','rueda-abdominal', array['Core']::text[], array['Rueda']::text[], array['gym','home']::text[], 'advanced', 'Rueda al frente sin arquear la lumbar y vuelve con el abdomen.'),
  ('Mountain climbers','mountain-climbers', array['Core','Cardio']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner', 'Lleva las rodillas al pecho alternando rápido con cadera estable.'),
  ('Russian twist','russian-twist', array['Core']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner', 'Gira el torso de lado a lado con el pecho alto.'),
  ('Hollow hold','hollow-hold', array['Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'intermediate', 'Lumbar pegada al suelo; brazos y piernas extendidos sin tocar.'),
  ('Pallof press','pallof-press', array['Core']::text[], array['Polea']::text[], array['gym']::text[], 'intermediate', 'Extiende los brazos resistiendo la rotación; abdomen firme.'),
  ('Dead bug','dead-bug', array['Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Extiende brazo y pierna opuestos sin despegar la lumbar.'),
  ('Bicicleta abdominal','bicicleta-abdominal', array['Core']::text[], array['Peso corporal']::text[], array['home']::text[], 'beginner', 'Lleva codo a rodilla opuesta pedaleando con control.'),
  -- ---------- Antebrazo ----------
  ('Curl de muñeca','curl-muneca', array['Antebrazo']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'beginner', 'Antebrazos apoyados; flexiona y extiende solo la muñeca.'),
  ('Paseo del granjero','paseo-granjero', array['Antebrazo','Trapecio','Core']::text[], array['Mancuernas']::text[], array['gym']::text[], 'intermediate', 'Camina erguido con peso pesado en cada mano y core firme.'),
  -- ---------- Cardio / acondicionamiento ----------
  ('Cinta de correr','cinta-correr', array['Cardio']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Ritmo y pendiente según la pauta; postura erguida.'),
  ('Bicicleta estática','bicicleta-estatica', array['Cardio']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Ajusta resistencia y cadencia al objetivo del día.'),
  ('Remo en máquina de cardio','remo-maquina-cardio', array['Cardio','Espalda']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Empuja con las piernas, luego tira con la espalda; secuencia fluida.'),
  ('Elíptica','eliptica', array['Cardio']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Mantén el ritmo objetivo con zancada completa.'),
  ('Escaladora','escaladora', array['Cardio','Glúteos']::text[], array['Máquina']::text[], array['gym']::text[], 'beginner', 'Pisada completa sin apoyarte en el manillar.'),
  ('Battle ropes','battle-ropes', array['Cardio','Hombros']::text[], array['Cuerda']::text[], array['gym']::text[], 'intermediate', 'Ondas potentes y constantes con rodillas semiflexionadas.'),
  ('Burpees','burpees', array['Cardio']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'intermediate', 'Flexión abajo y salto arriba enlazando con ritmo.'),
  ('Saltar a la comba','saltar-comba', array['Cardio']::text[], array['Comba']::text[], array['home','gym']::text[], 'beginner', 'Saltos bajos desde el tobillo con muñecas relajadas.'),
  ('Saltos al cajón','saltos-cajon', array['Cuádriceps','Cardio']::text[], array['Peso corporal']::text[], array['gym']::text[], 'intermediate', 'Salta y aterriza suave con las dos piernas; baja con control.'),
  ('Sentadilla con salto','sentadilla-salto', array['Cuádriceps','Cardio']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'intermediate', 'Baja a sentadilla y salta explosivo; amortigua la caída.'),
  ('Swing con kettlebell','swing-kettlebell', array['Glúteos','Femoral','Cardio']::text[], array['Kettlebell']::text[], array['gym','home']::text[], 'intermediate', 'Bisagra de cadera explosiva; la pesa flota por el impulso del glúteo.'),
  ('Thruster','thruster', array['Cuádriceps','Hombros','Cardio']::text[], array['Mancuernas']::text[], array['gym','home']::text[], 'intermediate', 'Enlaza sentadilla y press en un solo movimiento fluido.'),
  ('Sprint','sprint', array['Cardio']::text[], array['Peso corporal']::text[], array['gym']::text[], 'intermediate', 'Series cortas al máximo con recuperación entre repeticiones.'),
  -- ---------- Potencia / cuerpo completo ----------
  ('Cargada de potencia','power-clean', array['Espalda','Cuádriceps','Hombros']::text[], array['Barra']::text[], array['gym']::text[], 'advanced', 'Tirón explosivo y recepción de la barra en los hombros.'),
  ('Push press','push-press', array['Hombros','Tríceps']::text[], array['Barra']::text[], array['gym']::text[], 'intermediate', 'Pequeña flexión de piernas para impulsar la barra arriba.'),
  ('Arrancada','snatch', array['Hombros','Espalda','Cuádriceps']::text[], array['Barra']::text[], array['gym']::text[], 'advanced', 'Lleva la barra del suelo a sobre la cabeza en un solo tiempo.'),
  ('Turkish get-up','turkish-get-up', array['Core','Hombros']::text[], array['Kettlebell']::text[], array['gym']::text[], 'advanced', 'Levántate del suelo a de pie manteniendo la pesa arriba estable.'),
  ('Press pica','press-pica', array['Hombros','Tríceps']::text[], array['Peso corporal']::text[], array['home']::text[], 'intermediate', 'En V invertida, baja la cabeza entre las manos y empuja.'),
  -- ---------- Movilidad / calentamiento ----------
  ('Movilidad de cadera','movilidad-cadera', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Círculos y aperturas de cadera para preparar el tren inferior.'),
  ('Movilidad de hombro','movilidad-hombro', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Círculos y dislocaciones suaves para abrir el hombro.'),
  ('Movilidad torácica','movilidad-toracica', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Rotaciones de la columna dorsal para ganar rango antes de empujar.'),
  ('Estiramiento de isquios','estiramiento-isquios', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Bisagra suave buscando estiramiento sin rebotes.'),
  ('Gato-camello','gato-camello', array['Movilidad','Core']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Alterna flexión y extensión de la columna con la respiración.'),
  ('Calentamiento dinámico','calentamiento-dinamico', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Movimientos articulares progresivos para subir la temperatura.'),
  ('Foam roller','foam-roller', array['Movilidad']::text[], array['Peso corporal']::text[], array['home','gym']::text[], 'beginner', 'Rueda despacio sobre el músculo buscando los puntos densos.')
) as v(name, slug, muscles, equipment, locations, difficulty, cues)
where not exists (
  select 1 from public.exercises e where e.slug = v.slug and e.is_base_library = true
);
