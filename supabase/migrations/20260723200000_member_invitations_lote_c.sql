-- Lote C del plan "aula de clientes": invitación del coach.
-- Sello de envío de la invitación para mostrar estado y permitir reenvíos
-- informados en /coach/members (D-12: estados de reenvío en lado coach).
alter table public.member_profiles
  add column if not exists invitation_sent_at timestamptz;
comment on column public.member_profiles.invitation_sent_at is
  'Último envío del email de invitación al aula (magic link con marca del coach).';
