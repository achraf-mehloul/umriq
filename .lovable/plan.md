# Umriq — Audit & Target Architecture (Prompt 01, no implementation)

## 1. Current-state map

**Stack:** TanStack Start v1 (React 19, Vite 7), Tailwind v4 + shadcn, TanStack Query, Supabase (Auth/Postgres/Realtime/Storage), vite-plugin-pwa + idb-keyval, framer-motion. 13 migrations applied.

**Routes (32).** Public: `/`, `/login`, `/register`, `/onboarding`, `/terms`, `/privacy`. Authenticated (`_authenticated` gate): dashboard, market, offer/$id, publish, requests, messages, notifications, profile, agency/$id, payments, disputes (+/$id), saved-searches, export. Admin (`admin.tsx` gate via `is_admin` RPC, noindex, forced LTR): index, kyc, offers, reports, suspensions, disputes, login. Server route: `api/public/send-emails` (cron-secret + Resend, drains `email_outbox`).

**Data layer.** `src/lib/api.ts` (agency, offers, bookings, conversations/messages, notifications, reviews, dashboard stats), `src/lib/admin-api.ts` (KYC, reports, suspensions, admin stats, all-offers), `src/lib/api/*.ts` (disputes, payments, platform-payments, payment-proofs, subscription, saved-searches, trust, push). All go through the browser client; RLS is the sole authorization boundary.

**Tables (23).** profiles, agencies, agency_private, user_roles, offers, bookings, conversations, messages, notifications, reviews, reports, suspensions, disputes, dispute_messages, payment_accounts, platform_payment_accounts, payment_proofs, subscriptions, saved_searches, push_subscriptions, rate_events, email_outbox.

**Functions/triggers.** `has_role`/`is_admin`/`admin_stats`, `agency_access_active`, `handle_new_user`, `handle_booking_status_change` (notifications + seat decrement on confirm), `handle_payment_proof_review`, `notify_seller_payment_proof`, `mask_message_body`, `enforce_rate_limit` + offer/message limiters, `refresh_agency_rating`, `start_agency_trial`, `queue_email` + email triggers, `set_updated_at`.

**Buckets.** agency-logos (public), offer-images (public), agency-docs (private), payment-receipts (private).

**Roles.** enum `app_role`: admin, agency_owner, agency_staff, rabateur, moderator, agency — in `user_roles` only.

## 2. Core structural finding

`offers` is a flight-seat table with domain columns hard-coded (airline, city_from/to, departure/return date, seats, hotel_name, hotel_stars, package_type bolted on later). `bookings` is single-line: one offer, one seat count, one price. Hotels, visas and multi-component packages cannot be expressed. The fix is a **generic listing + inventory + order-item layer** that flight seats migrate into, not a second parallel marketplace.

## 3. Target domain model

```text
auth.users ─1:1─ profiles ─N:1─ agencies ─1:1─ agency_private
                                   │
                    agencies carry capability flags (is_supplier / is_buyer)
                                   │
        suppliers are agencies; no separate identity table
                                   │
   listings (generic, product_type: flight_seat|hotel_room|visa|package)
     ├─ listing_flight_details        (1:1, existing offer columns)
     ├─ listing_hotel_details         (1:1, hotel/city/board/room type/nights)
     ├─ listing_visa_details          (1:1, visa type/entry/processing days)
     ├─ listing_package_details       (1:1, nights/itinerary/inclusions)
     ├─ listing_package_components    (package → child listings, N:M)
     └─ inventory_units               (date/variant-scoped quantity + hold ledger)

   requests (RFQ: buyer posts a need) ─1:N─ quotes (supplier responds)
                                            └─ accepted quote → order

   orders (buyer_agency, supplier_agency, totals, status)
     └─ order_items (listing_id, snapshot fields, qty, unit_price, line_total)
          └─ inventory_holds (soft reservation with expiry)
   orders ─1:N─ payment_proofs, ─1:1─ commissions, ─1:N─ disputes
   commissions ─N:1─ settlements (periodic payout run per agency)
```

Relationship rules:
- **users→agencies**: a profile belongs to at most one agency; `agencies.owner_id` is the owner. Staff via `user_roles` (`agency_staff`) + profile.agency_id.
- **supplier/provider**: not a new identity. An agency gains `is_supplier` capability; KYC/verification already gates trust.
- **product vs listing**: no separate catalogue in this phase. A listing *is* the sellable unit, typed by `product_type`, with a typed detail row.
- **inventory**: quantity lives in `inventory_units`, never on the listing. `listings.remaining` becomes a derived read.
- **request→order**: requests/quotes are optional; direct buy from a listing creates an order straight away.
- **order vs booking**: `bookings` becomes a compatibility view/alias over single-item flight orders.

## 4. Entities — preserve / extend / new

**Preserve untouched:** profiles, agency_private, user_roles, conversations, messages, notifications, reviews, reports, suspensions, disputes, dispute_messages, payment_accounts, platform_payment_accounts, subscriptions, saved_searches, push_subscriptions, rate_events, email_outbox, all masking/rate-limit/email triggers, all storage buckets.

**Extend:**
- `agencies` — add `is_supplier`, `is_buyer`, `supplier_types[]`.
- `offers` — keep the table and all rows; add `listing_id` backlink. Frontfill a `listings` row per offer via migration; flight UI keeps reading `offers` until Prompt 04 flips it.
- `bookings` — add `order_id` backlink; new writes create an order + one item and mirror into bookings until the UI migrates.
- `payment_proofs` — add nullable `order_id` alongside `booking_id`.
- `disputes` — add nullable `order_id`.
- `saved_searches` — add `product_type`.
- `app_role` — no change needed.

**New:** listings, listing_flight_details, listing_hotel_details, listing_visa_details, listing_package_details, listing_package_components, inventory_units, inventory_holds, requests, quotes, orders, order_items, commissions, settlements, commission_rules.

## 5. RLS/security model

Same pattern as today: fail-closed, explicit GRANTs, `has_role` security-definer for admin.

- `listings`: public/anon SELECT only where `status='active'` and supplier not banned; INSERT/UPDATE/DELETE only by the owning agency's members; admin full via `has_role`.
- typed detail tables: mirror parent listing visibility through an `EXISTS` on listings.
- `inventory_units`: SELECT with the listing; **no client writes** — mutated only by security-definer RPCs.
- `inventory_holds`, `orders`, `order_items`: visible to buyer agency, supplier agency, admin. Status transitions via RPC, not direct UPDATE.
- `requests`: visible to the author and to verified suppliers matching the product type. `quotes`: author of the quote, request owner, admin.
- `commissions`, `settlements`: **admin-only write**; agency reads its own rows. `commission_rules`: admin write, authenticated read.
- New sensitive supplier contact fields follow the `agency_private` split — never on a publicly readable table.
- Receipts stay in the private bucket with signed URLs. No service-role key reaches the client.

## 6. Inventory consistency model

Overselling is the main new risk (today a trigger blindly decrements `remaining_seats`).

- Single writer: `reserve_inventory(unit_id, qty, order_id)` — SECURITY DEFINER, `SELECT ... FOR UPDATE` on the unit, rejects when `qty > available`, inserts an `inventory_holds` row with `expires_at`.
- `available = quantity_total - quantity_sold - active_holds`, computed inside the lock.
- Confirm converts a hold to sold; cancel/expiry releases it. A scheduled sweep expires stale holds.
- CHECK-free validation (time-dependent) via triggers, per project convention.
- The existing flight seat decrement trigger is retired only when flight listings move onto `inventory_units`, in the same migration, to avoid double-decrement.

## 7. Migration strategy & risks

Additive-only, four migrations, no destructive statements:
1. New tables + GRANTs + RLS + RPCs (nothing reads them yet).
2. Backfill: one `listings` + `listing_flight_details` + `inventory_units` row per existing offer; set `offers.listing_id`. Idempotent, re-runnable.
3. Orders backfill: one `orders` + `order_items` row per existing booking; set `bookings.order_id`.
4. Cutover: dual-write triggers keep `offers.remaining_seats` and `bookings.status` in sync while legacy UI still reads them; the legacy seat-decrement trigger is replaced by the inventory path.

Risks: (a) double seat decrement during cutover — mitigated by replacing the trigger in the same migration; (b) RLS recursion on listings↔orders — use security-definer helpers, never cross-table policy subqueries that re-enter a policied table; (c) regenerated `types.ts` widening breaking existing hooks — typecheck after each migration; (d) admin_stats drifting once orders exist — extend it in Prompt 06, not before; (e) realtime channels currently bound to `offers` — keep them until the UI flips.

## 8. Implementation order — Prompts 02–07

- **02 — Domain foundation (DB only).** listings + typed details + inventory_units/holds + reserve/release RPCs + RLS + GRANTs. Backfill flights. No UI change; app keeps working on `offers`.
- **03 — Orders & order items.** orders, order_items, commissions scaffold, status-transition RPCs, bookings↔orders backfill and dual-write. No UI change.
- **04 — Supplier & listing UI.** Extend the publish wizard to typed listings (flight/hotel/visa/package), market filters by product type, listing detail pages. Flight UI reads listings.
- **05 — Requests, quotes, negotiation.** RFQ posting, supplier quotes, accept → order, reuse existing chat and notifications.
- **06 — Payments, commissions, settlements, ops admin.** commission_rules, settlement runs, order-level payment proofs, extended admin console and stats.
- **07 — Polish & hardening.** i18n for all new copy, RTL/dark/font-scale audit, offline cache for listings, saved-search alerts per product type, final security scan and E2E pass.

## 9. Do NOT build yet

Real card/gateway payment processing or escrow custody; a separate product/SKU catalogue; multi-currency FX; supplier contracts/SLAs; dynamic or AI pricing; channel-manager or GDS/PMS integrations; a separate supplier identity table or second auth surface; ratings for individual listings; a public SEO marketplace outside auth; native mobile shells; any visual redesign.

## 10. Changes made in this prompt

None. Read-only audit; build remains green.
