# SPEC — FindMyJam

> Source of truth for what to build. A behaviour change lands here **first**, in its own commit, then in the code.
> Every acceptance criterion `ACn` (§5) and every rule `Rn` (§3) has at least one test named after it.
>
> This first version was written from the former design docs, the README and the code: it **documents the shipped
> behaviour**. Existing tests do not yet carry `ACn` / `Rn` in
> their names. Anything the sources do not settle is left as a `TODO`.

## 1. Scope

### Goal

Musicians have no simple way to find jam sessions near them or to gather other musicians for one. FindMyJam is a
mobile app (iOS, Android, web) and a small musical social network: discover jams around you, create and join them,
and meet musicians. Done means a musician can sign up, find or create a jam, join it, and be kept informed of it.

### In scope

- Account: sign up, sign in, persistent session.
- Profile: avatar, username, bio, instruments, music styles, skill level, location; lists of created and joined jams.
- Jams: create, edit and delete (title, description, date and time, location on a map, styles, instruments sought,
  skill level, maximum participants); recurring jams (weekly, every 2 weeks, monthly) with an optional end date.
- Participation: join and leave a jam; waitlist on full jams with automatic promotion.
- Map: jams on a map, filtered by distance, style, instrument and date; distance-sorted list.
- Friends: search users, send, accept and remove friend requests; view another user's profile.
- Chat: one room per jam, or per series for recurring jams, for its creator and participants.
- Notifications: in-app in real time and push (friend request, new jam nearby, jam updated, cancelled or starting
  soon, chat message, waitlist promotion).
- Calendar: month view of the jams the user created and joined.

### Out of scope

Excluded by the current docs and design:

- Editing a chat message (only its author can delete it).
- Changing the frequency or the day of a series (delete it and create a new one).
- Offset pagination (lists are cursor-paginated only).
- Handling a tapped push on web (`useNotificationResponse` is native only).
- Languages other than English in the UI.
- <!-- TODO: anything else to exclude explicitly (payments, offline mode, moderation…) -->

### Phases

| Phase | Content | Done when |
| --- | --- | --- |
| 1 | Everything in "In scope" (shipped, see `git log`) | AC1–AC24 have tests named after them and are green |
| 2 | <!-- TODO: next features --> | |

### Assumptions

- A series is scheduled in the creator's device time zone at creation (`Intl…resolvedOptions().timeZone`); its local
  time of day stays the same across DST changes.
- The creator of a jam is never one of its participants and is not counted in its capacity.
- Maestro flows run against the real Supabase project from `.env.local`; Jest tests never talk to Supabase.
- The Supabase Vault holds `project_url` and `service_role_key` (legacy service-role JWT); they are created by hand.

### Brief → design decisions

| Brief says | Decision | Why |
| --- | --- | --- |
| "Find jams around you" (original brief) | PostGIS search (`search_jams`) sorted by distance, then date | Distance is what matters on a map; keyset cursor keeps paging stable |
| "Jams CRUD" | Creator-only edit/delete, enforced by RLS | The database is the security boundary, the UI only hides actions |
| Recurring jams (added later) | Each date is a real `jams` row on a 60-day rolling window | Joining, search and notifications work per date like a one-off jam |
| "Never put business logic in components" | Route → component → hook → service → repository | See `CLAUDE.md` → Architecture and `DECISIONS.md` |

### Glossary

| Term | Meaning |
| --- | --- |
| Jam | One music session at a place and time (`jams` row). |
| One-off jam | A jam that belongs to no series (`series_id` null). |
| Series | Template of a recurring jam (`jam_series`): frequency, anchor date, local time, time zone, optional end date. |
| Occurrence / date of a series | A `jams` row generated from a series (`series_id`, `occurrence_date`). |
| Anchor date | First date of a series; later dates are computed from it. |
| Rolling window | Dates are generated up to today + 60 days (series' time zone), never past `ends_on`. |
| Creator | The user who created a jam or series. |
| Participant | A user in `jam_participants` for a jam. |
| Waitlist | Ordered queue of users waiting for a seat on a full jam. |
| Room | Chat of a one-off jam, or of a whole series (shared by all its dates). |

## 2. Domain model

### Principle

Supabase is the backend: Postgres holds the data and the rules that must never break (triggers, constraints, RLS),
and RLS is the security boundary. The client only talks to it through repositories, wrapped by services that
validate input with Zod and map rows (`snake_case`) to domain types (`camelCase`). Server state lives in TanStack
Query; realtime events only invalidate queries.

### Configuration

```bash
# .env.local (values never committed, see .env.example)
EXPO_PUBLIC_SUPABASE_URL=…
EXPO_PUBLIC_SUPABASE_KEY=…        # falls back to EXPO_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_MAPS_API_KEY=…             # injected into react-native-maps by app.config.ts; required on EAS builds
```

### Defaults and assumptions

| Setting | Default | Why |
| --- | --- | --- |
| Search radius | 25 km (options 5 / 10 / 25 / 50 km) | `DEFAULT_RADIUS_METERS`, `DISTANCE_FILTER_OPTIONS` |
| "Search this area" cap | 50 km | `MAX_AREA_SEARCH_RADIUS_METERS`: the map loads every page |
| Date filter | Any date (any / today / this weekend / next 7 days) | Range computed when the search runs, never stored |
| Jam list page | 20; map page 50; chat page 30 | Keyset pagination |
| `staleTime` | 30 s (5 min for instruments and styles) | `src/constants/query-config.ts` |
| `gcTime` | 10 min | Mobile memory |
| Retries | 2 for queries, 0 for mutations | Never create twice |
| Max participants | 10 (2–100) | DB check `>= 2`, form `max(100)` |
| Skill level | `all_levels` | DB default |
| Series window | today + 60 days, topped up daily at 03:00 UTC | `jam-series-rollover` cron |
| Notification radius | 25 km | `notification_preferences.radius_km` |

### Contract

Domain types are in `src/types/domain.ts` and `src/features/*/types.ts`; DB row and RPC types in
`src/lib/supabase/types.ts` (hand-written, updated with every migration). Signatures shared with tests:
`docs/implementation-contract.md`.

### Rules

- The client never computes series dates; the database does.
- A component never calls Supabase; a repository holds no business rule.
- Supabase data is never copied into a Zustand store.
- Every screen handles loading, error (with retry), empty and success.

## 3. Data and rules

### 3.1 Canonical model

Database details in §3.4; the migrations in `supabase/migrations/` are the source of truth.

| Entity | Key fields | Notes |
| --- | --- | --- |
| `profiles` | `id` (= `auth.users.id`), `username` (citext, unique), `avatar_url`, `bio`, `skill_level`, `location_name`, `latitude`/`longitude` | Created by trigger on sign-up |
| `jams` | `id`, `creator_id`, `title`, `description`, `starts_at`, `location_name`, `latitude`/`longitude`, `skill_level`, `max_participants`, `series_id`, `occurrence_date` | Unique `(series_id, occurrence_date)` |
| `jam_series` | `frequency`, `anchor_date`, `local_time`, `timezone`, template fields, `instrument_ids`, `style_ids`, `ends_on`, `generated_until` | `ends_on >= anchor_date` |
| `jam_participants` | `(jam_id, user_id)` | |
| `jam_waitlist` | `(jam_id, user_id)`, `position` | Position set by trigger |
| `jam_messages` | `jam_id` xor `series_id`, `sender_id`, `body`, `created_at` | Exactly one room |
| `friendships` | requester, addressee, `status` (`pending`/`accepted`/`rejected`/`blocked`) | Unique unordered pair |
| `notifications`, `notification_preferences`, `devices` | type, data, read state; per-type opt-outs; Expo push tokens | |
| `instruments`, `music_styles` + link tables | name, slug | 20 + 20 seeded |

### 3.2 Sources / inputs

- **User input**: forms validated with Zod (`src/features/*/schemas`), re-validated in services.
- **Geocoding**: OpenStreetMap Nominatim (`geocoding.repository.ts`), results parsed with Zod.
- **Push notifications**: Expo push tokens in `devices`; the `data` payload of a notification is parsed with Zod
  and mapped to a route (`resolve-notification-href.ts`), internal paths only.

### 3.3 Business rules

| Rule | When | Then |
| --- | --- | --- |
| R1 | A user joins a jam that has `max_participants` participants | Refused (`JAM_FULL`) |
| R2 | The creator joins their own jam | Refused (`CREATOR_CANNOT_JOIN`) |
| R3 | A user joins a jam they already joined | Refused (`ALREADY_JOINED`) |
| R4 | A user joins the waitlist of a jam that is past, not full, their own, or one they joined | Refused |
| R5 | Users join a waitlist | Ordered by arrival; the position sent by the client is ignored |
| R6 | A participant leaves (or is removed) from a jam that still exists, has not started and has a free seat | The first person on the waitlist becomes a participant and is notified, whatever their preferences |
| R7 | A user joins a jam directly while on its waitlist | They are removed from the waitlist |
| R8 | A series is created | Its dates are generated up to today + 60 days (or up to the anchor if later), never past `ends_on` |
| R9 | The creator deletes one date of a series | That date is never generated again |
| R10 | An end date is set | It is on or after the anchor date |
| R11 | The end date of a series is moved earlier | Upcoming dates after it are deleted, and their participants notified |
| R12 | The end date is moved later or cleared | Missing dates are generated right away |
| R13 | A series is edited ("all upcoming dates") | Template, time and end date change for upcoming dates only; frequency and day never change |
| R14 | A series is deleted | Upcoming dates are deleted; past dates stay as one-off jams |
| R15 | Dates of a series are generated | Only the first date announces the jam (new-jam notification) |
| R16 | A non-creator edits or deletes a jam or series | Refused (`NOT_CREATOR`, RLS) |
| R17 | A user reads or writes in a room | Only the creator and participants (of any date, for a series) can |
| R18 | A message is sent | Its time is the server's; it can never be edited, only deleted by its author |
| R19 | A friend request is sent between two users who already have one, either way | Refused (`FRIEND_REQUEST_EXISTS`) |
| R20 | A jam is cancelled (deleted) | Its participants and its creator are notified (preference `jam_updates`) |
| R21 | A notification is sent | Filtered by the recipient's `notification_preferences` (except R6) |
| R22 | Profile or jam input | Username 3–30 chars (letters, digits, `_`), password ≥ 8, bio ≤ 500, title 1–120, description ≤ 2000, message 1–2000, avatar ≤ 5 MB |

### 3.4 Database reference

Extensions: `postgis` (geo search, GiST), `pg_trgm` (fuzzy username search), `citext` (case-insensitive usernames),
all in the `extensions` schema; plus `pg_cron`, `pg_net` and Vault.

Enums: `skill_level` (`beginner`, `intermediate`, `advanced`, `expert`, `all_levels`); `friendship_status`
(`pending`, `accepted`, `rejected`, `blocked`); `jam_recurrence` (`weekly`, `biweekly`, `monthly_weekday` — same
weekday and position in the month as the anchor, a 5th position meaning "last"); `notification_type`
(`FRIEND_REQUEST`, `FRIEND_ACCEPTED`, `NEW_JAM_CITY`, `NEW_JAM_RADIUS`, `NEW_JAM_MATCH`, `JAM_UPDATED`,
`JAM_CANCELLED`, `JAM_STARTING_SOON`, `SYSTEM`, `CHAT_MESSAGE` — push only, never stored —, `WAITLIST_PROMOTED`).

Triggers:

| Trigger | Table | Action |
| --- | --- | --- |
| `on_auth_user_created` | `auth.users` | Creates the profile (pass `username` in `raw_user_meta_data` at sign-up) |
| `*_set_updated_at` | profiles, jams, jam_series, friendships | Sets `updated_at` |
| `jams_new_jam_notification` | jams | New-jam notification; for a series, only the first date |
| `jams_updated_notification`, `jams_cancelled_notification` | jams | Notify participants; the cancel payload carries `participant_ids` collected in the trigger (rows are gone when `pg_net` sends) |
| `jam_participants_check_capacity`, `jam_participants_check_not_creator` | jam_participants | R1, R2 |
| `jam_participants_promote_waitlist` | jam_participants | AFTER DELETE: R6 (skipped on a cascade delete), calls `send-waitlist-promoted-notification` |
| `jam_participants_remove_from_waitlist` | jam_participants | AFTER INSERT: R7 |
| `jam_waitlist_before_insert` | jam_waitlist | R4; sets `position` under a per-jam advisory lock (R5) |
| `jam_messages_set_created_at` | jam_messages | `created_at := now()` (R18) |
| `jam_messages_chat_notification` | jam_messages | Calls `send-chat-message-notification` |

RLS is on for every public table:

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | authenticated | own | own | — |
| `jams`, `jam_series` | authenticated | creator | creator | creator |
| `jam_participants` | authenticated | own | — | own or creator |
| `jam_waitlist` | authenticated | own | — | own |
| `jam_messages` | room members | room members, `sender_id = auth.uid()` | — | own |
| `friendships` | involved | requester | involved | involved |
| `instruments`, `music_styles` | authenticated | — | — | — |
| `user_instruments`, `user_music_styles` | authenticated | own | — | own |
| `jam_instruments`, `jam_styles` | authenticated | creator | — | creator |

Series functions: `private.next_occurrence_dates` (pure SQL, the date rule above;
`starts_at = (occurrence_date + local_time) AT TIME ZONE timezone`), `private.generate_jam_series_occurrences`
(`SECURITY DEFINER`, inserts missing dates with the instruments and styles still in the catalogue, then moves
`generated_until`), `public.extend_jam_series` (`service_role` only). The creator RPCs are `SECURITY INVOKER`, so RLS
applies on top of their own checks. `private` is not exposed by the API; `authenticated` has `USAGE` on it, and only
explicitly granted functions run.

Chat: `can_access_jam_chat` (`SECURITY DEFINER`) backs the RLS of `jam_messages`; the room of a deleted one-off jam
or series is deleted with it. The chat push goes to creator + participants − sender, filtered by
`notification_preferences.chat_messages`, body `username: message` cut at 140 characters, and opens
`/jams/chat/<jamId>` (for a series: its next date, or its last one).

Seed: 20 instruments and 20 music styles.

## 4. Failure scenarios

### 4.1 Retry policy

Queries retry twice; mutations are never retried (no double creation). Queries refetch on app focus and on
reconnect. Nothing is retried server-side: a failed `pg_net` call to an Edge Function is lost.

### 4.2 Fallback and degradation

- An Edge Function not deployed yet: the data is saved, the `pg_net` call fails (404), no push is sent.
- Realtime does not filter `DELETE` events: messages deleted by others disappear on the next refetch.
- A user promoted from a waitlist sees the jam in their calendar after `staleTime`, not instantly.
- Location permission denied: `LOCATION_DENIED`, the app falls back to a default position (Paris).

### 4.3 Data protection

- Series RPCs (`create_jam_series`, `update_jam_series`, `delete_jam_series`) change a series and its dates in one
  transaction; generation is idempotent (`ON CONFLICT DO NOTHING` on `(series_id, occurrence_date)`).
- Migrations are additive: a new timestamped file for every change, never an edited one.
- Vault secrets are created by hand, never in a migration. Service-only functions revoke `EXECUTE` from `anon`
  and `authenticated`; Edge Functions refuse any JWT without `role = service_role`.

### 4.4 Scenario matrix

| # | Scenario | Expected behaviour | Final status | Data touched? |
| --- | --- | --- | --- | --- |
| F1 | Join a full jam | Error shown, offer the waitlist | `JAM_FULL` | No |
| F2 | Non-creator calls an edit/delete RPC | Refused by the RPC and RLS | `NOT_CREATOR` / 42501 | No |
| F3 | Any Supabase error | Mapped to an `AppError`, shown with a retry | `AppError` code | No |
| F4 | End date before the anchor | Check constraint violation, error shown | error | No |
| F5 | Client released before its migration | PostgREST "function not found" on the new RPC | error | No — apply migrations first (§6.4 deploy order) |
| F6 | Network lost | Queries retry, refetch on reconnect | `NETWORK_ERROR` | No |
| F7 | Push for a removed message | Edge Function finds no message, sends nothing | — | No |

## 5. Acceptance criteria

Given / When / Then. Each one is testable and owned by at least one test named `ACn — …`. Phase 1 criteria
describe the shipped behaviour.

| AC | Given | When | Then | Phase |
| --- | --- | --- | --- | --- |
| AC1 | A visitor | They sign up with a valid username, email and password | A profile is created and they land on the home tab | 1 |
| AC2 | A signed-in user | They reopen the app | The session is restored without signing in again | 1 |
| AC3 | A signed-in user | They edit their profile (avatar, bio, instruments, styles, level, location) | The profile shows the new values | 1 |
| AC4 | A signed-in user | They create a jam with a title, a place picked on the map, a date and time | The jam opens and appears in nearby searches | 1 |
| AC5 | The creator of a jam | They edit or delete it | Participants are notified (updated / cancelled) | 1 |
| AC6 | A user creating a jam | They pick weekly, every 2 weeks or monthly | A series is created and its dates appear up to 60 days ahead | 1 |
| AC7 | A recurring jam being created or edited | An end date is set | No date is generated after it (R10–R12) | 1 |
| AC8 | The creator of a series | They edit "this date only" or "all upcoming dates" | Only that date, or all upcoming dates, change | 1 |
| AC9 | A user and a jam with free seats | They join, then leave | They appear, then disappear, in the participants | 1 |
| AC10 | A full jam | A user joins its waitlist | They see their rank on the list | 1 |
| AC11 | A full jam with a waitlist | A participant leaves | The first person waiting becomes a participant and is notified | 1 |
| AC12 | The map | The user sets distance, instrument, style or date filters | Only matching jams show, and the filters are kept between sessions | 1 |
| AC13 | A recurring jam | It appears on the map | Only its next matching date is shown; the jams list shows every date | 1 |
| AC14 | Jams around the user | They open the jams list | Jams are sorted by distance, then date, and load page by page | 1 |
| AC15 | A user | They search musicians by username and send a friend request | The other user receives it and can accept or reject it | 1 |
| AC16 | Two friends | One removes the other | Neither appears in the other's friends list | 1 |
| AC17 | A participant or the creator of a jam | They open its chat and send a message | Every member sees it live and receives a push | 1 |
| AC18 | A user who is neither creator nor participant | They try to open a jam's chat | They cannot read or write in it | 1 |
| AC19 | A notification is received | The user taps it (in-app or push) | The app opens the matching screen | 1 |
| AC20 | Unread notifications | The user opens the home tab | The bell shows the unread count | 1 |
| AC21 | A user with created and joined jams in a month | They open the calendar from the home tab | Days show a green dot (created) and a blue dot (participating) | 1 |
| AC22 | The calendar | The user taps a day, then a jam | The day's jams are listed, then the jam opens | 1 |
| AC23 | Any list screen | Data is loading, fails or is empty | A loader, an error with retry, or an empty state is shown | 1 |
| AC24 | A jam starting soon | Its start is near | Participants receive a "starting soon" notification | 1 |

## 6. API and definitions

### 6.1 Definitions

There is no custom HTTP API: the client calls Supabase (PostgREST tables under RLS, RPCs, Storage, Realtime).
Edge Functions are called by the database only.

### 6.2 RPCs and Edge Functions

| Name | Purpose | Caller | Errors |
| --- | --- | --- | --- |
| `search_jams` | Jams in a radius with filters, distance → date → id, keyset cursor; `p_next_occurrence_only` for the map | Client | — |
| `search_profiles`, `search_profiles_nearby` | Users by username / nearby, with instrument and style filters | Client | — |
| `get_user_created_jams`, `get_user_participated_jams` | Profile lists | Client | — |
| `create_jam_series`, `update_jam_series`, `delete_jam_series` | Series and their dates, one transaction | Creator | 42501, P0002, 22023, 23514 |
| `extend_jam_series` | Tops up the rolling window | Cron (`service_role`) | — |
| `get_jam_messages` | Messages of a room, newest first | Room members | 22023 |
| `get_user_notifications`, `get_unread_notifications_count` | Inbox | Client | — |
| `get_jam_participant_count` | Participants of a jam | Client | — |
| `send-*-notification` (8 Edge Functions) | Insert `notifications` rows and send Expo pushes | DB triggers and cron via `pg_net`, service-role JWT | 403 |

### 6.3 Response shapes

See `src/lib/supabase/types.ts` (rows and RPC results) and `src/types/domain.ts` (mapped domain types).

### 6.4 Startup, rebuild and deploy

```bash
npm install
npm run ios            # dev build (does not run in Expo Go)
npm start              # Metro
npm test               # Jest
maestro test .maestro -e E2E_EMAIL=… -e E2E_PASSWORD=…   # e2e flows
```

#### Migrations

`20250721130000_baseline.sql` rebuilds the whole database on an empty project; every later change is a new
timestamped migration.

- Local (Docker): `supabase start`, then `supabase db reset`.
- Existing remote project — **destructive, deletes all data**: `supabase link --project-ref <ref>`, then
  `supabase db reset --linked`.
- New empty project: `supabase link --project-ref <ref>`, then `supabase db push` (or paste the files in the SQL Editor).

Manual steps, never in a migration:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>', 'service_role_key');  -- the legacy service_role JWT
```

Then `supabase functions deploy` (the eight `send-*-notification` functions, `verify_jwt = true` in
`supabase/config.toml`).

Scheduled jobs (`pg_cron`): `jam-starting-soon` every 5 minutes (with the service-role `Authorization` header) and
`jam-series-rollover` daily at 03:00 UTC (`select public.extend_jam_series();`).

#### Deploy order per migration

| Migration | Order | In the wrong order |
| --- | --- | --- |
| `20261009114832_jam_cancelled_notification_participants` | Any; redeploy `send-jam-cancelled-notification` | Old function ignores `participant_ids`; new one treats it missing as empty |
| `20261024120000_recurring_jams` | Migration, then client | — (old client ignores the new columns) |
| `20261024130000_jam_chat` | Deploy `send-chat-message-notification` and redeploy the other `send-*` functions, then migration, then client | Messages are saved but no push (404) until the function is deployed |
| `20261024140000_lock_down_function_grants` | Migration, then functions | "Starting soon" reminders refused until the migration is applied |
| `20261024150000_search_jams_next_occurrence` | Migration, then client | New client gets "function not found" |
| `20261026120000_jam_waitlist` | Deploy `send-waitlist-promoted-notification`, then migration, then client | Promotion happens but no notification (404) |
| `20261118120000_jam_series_ends_on` | Migration, then client | New client gets "function not found" on the series RPCs |
