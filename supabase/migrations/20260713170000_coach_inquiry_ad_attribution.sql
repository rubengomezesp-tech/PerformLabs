-- Preserve Google Ads, Google app/web attribution and Meta click attribution on
-- RG Coach inquiries. This is additive and safe to run before or after the app:
-- the API's structured-message fallback keeps every value until these columns
-- exist, and this migration hydrates any rows accepted during that rollout gap.

alter table public.coach_inquiries
  add column if not exists utm_id text,
  add column if not exists utm_matchtype text,
  add column if not exists utm_device text,
  add column if not exists utm_network text,
  add column if not exists utm_adgroup text,
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists fbclid text;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_ad_dimensions_length_check
    check (
      (utm_id is null or (char_length(utm_id) <= 120 and utm_id !~ '[[:cntrl:]]'))
      and (utm_matchtype is null or (char_length(utm_matchtype) <= 120 and utm_matchtype !~ '[[:cntrl:]]'))
      and (utm_device is null or (char_length(utm_device) <= 120 and utm_device !~ '[[:cntrl:]]'))
      and (utm_network is null or (char_length(utm_network) <= 120 and utm_network !~ '[[:cntrl:]]'))
      and (utm_adgroup is null or (char_length(utm_adgroup) <= 120 and utm_adgroup !~ '[[:cntrl:]]'))
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_click_ids_format_check
    check (
      (gclid is null or (char_length(gclid) <= 512 and gclid !~ '[[:cntrl:][:space:]]'))
      and (gbraid is null or (char_length(gbraid) <= 512 and gbraid !~ '[[:cntrl:][:space:]]'))
      and (wbraid is null or (char_length(wbraid) <= 512 and wbraid !~ '[[:cntrl:][:space:]]'))
      and (fbclid is null or (char_length(fbclid) <= 512 and fbclid !~ '[[:cntrl:][:space:]]'))
    );
exception when duplicate_object then null;
end $$;

with parsed as (
  select
    id,
    nullif(btrim(split_part(split_part(message, E'\nutm_id: ', 2), E'\n', 1)), '') as parsed_utm_id,
    nullif(btrim(split_part(split_part(message, E'\nutm_matchtype: ', 2), E'\n', 1)), '') as parsed_utm_matchtype,
    nullif(btrim(split_part(split_part(message, E'\nutm_device: ', 2), E'\n', 1)), '') as parsed_utm_device,
    nullif(btrim(split_part(split_part(message, E'\nutm_network: ', 2), E'\n', 1)), '') as parsed_utm_network,
    nullif(btrim(split_part(split_part(message, E'\nutm_adgroup: ', 2), E'\n', 1)), '') as parsed_utm_adgroup,
    nullif(btrim(split_part(split_part(message, E'\ngclid: ', 2), E'\n', 1)), '') as parsed_gclid,
    nullif(btrim(split_part(split_part(message, E'\ngbraid: ', 2), E'\n', 1)), '') as parsed_gbraid,
    nullif(btrim(split_part(split_part(message, E'\nwbraid: ', 2), E'\n', 1)), '') as parsed_wbraid,
    nullif(btrim(split_part(split_part(message, E'\nfbclid: ', 2), E'\n', 1)), '') as parsed_fbclid
  from public.coach_inquiries
  where message like E'RG_DIAGNOSTIC_V1\n%'
)
update public.coach_inquiries as inquiry
set
  utm_id = coalesce(
    inquiry.utm_id,
    case when char_length(parsed.parsed_utm_id) <= 120 and parsed.parsed_utm_id !~ '[[:cntrl:]]' then parsed.parsed_utm_id end
  ),
  utm_matchtype = coalesce(
    inquiry.utm_matchtype,
    case when char_length(parsed.parsed_utm_matchtype) <= 120 and parsed.parsed_utm_matchtype !~ '[[:cntrl:]]' then parsed.parsed_utm_matchtype end
  ),
  utm_device = coalesce(
    inquiry.utm_device,
    case when char_length(parsed.parsed_utm_device) <= 120 and parsed.parsed_utm_device !~ '[[:cntrl:]]' then parsed.parsed_utm_device end
  ),
  utm_network = coalesce(
    inquiry.utm_network,
    case when char_length(parsed.parsed_utm_network) <= 120 and parsed.parsed_utm_network !~ '[[:cntrl:]]' then parsed.parsed_utm_network end
  ),
  utm_adgroup = coalesce(
    inquiry.utm_adgroup,
    case when char_length(parsed.parsed_utm_adgroup) <= 120 and parsed.parsed_utm_adgroup !~ '[[:cntrl:]]' then parsed.parsed_utm_adgroup end
  ),
  gclid = coalesce(
    inquiry.gclid,
    case when char_length(parsed.parsed_gclid) <= 512 and parsed.parsed_gclid !~ '[[:cntrl:][:space:]]' then parsed.parsed_gclid end
  ),
  gbraid = coalesce(
    inquiry.gbraid,
    case when char_length(parsed.parsed_gbraid) <= 512 and parsed.parsed_gbraid !~ '[[:cntrl:][:space:]]' then parsed.parsed_gbraid end
  ),
  wbraid = coalesce(
    inquiry.wbraid,
    case when char_length(parsed.parsed_wbraid) <= 512 and parsed.parsed_wbraid !~ '[[:cntrl:][:space:]]' then parsed.parsed_wbraid end
  ),
  fbclid = coalesce(
    inquiry.fbclid,
    case when char_length(parsed.parsed_fbclid) <= 512 and parsed.parsed_fbclid !~ '[[:cntrl:][:space:]]' then parsed.parsed_fbclid end
  )
from parsed
where inquiry.id = parsed.id;

update public.coach_inquiries
set source = case
  when coalesce(gclid, gbraid, wbraid) is not null then 'google'
  when fbclid is not null then 'meta'
  else source
end
where source in ('website', 'direct')
  and utm_source is null
  and coalesce(gclid, gbraid, wbraid, fbclid) is not null;

comment on column public.coach_inquiries.gclid is 'Google Ads click identifier; never write to application logs.';
comment on column public.coach_inquiries.gbraid is 'Google app-to-web attribution identifier; never write to application logs.';
comment on column public.coach_inquiries.wbraid is 'Google web-to-app attribution identifier; never write to application logs.';
comment on column public.coach_inquiries.fbclid is 'Meta click identifier; never write to application logs.';
