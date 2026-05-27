create table if not exists public.implementation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  buyer_type text,
  estimated_days int not null default 21,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.implementation_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.implementation_templates(id) on delete cascade,
  phase text not null,
  title text not null,
  description text,
  sort_order int not null default 0,
  day_offset int not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, sort_order)
);

create table if not exists public.implementation_template_brief_defaults (
  template_id uuid primary key references public.implementation_templates(id) on delete cascade,
  domain_strategy text not null default 'undecided' check (domain_strategy in ('undecided', 'new_domain', 'existing_domain', 'subdomain')),
  logo_status text not null default 'pending' check (logo_status in ('pending', 'received', 'needs_design', 'approved')),
  brand_notes text,
  target_audience text,
  offer_summary text,
  pricing_notes text,
  payment_provider text,
  content_notes text,
  exercise_video_notes text,
  nutrition_notes text,
  legal_notes text,
  launch_notes text,
  internal_risks text,
  updated_at timestamptz not null default now()
);

alter table public.implementation_projects
add column if not exists template_id uuid references public.implementation_templates(id) on delete set null;

alter table public.implementation_templates enable row level security;
alter table public.implementation_template_tasks enable row level security;
alter table public.implementation_template_brief_defaults enable row level security;

create index if not exists implementation_templates_active_sort_idx
on public.implementation_templates (is_active, sort_order);

create index if not exists implementation_template_tasks_template_sort_idx
on public.implementation_template_tasks (template_id, sort_order);

grant select on public.implementation_templates to anon, authenticated;
grant insert, update, delete on public.implementation_templates to authenticated;
grant all privileges on public.implementation_templates to service_role;

grant select on public.implementation_template_tasks to anon, authenticated;
grant insert, update, delete on public.implementation_template_tasks to authenticated;
grant all privileges on public.implementation_template_tasks to service_role;

grant select on public.implementation_template_brief_defaults to anon, authenticated;
grant insert, update, delete on public.implementation_template_brief_defaults to authenticated;
grant all privileges on public.implementation_template_brief_defaults to service_role;

insert into public.implementation_templates (name, slug, description, buyer_type, estimated_days, is_active, sort_order)
values
  (
    'App premium completa',
    'premium-completa',
    'Implantación para entrenadores que quieren salir con marca, dominio, entrenamiento, nutrición, pagos, contenido y lanzamiento coordinado.',
    'Entrenador con oferta premium y clientes de alto valor',
    30,
    true,
    10
  ),
  (
    'Nutrición profesional',
    'nutricion-profesional',
    'Implantación centrada en dietas, recetas, categorías, restricciones, macros y acompañamiento nutricional.',
    'Coach de nutrición o entrenador que vende transformación con dieta como eje',
    24,
    true,
    20
  ),
  (
    'Entrenamiento y comunidad',
    'entrenamiento-comunidad',
    'Implantación enfocada en programas, biblioteca de ejercicios, vídeos propios, comunidad y soporte recurrente.',
    'Entrenador con método de entrenamiento, comunidad y contenido educativo',
    24,
    true,
    30
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  buyer_type = excluded.buyer_type,
  estimated_days = excluded.estimated_days,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

with premium as (
  select id from public.implementation_templates where slug = 'premium-completa'
)
insert into public.implementation_template_tasks (template_id, phase, title, description, sort_order, day_offset)
select id, phase, title, description, sort_order, day_offset
from premium
cross join (values
  ('Requisitos', 'Completar briefing del entrenador', 'Oferta, público objetivo, método, precios, accesos y decisiones críticas.', 10, 1),
  ('Marca', 'Definir nombre, logo, colores y tono', 'Identidad visual, referencias, assets recibidos y piezas que nuestro equipo debe preparar.', 20, 3),
  ('Dominio', 'Coordinar dominio personalizado', 'Comprar, conectar o preparar el dominio definitivo de la app.', 30, 5),
  ('Entrenamiento', 'Preparar biblioteca base y vídeos propios', 'Ejercicios base, vídeos del entrenador, sustituciones y categorías iniciales.', 40, 10),
  ('Nutrición', 'Preparar plantillas de dieta y categorías', 'Macros, restricciones, recetas, categorías y lógica inicial de planes.', 50, 14),
  ('Pagos', 'Configurar oferta y acceso de pago', 'Planes, checkout, trial, cupones y reglas de acceso.', 60, 18),
  ('Contenido', 'Cargar guías y onboarding', 'Bienvenida, instrucciones, FAQs, soporte y contenido educativo inicial.', 70, 21),
  ('Lanzamiento', 'Revisión completa y salida operativa', 'Pruebas finales, acceso de clientes, checklist legal y plan de lanzamiento.', 80, 28)
) as task(phase, title, description, sort_order, day_offset)
on conflict (template_id, sort_order) do update set
  phase = excluded.phase,
  title = excluded.title,
  description = excluded.description,
  day_offset = excluded.day_offset;

with nutrition as (
  select id from public.implementation_templates where slug = 'nutricion-profesional'
)
insert into public.implementation_template_tasks (template_id, phase, title, description, sort_order, day_offset)
select id, phase, title, description, sort_order, day_offset
from nutrition
cross join (values
  ('Requisitos', 'Completar briefing nutricional', 'Objetivo del método, tipos de cliente, restricciones, estilo de dieta y entregables.', 10, 1),
  ('Marca', 'Recoger identidad visual y tono', 'Logo, colores, referencias y forma de comunicación del coach.', 20, 3),
  ('Nutrición', 'Crear categorías de dieta', 'Sin gluten, alta proteína, vegana, definición, volumen u otras categorías del método.', 30, 7),
  ('Nutrición', 'Preparar recetas y lista base de ingredientes', 'Recetas iniciales, macros, alérgenos, swaps y preferencias.', 40, 12),
  ('Contenido', 'Cargar guías de bienvenida y educación', 'Cómo pesar alimentos, medir progreso, cambiar comidas y reportar dudas.', 50, 16),
  ('Pagos', 'Preparar oferta nutricional', 'Planes, duración, checkout y reglas de acceso.', 60, 19),
  ('Lanzamiento', 'Validar experiencia del cliente', 'Pruebas de onboarding, dieta, soporte y entrega final.', 70, 23)
) as task(phase, title, description, sort_order, day_offset)
on conflict (template_id, sort_order) do update set
  phase = excluded.phase,
  title = excluded.title,
  description = excluded.description,
  day_offset = excluded.day_offset;

with training as (
  select id from public.implementation_templates where slug = 'entrenamiento-comunidad'
)
insert into public.implementation_template_tasks (template_id, phase, title, description, sort_order, day_offset)
select id, phase, title, description, sort_order, day_offset
from training
cross join (values
  ('Requisitos', 'Completar briefing de entrenamiento', 'Método, niveles, objetivos, equipo disponible y experiencia de cliente.', 10, 1),
  ('Marca', 'Preparar identidad de la app', 'Nombre, logo, colores, referencias visuales y tono del entrenador.', 20, 3),
  ('Entrenamiento', 'Cargar biblioteca de ejercicios base', 'Ejercicios, grupos musculares, material, instrucciones y alternativas.', 30, 8),
  ('Entrenamiento', 'Organizar vídeos del entrenador', 'Vídeos propios, miniaturas, prioridades de grabación y sustituciones.', 40, 12),
  ('Programas', 'Crear programas iniciales', 'Semanas, días, series, repeticiones, tempo, descanso y progresiones.', 50, 16),
  ('Comunidad', 'Preparar canales y soporte', 'Canales, normas, bienvenida, soporte y mensajes recurrentes.', 60, 19),
  ('Lanzamiento', 'Probar app con primeros clientes', 'Soft launch, feedback, ajustes y salida pública.', 70, 23)
) as task(phase, title, description, sort_order, day_offset)
on conflict (template_id, sort_order) do update set
  phase = excluded.phase,
  title = excluded.title,
  description = excluded.description,
  day_offset = excluded.day_offset;

with defaults as (
  select
    id,
    slug,
    case slug
      when 'premium-completa' then 'new_domain'
      else 'undecided'
    end as domain_strategy,
    case slug
      when 'premium-completa' then 'received'
      else 'pending'
    end as logo_status,
    case slug
      when 'premium-completa' then 'Revisar marca completa, tono premium y assets necesarios para una experiencia propia.'
      when 'nutricion-profesional' then 'Priorizar claridad, confianza, resultados y educación nutricional.'
      else 'Priorizar energía, comunidad, vídeos propios y progreso visible.'
    end as brand_notes,
    case slug
      when 'premium-completa' then 'Clientes que quieren una transformación guiada con entrenamiento, nutrición y seguimiento.'
      when 'nutricion-profesional' then 'Personas que necesitan estructura nutricional, adherencia y soporte sencillo.'
      else 'Clientes que buscan entrenar con método, pertenecer a una comunidad y seguir programas claros.'
    end as target_audience,
    case slug
      when 'premium-completa' then 'App premium completa con entrenamiento, nutrición, contenido, pagos y lanzamiento coordinado.'
      when 'nutricion-profesional' then 'Sistema de nutrición con plantillas, recetas, categorías y seguimiento.'
      else 'Sistema de entrenamiento con programas, vídeos, comunidad y soporte.'
    end as offer_summary,
    case slug
      when 'premium-completa' then 'Validar planes principales, checkout y acceso antes del lanzamiento.'
      else 'Definir planes y forma de cobro durante el briefing.'
    end as pricing_notes,
    'Pendiente' as payment_provider,
    case slug
      when 'premium-completa' then 'Bienvenida, FAQs, guías de entrenamiento, nutrición, soporte y onboarding.'
      when 'nutricion-profesional' then 'Guías de macros, cambios de comidas, mediciones y adherencia.'
      else 'Bienvenida, normas de comunidad, guías de técnica y soporte.'
    end as content_notes,
    case slug
      when 'nutricion-profesional' then 'No prioritario salvo vídeos educativos de nutrición.'
      else 'Priorizar vídeos propios del entrenador para ejercicios clave.'
    end as exercise_video_notes,
    case slug
      when 'entrenamiento-comunidad' then 'Nutrición secundaria; definir si se incluye como módulo inicial.'
      else 'Crear categorías, restricciones y lógica de planes desde el arranque.'
    end as nutrition_notes,
    'Preparar privacidad, términos, disclaimers y permisos de comunicación.' as legal_notes,
    'Planificar soft launch con primeros clientes y revisión del equipo.' as launch_notes,
    'Decisiones pendientes de marca, dominio, pagos o contenido pueden bloquear la entrega.' as internal_risks
  from public.implementation_templates
  where slug in ('premium-completa', 'nutricion-profesional', 'entrenamiento-comunidad')
)
insert into public.implementation_template_brief_defaults (
  template_id,
  domain_strategy,
  logo_status,
  brand_notes,
  target_audience,
  offer_summary,
  pricing_notes,
  payment_provider,
  content_notes,
  exercise_video_notes,
  nutrition_notes,
  legal_notes,
  launch_notes,
  internal_risks
)
select
  id,
  domain_strategy,
  logo_status,
  brand_notes,
  target_audience,
  offer_summary,
  pricing_notes,
  payment_provider,
  content_notes,
  exercise_video_notes,
  nutrition_notes,
  legal_notes,
  launch_notes,
  internal_risks
from defaults
on conflict (template_id) do update set
  domain_strategy = excluded.domain_strategy,
  logo_status = excluded.logo_status,
  brand_notes = excluded.brand_notes,
  target_audience = excluded.target_audience,
  offer_summary = excluded.offer_summary,
  pricing_notes = excluded.pricing_notes,
  payment_provider = excluded.payment_provider,
  content_notes = excluded.content_notes,
  exercise_video_notes = excluded.exercise_video_notes,
  nutrition_notes = excluded.nutrition_notes,
  legal_notes = excluded.legal_notes,
  launch_notes = excluded.launch_notes,
  internal_risks = excluded.internal_risks,
  updated_at = now();
