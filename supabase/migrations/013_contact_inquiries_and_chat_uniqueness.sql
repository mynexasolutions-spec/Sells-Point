  -- Contact enquiry inbox and canonical chat uniqueness.
  -- Some older deployed databases predate chat read markers, so create the
  -- prerequisite here before consolidating duplicate conversations.
  create table if not exists chat_reads (
    user_id uuid references profiles(id) on delete cascade,
    chat_id uuid references chats(id) on delete cascade,
    last_read_at timestamptz not null default now(),
    primary key (user_id, chat_id)
  );

  create index if not exists chat_reads_user_idx on chat_reads(user_id);
  alter table chat_reads enable row level security;
  drop policy if exists "chat_reads_select_all" on chat_reads;
  create policy "chat_reads_select_all" on chat_reads for select using (true);
  drop policy if exists "chat_reads_insert_all" on chat_reads;
  create policy "chat_reads_insert_all" on chat_reads for insert with check (true);
  drop policy if exists "chat_reads_update_all" on chat_reads;
  create policy "chat_reads_update_all" on chat_reads for update using (true);

  create table if not exists contact_inquiries (
    id uuid primary key default gen_random_uuid(),
    reference_code text not null unique,
    name text not null check (char_length(name) between 2 and 100),
    email text not null check (char_length(email) <= 254),
    normalized_email text not null,
    phone text,
    category text not null check (
      category in ('support', 'safety', 'account', 'listing', 'payment', 'partnership', 'feedback', 'other')
    ),
    message text not null check (char_length(message) between 10 and 2000),
    status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
    admin_note text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists contact_inquiries_status_created_idx
    on contact_inquiries(status, created_at desc);
  create index if not exists contact_inquiries_email_created_idx
    on contact_inquiries(normalized_email, created_at desc);

  alter table contact_inquiries enable row level security;

  -- Public visitors submit through the server-only service-role endpoint.
  -- Admin reads and mutations also go through protected service-role endpoints,
  -- so no browser-facing RLS policies are created for this table.

  create or replace function submit_contact_inquiry(
    p_reference_code text,
    p_name text,
    p_email text,
    p_normalized_email text,
    p_phone text,
    p_category text,
    p_message text
  )
  returns boolean
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    perform pg_advisory_xact_lock(hashtextextended(p_normalized_email, 0));

    if exists (
      select 1
      from contact_inquiries
      where normalized_email = p_normalized_email
        and created_at >= now() - interval '60 seconds'
    ) then
      return false;
    end if;

    insert into contact_inquiries (
      reference_code,
      name,
      email,
      normalized_email,
      phone,
      category,
      message
    )
    values (
      p_reference_code,
      p_name,
      p_email,
      p_normalized_email,
      nullif(p_phone, ''),
      p_category,
      p_message
    );

    return true;
  end;
  $$;

  revoke all on function submit_contact_inquiry(text, text, text, text, text, text, text) from public;
  revoke all on function submit_contact_inquiry(text, text, text, text, text, text, text) from anon;
  revoke all on function submit_contact_inquiry(text, text, text, text, text, text, text) from authenticated;
  grant execute on function submit_contact_inquiry(text, text, text, text, text, text, text) to service_role;

  create or replace function canonical_uuid_array(values_to_sort uuid[])
  returns text
  language sql
  immutable
  strict
  as $$
    select string_agg(value::text, ',' order by value::text)
    from unnest(values_to_sort) as sorted(value);
  $$;

  create temporary table chat_duplicate_map on commit drop as
  select duplicate_id, keeper_id
  from (
    select
      id as duplicate_id,
      first_value(id) over (
        partition by listing_id, canonical_uuid_array(participant_ids)
        order by created_at, id
      ) as keeper_id,
      row_number() over (
        partition by listing_id, canonical_uuid_array(participant_ids)
        order by created_at, id
      ) as duplicate_rank
    from chats
  ) ranked_chats
  where duplicate_rank > 1;

  update messages
  set chat_id = duplicate_map.keeper_id
  from chat_duplicate_map duplicate_map
  where messages.chat_id = duplicate_map.duplicate_id;

  insert into chat_reads (user_id, chat_id, last_read_at)
  select
    reads.user_id,
    duplicate_map.keeper_id,
    max(reads.last_read_at) as last_read_at
  from chat_reads reads
  join chat_duplicate_map duplicate_map on duplicate_map.duplicate_id = reads.chat_id
  group by reads.user_id, duplicate_map.keeper_id
  on conflict (user_id, chat_id)
  do update set last_read_at = greatest(chat_reads.last_read_at, excluded.last_read_at);

  delete from chats
  using chat_duplicate_map
  where chats.id = chat_duplicate_map.duplicate_id;

  create unique index if not exists chats_listing_participants_unique_idx
    on chats(listing_id, canonical_uuid_array(participant_ids));
