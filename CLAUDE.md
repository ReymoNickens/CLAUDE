# CampusConnect UCC — Project Bible

> Progressive Web App for the University of Cape Coast community, Ghana.
> All decisions, conventions, and architecture live here. Keep this file updated as the project evolves.

---

## Project Overview

**Name:** CampusConnect UCC
**Type:** Progressive Web App (PWA) — mobile-first, installable via browser, no app store needed
**Target users:** UCC students, drivers, local businesses, landlords, and UCC admin
**Primary device:** Android phones on slow/patchy mobile data
**Currency:** Ghana Cedis (GH₵) throughout
**Phone format:** Ghana numbers (+233) throughout

---

## The Four Modules

### 1. Campus Newsfeed
- Anyone with a UCC account can post: title, body, optional photo, category tag
- Categories: `Academic` | `Events` | `Lost & Found` | `General` | `Urgent`
- Verified accounts (SRC, departments, admin) display a blue badge — granted by admin
- Students can like and comment
- Posts sorted newest-first
- Anyone can view; must be logged in to post

### 2. Accommodation Listings
- Landlords/agents post listings with: title, description, price (GH₵/month),
  neighbourhood, up to 5 photos, amenities checklist, WhatsApp contact number
- Amenities: `water` | `electricity` | `wifi` | `security` | `self-contained`
- Students filter by price range and neighbourhood
- WhatsApp CTA opens `wa.me/+233XXXXXXXXX` directly
- Listing status: `Available` | `Taken`

### 3. Local Services Directory
- Business categories: chop bars, printing, salons, tailors, phone repair,
  pharmacies, tutors, laundry
- Each profile: name, category, description, location, phone, WhatsApp,
  opening hours, photos
- Students leave star ratings (1–5) and text reviews
- Browse by category; search by name

### 4. Transport (Uber-style)
This is the most critical module. See full spec below.

**Student (passenger) flow:**
1. Open transport tab → map of UCC and surroundings loads
2. Set pickup (GPS or tap map) → set destination
3. Choose vehicle type: `Car` or `Pragya` (tricycle)
4. See fare estimate based on distance × rate per km
5. Tap "Request Ride" → system matches nearest available online driver
6. See driver name, photo, vehicle, rating, ETA on live map
7. Free cancellation within 2 minutes of booking

**Driver flow:**
1. Log in → toggle Online/Offline
2. Receive ride request notification (pickup, destination, fare) — 30-second window
3. Accept → see navigation to pickup on map
4. Complete ride → mark complete
5. Dashboard: earnings, trips, rating

**Fare & commission:**
- `fare = distance_km × rate_per_km` (rates set per vehicle type in admin)
- Platform commission: 10% per completed ride — tracked informational only (cash payment now; MoMo in v2)
- Driver earnings = 90% of fare, tracked in `driver_earnings` table
- `payment_method` column present from day one for MoMo migration

**Admin panel covers:**
- Approve/suspend drivers
- View all rides (completed / cancelled / in-progress)
- Set fare rates per km for cars and pragyas separately
- View platform commission totals
- Manage all user types
- View and remove flagged newsfeed content

---

## User Types & Roles

| Role | Key permissions |
|------|----------------|
| `student` | Post newsfeed, browse accommodation & services, book rides, leave reviews |
| `driver` | Go online, accept/decline rides, view earnings dashboard |
| `business_owner` | Manage their services listing |
| `landlord` | Manage accommodation listings |
| `admin` | Full access to all content + admin dashboard |

A user has exactly one role set at registration time.
Drivers additionally have a separate `drivers` profile row; admin must approve before they go online.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend framework | **Next.js 14** (App Router) | SSR, PWA-friendly, Vercel-native |
| Styling | **Tailwind CSS** | Fast mobile-first UI |
| Component library | **shadcn/ui** | Accessible, Tailwind-based, unstyled base |
| State management | **Zustand** | Lightweight, no boilerplate |
| Database + Auth | **Supabase** | Postgres + Auth + Realtime + Storage in one |
| Maps | **Google Maps JS API** | Best Ghana coverage; load lazily on transport tab only |
| Push notifications | **Firebase Cloud Messaging (FCM)** | Free; works as PWA push |
| SMS / OTP | **Arkesel** | Ghana-based, +233 format, ~$0.025/SMS |
| PWA plumbing | **next-pwa** (Workbox) | Service worker + manifest generation |
| Image handling | **browser-image-compression** | Client-side resize to <200 KB before upload |
| Hosting | **Vercel** (free tier) | Native Next.js support, CI/CD on push |

---

## Repository & Folder Structure

```
campusconnect/
├── public/
│   ├── icons/                  # PWA icons (192x192, 512x512, maskable)
│   ├── manifest.json           # Web app manifest
│   └── screenshots/            # PWA store screenshots
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/             # Protected — requires auth
│   │   │   ├── layout.tsx      # Bottom nav, auth guard
│   │   │   ├── newsfeed/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── accommodation/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── transport/
│   │   │       ├── page.tsx        # Student ride booking
│   │   │       └── driver/page.tsx # Driver dashboard
│   │   ├── admin/
│   │   │   ├── layout.tsx      # Admin auth guard
│   │   │   ├── page.tsx        # Dashboard overview
│   │   │   ├── drivers/page.tsx
│   │   │   ├── rides/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── content/page.tsx
│   │   │   └── settings/page.tsx   # Fare rates
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── rides/
│   │   │   │   ├── request/route.ts
│   │   │   │   ├── match/route.ts
│   │   │   │   └── complete/route.ts
│   │   │   └── notifications/route.ts
│   │   ├── layout.tsx          # Root layout, FCM init
│   │   └── page.tsx            # Public landing / redirect
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── layout/             # BottomNav, TopBar, etc.
│   │   ├── newsfeed/
│   │   ├── accommodation/
│   │   ├── services/
│   │   └── transport/
│   │       ├── RideMap.tsx
│   │       ├── DriverCard.tsx
│   │       ├── FareEstimate.tsx
│   │       └── RideStatusBar.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server-side client
│   │   │   └── middleware.ts
│   │   ├── maps/
│   │   │   ├── distance.ts     # Haversine distance util
│   │   │   └── geocode.ts
│   │   ├── fcm/
│   │   │   └── push.ts
│   │   ├── arkesel/
│   │   │   └── sms.ts
│   │   └── utils/
│   │       ├── currency.ts     # GH₵ formatting
│   │       ├── phone.ts        # +233 formatting/validation
│   │       └── fare.ts         # Fare calculation logic
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRide.ts          # Ride state + Supabase Realtime
│   │   ├── useDriverLocation.ts
│   │   └── useGeolocation.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── rideStore.ts
│   │   └── notificationStore.ts
│   │
│   └── types/
│       ├── database.ts         # Generated Supabase types
│       └── index.ts            # App-level types
│
├── supabase/
│   ├── migrations/             # Versioned SQL migrations
│   └── seed.sql                # Dev seed data
│
├── CLAUDE.md                   # This file
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Enums
create type user_role as enum ('student', 'driver', 'business_owner', 'landlord', 'admin');
create type post_category as enum ('Academic', 'Events', 'Lost & Found', 'General', 'Urgent');
create type listing_status as enum ('Available', 'Taken');
create type vehicle_type as enum ('Car', 'Pragya');
create type ride_status as enum ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
create type driver_status as enum ('pending', 'approved', 'suspended');

-- Core users (extends Supabase auth.users)
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text unique,           -- +233XXXXXXXXX
  avatar_url   text,
  role         user_role not null default 'student',
  is_verified  boolean default false, -- blue badge for newsfeed
  fcm_token    text,                  -- for push notifications
  created_at   timestamptz default now()
);

-- Drivers (additional profile for role=driver)
create table drivers (
  id              uuid primary key references profiles(id) on delete cascade,
  vehicle_type    vehicle_type not null,
  vehicle_photo   text,
  plate_number    text,
  status          driver_status default 'pending',
  is_online       boolean default false,
  current_lat     double precision,
  current_lng     double precision,
  location_updated_at timestamptz,
  rating          numeric(3,2) default 5.0,
  total_trips     int default 0,
  total_earnings  numeric(12,2) default 0
);

-- Newsfeed posts
create table posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  title        text not null,
  body         text not null,
  photo_url    text,
  category     post_category not null default 'General',
  likes_count  int default 0,
  is_flagged   boolean default false,
  created_at   timestamptz default now()
);

create table post_likes (
  post_id   uuid references posts(id) on delete cascade,
  user_id   uuid references profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

-- Accommodation listings
create table accommodations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references profiles(id) on delete cascade,
  title          text not null,
  description    text,
  price_per_month numeric(10,2) not null,
  neighbourhood  text not null,
  photos         text[],          -- array of storage URLs, max 5
  has_water      boolean default false,
  has_electricity boolean default false,
  has_wifi       boolean default false,
  has_security   boolean default false,
  is_self_contained boolean default false,
  whatsapp_number text not null,
  status         listing_status default 'Available',
  created_at     timestamptz default now()
);

-- Services directory
create table services (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references profiles(id) on delete cascade,
  name           text not null,
  category       text not null,
  description    text,
  location       text,
  phone          text,
  whatsapp       text,
  opening_hours  text,
  photos         text[],
  avg_rating     numeric(3,2) default 0,
  review_count   int default 0,
  created_at     timestamptz default now()
);

create table service_reviews (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid references services(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz default now(),
  unique(service_id, user_id)
);

-- Transport: fare rates (editable by admin)
create table fare_rates (
  id           uuid primary key default gen_random_uuid(),
  vehicle_type vehicle_type not null unique,
  price_per_km numeric(8,2) not null,
  base_fare    numeric(8,2) not null default 2.00,
  updated_at   timestamptz default now()
);

-- Transport: rides
create table rides (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid references profiles(id),
  driver_id        uuid references drivers(id),
  vehicle_type     vehicle_type not null,
  pickup_lat       double precision not null,
  pickup_lng       double precision not null,
  pickup_address   text,
  dest_lat         double precision not null,
  dest_lng         double precision not null,
  dest_address     text,
  distance_km      numeric(8,3),
  fare_amount      numeric(10,2),
  commission_amount numeric(10,2),    -- 10% of fare
  driver_earnings  numeric(10,2),     -- 90% of fare
  payment_method   text default 'cash', -- ready for 'momo' in v2
  status           ride_status default 'pending',
  requested_at     timestamptz default now(),
  accepted_at      timestamptz,
  completed_at     timestamptz,
  cancelled_at     timestamptz,
  cancel_reason    text
);

-- Notifications
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  type       text not null,   -- 'ride_request' | 'ride_accepted' | 'ride_completed' | 'post_like' etc.
  data       jsonb,
  is_read    boolean default false,
  created_at timestamptz default now()
);
```

---

## Third-Party Services & Free Tiers

| Service | Purpose | Free tier | Notes |
|---------|---------|-----------|-------|
| **Supabase** | DB, Auth, Realtime, Storage | 500 MB DB, 1 GB storage, 50K MAU | Upgrade at scale |
| **Vercel** | Hosting + CI/CD | Unlimited personal projects | Upgrade for team |
| **Google Maps JS API** | Maps, geocoding, directions | $200/month credit (~28K map loads) | Load lazily — transport tab only |
| **Firebase (FCM)** | Push notifications | Free forever | No cost for notifications |
| **Arkesel** | Ghana SMS + OTP (+233) | Paid — ~$0.025/SMS | No meaningful free tier; budget ~$5 for dev |
| **Google OAuth** | Social sign-in | Free | |
| **next-pwa / Workbox** | Service worker, offline | Open source / free | |
| **browser-image-compression** | Client-side image resize | Open source / free | |

**Total estimated monthly cost at launch (low traffic):** ~$5–10 (mostly Arkesel SMS)

---

## Coding Conventions

### General
- TypeScript strict mode throughout. No `any`.
- All environment variables prefixed `NEXT_PUBLIC_` only if safe to expose to browser.
- All secrets in `.env.local` (never committed). See `.env.local.example`.

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Database helpers: mirror table name, e.g. `getPostById`, `createRide`
- React hooks: `useCamelCase`

### Currency & phone
- Always store amounts as `numeric` in the DB (not floats)
- Display with `formatCurrency(amount)` from `src/lib/utils/currency.ts`
- Always store phone as `+233XXXXXXXXX` format; use `formatPhone()` for display

### Supabase
- Use the server client (`src/lib/supabase/server.ts`) in Server Components and API routes
- Use the browser client (`src/lib/supabase/client.ts`) in Client Components only
- All realtime subscriptions live inside custom hooks, cleaned up on unmount
- Row-Level Security (RLS) enabled on all tables from day one

### Maps
- Import Google Maps only inside `transport/` components — never globally
- Use Haversine formula in `src/lib/maps/distance.ts` for fare estimation (no API call needed for distance)
- Call Directions API only when driver needs turn-by-turn navigation

### PWA / Offline
- Cache strategy: `StaleWhileRevalidate` for list pages, `CacheFirst` for static assets
- Transport tab: network-only (real-time data, no stale cache)
- Always show offline indicator banner when `navigator.onLine === false`

### Images
- Compress client-side to ≤200 KB before upload to Supabase Storage
- Store only the storage path in the DB; generate signed URLs at render time
- Profile photos: 1:1 ratio; listing photos: 4:3 ratio

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Firebase (FCM)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=   # for web push

# Arkesel (SMS/OTP)
ARKESEL_API_KEY=                  # server-only

# App
NEXT_PUBLIC_APP_URL=https://campusconnect.vercel.app
```

---

## PWA Configuration

`manifest.json` key fields:
```json
{
  "name": "CampusConnect UCC",
  "short_name": "CampusConnect",
  "theme_color": "#003087",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/"
}
```

UCC brand colour: `#003087` (dark blue). Accent: `#FFD700` (gold).

---

## Key Business Rules (encode in code, not just docs)

1. A driver cannot go online until their `drivers.status = 'approved'`
2. A ride cannot be matched to an offline driver (`drivers.is_online = false`)
3. Commission is always exactly 10% of `fare_amount`, stored at time of completion
4. A user can only leave one review per service (`unique` constraint)
5. Post likes are idempotent — like/unlike toggle, never double-count
6. Accommodation photos array must have length ≤ 5 (enforce client + DB check)
7. Verified badge (`is_verified`) can only be set by admin role via admin panel

---

## Sprint Plan

See below section.
