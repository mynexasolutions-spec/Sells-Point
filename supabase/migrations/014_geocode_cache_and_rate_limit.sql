-- Shared reverse-geocode cache and cross-instance Nominatim request pacing.
create table if not exists geocode_cache (
  coordinate_key text primary key,
  response jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists nominatim_rate_limit (
  singleton boolean primary key default true check (singleton),
  next_allowed_at timestamptz not null default now()
);

insert into nominatim_rate_limit (singleton) values (true)
on conflict (singleton) do nothing;

create or replace function acquire_nominatim_slot()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_next timestamptz;
  slot_at timestamptz;
  wait_ms integer;
begin
  select next_allowed_at into current_next
  from nominatim_rate_limit
  where singleton = true
  for update;

  slot_at := greatest(clock_timestamp(), current_next);
  wait_ms := greatest(0, ceil(extract(epoch from (slot_at - clock_timestamp())) * 1000)::integer);

  update nominatim_rate_limit
  set next_allowed_at = slot_at + interval '1 second'
  where singleton = true;

  return wait_ms;
end;
$$;

alter table geocode_cache enable row level security;
alter table nominatim_rate_limit enable row level security;
revoke all on geocode_cache from anon, authenticated;
revoke all on nominatim_rate_limit from anon, authenticated;
revoke all on function acquire_nominatim_slot() from public, anon, authenticated;
grant execute on function acquire_nominatim_slot() to service_role;
