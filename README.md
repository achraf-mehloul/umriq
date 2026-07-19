# Umriq — سوق مقاعد العمرة

**Umriq** is a premium bilingual (AR/EN) B2B marketplace PWA for Umrah travel agencies and Rabateurs in Algeria to publish, negotiate, and reserve Umrah flight seats. Built to feel like a native iOS app while running fully in the browser and offline.

Live: https://umriq-seats-nexus.lovable.app

---

## ✨ Highlights

- **Native-app feel** — glassmorphism, physical spring motion, page transitions, cinematic splash.
- **True PWA** — installable, offline-capable, IndexedDB cache for offers & chats, service-worker asset caching.
- **Bilingual RTL/LTR** — full Arabic + English with Tajawal/Inter typography.
- **Light & dark mode** — user-persisted with instant swap.
- **Accessibility** — 4-step font-scaling for elderly users (`sm` / `md` / `lg` / `xl`).
- **Haptic + audio** — subtle vibration and success chime on booking/publish.
- **Row-Level Security** — every table protected by Postgres RLS. Roles stored in a separate `user_roles` table (privilege-escalation safe).

---

## 🧩 Platform Features (agency side)

### Authentication & Onboarding
- Email + password sign-up / sign-in
- Google OAuth (via Lovable auth broker)
- Phone OTP scaffolding (requires Twilio for production)
- Auto-created `profiles` row per user (trigger: `handle_new_user`)
- Guided agency creation form (logo upload, name AR/EN, city AR/EN, phone, license #)
- KYC document upload (commercial register + Umrah license → private `agency-docs` bucket)

### Marketplace
- Real-time offer feed with realtime invalidation
- Filters: urgent, verified-only, price range, city, free-text search
- Sort: newest, price asc/desc, departure date
- Rich offer cards with airline, route, seats, price, discount, hotel, images, urgency flame
- Offer detail with image hero, route diagram, per-seat pricing, notes
- Reviews section (agency reputation)

### Publish flow
- 3-step guided wizard (details → price/seats → review) with progress bar
- **Autosave** — draft persists across refreshes (localStorage)
- Multi-image upload (up to 5, Supabase Storage `offer-images` public bucket)
- Urgent toggle → auto-expires offer in 24h
- Success haptic + chime on publish

### Booking & Trust
- Standard reservation flow (seats picker, notes, chat)
- **Quick-book — one-tap** reservation, gated to verified sellers only
- Animated emerald **VerifiedBadge** with pulse ring next to every verified agency
- Booking state machine: `pending → confirmed → paid → completed | cancelled`
- Automatic notification insertion on booking status change (DB trigger)
- Automatic remaining-seats decrement on confirmation
- Post-completion review & rating (1–5 stars, auto-refreshes agency rating)

### Messaging
- 1:1 conversations between agencies (Supabase Realtime)
- Auto-masking of phone numbers, emails, and off-platform contact strings
- Deep-linking from offer detail → new/existing conversation

### Dashboard & Analytics
- Editorial greeting + agency identity
- KPI cards (published seats, sold, urgent, active requests)
- **MarketChart** — OHLC candlestick chart aggregating real offer prices
- Urgent offers spotlight rail

### PWA & Offline
- `manifest.webmanifest` with Umriq branding & icons
- Service worker (Workbox via `vite-plugin-pwa`):
  - Pages: NetworkFirst (4s timeout)
  - JS/CSS/fonts: CacheFirst
  - Images (local + Supabase Storage): CacheFirst
- IndexedDB persistence (`idb-keyval`) for last-viewed offers & conversations
- Custom `InstallPrompt` (iOS-aware)
- SW guard: only registers on published origin, never in preview

---

## 🛡 Admin Console (`/admin`)

Fully separate route with its own login (`/admin/login`) — different visual identity (dark cockpit UI), gated by `has_role(user, 'admin')` RPC. Not linked from public nav; admin-verified users see an entry in Profile → Settings.

### Screens
- **Overview** (`/admin`) — live counters: agencies, pending KYC, active offers, bookings, open reports
- **KYC Queue** (`/admin/kyc`) — pending / approved / rejected tabs, full agency details modal with document links, one-click **Approve & verify** or **Reject with reason**
- **Offers** (`/admin/offers`) — table of all offers, pause/activate/expire actions
- **Reports** (`/admin/reports`) — user-submitted reports on offers/agencies/messages/users, status flow (open → reviewing → resolved/dismissed)
- **Suspensions** (`/admin/suspensions`) — suspend a user by UUID + reason, lift active suspensions

### Security
- Separate auth gate — checks `is_admin()` RPC before rendering; non-admins get a locked screen with sign-out.
- Every admin action is protected by RLS policies on the DB (not just client checks).
- `robots: noindex` on all admin routes.
- Admin route flagged as `ltr` regardless of user locale for consistent operations UX.

---

## 🗄 Database

Schema created via Supabase migrations, all in the `public` schema with RLS + explicit GRANTs.

| Table | Purpose |
|---|---|
| `profiles` | Auto-created per auth user; links to agency |
| `agencies` | Agency identity + KYC status (`kyc_status`, `kyc_reviewed_at`, `kyc_rejection_reason`) |
| `offers` | Flight seat listings |
| `bookings` | Reservation state machine |
| `conversations` + `messages` | 1:1 chat with masked content |
| `reviews` | Post-booking ratings (auto-updates agency rating via trigger) |
| `notifications` | Per-user notification feed |
| `user_roles` | Roles enum (`admin`, `moderator`, `agency`) — **never** stored on profiles |
| `reports` | User-submitted moderation flags |
| `suspensions` | Admin-imposed account holds |

### Key DB functions
- `has_role(user, role)` — SECURITY DEFINER, used by every RLS policy that gates by role (avoids infinite recursion).
- `is_admin(user)` — convenience wrapper.
- `handle_new_user()` — post-signup profile bootstrap.
- `refresh_agency_rating()` — trigger on review insert.
- `handle_booking_status_change()` — sends notifications & decrements remaining seats.
- `bump_conversation_last_message()` — keeps conversation timestamps fresh.

---

## 🧱 Architecture

- **Framework:** TanStack Start v1 (React 19, Vite 7)
- **Routing:** File-based (`src/routes/**`) with `_authenticated` layout gate
- **State/data:** TanStack Query + Supabase browser client (RLS-enforced)
- **Realtime:** Supabase Realtime channels for offers + messages
- **UI:** Tailwind v4 + shadcn/ui, framer-motion for animation
- **Storage:** Supabase Storage (`agency-logos`, `offer-images` public; `agency-docs` private)
- **PWA:** vite-plugin-pwa (Workbox)
- **Offline:** idb-keyval (IndexedDB)

### Key modules
| Path | Role |
|---|---|
| `src/lib/api.ts` | Agency-side data layer (all TanStack Query hooks) |
| `src/lib/admin-api.ts` | Admin data layer + `useIsAdmin` |
| `src/lib/offline.ts` | IndexedDB hydrate/persist helpers |
| `src/lib/haptics.ts` | Vibration + WebAudio success/tap cues |
| `src/lib/autosave.ts` | Debounced localStorage form drafts |
| `src/lib/font-scale.tsx` | Accessibility font-scaling provider |
| `src/lib/theme.tsx` | Light/dark mode provider |
| `src/lib/i18n/` | AR/EN dictionary + provider |
| `src/components/VerifiedBadge.tsx` | Animated trust badge |
| `src/components/QuickBookButton.tsx` | One-tap reserve for verified sellers |
| `src/components/MarketChart.tsx` | OHLC candlestick chart |
| `src/components/layout/AppShell.tsx` | Page shell + transition |

---

## 🚀 Roadmap (not yet implemented)

- **Push notifications** — DB schema ready; requires VAPID keys + service-worker `push` handler
- **Interactive map** for routes (Makkah / Madinah waypoints)
- **Payments** — Stripe / CIB / Edahabia + platform commission
- **Public SEO landing page** with hero, testimonials, pricing
- **Terms of Service & Privacy Policy** pages
- **Advanced agency analytics** (funnel, conversion, price competitiveness)

---

## 🧑‍💻 Local development

```bash
bun install
bun run dev
```

Environment variables required (auto-injected via Lovable Cloud):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

To grant admin: add a row in `user_roles` with `role='admin'` for the target `user_id`.

---

© Umriq — Built with Lovable Cloud.
