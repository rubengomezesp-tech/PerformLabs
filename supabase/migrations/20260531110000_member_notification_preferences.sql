-- Per-member notification toggles, written via the service client from /app/profile.
-- Mirrors member_diet_preferences (one row per member, upsert on member_profile_id).
create table if not exists public.member_notification_preferences (
  member_profile_id uuid primary key references public.member_profiles(id) on delete cascade,
  coach_changes boolean not null default true,
  workout_reminders boolean not null default true,
  meal_reminders boolean not null default false,
  checkin_reminders boolean not null default true,
  in_app_messages boolean not null default true,
  quiet_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.member_notification_preferences enable row level security;

comment on table public.member_notification_preferences is
  'Per-member notification toggles (coach changes, workout/meal/check-in reminders, in-app messages, quiet mode). Read/written via the service client from /app/profile.';
