-- Mock commerce release: seller-declared variants, persistent carts and orders.
alter table listings add column if not exists specifications jsonb not null default '{}'::jsonb;

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id)
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  selected_specifications jsonb not null default '{}'::jsonb,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, listing_id)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references profiles(id),
  subtotal numeric not null check (subtotal >= 0),
  emi_months integer check (emi_months in (3, 6, 9, 12)),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refund_requested', 'refunded')),
  shipping_name text not null default '',
  shipping_phone text not null default '',
  shipping_address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  listing_id uuid references listings(id) on delete set null,
  title text not null,
  image_url text,
  unit_price numeric not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  selected_specifications jsonb not null default '{}'::jsonb
);

create table if not exists mock_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  transaction_reference text not null unique,
  amount numeric not null check (amount >= 0),
  payment_method text not null default 'mock_emi',
  state text not null check (state in ('successful', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists carts_buyer_idx on carts(buyer_id);
create index if not exists orders_buyer_idx on orders(buyer_id, created_at desc);
create index if not exists orders_seller_idx on orders(seller_id, created_at desc);
create index if not exists order_items_order_idx on order_items(order_id);

alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table mock_payments enable row level security;
create policy "mock_commerce_carts" on carts for all using (true) with check (true);
create policy "mock_commerce_cart_items" on cart_items for all using (true) with check (true);
create policy "mock_commerce_orders" on orders for all using (true) with check (true);
create policy "mock_commerce_order_items" on order_items for all using (true) with check (true);
create policy "mock_commerce_payments" on mock_payments for all using (true) with check (true);
