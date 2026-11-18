# DESIGN — FindMyJam

> Source of truth for the look and feel of the app. The values here are mirrored in the NativeWind token files —
> `src/global.css` (CSS variables), `tailwind.config.js` (token → class mapping, radius, fonts, glow shadows) and
> `src/constants/theme.ts` (the same palette for React Navigation and native props); they change in the same commit.
> The `ui-design` skill checks every screen against this file.

| Setting | Value |
| --- | --- |
| Style | Neon night (synthwave / cyberpunk), from the FindMyJam mockups |
| Theme mode | dark only |
| Accent | `#ff2e88` (neon pink), second neon `#22e3ff` (cyan) |
| Styling | React Native: NativeWind on the theme tokens |
| Reference | `docs/design/mockups/` (home, explore-map, jam-detail, chat) and the "FindMyJam — style néon nocturne" canvas |

The mockups are the visual reference: layout, sizes and states are read from their markup. Their copy and sample
data (venues, usernames, distances) are examples, never shipped. Original style: no logo, name or visual from any
game or brand.

## 1. Principles

- Night city: a deep violet night, two neons — pink for action, cyan for information and location — and a sunset
  horizon used sparingly as the signature.
- Glow means "this is the action" or "this is selected": the primary button, the selected chip or marker, the unread
  badge. Nothing else glows.
- Bold condensed uppercase titles, a friendly grotesk for reading, mono for data (distances, times, counts, labels).
- Rounded, tactile, big touch targets: musicians use it standing, often one-handed.

## 2. Colours

Semantic tokens used by screens. Raw values live only in the token files. One theme (dark only): `src/global.css`
defines the values in `:root` and drops the `prefers-color-scheme` override; `app.json` sets
`userInterfaceStyle: "dark"`.

| Token | Role | Value |
| --- | --- | --- |
| `background` | Screen | `#0b0716` |
| `surface` | Cards, sheets, tab bar, inputs on surface | `#140c26` |
| `surfaceHover` | Pressed surface, chips background, map overlays | `#1d1236` |
| `text` | Main text | `#f4ecff` |
| `textSoft` | Secondary text, metadata lines | `#d9ccef` |
| `textMuted` | Labels, placeholders, inactive tabs | `#b9a8d6` |
| `border` | Hairlines between surfaces (decorative, never the only boundary of a control) | `#2a1c44` |
| `borderStrong` | Inputs, secondary buttons, unselected chips (≥ 3:1) | `#6e5c94` |
| `primary` | Neon pink: primary action, selection, created-by-you, own chat bubble, unread badge | `#ff2e88` |
| `onPrimary` | Text and icons on `primary` | `#12051f` |
| `primaryText` | The pink as text, thin line or icon (active tab, links, counts) | `#ff2e88` |
| `secondaryAccent` | Cyan: location, distance, info badges, "participating", focus ring, live states | `#22e3ff` |
| `onSecondaryAccent` | Text on a cyan fill | `#12051f` |
| `event` | "Created by you" dot in the calendar (AC21 green) | `#5dff9e` |
| `danger` | Errors, leave / delete, cancelled | `#ff7a45` |
| `onDanger` | Text on a `danger` fill | `#12051f` |

Contrast: text ≥ 4.5:1, large text and icons ≥ 3:1 on their background.

**Code names.** The NativeWind classes keep the names the code already uses; each maps to a role above:
`background`, `foreground` → `text`, `card` / `card-elevated` → `surface`, `surface-hover`, `secondary` / `muted` →
`surfaceHover`, `secondary-foreground` / `text-soft` → `textSoft`, `muted-foreground` → `textMuted`, `border`,
`border-strong` / `input` → `borderStrong`, `primary`, `primary-foreground` → `onPrimary`, `primary-text` →
`primaryText`, `ring` → `secondaryAccent`, `destructive` → `danger`, `destructive-foreground` → `onDanger`, `accent`
→ `secondaryAccent`, `accent-foreground` → `onSecondaryAccent`, `event` → `event` (green), `event-foreground` →
`onPrimary`, `tab-bar` → `surface`. `theme.ts` uses the camelCase names and keeps the older keys mapped to the same
roles.

Measured ratios (WCAG 2.x):

| Pair | On `background` / `surface` / `surfaceHover` |
| --- | --- |
| `text` | 17.32 / 16.47 / 15.34 |
| `textSoft` | 13.10 / 12.46 / 11.61 |
| `textMuted` | 9.12 / 8.68 / 8.08 |
| `primaryText` (pink) | 5.68 / 5.40 / 5.03 |
| `secondaryAccent` (cyan) | 12.78 / 12.16 / 11.32 |
| `event` (green) | 15.40 / 14.65 / 13.64 |
| `danger` | 7.69 / 7.31 / 6.81 |
| `borderStrong` (control outline) | 3.43 / 3.26 / 3.04 |
| `border` (decorative only) | 1.28 / 1.21 / 1.13 |
| `onPrimary` on `primary` · on cyan · on green · on `danger` | 5.62 · 12.65 · 15.24 · 7.61 |

**Hue pairs that are close in lightness** — pink vs `danger` (1.35:1) and green `event` vs cyan "participating"
(1.20:1) — are told apart by hue, and always also by an icon or a text label (calendar legend, "Leave" text with its
icon). Never colour alone.

## 3. Typography

| Variant | Size / line height | Family · weight | Use |
| --- | --- | --- | --- |
| `display` | 44 / 54, uppercase, tracking 0.03em | **Anton** 400 | Screen title (MODELS-style one-word titles, "JAMS NEAR YOU") |
| `title` | 32 / 40, uppercase, tracking 0.02em | Anton 400 | Hero and jam titles |
| `heading` | 24 / 30, uppercase, tracking 0.03em | Anton 400 | Section titles |
| `subheading` | 16 / 21 | **Space Grotesk** 700 | Card titles, list item titles |
| `body` | 15 / 22 | Space Grotesk 400 | Default text, chat messages |
| `meta` | 13 / 18 | Space Grotesk 400, `textSoft` | Metadata lines ("1.6 km · Jazz · Intermediate") |
| `label` | 11 / 16, uppercase, tracking 0.12em | **JetBrains Mono** 600 | Labels, section kickers, status, badges |
| `data` | 12 / 16 | JetBrains Mono 400–600 | Distances, times, counts, seats ("10 / 10 · FULL") |
| `button` | 15 / 20, uppercase, tracking 0.06em | Space Grotesk 700 | Button labels |

Fonts: `@expo-google-fonts/anton`, `@expo-google-fonts/space-grotesk` (400, 500, 700) and
`@expo-google-fonts/jetbrains-mono` (400, 600), loaded with `useFonts` in `AuthProvider` as today (splash held until
ready, system font fallback). The `Text` primitive (`src/components/ui/text.tsx`) picks the face: `text-xl` and up →
Anton, smaller → Space Grotesk, `font-mono` → JetBrains Mono. Tailwind size scale: `text-xs` = label (11/16),
`text-sm` = meta (13/18), `text-base` = body (15/22), `text-lg` = subheading (16/21), `text-xl` = heading (24/30),
`text-2xl` = title (32/40), `text-3xl` = display (44/54). Label style: `font-mono text-xs uppercase tracking-label`.
Dynamic type stays on: titles may wrap to two lines, never truncate a jam title to one.
Anton line heights stay at about 1.2× the size or more: Anton is tall (cap height 0.86 em, descent 0.33 em), and with a tighter line height iOS cuts the top of the capitals.

## 4. Spacing, radius, elevation, motion

- Spacing: 4-pt base → 0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32. Screen padding 20; card padding 14–18; gap
  between sections 18; between list cards 10–14.
- Radius: `sm` 6 (tags, data badges) · `md` 12 (icon buttons, small cards) · `lg` 16 (buttons, inputs, list cards
  18) · `xl` 24 (hero cards, map preview, bottom sheets 28 on top corners) · `full` 999 (chips, avatars, dots,
  badges). Avatars are round again.
- Elevation: no grey drop shadows. **Glow** is the only shadow: `shadow-glow` (colour `primary`, blur 22, opacity
  ~0.7) on the primary button, the selected chip or marker and the unread badge; `shadow-glow-accent` (cyan) on the
  user location and live states. RN 0.76+ `boxShadow` renders it on iOS and Android; at most one glowing element
  group per screen region.
- Signature decor — the **horizon**: a sunset gradient (`#1b0830` → `#4a1250` → `#b8325f` → `#ff7a45`, then a hard
  line to `background`), a striped sun (`#ffd36b` → `#ff5f8f` → `#ff3d8b`) and a perspective grid in `secondaryAccent` at 45 % opacity. Used only on
  the Home "Your next jam" card and the Jam detail header; text over it sits on a solid or 85 % `background` backing.
  One component (`src/components/ui/horizon.tsx`, drawn with `react-native-svg` only, no extra native module), never redrawn per
  screen.
- Map: custom dark map style (`NightMapStyle` in `theme.ts`: geometry `#0e0a1c`, streets `#2a1f45` / highways `#3a2a5c`,
  water `#12306a`, parks `#13261f`; Android only, iOS Apple Maps uses its dark appearance); jam markers are pink
  pins (outline, `surface` fill), the selected one filled pink with glow and larger (44 vs 36); the user location is
  a cyan dot with a pulse; the search radius is a dashed cyan circle.
- Motion: `fast` 150 ms, `normal` 250 ms, ease-out. Only the user-location pulse loops. Everything is off with
  reduce motion.
- Buttons: primary = `primary` fill, `onPrimary` text, `button` style, 56 high (52 in cards), radius 16, glow,
  forward actions end with "→" ("Open jam →"); secondary = transparent, 1px `secondaryAccent`, cyan text, 48 high;
  quiet = transparent, 1px `borderStrong`, `textSoft` text; danger = 1px `danger`, `danger` text.
- Chips: pills, 36 min height. A filter in a list: selected = cyan outline + cyan text. A segmented control (map
  distance): selected = `primary` fill, `onPrimary` text, in a `surface` track.
- Touch targets ≥ 44 pt / 48 dp; icon buttons 44 × 44 with a 1px `borderStrong` outline on `surface`.

## 5. Components inventory

Primitives in `src/components/ui/`, defined once and reused. A component is listed here before it is used in two
places; a new look is a new variant, never a copy.

| Component | Variants | States | Notes |
| --- | --- | --- | --- |
| `Button` | primary · secondary · quiet · danger (code: `primary`, `secondary` / `outline`, `ghost`, `destructive`) | default · pressed · focus · disabled · loading | One primary action per screen; `button` text style; glow on primary only |
| `IconButton` | default · overlay (on the horizon, 80 % `background`) | pressed · focus | 44 × 44, `accessibilityLabel` required |
| `Text` / headings | display · title · heading · subheading · body · meta · label · data | — | Only way to style text |
| `Input` / `Field` | default · error | focus (cyan ring) · disabled | Label always visible, error below in `danger` with an icon |
| `Card` | default · hero (with `Horizon`) | pressed | `surface`, 1px `border`, radius 18–24 |
| `Chip` | filter · segment | selected · pressed | See §4 |
| `Tag` / `Badge` | neutral · info (cyan) · action (pink) · success (green) · danger | — | Mono `label`/`data` text, colour + text, never colour alone |
| `CountBadge` | — | — | Unread count on the bell: pink pill, glow |
| `Avatar` / `AvatarStack` | sizes 32 · 36 | — | Round, initials placeholder; stack overlaps by 10 with a 2px `background` ring |
| `Horizon` | card · header | — | The signature decor of §4 |
| `EmptyState` | — | — | Message + action |
| `ErrorState` | — | — | Message + "Try again" |
| `Skeleton` | line · block | — | Loading content, `surfaceHover` |

## 6. Screens and navigation

Bottom tabs (custom `BottomTabBar` on `surface`, active tab in `primaryText` with a bold label): **Home**,
**Explore**, **Friends**, **Profile**. Jams and notifications are stacks inside the tabs, hidden from the bar. The
mockups show a raised pink "Create" button in the middle of the bar: an option, not adopted — creating a jam stays
the primary action of Home.

| Screen | Route | Primary action | Mockup |
| --- | --- | --- | --- |
| Sign in / Register | `(auth)/login`, `(auth)/register` | Sign in / Create account | — |
| Home | `(tabs)/index` | Create jam (header: calendar and notifications with unread count) | `home` |
| Explore (map + filters) | `(tabs)/explore` | Search this area | `explore-map` |
| All jams | `jams/all` | Open a jam | `home` (list) |
| Jam detail | `jams/[id]` | Join (or Join the waitlist / Leave; Edit for the creator) | `jam-detail` |
| Create / edit jam | `jams/create`, `jams/edit/[id]` | Create jam / Save changes | — |
| Chat | `jams/chat/[id]` | Send | `chat` |
| Friends, search, user profile | `friends/`, `friends/search`, `friends/[userId]` | Add friend / Accept | — |
| Profile, edit profile | `profile/`, `profile/edit` | Save | — |
| Notifications | `notifications` | Open the notification | — |
| Calendar | from Home | Open a day, then a jam | — (green dot = created, cyan dot = participating, with a legend) |

Screens without a mockup apply the same tokens and primitives; no new decor.

## 7. Icons and images

- Icons: `lucide-react-native`, stroke 1.8, sizes 16 / 20 / 22 / 24; colour from a theme token, never a literal.
- Instruments and styles keep their icons (`src/utils/instrument-icons.ts`) in badges.
- Images: avatars through `expo-image` with cache, round; a placeholder with initials on a neon fill when there is
  none.
- Maps: `react-native-maps` with the custom dark style, markers and clusters of §4.

## 8. Voice

- English only, sentence case in body text; titles, labels and buttons are uppercase by style, not in the strings.
- Short and direct; buttons are verbs ("Join", "Join the waitlist", "Save changes"), empty states say what to do
  next ("No jam matches these filters. Try a wider distance or another date.").
- Errors say what failed ("Unable to load jams") and offer "Try again".
- Musician words: jam, session, musicians, instruments sought, skill level, waitlist.

## 9. Do / don't

- Do: reuse primitives, keep one primary action and one glow group per region, check the smallest screen and the
  largest text size, keep text off the horizon gradient without a backing.
- Don't: hard-code colours or sizes, add glow to decoration, use the horizon on more than the two hero places,
  rely on colour alone (danger vs pink, created vs participating), remove focus rings, disable font scaling.

## 10. Moving the app to this design

Done on 2026-11-18, one commit per step (`git log --oneline -- DESIGN.md src`); visual change only, no copy, label,
role, data or navigation change. Replaces the Terminal design.

1. Tokens: §2 in `src/global.css` (`:root` only), `tailwind.config.js` (§4 radius, `shadow-glow` /
   `shadow-glow-accent`, §3 sizes, `tracking-label` / `tracking-button` / `tracking-display`) and
   `src/constants/theme.ts` (`Colors.light` = `Colors.dark` = the night theme, `Glow`, `Radius`, horizon and map
   values); `useAppColorScheme` always returns `dark`; `app.json` `userInterfaceStyle: "dark"`, splash `#0b0716`.
2. Fonts: Anton, Space Grotesk, JetBrains Mono replace Archivo / IBM Plex Mono; `Text` maps `text-xl`+ to Anton
   (uppercase by style), smaller to Space Grotesk, `font-mono` to JetBrains Mono.
3. Primitives: the §5 components restyled; `Chip`, `CountBadge`, `IconButton`, `AvatarStack`, `Skeleton`, `Horizon`
   added (`Horizon` with `react-native-svg`, already in the build through `lucide-react-native`). Glow is an RN `boxShadow` from `Glow` in `StyleSheet`s.
4. Screens: Home, Explore, Jam detail, Chat against their mockups, then every other screen. Screen padding 20.
5. Map: `NightMapStyle`, pink pin markers (selected: filled, 44, glow), a cyan user-location dot with a pulse (off
   with reduce motion) instead of the platform dot, the dashed cyan search circle.
6. `check-design.sh`: 0 blocking, 0 major, 16 minor (`FlatList` → `FlashList`, needs a dependency).

Not done, on purpose or for later:

- Mockup content that does not exist in the app (it would be new text or data): the Home "Your next jam" hero
  (so `Horizon` is only on Jam detail today), the Explore selected-jam sheet, the Jam detail info grid labels and
  avatar stack (`AvatarStack` is ready), the Chat room header and day divider, the mockups' "FINDMYJAM" logotype.
- The raised "Create" tab button (§6: not adopted).
- Not checked on a device: smallest screen, largest text size, the glow (`boxShadow`) and the pin markers on
  Android, the dashed circle (`lineDashPattern` is iOS only), the pulse inside a map marker.
- `FlatList` → `FlashList`; a `Skeleton` is available but screens still use `Loading`.
