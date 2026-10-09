# FindMyJam

A mobile app (iOS, Android, web) for finding and organising jam sessions between musicians: discover jams around you on a map, create your own, sign up, and build a network of musicians.

## Features

- **Account**: sign up, sign in, profile with avatar, instruments, styles and skill level.
- **Jams**: create a jam with a location picked on a map, browse a distance-sorted list, view details, join and leave.
- **Map**: explore nearby jams, with filters.
- **Friends**: search for musicians, send friend requests, manage your friends list, view another user's profile.
- **Notifications**: in-app in real time and push (friend request, new jam nearby, jam updated, cancelled or about to start).

## Stack

| Area | Technologies |
|---|---|
| App | Expo SDK 57, React Native 0.86, strict TypeScript, Expo Router |
| UI | NativeWind v4 (Tailwind 3), Reanimated, `react-native-maps` |
| Data | TanStack Query (server state), Zustand (client state), React Hook Form + Zod |
| Backend | Supabase: Postgres + RLS, Auth, Realtime, Storage, Edge Functions (Deno) |
| Quality | Jest + React Native Testing Library, ESLint (`eslint-config-expo`), `tsc` |

## Getting started

Requirements: Node 22, Xcode (iOS) or Android Studio (Android), and a Supabase project.

```bash
npm install
cp .env.example .env.local   # then fill in the variables below
```

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | Public (anon / publishable) key of the project |
| `GOOGLE_MAPS_API_KEY` | Google Maps key, injected into the native config by `app.config.ts` |

The app uses native modules (`expo-dev-client`, `react-native-maps`, `expo-notifications`), so it runs as a development build.

```bash
npm run ios        # build and install the development build on the iOS simulator
npm run android    # same on an Android emulator or device
npm start          # start Metro for an already installed build
npm run web        # web version
```

The first `npm run ios` generates the `ios/` folder and takes several minutes. `npx expo start --go` gives a quick try in Expo Go, without push notifications.

## Commands

```bash
npm test                # all tests (Jest)
npm run test:watch
npx jest <file>         # a single test file
npx tsc --noEmit        # typecheck
npm run lint            # ESLint
```

`npm run reset-project` is left over from the Expo template: do not run it, it moves `src/app` aside.

## Code organisation

Data flows one way, and each layer only talks to the next:

```
src/app (routes) → features/*/components → features/*/hooks → services → repositories → Supabase
```

| Folder | Contents |
|---|---|
| `src/app/` | Expo Router routes: navigation and composition only |
| `src/features/<domain>/` | `components/`, `hooks/`, `schemas/` (Zod), `types.ts` per domain: `auth`, `jams`, `map`, `location`, `friends`, `profile`, `notifications`, `home` |
| `src/services/` | Business rules, validation, mapping SQL rows to domain types, `AppError` errors |
| `src/repositories/` | Plain Supabase queries |
| `src/components/` | Shared components (UI, layout, loading and error states) |
| `src/lib/`, `src/store/`, `src/utils/` | Supabase client, query keys, Zustand stores, utilities |
| `supabase/` | SQL migrations and Edge Functions |

## Tests

Two kinds of tests, all run by Jest: unit tests (`*.test.ts`) for schemas, utilities and services, and component tests (`*.test.tsx`) with React Native Testing Library. They live in a `__tests__/` folder next to the code. No test talks to Supabase and there is no end-to-end suite.

## Supabase backend

`supabase/migrations/` is the source of truth for the schema: tables, RLS policies, RPC functions, reference data (instruments, styles) and the avatars bucket. `20250721130000_baseline.sql` rebuilds the whole database on an empty project; every change after that goes in a new timestamped migration.

```bash
supabase link --project-ref <ref>
supabase db push                 # apply migrations to a project
supabase functions deploy        # deploy the notification Edge Functions
```

Two secrets must be created by hand in Supabase Vault; the triggers that call the Edge Functions read them:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>', 'service_role_key');
```

`supabase db reset --linked` recreates the remote database from the migrations and **deletes all its data**.
