-- Seed idempotente de logica base para todas las apps de cliente existentes.
-- Ejecutar despues de crear workspaces.

with setting_seed(key, value) as (
  values
    ('brand.logo_url', '""'::jsonb),
    ('brand.favicon_url', '""'::jsonb),
    ('brand.header_image_url', '""'::jsonb),
    ('support.reactivation_url', '""'::jsonb),
    ('support.website_url', '""'::jsonb),
    ('access.master_password_enabled', 'false'::jsonb),
    ('nutrition.show_net_carbs', 'false'::jsonb),
    ('pwa.enabled', 'true'::jsonb),
    ('pwa.short_name', '"Coach App"'::jsonb),
    ('pwa.description', '"Fitness coaching app"'::jsonb),
    ('pwa.theme_color', '"#d8bd6b"'::jsonb),
    ('subscription.activation_delay_min_days', '0'::jsonb),
    ('subscription.activation_delay_max_days', '7'::jsonb),
    ('subscription.default_measurement_system', '"metric"'::jsonb),
    ('subscription.default_gender', '"not_set"'::jsonb),
    ('subscription.minimum_age', '16'::jsonb),
    ('subscription.allow_pause', 'true'::jsonb),
    ('tracker.habit_enabled', 'true'::jsonb),
    ('tracker.period_enabled', 'true'::jsonb),
    ('progress.body_fat_question_enabled', 'true'::jsonb),
    ('fitness.exercise_swaps_enabled', 'true'::jsonb),
    ('fitness.static_swaps_enabled', 'true'::jsonb),
    ('fitness.exercise_audio_enabled', 'false'::jsonb),
    ('fitness.injuries_field_enabled', 'true'::jsonb),
    ('fitness.workout_log_enabled', 'true'::jsonb),
    ('nutrition.preferred_cuisine_enabled', 'true'::jsonb),
    ('nutrition.preferred_recipes_enabled', 'true'::jsonb),
    ('nutrition.allergies_enabled', 'true'::jsonb),
    ('nutrition.product_name_visible', 'true'::jsonb),
    ('nutrition.member_adjustments_enabled', 'false'::jsonb),
    ('nutrition.variety_tags_enabled', 'true'::jsonb)
)
insert into public.app_settings (workspace_id, key, value)
select w.id, s.key, s.value
from public.workspaces w
cross join setting_seed s
on conflict (workspace_id, key) do nothing;

with app_page_seed(title, route, page_type, menu_area, sort_order, is_system, status) as (
  values
    ('Panel', '/app', 'system', 'main', 10, true, 'active'::public.plan_status),
    ('Entreno', '/app/workouts', 'system', 'main', 20, true, 'active'::public.plan_status),
    ('Comida', '/app/meals', 'system', 'main', 30, true, 'active'::public.plan_status),
    ('Progreso', '/app/progress', 'system', 'main', 40, true, 'active'::public.plan_status),
    ('Cardio', '/app/cardio', 'system', 'main', 50, true, 'active'::public.plan_status),
    ('Guias', '/app/guides', 'content', 'main', 60, false, 'active'::public.plan_status),
    ('Soporte', '/app/support', 'support', 'main', 70, true, 'active'::public.plan_status)
)
insert into public.app_pages (workspace_id, title, route, page_type, menu_area, sort_order, is_system, status)
select w.id, p.title, p.route, p.page_type, p.menu_area, p.sort_order, p.is_system, p.status
from public.workspaces w
cross join app_page_seed p
on conflict (workspace_id, route) do nothing;

with notification_seed(event_key, title, channels) as (
  values
    ('customer.account_created', 'Cuenta de cliente creada', array['email','push','in_app']),
    ('customer.account_activated', 'Cuenta activada', array['email','push','in_app']),
    ('customer.account_deactivated', 'Cuenta desactivada', array['email','in_app']),
    ('payment.succeeded', 'Pago correcto', array['email','in_app']),
    ('payment.failed', 'Pago fallido', array['email','push','in_app']),
    ('progress.update_due', 'Check-in pendiente', array['email','push','in_app']),
    ('progress.update_overdue', 'Check-in atrasado', array['email','push','in_app']),
    ('meal.swap_succeeded', 'Cambio de comida generado', array['push','in_app']),
    ('meal.swap_failed', 'Cambio de comida fallido', array['in_app']),
    ('fitness.exercise_swap_requested', 'Solicitud de swap de ejercicio', array['push','in_app']),
    ('progress.photo_uploaded', 'Foto de progreso subida', array['push','in_app']),
    ('nutrition.plan_activated', 'Plan nutricional activado', array['email','push','in_app']),
    ('nutrition.generation_failed', 'Generacion nutricional fallida', array['in_app']),
    ('community.moderation_reported', 'Reporte de comunidad', array['in_app']),
    ('account.delete_requested', 'Solicitud de borrado', array['email','in_app'])
),
expanded_notifications as (
  select event_key, title, unnest(channels) as channel
  from notification_seed
)
insert into public.notification_templates (workspace_id, event_key, channel, subject, body, is_enabled)
select
  w.id,
  n.event_key,
  n.channel,
  n.title,
  jsonb_build_object('title', n.title, 'body', '', 'variables', jsonb_build_array()),
  true
from public.workspaces w
cross join expanded_notifications n
on conflict (workspace_id, event_key, channel) do nothing;
