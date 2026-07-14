# Architecture — Jam Finder

Référence unique pour l'architecture frontend. Complète `PROJECT_CONTEXT.md`.

---

## 1. Structure des dossiers

```
src/
├── app/                          # Expo Router — routing uniquement
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── explore.tsx           # Carte + filtres
│   │   ├── jams/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── create.tsx
│   │   ├── profile/
│   │   │   ├── index.tsx
│   │   │   └── edit.tsx
│   │   └── friends/
│   │       ├── index.tsx
│   │       └── search.tsx
│   └── +not-found.tsx
│
├── components/                   # UI générique, sans logique métier
│   ├── ui/                       # Primitives (Button, Input, Card…)
│   ├── layout/                   # Screen, Header, EmptyState, ErrorState
│   └── feedback/                 # LoadingSpinner, Toast
│
├── features/                     # Logique métier par domaine
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   ├── hooks/                # useAuth, useLogin, useRegister
│   │   ├── schemas/              # loginSchema, registerSchema (Zod)
│   │   └── types.ts
│   ├── profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   └── types.ts
│   ├── jams/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   └── types.ts
│   ├── participation/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── map/
│   │   ├── components/           # JamMap, JamMarker, MapFilters
│   │   ├── hooks/
│   │   └── types.ts
│   └── friends/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       └── types.ts
│
├── services/                     # Orchestration métier (règles, validation, composition)
│   ├── auth.service.ts
│   ├── profile.service.ts
│   ├── jam.service.ts
│   ├── participation.service.ts
│   ├── friend.service.ts
│   └── map.service.ts
│
├── repositories/                 # Accès données Supabase (CRUD pur)
│   ├── auth.repository.ts
│   ├── profile.repository.ts
│   ├── jam.repository.ts
│   ├── participation.repository.ts
│   ├── friend.repository.ts
│   └── reference.repository.ts   # instruments, music_styles
│
├── lib/                          # Infrastructure transversale
│   ├── supabase/
│   │   ├── client.ts             # Client Supabase (migration depuis utils/supabase.ts)
│   │   └── types.ts              # Types générés depuis le schéma DB
│   ├── query/
│   │   ├── client.ts             # QueryClient + config globale
│   │   └── keys.ts               # Query key factory centralisée
│   ├── errors/
│   │   ├── app-error.ts          # AppError, DomainError, NetworkError
│   │   └── map-supabase-error.ts
│   └── validation/
│       └── common-schemas.ts     # idSchema, paginationSchema, geoSchema
│
├── store/                        # State client global (Zustand)
│   ├── auth.store.ts             # Session courante, userId
│   ├── map-filters.store.ts      # Filtres carte (UI state)
│   └── ui.store.ts               # Modals, toasts, navigation temporaire
│
├── hooks/                        # Hooks transverses (non liés à une feature)
│   ├── use-theme.ts
│   └── use-debounce.ts
│
├── types/                        # Types partagés entre features
│   ├── domain.ts                 # Profile, Jam, Friendship, Instrument…
│   ├── api.ts                    # PaginatedResponse, ApiResult
│   └── geo.ts                    # Coordinates, GeoBounds
│
├── constants/
│   ├── theme.ts
│   ├── query-config.ts           # staleTime, gcTime par domaine
│   └── routes.ts                 # Chemins typés Expo Router
│
└── utils/                        # Fonctions pures utilitaires
    ├── date.ts
    ├── geo.ts                    # distance, bounding box
    └── format.ts

supabase/
├── migrations/                   # SQL versionné
├── seed.sql                      # instruments, music_styles
└── config.toml

docs/
└── DATABASE.md                   # Schéma documenté
```

### Fichiers racine

| Fichier | Responsabilité |
|---------|----------------|
| `ARCHITECTURE.md` | Ce document — référence unique |
| `docs/DATABASE.md` | Schéma PostgreSQL, relations, RLS |
| `supabase/migrations/*.sql` | Migrations versionnées |
| `.env.example` | Variables `EXPO_PUBLIC_SUPABASE_*` |

### Migration depuis l'existant

| Actuel | Cible |
|--------|-------|
| `utils/supabase.ts` | `src/lib/supabase/client.ts` |
| `src/hooks/use-theme.ts` | Reste — hooks transverses |
| `src/components/*` | Reste — UI générique uniquement |

---

## 2. Conventions TypeScript

### Règles générales

- **`strict: true`** — déjà activé, à conserver.
- **Pas de `any`**, pas de `unknown` sans narrowing explicite.
- **Pas de valeurs par défaut dans les signatures** — paramètres explicites.
- **Typage strict des retours** — toute fonction exportée a un type de retour explicite.
- **Pas de logique métier dans les composants** — uniquement rendu + appels hooks.

### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers composants | `kebab-case.tsx` | `jam-card.tsx` |
| Fichiers hooks | `use-*.ts` | `use-jam-list.ts` |
| Fichiers services | `*.service.ts` | `jam.service.ts` |
| Fichiers repositories | `*.repository.ts` | `jam.repository.ts` |
| Types domaine | `PascalCase` | `Jam`, `Profile` |
| Types DB (Supabase) | suffixe `Row` / `Insert` / `Update` | `JamRow`, `JamInsert` |
| Schémas Zod | suffixe `Schema` | `createJamSchema` |
| Constantes | `SCREAMING_SNAKE_CASE` | `DEFAULT_STALE_TIME` |

### Imports

- Alias `@/*` → `./src/*` (déjà configuré).
- Ordre : React → libs externes → `@/lib` → `@/features` → `@/components` → relatifs.
- **Barrel exports interdits** dans `features/` et `repositories/` — imports directs pour le tree-shaking.

### Types — 3 couches distinctes

```
Database types (src/lib/supabase/types.ts)   ← générés Supabase CLI
       ↓ mappés par
Domain types   (src/types/domain.ts)         ← modèle métier app
       ↓ exposés par
Feature types  (src/features/*/types.ts)     ← vues, DTOs, filtres locaux
```

- Les **repositories** retournent des `*Row` Supabase ou des domain types mappés.
- Les **services** ne connaissent que les domain types.
- Les **hooks/composants** ne voient jamais les types DB bruts.

---

## 3. Séparation Feature / Service / Repository

### Flux obligatoire

```
Screen (app/) → Feature Hook → Service → Repository → Supabase
                     ↓
              React Query / Zustand
```

### Responsabilités par couche

| Couche | Fichiers | Fait | Ne fait pas |
|--------|----------|------|-------------|
| **Screen** (`app/`) | `*.tsx` routes | Layout, navigation, composition composants | Fetch, validation, appels Supabase |
| **Feature Component** | `features/*/components/` | UI métier, formulaires (RHF) | Accès direct DB |
| **Feature Hook** | `features/*/hooks/` | Bridge React Query ↔ service, expose `{ data, isLoading, error, mutate }` | Logique métier complexe |
| **Service** | `services/*.service.ts` | Règles métier, orchestration multi-repo, validation Zod, mapping erreurs | Connaître React, connaître Supabase SDK |
| **Repository** | `repositories/*.repository.ts` | CRUD Supabase, requêtes SQL/RPC, upload Storage | Règles métier, validation |

### Exemple — feature `jams`

| Fichier | Responsabilité |
|---------|----------------|
| `features/jams/hooks/use-jam-list.ts` | `useQuery` avec filtres, expose `jams[]` |
| `features/jams/hooks/use-create-jam.ts` | `useMutation`, invalidation cache |
| `features/jams/schemas/create-jam.schema.ts` | Validation Zod formulaire création |
| `services/jam.service.ts` | Vérifie que l'utilisateur est créateur avant update/delete ; compose jam + instruments + styles |
| `repositories/jam.repository.ts` | `findNearby()`, `create()`, `update()`, `delete()`, joins `jam_instruments` / `jam_styles` |

### Règle d'or

> **Un composant ne parle jamais directement à Supabase.**  
> **Un repository ne contient jamais de règle métier.**

---

## 4. Gestion du state

### Principe

| Type de state | Outil | Exemples |
|---------------|-------|----------|
| **Server state** (données distantes) | **TanStack Query** | Jams, profils, amis, participations |
| **Auth session** | **Zustand** + listener Supabase Auth | `userId`, `session`, `isAuthenticated` |
| **UI state local** | **Zustand** ou `useState` | Filtres carte, modal ouverte, onglet actif |
| **Form state** | **React Hook Form** | Création jam, édition profil |
| **URL state** | **Expo Router params** | `jam/[id]`, filtres partageables |

### Stores Zustand

| Fichier | State | Persisté ? |
|---------|-------|------------|
| `store/auth.store.ts` | `session`, `userId`, `isLoading` | Non (Supabase Auth gère la persistance via AsyncStorage) |
| `store/map-filters.store.ts` | `distance`, `styles[]`, `instruments[]`, `date` | Oui (AsyncStorage) |
| `store/ui.store.ts` | Toast queue, modal active | Non |

### Règles Zustand

- Stores **minuscules** — uniquement ce qui n'est pas du server state.
- Pas de duplication : si la donnée vient de Supabase → React Query, jamais Zustand.
- Actions nommées explicitement : `setFilters`, `resetFilters`, `openModal`.
- Pas de side effects dans les stores — les listeners Auth vivent dans `lib/supabase/auth-listener.ts`.

### Synchronisation Auth

```
Supabase Auth (AsyncStorage)
       ↓ onAuthStateChange
auth.store.ts (userId, session)
       ↓
React Query (enabled: !!userId)
```

---

## 5. Stratégie React Query

### Configuration globale — `lib/query/client.ts`

| Option | Valeur | Raison |
|--------|--------|--------|
| `staleTime` | 30s (défaut), 5min (référentiels) | Données jams changent peu en lecture |
| `gcTime` | 10min | Mobile — mémoire limitée |
| `retry` | 2 (queries), 0 (mutations) | Éviter double création |
| `refetchOnWindowFocus` | `true` | Retour app → refresh |
| `refetchOnReconnect` | `true` | Réseau mobile instable |

### Query Key Factory — `lib/query/keys.ts`

Structure hiérarchique, invalidation ciblée :

```
queryKeys.jams.all                    → ['jams']
queryKeys.jams.lists()                → ['jams', 'list']
queryKeys.jams.list(filters)          → ['jams', 'list', filters]
queryKeys.jams.detail(id)             → ['jams', 'detail', id]
queryKeys.jams.participants(jamId)    → ['jams', 'participants', jamId]

queryKeys.profiles.detail(userId)     → ['profiles', userId]
queryKeys.profiles.jams(userId)       → ['profiles', userId, 'jams']

queryKeys.friends.list(userId)        → ['friends', userId]
queryKeys.friends.requests(userId)    → ['friends', userId, 'requests']

queryKeys.reference.instruments       → ['reference', 'instruments']
queryKeys.reference.musicStyles       → ['reference', 'music-styles']
```

### Hooks par feature

| Hook | Type | Service appelé |
|------|------|----------------|
| `useJamList(filters)` | Query | `jamService.findNearby(filters)` |
| `useJamDetail(id)` | Query | `jamService.getById(id)` |
| `useCreateJam()` | Mutation | `jamService.create(data)` |
| `useUpdateJam()` | Mutation | `jamService.update(id, data)` |
| `useDeleteJam()` | Mutation | `jamService.delete(id)` |
| `useJoinJam()` | Mutation | `participationService.join(jamId)` |
| `useLeaveJam()` | Mutation | `participationService.leave(jamId)` |
| `useProfile(userId)` | Query | `profileService.getById(userId)` |
| `useFriends()` | Query | `friendService.listAccepted()` |
| `useSendFriendRequest()` | Mutation | `friendService.sendRequest(userId)` |

### Invalidation après mutations

| Mutation | Invalide |
|----------|----------|
| `createJam` | `jams.lists()`, `profiles.jams(creatorId)` |
| `updateJam` | `jams.detail(id)`, `jams.lists()` |
| `deleteJam` | `jams.detail(id)`, `jams.lists()` |
| `joinJam` | `jams.detail(id)`, `jams.participants(id)` |
| `leaveJam` | `jams.detail(id)`, `jams.participants(id)` |
| `updateProfile` | `profiles.detail(userId)` |
| `acceptFriend` | `friends.list()`, `friends.requests()` |

### Realtime — intégration Query

Pour les participations et demandes d'amis en temps réel :

- Subscription dans un hook dédié : `useJamParticipantsRealtime(jamId)`.
- Sur événement `INSERT`/`DELETE` → `queryClient.invalidateQueries(queryKeys.jams.participants(jamId))`.
- Pas de state Realtime dans Zustand.

### États UI obligatoires

Chaque screen doit gérer explicitement :

- `isLoading` → skeleton / spinner
- `isError` → message + retry
- `isEmpty` → empty state contextualisé
- `isSuccess` → contenu

---

## 6. Stratégie Supabase

### Client — `lib/supabase/client.ts`

| Aspect | Règle |
|--------|-------|
| Instance unique | Singleton exporté, jamais recréé |
| Auth storage | AsyncStorage (déjà en place) |
| Types | Générés via `supabase gen types typescript` → `lib/supabase/types.ts` |
| Env vars | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

### Couche Repository — règles

| Règle | Détail |
|-------|--------|
| 1 repo = 1 table (ou groupe cohérent) | `jam.repository.ts` gère `jams` + `jam_instruments` + `jam_styles` |
| Retour typé | `{ data, error }` Supabase → mapper vers `AppError` dans le service |
| Pas de `.select('*')` en prod | Colonnes explicites |
| RPC pour requêtes geo | `find_jams_nearby(lat, lng, radius)` — PostGIS ou calcul côté DB |
| Transactions | Via Edge Function ou RPC Postgres si opération multi-table critique |

### Auth

| Aspect | Implémentation |
|--------|----------------|
| Inscription | `auth.repository.signUp(email, password)` → trigger DB crée `profiles` |
| Session | Listener `onAuthStateChange` → `auth.store` |
| Guard routes | `(auth)/` vs `(tabs)/` — redirect dans `_layout.tsx` selon `isAuthenticated` |
| RLS | Toute table user-scoped protégée par `auth.uid()` |

### Storage

| Bucket | Usage | Règle |
|--------|-------|-------|
| `avatars` | Photos profil | Path : `{userId}/avatar.jpg`, policy : owner only write |
| Upload | Via `profile.repository.uploadAvatar()` | Service valide taille/format avant upload |

### Realtime

| Channel | Table | Usage |
|---------|-------|-------|
| `jam:{id}:participants` | `jam_participants` | Mise à jour liste participants |
| `friends:{userId}` | `friendships` | Nouvelles demandes |

- Abonnement/désabonnement dans `useEffect` des hooks Realtime.
- Cleanup obligatoire au unmount.

### Edge Functions (futur)

Réservées pour :

- Notifications push (nouvelle demande ami, jam proche)
- Opérations nécessitant un secret (API externe)
- Batch jobs (nettoyage jams passées)

Pas d'Edge Function pour du CRUD simple — RLS + repositories suffisent.

### Gestion des erreurs Supabase

```
Supabase error (PostgrestError / AuthError)
       ↓ mapSupabaseError()
AppError (code, message, statusCode)
       ↓
Service throw AppError
       ↓
React Query onError → toast UI
```

Codes métier à définir dans `lib/errors/app-error.ts` :

- `JAM_FULL`, `ALREADY_JOINED`, `NOT_CREATOR`, `FRIEND_REQUEST_EXISTS`, `UNAUTHORIZED`

---

## 7. Règles d'architecture

### Flux de données

1. **Unidirectionnel** : Screen → Hook → Service → Repository → Supabase.
2. **Pas de raccourci** : jamais Supabase depuis un composant ou un hook sans passer par service/repository.
3. **Server state dans Query**, **UI state dans Zustand**, **form state dans RHF**.

### Boundaries

| De → Vers | Autorisé ? |
|-----------|------------|
| `app/` → `features/*/hooks` | ✅ |
| `app/` → `services/` | ❌ |
| `features/` → `services/` | ✅ (via hooks uniquement) |
| `services/` → `repositories/` | ✅ |
| `repositories/` → `lib/supabase` | ✅ |
| `repositories/` → `services/` | ❌ |
| `features/A` → `features/B` | ❌ (passer par service ou type partagé) |

### Validation

- **Entrée utilisateur** : Zod dans `features/*/schemas/` + `@hookform/resolvers`.
- **Entrée service** : re-validation Zod ou assertion de type domain.
- **Sortie repository** : parsing Zod optionnel si données externes.

### Tests (future)

| Couche | Type de test |
|--------|--------------|
| Services | Unit tests (mock repositories) |
| Repositories | Integration tests (Supabase local) |
| Hooks | Tests avec `@testing-library/react-hooks` + MSW |
| Composants | Snapshot + interaction |

### Performance mobile

- Pagination cursor-based pour listes jams (`limit` + `cursor`).
- `staleTime` élevé pour référentiels (`instruments`, `music_styles`).
- Images avatar via `expo-image` avec cache.
- Debounce 300ms sur filtres carte (`use-debounce.ts`).

---

## 8. Ordre d'implémentation

| Phase | Fichiers prioritaires |
|-------|----------------------|
| **0 — Infra** | `lib/supabase/client.ts`, `lib/query/client.ts`, `lib/query/keys.ts`, `lib/errors/*`, `store/auth.store.ts` |
| **1 — Auth** | `repositories/auth.repository.ts`, `services/auth.service.ts`, `features/auth/*`, routes `(auth)/` |
| **2 — Référentiels** | `repositories/reference.repository.ts`, hooks instruments/styles |
| **3 — Profile** | repo + service + feature profile |
| **4 — Jams CRUD** | repo + service + feature jams |
| **5 — Participation** | repo + service + hooks join/leave |
| **6 — Carte** | `features/map/*`, `store/map-filters.store.ts`, RPC geo |
| **7 — Amis** | repo + service + feature friends + Realtime |
