-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('admin', 'agency_owner', 'agency_staff', 'rabateur');
create type public.offer_status as enum ('active', 'paused', 'sold_out', 'expired');
create type public.booking_status as enum ('pending', 'confirmed', 'paid', 'completed', 'cancelled');
create type public.notification_type as enum ('deal', 'message', 'urgent', 'system');

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  locale text not null default 'ar',
  agency_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- =========================================================
-- AGENCIES
-- =========================================================
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  city_ar text not null,
  city_en text not null,
  license_number text,
  commercial_register_url text,
  license_url text,
  logo_url text,
  bio_ar text,
  bio_en text,
  phone text,
  email text,
  verified boolean not null default false,
  verified_at timestamptz,
  rating numeric(3,2) not null default 0,
  total_deals integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agencies_owner_idx on public.agencies(owner_id);
create index agencies_city_idx on public.agencies(city_en);

grant select, insert, update on public.agencies to authenticated;
grant all on public.agencies to service_role;
alter table public.agencies enable row level security;

create policy "agencies_select_all_authenticated" on public.agencies
  for select to authenticated using (true);
create policy "agencies_insert_own" on public.agencies
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "agencies_update_own" on public.agencies
  for update to authenticated using (auth.uid() = owner_id);

-- now add FK from profiles to agencies (set null on delete)
alter table public.profiles
  add constraint profiles_agency_fk
  foreign key (agency_id) references public.agencies(id) on delete set null;

-- =========================================================
-- USER ROLES + has_role (security definer to prevent recursion)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "user_roles_select_own" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- Admin policies (use has_role to avoid recursion)
create policy "agencies_admin_update" on public.agencies
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "user_roles_admin_all" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- OFFERS
-- =========================================================
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  city_from_ar text not null,
  city_from_en text not null,
  airline text not null,
  departure_date date not null,
  return_date date,
  total_seats integer not null check (total_seats > 0),
  remaining_seats integer not null check (remaining_seats >= 0),
  original_price numeric(12,2) not null,
  price numeric(12,2) not null,
  currency text not null default 'DZD',
  urgent boolean not null default false,
  status public.offer_status not null default 'active',
  expires_at timestamptz,
  notes_ar text,
  notes_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index offers_agency_idx on public.offers(agency_id);
create index offers_status_date_idx on public.offers(status, departure_date);
create index offers_urgent_idx on public.offers(urgent) where urgent = true;

grant select, insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;

create policy "offers_select_all_authenticated" on public.offers
  for select to authenticated using (true);
create policy "offers_insert_owner" on public.offers
  for insert to authenticated
  with check (exists (select 1 from public.agencies a where a.id = agency_id and a.owner_id = auth.uid()));
create policy "offers_update_owner" on public.offers
  for update to authenticated
  using (exists (select 1 from public.agencies a where a.id = agency_id and a.owner_id = auth.uid()));
create policy "offers_delete_owner" on public.offers
  for delete to authenticated
  using (exists (select 1 from public.agencies a where a.id = agency_id and a.owner_id = auth.uid()));

-- =========================================================
-- BOOKINGS
-- =========================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  buyer_agency_id uuid not null references public.agencies(id) on delete cascade,
  seller_agency_id uuid not null references public.agencies(id) on delete cascade,
  seats integer not null check (seats > 0),
  price_per_seat numeric(12,2) not null,
  total_price numeric(12,2) not null,
  status public.booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_buyer_idx on public.bookings(buyer_agency_id);
create index bookings_seller_idx on public.bookings(seller_agency_id);
create index bookings_offer_idx on public.bookings(offer_id);

grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

create policy "bookings_select_participants" on public.bookings
  for select to authenticated using (
    exists (select 1 from public.agencies a
            where a.id in (buyer_agency_id, seller_agency_id) and a.owner_id = auth.uid())
  );
create policy "bookings_insert_buyer" on public.bookings
  for insert to authenticated with check (
    exists (select 1 from public.agencies a where a.id = buyer_agency_id and a.owner_id = auth.uid())
  );
create policy "bookings_update_participants" on public.bookings
  for update to authenticated using (
    exists (select 1 from public.agencies a
            where a.id in (buyer_agency_id, seller_agency_id) and a.owner_id = auth.uid())
  );

-- =========================================================
-- CONVERSATIONS + MESSAGES
-- =========================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  agency_a_id uuid not null references public.agencies(id) on delete cascade,
  agency_b_id uuid not null references public.agencies(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (agency_a_id, agency_b_id)
);

create index conversations_a_idx on public.conversations(agency_a_id);
create index conversations_b_idx on public.conversations(agency_b_id);

grant select, insert, update on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;

create policy "conversations_select_participants" on public.conversations
  for select to authenticated using (
    exists (select 1 from public.agencies a
            where a.id in (agency_a_id, agency_b_id) and a.owner_id = auth.uid())
  );
create policy "conversations_insert_participant" on public.conversations
  for insert to authenticated with check (
    exists (select 1 from public.agencies a
            where a.id in (agency_a_id, agency_b_id) and a.owner_id = auth.uid())
  );

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  masked_body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);

grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;

create policy "messages_select_participants" on public.messages
  for select to authenticated using (
    exists (select 1 from public.conversations c
            join public.agencies a on a.id in (c.agency_a_id, c.agency_b_id)
            where c.id = conversation_id and a.owner_id = auth.uid())
  );
create policy "messages_insert_sender" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c
                join public.agencies a on a.id in (c.agency_a_id, c.agency_b_id)
                where c.id = conversation_id and a.owner_id = auth.uid())
  );
create policy "messages_update_recipient_read" on public.messages
  for update to authenticated using (
    exists (select 1 from public.conversations c
            join public.agencies a on a.id in (c.agency_a_id, c.agency_b_id)
            where c.id = conversation_id and a.owner_id = auth.uid())
  );

-- =========================================================
-- REVIEWS
-- =========================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_agency_id uuid not null references public.agencies(id) on delete cascade,
  reviewed_agency_id uuid not null references public.agencies(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_agency_id)
);

create index reviews_reviewed_idx on public.reviews(reviewed_agency_id);

grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;

create policy "reviews_select_all_authenticated" on public.reviews
  for select to authenticated using (true);
create policy "reviews_insert_reviewer" on public.reviews
  for insert to authenticated with check (
    exists (select 1 from public.agencies a where a.id = reviewer_agency_id and a.owner_id = auth.uid())
    and exists (select 1 from public.bookings b
                where b.id = booking_id and b.status = 'completed'
                  and (b.buyer_agency_id = reviewer_agency_id or b.seller_agency_id = reviewer_agency_id))
  );

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title_ar text not null,
  title_en text not null,
  body_ar text,
  body_en text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications(user_id, read, created_at desc);

grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (auth.uid() = user_id);

-- =========================================================
-- TRIGGERS: updated_at + auto-create profile on signup
-- =========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_agencies_updated before update on public.agencies
  for each row execute function public.set_updated_at();
create trigger trg_offers_updated before update on public.offers
  for each row execute function public.set_updated_at();
create trigger trg_bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'locale', 'ar')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- REALTIME for messages + notifications
-- =========================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.offers;