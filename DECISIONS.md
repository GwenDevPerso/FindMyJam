# DECISIONS

Why FindMyJam is built the way it is. The detailed rules are in `SPEC.md`; this file explains the choices
and what they cost. Update it whenever a design choice changes.

Written from the former design docs (architecture, database, product context) and the git history.

## 1. System design

Client, one way:

```
src/app (Expo Router routes)
   ↓
features/*/components ──→ features/*/hooks (TanStack Query) ──→ services/*.service.ts ──→ repositories/*.repository.ts
                                  ↑                              (Zod, rules, Row → domain,    (plain Supabase calls)
                          use-*-realtime.ts                       AppError)                           ↓
                          (invalidate only)  ←──────────── Supabase Realtime ←───────────── Supabase (Postgres + RLS)
```

Notifications:

```
Postgres trigger / pg_cron
   ↓ public.invoke_notification_edge_function(name, body)      pg_net, secrets from Vault
Edge Function send-*-notification                              refuses any JWT without role = service_role
   ↓ _shared/notification-service.ts
INSERT notifications  +  Expo Push API (tokens from devices)
   ↓ Realtime
use-notifications-realtime → invalidate → UI;  resolve-notification-href → route
```

- The database holds every rule that must never break (constraints, triggers, RLS); the UI only hides what a user
  may not do.
- Each layer only talks to the next; a component never touches Supabase.
- Server state is in TanStack Query only; realtime events invalidate queries, payloads are never stored.
- Lists are keyset-paginated; nothing uses `OFFSET`.

## 2. Choices and trade-offs

| Choice | Why | Trade-off accepted |
| --- | --- | --- |
| Dates of a series are real `jams` rows | Joining, search, notifications and chat work per date like a one-off jam | Rows to generate and keep in sync with the template |
| 60-day rolling window topped up by a daily cron | Bounded number of rows; an open-ended series costs nothing | A date further than 60 days does not exist yet |
| Generation only after `generated_until` | A date deleted by the creator is never recreated | Shortening then extending an end date can bring back dates deleted in between |
| The client never computes dates | One source of truth (`private.next_occurrence_dates`), DST-safe local time | The client recurrence summary mirrors the SQL rule by hand |
| Series day and frequency cannot change | Avoids moving dates people already joined | The creator must delete and recreate a series |
| Keyset cursor pagination | Stable and fast pages while data changes | No "jump to page n" |
| Hand-written `src/lib/supabase/types.ts` | Precise domain-friendly types | Must be updated with every migration |
| RLS as the security boundary | Rules hold whatever client calls the API | Policies to write and review for every table |
| Edge Functions only for secrets or external calls, service-role JWT | No server code for plain CRUD; functions cannot be called by users | Two deploys (migration + functions) in a set order |
| One chat room per series | Members of different dates talk together | Past dates of a deleted series start a new, empty room |
| Waitlist and promotion in DB triggers | Promotion happens whatever client or action freed the seat | Logic lives in SQL, tested only end to end |
| Chat pushes write no `notifications` row | The inbox does not fill with messages | A missed chat push cannot be found in the inbox |
| One squashed baseline, then additive migrations | Rebuilds an empty project in one file | Applied migrations are never edited |
| Zustand only for session and map filters | No duplicated server state | — |
| NativeWind with semantic CSS tokens | Light/dark from one palette | `constants/theme.ts` mirrors it for native props |
| `search_jams p_next_occurrence_only` for the map | One marker per series instead of one per date | The list and the map show different counts for a series |
| Calendar month grid built in-house | A few dozen lines; no dependency | No week view or swipe gestures |

## 3. Stack

| Component | Choice | Why | Alternatives considered |
| --- | --- | --- | --- |
| React Native / Expo / TypeScript | Expo SDK 57, RN 0.86, dev build | iOS, Android and web from one codebase; native modules (maps, notifications) | — |
| Routing | Expo Router, typed routes | File-based routes, deep links from push notifications | — |
| Styling | NativeWind v4 (Tailwind 3) | Tokens and dark mode with class names | — |
| Server state | TanStack Query | Cache, retries, invalidation, infinite lists | — |
| Client state | Zustand | Minimal stores (session, map filters) | — |
| Forms | React Hook Form + Zod | Same schemas in forms and services | — |
| Backend | Supabase: Postgres (PostGIS, pg_trgm, citext), Auth, Storage, Realtime, Edge Functions (Deno), pg_cron, pg_net, Vault | One managed backend with RLS; geo search in SQL | — |
| Maps | `react-native-maps` (Google Maps key) | Native maps on both platforms | — |
| Geocoding | OpenStreetMap Nominatim | Free, no key | — |
| Unit and component tests | Jest (`jest-expo`) + React Native Testing Library | Expo's supported preset | Vitest, removed in `60747b9` to run everything with Jest |
| End-to-end tests | Maestro | YAML flows on a simulator with the dev build | — |

## 4. What I would do with more time

- Generate `src/lib/supabase/types.ts` from the database instead of writing it by hand.
- Test the Edge Functions and the waitlist triggers directly (today only through Maestro flows).
- Replace the `YYYY-MM-DD` text fields with a native date picker.
- Show "until <date>" in the recurrence summary of a series.
- Refresh the calendar of a user promoted from a waitlist right away.
- Translate the UI.
- Fix the known bugs kept as `it.todo` / `it.skip`: the "Max participants" field snaps back to 2 when cleared, and
  a non-date typed in the jam form passes validation.
- Make the ChatScreen test that failed once under load deterministic.
- Rename existing tests after the `ACn` / `Rn` of `SPEC.md`.
