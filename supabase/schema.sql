
create extension if not exists pgcrypto;

-- =========================================================
-- Tables
-- =========================================================

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  name text not null default '',
  email text default '',
  avatar_url text,
  verified boolean not null default false,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  location text default '',
  latitude double precision,
  longitude double precision,
  bio text default '',
  joined_at timestamptz not null default now(),
  rating numeric not null default 0,
  rating_count integer not null default 0
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  price numeric not null default 0,
  original_price numeric default 0,
  category text not null,
  condition text default 'Good',
  images text[] not null default '{}',
  video_url text,
  location text default '',
  latitude double precision,
  longitude double precision,
  featured boolean not null default false,
  featured_status text not null default 'none'
    check (featured_status in ('none', 'pending', 'approved', 'rejected')),
  status text not null default 'active'
    check (status in ('active', 'sold', 'expired', 'flagged', 'removed')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  moderation_note text default '',
  created_at timestamptz not null default now(),
  views integer not null default 0
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  participant_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  text text default '',
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists chat_reads (
  user_id uuid references profiles(id) on delete cascade,
  chat_id uuid references chats(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, chat_id)
);

create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('listing', 'user')),
  target_id uuid not null,
  reporter_id uuid references profiles(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution_note text default '',
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references profiles(id) on delete cascade,
  reviewed_user_id uuid references profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reviewer_id, reviewed_user_id),
  check (reviewer_id <> reviewed_user_id)
);

create table if not exists categories (
  id text primary key,
  label text not null,
  icon text not null default 'Tag',
  image_url text,
  sort_order integer not null default 0
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type text not null check (type in ('message', 'favorite', 'listing_sold', 'price_drop', 'admin', 'featured_approved', 'featured_rejected', 'user_banned')),
  entity_id uuid,
  entity_type text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists moderation_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  target_type text not null check (target_type in ('listing', 'user', 'report')),
  target_id uuid not null,
  action text not null,
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists listings_seller_idx on listings(seller_id);
create index if not exists messages_chat_idx on messages(chat_id);
create index if not exists chats_participants_idx on chats using gin(participant_ids);
create index if not exists notifications_recipient_idx on notifications(recipient_id);
create index if not exists chat_reads_user_idx on chat_reads(user_id);
create index if not exists reviews_reviewed_user_idx on reviews(reviewed_user_id);
create index if not exists reviews_reviewer_idx on reviews(reviewer_id);
create index if not exists listings_geo_idx on listings(latitude, longitude);
create index if not exists listings_expires_at_idx on listings(expires_at);
create index if not exists listings_status_idx on listings(status);
create index if not exists user_blocks_blocker_idx on user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on user_blocks(blocked_id);
create index if not exists moderation_logs_target_idx on moderation_logs(target_type, target_id);

-- =========================================================
-- Row Level Security
--
-- IMPORTANT — mock-auth tradeoff:
-- The app currently uses a mock OTP flow (no real Supabase Auth session), so
-- there is no `auth.uid()` to scope policies by row ownership. Policies below
-- are intentionally permissive for normal read/write (equivalent to the
-- trust model of the old localStorage-only prototype), while all
-- moderation/admin actions (ban, unban, approve/reject featured, delete any
-- listing, resolve reports) are only ever performed by the Next.js
-- `/api/admin/*` routes using the service-role key, which bypasses RLS after
-- checking `profiles.is_admin` server-side.
--
-- Once real Supabase phone-OTP auth (Twilio etc.) is wired in, tighten these
-- to `using (auth.uid() = id)` / `using (auth.uid() = seller_id)` etc.
-- =========================================================

alter table profiles enable row level security;
alter table listings enable row level security;
alter table categories enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table favorites enable row level security;
alter table reports enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table chat_reads enable row level security;
alter table announcements enable row level security;
alter table user_blocks enable row level security;
alter table moderation_logs enable row level security;

drop policy if exists "announcements_select_all" on announcements;
create policy "announcements_select_all" on announcements for select using (true);

drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select using (true);
drop policy if exists "profiles_insert_all" on profiles;
create policy "profiles_insert_all" on profiles for insert with check (true);
drop policy if exists "profiles_update_all" on profiles;
create policy "profiles_update_all" on profiles for update using (true);

drop policy if exists "listings_select_all" on listings;
create policy "listings_select_all" on listings for select using (true);
drop policy if exists "listings_insert_all" on listings;
create policy "listings_insert_all" on listings for insert with check (true);
drop policy if exists "listings_update_all" on listings;
create policy "listings_update_all" on listings for update using (true);
drop policy if exists "listings_delete_all" on listings;
create policy "listings_delete_all" on listings for delete using (true);

drop policy if exists "categories_select_all" on categories;
create policy "categories_select_all" on categories for select using (true);

drop policy if exists "chats_select_all" on chats;
create policy "chats_select_all" on chats for select using (true);
drop policy if exists "chats_insert_all" on chats;
create policy "chats_insert_all" on chats for insert with check (true);

drop policy if exists "messages_select_all" on messages;
create policy "messages_select_all" on messages for select using (true);
drop policy if exists "messages_insert_all" on messages;
create policy "messages_insert_all" on messages for insert with check (true);

drop policy if exists "favorites_select_all" on favorites;
create policy "favorites_select_all" on favorites for select using (true);
drop policy if exists "favorites_insert_all" on favorites;
create policy "favorites_insert_all" on favorites for insert with check (true);
drop policy if exists "favorites_delete_all" on favorites;
create policy "favorites_delete_all" on favorites for delete using (true);

-- reports: anyone can file a report, but nobody can read/update via the anon
-- key — only the admin API routes (service role) can list/resolve reports.
drop policy if exists "reports_insert_all" on reports;
create policy "reports_insert_all" on reports for insert with check (true);

drop policy if exists "reviews_select_all" on reviews;
create policy "reviews_select_all" on reviews for select using (true);
drop policy if exists "reviews_insert_all" on reviews;
create policy "reviews_insert_all" on reviews for insert with check (true);
drop policy if exists "reviews_update_all" on reviews;
create policy "reviews_update_all" on reviews for update using (true);

-- notifications: users can only read their own notifications; inserts are
-- done by the service role (API routes) or by the app via the anon key with
-- the understanding that RLS is permissive for now (same trust model as
-- other tables until real auth is wired in).
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications for select using (true);
drop policy if exists "notifications_insert_all" on notifications;
create policy "notifications_insert_all" on notifications for insert with check (true);
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update using (true);

drop policy if exists "chat_reads_select_all" on chat_reads;
create policy "chat_reads_select_all" on chat_reads for select using (true);
drop policy if exists "chat_reads_insert_all" on chat_reads;
create policy "chat_reads_insert_all" on chat_reads for insert with check (true);
drop policy if exists "chat_reads_update_all" on chat_reads;
create policy "chat_reads_update_all" on chat_reads for update using (true);

drop policy if exists "user_blocks_select_all" on user_blocks;
create policy "user_blocks_select_all" on user_blocks for select using (true);
drop policy if exists "user_blocks_insert_all" on user_blocks;
create policy "user_blocks_insert_all" on user_blocks for insert with check (true);
drop policy if exists "user_blocks_delete_all" on user_blocks;
create policy "user_blocks_delete_all" on user_blocks for delete using (true);

drop policy if exists "moderation_logs_no_anon_select" on moderation_logs;
create policy "moderation_logs_no_anon_select" on moderation_logs for select using (false);

-- =========================================================
-- RPC functions
-- =========================================================

create or replace function get_category_stats()
returns table (category text, count bigint)
language sql
as $$
  select l.category, count(*) as count
  from listings l
  where l.status = 'active'
  group by l.category
  order by count desc;
$$;

create or replace function distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
    else 6371 * acos(
      least(
        1,
        greatest(
          -1,
          cos(radians(lat1)) * cos(radians(lat2)) *
          cos(radians(lon2) - radians(lon1)) +
          sin(radians(lat1)) * sin(radians(lat2))
        )
      )
    )
  end;
$$;

create or replace function search_nearby_listings(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  search_query text default null,
  category_filter text default null,
  min_price numeric default null,
  max_price numeric default null,
  condition_filters text[] default null,
  date_cutoff timestamptz default null,
  result_limit integer default 20,
  result_offset integer default 0
)
returns table (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  price numeric,
  original_price numeric,
  category text,
  condition text,
  images text[],
  video_url text,
  location text,
  latitude double precision,
  longitude double precision,
  featured boolean,
  featured_status text,
  status text,
  created_at timestamptz,
  views integer,
  expires_at timestamptz,
  moderation_note text,
  distance_km double precision
)
language sql
stable
as $$
  select
    l.id,
    l.seller_id,
    l.title,
    l.description,
    l.price,
    l.original_price,
    l.category,
    l.condition,
    l.images,
    l.video_url,
    l.location,
    l.latitude,
    l.longitude,
    l.featured,
    l.featured_status,
    l.status,
    l.created_at,
    l.views,
    l.expires_at,
    l.moderation_note,
    distance_km(user_lat, user_lng, l.latitude, l.longitude) as distance_km
  from listings l
  where l.status = 'active'
    and l.expires_at > now()
    and l.latitude is not null
    and l.longitude is not null
    and (radius_km is null or distance_km(user_lat, user_lng, l.latitude, l.longitude) <= radius_km)
    and (search_query is null or l.title ilike '%' || search_query || '%' or l.description ilike '%' || search_query || '%')
    and (category_filter is null or l.category = category_filter)
    and (min_price is null or l.price >= min_price)
    and (max_price is null or l.price <= max_price)
    and (condition_filters is null or l.condition = any(condition_filters))
    and (date_cutoff is null or l.created_at >= date_cutoff)
  order by
    case when l.featured and l.featured_status = 'approved' then 0 else 1 end,
    distance_km asc nulls last,
    l.created_at desc
  limit result_limit
  offset result_offset;
$$;

-- =========================================================
-- Realtime
-- =========================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;

-- =========================================================
-- Seed data (safe to re-run — ids are fixed, ON CONFLICT DO NOTHING)
-- =========================================================

insert into profiles (id, phone, name, email, avatar_url, verified, is_admin, is_banned, location, bio, joined_at, rating, rating_count) values
  ('00000000-0000-0000-0000-000000000001', '+919999900000', 'Sells Point HQ', 'admin@sellspoint.app', 'https://i.pravatar.cc/150?img=12', true, true, false, 'Bengaluru, IN', 'Official Sells Point administrator account.', now() - interval '700 days', 5, 12),
  ('00000000-0000-0000-0000-000000000002', '+919812345678', 'Aarav Mehta', 'aarav.mehta@example.com', 'https://i.pravatar.cc/150?img=13', true, false, false, 'Mumbai, IN', 'Upgrading gadgets every year — selling gently used electronics in mint condition.', now() - interval '410 days', 4.8, 37),
  ('00000000-0000-0000-0000-000000000003', '+919823456789', 'Priya Sharma', 'priya.sharma@example.com', 'https://i.pravatar.cc/150?img=32', true, false, false, 'Pune, IN', 'Interior design enthusiast selling premium furniture pieces.', now() - interval '280 days', 4.6, 21),
  ('00000000-0000-0000-0000-000000000004', '+919834567890', 'Rohan Kapoor', 'rohan.kapoor@example.com', 'https://i.pravatar.cc/150?img=15', false, false, false, 'Delhi, IN', 'Car and bike enthusiast. Quick and honest deals.', now() - interval '60 days', 4.2, 9)
on conflict (id) do nothing;

insert into categories (id, label, icon, sort_order) values
  ('mobiles', 'Mobiles', 'Smartphone', 1),
  ('laptops', 'Laptops', 'Laptop', 2),
  ('vehicles', 'Vehicles', 'Car', 3),
  ('furniture', 'Furniture', 'Sofa', 4),
  ('fashion', 'Fashion', 'Shirt', 5),
  ('gaming', 'Gaming', 'Gamepad2', 6),
  ('appliances', 'Appliances', 'WashingMachine', 7),
  ('cameras', 'Cameras', 'Camera', 8),
  ('books', 'Books', 'BookOpen', 9),
  ('realestate', 'Real Estate', 'Building2', 10)
on conflict (id) do nothing;

insert into listings (id, seller_id, title, description, price, original_price, category, condition, images, video_url, location, featured, featured_status, status, created_at, views) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'iPhone 14 Pro — 256GB Deep Purple', 'Barely used iPhone 14 Pro, 256GB, Deep Purple. Comes with original box, charger, and unused earphones. No scratches, screen protector applied since day one.', 78999, 129999, 'mobiles', 'Excellent', array['https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=1200&q=80','https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=1200&q=80'], null, 'Mumbai, IN', true, 'approved', 'active', now() - interval '2 days', 341),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'MacBook Air M2 13-inch, 8GB/256GB', 'MacBook Air M2 in Midnight color. Used lightly for college work, battery health 96%. Includes charger and sleeve case.', 84999, 114900, 'laptops', 'Like New', array['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1200&q=80','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80'], null, 'Mumbai, IN', true, 'approved', 'active', now() - interval '5 days', 512),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Mid-Century Modern Sofa — 3 Seater', 'Solid wood 3-seater sofa with premium fabric upholstery. Minimal wear, extremely comfortable, pet-free and smoke-free home.', 18500, 32000, 'furniture', 'Good', array['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80','https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80'], null, 'Pune, IN', false, 'none', 'active', now() - interval '8 days', 122),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Royal Enfield Classic 350 — 2021', 'Single owner, well maintained, all papers clear. Recently serviced with new tyres. Genuine reason for sale: relocating abroad.', 132000, 189000, 'vehicles', 'Good', array['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80','https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&q=80'], null, 'Delhi, IN', true, 'pending', 'active', now() - interval '1 days', 89),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Sony Alpha A6400 with 16-50mm Lens', 'Mirrorless camera kit in great shape, shutter count under 8000. Perfect for vlogging and travel photography.', 54500, 78990, 'cameras', 'Excellent', array['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80','https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80'], null, 'Mumbai, IN', false, 'none', 'sold', now() - interval '20 days', 245),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'PlayStation 5 Slim Disc Edition + 2 Controllers', 'PS5 Slim with two DualSense controllers and three games included (Spiderman 2, GT7, FC24). Excellent condition, smoke-free home.', 39999, 54990, 'gaming', 'Like New', array['https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=1200&q=80','https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=1200&q=80'], null, 'Pune, IN', false, 'none', 'active', now() - interval '3 days', 410)
on conflict (id) do nothing;

insert into chats (id, listing_id, participant_ids, created_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', array['00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid], now() - interval '1 days')
on conflict (id) do nothing;

insert into messages (id, chat_id, sender_id, text, image_url, created_at) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Hi! Is the iPhone 14 Pro still available?', null, now() - interval '1 days' + interval '10 minutes'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Yes it is! Still in great condition, happy to share more photos.', null, now() - interval '1 days' + interval '14 minutes'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Great, would you take 75,000 for it?', null, now() - interval '1 days' + interval '20 minutes')
on conflict (id) do nothing;

insert into reports (id, type, target_id, reporter_id, reason, status, created_at) values
  ('40000000-0000-0000-0000-000000000001', 'listing', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Suspicious pricing, possible scam listing.', 'open', now() - interval '1 days')
on conflict (id) do nothing;
