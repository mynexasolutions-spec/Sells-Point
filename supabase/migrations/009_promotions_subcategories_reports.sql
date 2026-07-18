-- Persisted mock promotions, subcategories, and contextual report resolution.

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references categories(id) on delete restrict,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, label)
);

alter table listings
  add column if not exists subcategory_id uuid references subcategories(id) on delete restrict,
  add column if not exists promotion_price_inr integer,
  add column if not exists promotion_requested_at timestamptz,
  add column if not exists promotion_quoted_at timestamptz,
  add column if not exists promotion_paid_at timestamptz,
  add column if not exists promotion_payment_reference text;

alter table listings drop constraint if exists listings_featured_status_check;
alter table listings add constraint listings_featured_status_check
  check (featured_status in ('none', 'pending', 'awaiting_payment', 'approved', 'rejected'));
alter table listings add constraint listings_promotion_price_check
  check (promotion_price_inr is null or promotion_price_inr > 0);

create table if not exists promotion_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  amount_inr integer not null check (amount_inr > 0),
  provider text not null default 'mock' check (provider = 'mock'),
  status text not null default 'successful' check (status in ('successful')),
  reference text not null unique,
  created_at timestamptz not null default now(),
  unique (listing_id)
);

alter table reports add column if not exists resolution_action text;

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in (
  'message', 'favorite', 'listing_sold', 'price_drop', 'admin', 'featured_approved',
  'featured_rejected', 'featured_quote_ready', 'featured_activated', 'user_banned'
));

create index if not exists subcategories_category_idx on subcategories(category_id, sort_order);
create index if not exists listings_subcategory_idx on listings(subcategory_id);
create index if not exists promotion_payments_created_idx on promotion_payments(created_at desc);

alter table subcategories enable row level security;
alter table promotion_payments enable row level security;
drop policy if exists "subcategories_select_all" on subcategories;
create policy "subcategories_select_all" on subcategories for select using (true);
-- Payment writes use the service-role API/RPC. Public reads are intentionally disabled.

create or replace function complete_mock_promotion_payment(actor_id uuid, target_listing_id uuid)
returns table (payment_id uuid, payment_reference text)
language plpgsql security definer set search_path = public
as $$
declare
  target listings%rowtype;
  existing promotion_payments%rowtype;
  new_payment promotion_payments%rowtype;
  ref text;
begin
  select * into target from listings where id = target_listing_id for update;
  if target.id is null or target.seller_id <> actor_id then raise exception 'Not authorized'; end if;
  select * into existing from promotion_payments where listing_id = target_listing_id;
  if existing.id is not null then
    return query select existing.id, existing.reference;
    return;
  end if;
  if target.featured_status <> 'awaiting_payment' or target.promotion_price_inr is null then
    raise exception 'Listing is not awaiting payment';
  end if;
  ref := 'MOCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into promotion_payments(listing_id, seller_id, amount_inr, reference)
    values(target.id, target.seller_id, target.promotion_price_inr, ref) returning * into new_payment;
  update listings set featured = true, featured_status = 'approved', promotion_paid_at = now(),
    promotion_payment_reference = ref where id = target.id;
  insert into notifications(recipient_id, actor_id, type, entity_id, entity_type)
    values(target.seller_id, target.seller_id, 'featured_activated', target.id, 'listing');
  return query select new_payment.id, new_payment.reference;
end;
$$;

drop function if exists search_nearby_listings(double precision,double precision,double precision,text,text,numeric,numeric,text[],timestamptz,integer,integer);
create function search_nearby_listings(
  user_lat double precision, user_lng double precision, radius_km double precision,
  search_query text default null, category_filter text default null, subcategory_filter uuid default null,
  min_price numeric default null, max_price numeric default null, condition_filters text[] default null,
  date_cutoff timestamptz default null, result_limit integer default 20, result_offset integer default 0
) returns table (
  id uuid, seller_id uuid, title text, description text, price numeric, original_price numeric,
  category text, subcategory_id uuid, condition text, images text[], video_url text, location text,
  latitude double precision, longitude double precision, featured boolean, featured_status text,
  status text, created_at timestamptz, views integer, expires_at timestamptz,
  moderation_note text, promotion_price_inr integer, promotion_requested_at timestamptz,
  promotion_quoted_at timestamptz, promotion_paid_at timestamptz,
  promotion_payment_reference text, distance_km double precision
) language sql stable as $$
  select l.id,l.seller_id,l.title,l.description,l.price,l.original_price,l.category,l.subcategory_id,
    l.condition,l.images,l.video_url,l.location,l.latitude,l.longitude,l.featured,l.featured_status,
    l.status,l.created_at,l.views,l.expires_at,l.moderation_note,l.promotion_price_inr,
    l.promotion_requested_at,l.promotion_quoted_at,l.promotion_paid_at,l.promotion_payment_reference,
    distance_km(user_lat,user_lng,l.latitude,l.longitude)
  from listings l where l.status='active' and l.expires_at > now()
    and l.latitude is not null and l.longitude is not null
    and (radius_km is null or distance_km(user_lat,user_lng,l.latitude,l.longitude) <= radius_km)
    and (search_query is null or l.title ilike '%'||search_query||'%' or l.description ilike '%'||search_query||'%')
    and (category_filter is null or l.category=category_filter)
    and (subcategory_filter is null or l.subcategory_id=subcategory_filter)
    and (min_price is null or l.price>=min_price) and (max_price is null or l.price<=max_price)
    and (condition_filters is null or l.condition=any(condition_filters))
    and (date_cutoff is null or l.created_at>=date_cutoff)
  order by case when l.featured and l.featured_status='approved' then 0 else 1 end,
    distance_km(user_lat,user_lng,l.latitude,l.longitude), l.created_at desc
  limit result_limit offset result_offset;
$$;

notify pgrst, 'reload schema';
