alter table public.workspaces
add column if not exists public_domain text,
add column if not exists member_domain text,
add column if not exists fallback_subdomain text;

create unique index if not exists workspaces_public_domain_unique
on public.workspaces (public_domain)
where public_domain is not null;

create unique index if not exists workspaces_member_domain_unique
on public.workspaces (member_domain)
where member_domain is not null;

create unique index if not exists workspaces_fallback_subdomain_unique
on public.workspaces (fallback_subdomain)
where fallback_subdomain is not null;

update public.workspaces
set
  public_domain = coalesce(public_domain, custom_domain),
  member_domain = coalesce(member_domain, case when custom_domain is not null then 'miembros.' || custom_domain else null end),
  fallback_subdomain = coalesce(fallback_subdomain, slug || '.performlabs.app')
where public_domain is null
   or member_domain is null
   or fallback_subdomain is null;
