-- One canonical registry prevents a host from being assigned to different
-- workspaces through different legacy columns (public/member/fallback/custom).

create or replace function public.canonical_workspace_domain(raw_domain text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  normalized text;
begin
  normalized := lower(btrim(raw_domain));
  normalized := regexp_replace(normalized, '^https?://', '', 'i');
  normalized := regexp_replace(normalized, '^www\.', '', 'i');
  normalized := regexp_replace(normalized, '/.*$', '');
  normalized := regexp_replace(normalized, ':\d+$', '');
  normalized := regexp_replace(normalized, '\.$', '');
  return nullif(normalized, '');
end;
$$;

-- Stop instead of choosing an arbitrary tenant if historical data already has
-- a cross-workspace collision. The operator can resolve the named host and
-- safely rerun the migration.
do $$
declare
  conflicting_domains text;
begin
  with claims as (
    select id as workspace_id, public.canonical_workspace_domain(public_domain) as domain from public.workspaces
    union all
    select id, public.canonical_workspace_domain(member_domain) from public.workspaces
    union all
    select id, public.canonical_workspace_domain(fallback_subdomain) from public.workspaces
    union all
    select id, public.canonical_workspace_domain(custom_domain) from public.workspaces
    union all
    select workspace_id, public.canonical_workspace_domain(domain) from public.workspace_domains
  ), collisions as (
    select domain
    from claims
    where domain is not null
    group by domain
    having count(distinct workspace_id) > 1
    order by domain
    limit 10
  )
  select string_agg(domain, ', ' order by domain) into conflicting_domains
  from collisions;

  if conflicting_domains is not null then
    raise exception 'Workspace domain collision(s) must be resolved before migration: %', conflicting_domains
      using errcode = '23505';
  end if;
end;
$$;

-- Canonicalize and collapse legacy duplicates belonging to the same workspace
-- before the existing UNIQUE(domain) constraint becomes our global lock.
with ranked as (
  select
    id,
    row_number() over (
      partition by workspace_id, public.canonical_workspace_domain(domain)
      order by is_primary desc, (status = 'verified') desc, created_at asc, id
    ) as row_number
  from public.workspace_domains
)
delete from public.workspace_domains domains
using ranked
where domains.id = ranked.id
  and ranked.row_number > 1;

update public.workspace_domains
set domain = public.canonical_workspace_domain(domain),
    updated_at = now()
where domain is distinct from public.canonical_workspace_domain(domain);

update public.workspaces
set public_domain = public.canonical_workspace_domain(public_domain),
    member_domain = public.canonical_workspace_domain(member_domain),
    fallback_subdomain = public.canonical_workspace_domain(fallback_subdomain),
    custom_domain = public.canonical_workspace_domain(custom_domain)
where public_domain is distinct from public.canonical_workspace_domain(public_domain)
   or member_domain is distinct from public.canonical_workspace_domain(member_domain)
   or fallback_subdomain is distinct from public.canonical_workspace_domain(fallback_subdomain)
   or custom_domain is distinct from public.canonical_workspace_domain(custom_domain);

create or replace function public.normalize_workspace_domain_registry_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := public.canonical_workspace_domain(new.domain);
  if new.domain is null then
    raise exception 'Workspace domain cannot be empty' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_domains_normalize_domain on public.workspace_domains;
create trigger workspace_domains_normalize_domain
before insert or update of domain on public.workspace_domains
for each row execute function public.normalize_workspace_domain_registry_row();

create or replace function public.normalize_workspace_domain_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.public_domain := public.canonical_workspace_domain(new.public_domain);
  new.member_domain := public.canonical_workspace_domain(new.member_domain);
  new.fallback_subdomain := public.canonical_workspace_domain(new.fallback_subdomain);
  new.custom_domain := public.canonical_workspace_domain(new.custom_domain);
  return new;
end;
$$;

drop trigger if exists workspaces_normalize_domain_columns on public.workspaces;
create trigger workspaces_normalize_domain_columns
before insert or update of public_domain, member_domain, fallback_subdomain, custom_domain on public.workspaces
for each row execute function public.normalize_workspace_domain_columns();

create or replace function public.sync_workspace_domain_registry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim record;
  affected_rows integer;
begin
  if tg_op = 'DELETE' then
    delete from public.workspace_domains where workspace_id = old.id;
    return old;
  end if;

  -- Only replace primary rows whose corresponding legacy value changed. This
  -- preserves verification status for unchanged domains.
  delete from public.workspace_domains
  where workspace_id = new.id
    and is_primary
    and domain_type in ('public_site', 'member_app', 'fallback', 'custom_app')
    and not (
      (domain_type = 'public_site' and domain = new.public_domain)
      or (domain_type = 'member_app' and domain = new.member_domain)
      or (domain_type = 'fallback' and domain = new.fallback_subdomain)
      or (domain_type = 'custom_app' and domain = new.custom_domain and new.custom_domain is distinct from new.public_domain)
    );

  for claim in
    select distinct on (domain) domain, domain_type
    from (values
      (new.public_domain, 'public_site'::public.workspace_domain_type, 1),
      (new.member_domain, 'member_app'::public.workspace_domain_type, 2),
      (new.fallback_subdomain, 'fallback'::public.workspace_domain_type, 3),
      (case when new.custom_domain is distinct from new.public_domain then new.custom_domain end,
        'custom_app'::public.workspace_domain_type, 4)
    ) as requested(domain, domain_type, priority)
    where domain is not null
    order by domain, priority
  loop
    update public.workspace_domains
    set domain_type = claim.domain_type,
        is_primary = true,
        updated_at = now()
    where workspace_id = new.id
      and domain = claim.domain;

    get diagnostics affected_rows = row_count;
    if affected_rows = 0 then
      insert into public.workspace_domains (workspace_id, domain, domain_type, is_primary)
      values (new.id, claim.domain, claim.domain_type, true);
    end if;
  end loop;

  return new;
exception
  when unique_violation then
    raise exception 'Workspace domain is already assigned to another workspace'
      using errcode = '23505', constraint = 'workspace_domains_domain_key';
end;
$$;

drop trigger if exists workspaces_sync_domain_registry on public.workspaces;
create trigger workspaces_sync_domain_registry
after insert or delete or update of public_domain, member_domain, fallback_subdomain, custom_domain on public.workspaces
for each row execute function public.sync_workspace_domain_registry();

-- Backfill every current workspace through the same race-safe path used by all
-- future writes.
update public.workspaces set public_domain = public_domain;

