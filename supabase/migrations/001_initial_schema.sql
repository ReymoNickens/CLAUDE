-- =============================================================
-- CampusConnect UCC — Initial Schema Migration
-- Version: 001
-- Date: 2026-03-26
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────────────────────
create type user_role as enum (
  'student',
  'driver',
  'business_owner',
  'landlord',
  'admin'
);

create type post_category as enum (
  'Academic',
  'Events',
  'Lost & Found',
  'General',
  'Urgent'
);

create type listing_status as enum ('Available', 'Taken');

create type vehicle_type as enum ('Car', 'Pragya');

create type ride_status as enum (
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
);

create type driver_status as enum ('pending', 'approved', 'suspended');

-- ─────────────────────────────────────────────────────────────
-- 2. Core Tables
-- ─────────────────────────────────────────────────────────────

-- 2a. Profiles (extends auth.users 1-to-1)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text unique,               -- +233XXXXXXXXX
  avatar_url   text,
  role         user_role not null default 'student',
  is_verified  boolean not null default false,
  fcm_token    text,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'One-to-one extension of auth.users. Created automatically by trigger on sign-up.';

-- 2b. Drivers
create table public.drivers (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  vehicle_type        vehicle_type not null,
  vehicle_photo       text,
  plate_number        text,
  status              driver_status not null default 'pending',
  is_online           boolean not null default false,
  current_lat         double precision,
  current_lng         double precision,
  location_updated_at timestamptz,
  rating              numeric(3,2) not null default 5.00,
  total_trips         int not null default 0,
  total_earnings      numeric(12,2) not null default 0.00,
  commission_owed     numeric(12,2) not null default 0.00
);

comment on column public.drivers.commission_owed is
  'Running cash commission debt owed to the platform. Incremented on cash ride completion; decremented by trigger on commission_payments insert.';

-- 2c. Commission settlement ledger
create table public.commission_payments (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  recorded_by uuid references public.profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

-- 2d. Newsfeed posts
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        text not null,
  photo_url   text,
  category    post_category not null default 'General',
  likes_count int not null default 0,
  is_flagged  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_category_idx   on public.posts (category);

-- 2e. Post likes (idempotent toggle via PK uniqueness)
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

-- 2f. Post comments
create table public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index post_comments_post_id_idx on public.post_comments (post_id);

-- 2g. Accommodation listings
create table public.accommodations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  description       text,
  price_per_month   numeric(10,2) not null check (price_per_month > 0),
  neighbourhood     text not null,
  photos            text[],
  has_water         boolean not null default false,
  has_electricity   boolean not null default false,
  has_wifi          boolean not null default false,
  has_security      boolean not null default false,
  is_self_contained boolean not null default false,
  whatsapp_number   text not null,
  status            listing_status not null default 'Available',
  created_at        timestamptz not null default now(),

  constraint accommodations_photos_max_5 check (
    photos is null or array_length(photos, 1) <= 5
  )
);

create index accommodations_neighbourhood_idx on public.accommodations (neighbourhood);
create index accommodations_status_idx        on public.accommodations (status);
create index accommodations_price_idx         on public.accommodations (price_per_month);

-- 2h. Local services directory
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  category      text not null,
  description   text,
  location      text,
  phone         text,
  whatsapp      text,
  opening_hours text,
  photos        text[],
  avg_rating    numeric(3,2) not null default 0.00,
  review_count  int not null default 0,
  created_at    timestamptz not null default now()
);

create index services_category_idx on public.services (category);

-- 2i. Service reviews (one per user per service)
create table public.service_reviews (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  unique (service_id, user_id)
);

-- 2j. Fare rates (one row per vehicle type; editable by admin)
create table public.fare_rates (
  id           uuid primary key default gen_random_uuid(),
  vehicle_type vehicle_type not null unique,
  price_per_km numeric(8,2) not null check (price_per_km > 0),
  base_fare    numeric(8,2) not null default 2.00 check (base_fare >= 0),
  updated_at   timestamptz not null default now()
);

-- Seed default fare rates
insert into public.fare_rates (vehicle_type, price_per_km, base_fare) values
  ('Car',    2.50, 5.00),
  ('Pragya', 1.50, 3.00);

-- 2k. Rides
create table public.rides (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid references public.profiles(id) on delete set null,
  driver_id         uuid references public.drivers(id) on delete set null,
  vehicle_type      vehicle_type not null,
  pickup_lat        double precision not null,
  pickup_lng        double precision not null,
  pickup_address    text,
  dest_lat          double precision not null,
  dest_lng          double precision not null,
  dest_address      text,
  distance_km       numeric(8,3),
  fare_amount       numeric(10,2),
  commission_amount numeric(10,2),
  driver_earnings   numeric(10,2),
  payment_method    text not null default 'cash'
                    check (payment_method in ('cash', 'momo')),
  status            ride_status not null default 'pending',
  requested_at      timestamptz not null default now(),
  accepted_at       timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text
);

create index rides_student_id_idx   on public.rides (student_id);
create index rides_driver_id_idx    on public.rides (driver_id);
create index rides_status_idx       on public.rides (status);
create index rides_requested_at_idx on public.rides (requested_at desc);

-- 2l. Notifications
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  data       jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_is_read_idx on public.notifications (user_id, is_read);

-- ─────────────────────────────────────────────────────────────
-- 3. Triggers
-- ─────────────────────────────────────────────────────────────

-- 3a. Auto-create profile row when a new auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'User'
    ),
    new.phone,
    coalesce(
      (new.raw_user_meta_data->>'role')::user_role,
      'student'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 3b. Decrement commission_owed when a commission_payment is recorded
create or replace function public.handle_commission_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.drivers
  set commission_owed = greatest(0, commission_owed - new.amount)
  where id = new.driver_id;
  return new;
end;
$$;

create trigger on_commission_payment_created
  after insert on public.commission_payments
  for each row
  execute procedure public.handle_commission_payment();

-- 3c. On cash ride completion: increment driver commission_owed and totals
create or replace function public.handle_ride_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    if new.driver_id is not null and new.fare_amount is not null then
      update public.drivers
      set
        total_trips     = total_trips + 1,
        total_earnings  = total_earnings + coalesce(new.fare_amount, 0),
        commission_owed = case
          when new.payment_method = 'cash'
          then commission_owed + coalesce(new.commission_amount, 0)
          else commission_owed
        end
      where id = new.driver_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_ride_completed
  after update on public.rides
  for each row
  execute procedure public.handle_ride_completion();

-- 3d. Keep service avg_rating and review_count in sync
create or replace function public.handle_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.services
  set
    review_count = (
      select count(*) from public.service_reviews
      where service_id = coalesce(new.service_id, old.service_id)
    ),
    avg_rating = (
      select coalesce(avg(rating), 0)
      from public.service_reviews
      where service_id = coalesce(new.service_id, old.service_id)
    )
  where id = coalesce(new.service_id, old.service_id);
  return coalesce(new, old);
end;
$$;

create trigger on_review_insert
  after insert on public.service_reviews
  for each row execute procedure public.handle_review_change();

create trigger on_review_update
  after update on public.service_reviews
  for each row execute procedure public.handle_review_change();

create trigger on_review_delete
  after delete on public.service_reviews
  for each row execute procedure public.handle_review_change();

-- ─────────────────────────────────────────────────────────────
-- 4. Row-Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.drivers             enable row level security;
alter table public.commission_payments enable row level security;
alter table public.posts               enable row level security;
alter table public.post_likes          enable row level security;
alter table public.post_comments       enable row level security;
alter table public.accommodations      enable row level security;
alter table public.services            enable row level security;
alter table public.service_reviews     enable row level security;
alter table public.fare_rates          enable row level security;
alter table public.rides               enable row level security;
alter table public.notifications       enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── profiles ──────────────────────────────────────────────────
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Admin can update any profile"
  on public.profiles for update using (public.is_admin());

-- ── drivers ───────────────────────────────────────────────────
create policy "Drivers are publicly readable"
  on public.drivers for select using (true);

create policy "Driver can insert their own row"
  on public.drivers for insert with check (auth.uid() = id);

create policy "Driver can update their own row"
  on public.drivers for update using (auth.uid() = id);

create policy "Admin can update any driver"
  on public.drivers for update using (public.is_admin());

-- ── commission_payments ───────────────────────────────────────
create policy "Admins can view all commission payments"
  on public.commission_payments for select using (public.is_admin());

create policy "Drivers can view their own payments"
  on public.commission_payments for select using (auth.uid() = driver_id);

create policy "Only admins can insert commission payments"
  on public.commission_payments for insert with check (public.is_admin());

-- ── posts ─────────────────────────────────────────────────────
create policy "Posts are publicly readable"
  on public.posts for select using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete using (auth.uid() = user_id);

create policy "Admin can update any post"
  on public.posts for update using (public.is_admin());

create policy "Admin can delete any post"
  on public.posts for delete using (public.is_admin());

-- ── post_likes ────────────────────────────────────────────────
create policy "Post likes are publicly readable"
  on public.post_likes for select using (true);

create policy "Authenticated users can like"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.post_likes for delete using (auth.uid() = user_id);

-- ── post_comments ─────────────────────────────────────────────
create policy "Comments are publicly readable"
  on public.post_comments for select using (true);

create policy "Authenticated users can comment"
  on public.post_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.post_comments for delete using (auth.uid() = user_id);

create policy "Admin can delete any comment"
  on public.post_comments for delete using (public.is_admin());

-- ── accommodations ────────────────────────────────────────────
create policy "Accommodations are publicly readable"
  on public.accommodations for select using (true);

create policy "Landlords can create listings"
  on public.accommodations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('landlord', 'admin')
    )
  );

create policy "Owners can update their listings"
  on public.accommodations for update using (auth.uid() = user_id);

create policy "Owners can delete their listings"
  on public.accommodations for delete using (auth.uid() = user_id);

create policy "Admin can manage all listings"
  on public.accommodations for all using (public.is_admin());

-- ── services ──────────────────────────────────────────────────
create policy "Services are publicly readable"
  on public.services for select using (true);

create policy "Business owners can create services"
  on public.services for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('business_owner', 'admin')
    )
  );

create policy "Owners can update their service"
  on public.services for update using (auth.uid() = user_id);

create policy "Owners can delete their service"
  on public.services for delete using (auth.uid() = user_id);

create policy "Admin can manage all services"
  on public.services for all using (public.is_admin());

-- ── service_reviews ───────────────────────────────────────────
create policy "Reviews are publicly readable"
  on public.service_reviews for select using (true);

create policy "Authenticated students can review"
  on public.service_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'student'
    )
  );

create policy "Users can update their own review"
  on public.service_reviews for update using (auth.uid() = user_id);

create policy "Users can delete their own review"
  on public.service_reviews for delete using (auth.uid() = user_id);

-- ── fare_rates ────────────────────────────────────────────────
create policy "Fare rates are publicly readable"
  on public.fare_rates for select using (true);

create policy "Only admins can modify fare rates"
  on public.fare_rates for all using (public.is_admin());

-- ── rides ─────────────────────────────────────────────────────
create policy "Students can view their own rides"
  on public.rides for select using (auth.uid() = student_id);

create policy "Drivers can view rides assigned to them"
  on public.rides for select
  using (
    exists (
      select 1 from public.drivers
      where id = auth.uid() and id = rides.driver_id
    )
  );

create policy "Admin can view all rides"
  on public.rides for select using (public.is_admin());

create policy "Students can request rides"
  on public.rides for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'student'
    )
  );

create policy "Drivers can update their assigned rides"
  on public.rides for update
  using (
    exists (
      select 1 from public.drivers
      where id = auth.uid() and id = rides.driver_id
    )
  );

create policy "Students can cancel their own pending rides"
  on public.rides for update
  using (auth.uid() = student_id and status = 'pending');

create policy "Admin can update any ride"
  on public.rides for update using (public.is_admin());

-- ── notifications ─────────────────────────────────────────────
create policy "Users can view their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can mark their notifications read"
  on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on public.notifications for insert with check (true);

-- ─────────────────────────────────────────────────────────────
-- 5. Realtime publication
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.drivers;
alter publication supabase_realtime add table public.posts;

-- =============================================================
-- End of migration 001
-- =============================================================
