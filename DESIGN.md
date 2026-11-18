# DESIGN — FindMyJam

> Source of truth for the look and feel of the app. The values here are mirrored in the NativeWind token files —
> `src/global.css` (CSS variables, light and dark), `tailwind.config.js` (token → class mapping, radius, fonts) and
> `src/constants/theme.ts` (the same palette for React Navigation and native props); they change in the same commit.
> The `ui-design` skill checks every screen against this file.

| Setting | Value |
| --- | --- |
| Style | Terminal / editorial (gwenaelbihan.fr) |
| Theme mode | light and dark (follows the system setting) |
| Accent | `#1db954` |
| Styling | React Native: NativeWind on the theme tokens |
| Reference | none |

## 1. Principles

- Terminal / editorial: dark, dense, typographic, like gwenaelbihan.fr.
- Mono for UI and data, a large tight sans for titles, one accent colour for prompts, numbers and the primary action.
- No decoration: square corners, no shadows, 1px lines.

## 2. Colours

Semantic tokens used by screens. Raw values live only in the token file.

| Token | Role | Dark | Light |
| --- | --- | --- | --- |
| `background` | Page / screen | `#0e0e0c` | `#f6f4ee` |
| `surface` | Cards, terminal blocks | `#141410` | `#ffffff` |
| `surfaceHover` | Hover / pressed surface | `#1a1915` | `#efece4` |
| `text` | Main text | `#edeae2` | `#141410` |
| `textSoft` | Secondary text, nav | `#b4aea1` | `#4a463d` |
| `textMuted` | Labels, metadata | `#9a9384` | `#6b665a` |
| `border` | Lines | `#26251f` | `#dcd8cc` |
| `borderStrong` | Inputs, secondary buttons (≥ 3:1, WCAG 1.4.11) | `#6b665a` | `#857f72` |
| `primary` | Accent: prompts, numbers, primary action, focus | `#1db954` | `#1db954` |
| `onPrimary` | Text on primary | `#0e0e0c` | `#0e0e0c` |
| `danger` | Errors, removals | `#e8806b` | `#b23a24` |
| `onDanger` | Text on a `danger` fill | `#0e0e0c` | `#ffffff` |
| `primaryText` | The accent used as text, thin lines, icons, focus | `#1db954` | `#141410` (= `text`) |
| `secondaryAccent` | Second colour: "participating" in the calendar, instruments, friend relations | `#d4daff` | `#3451c7` |
| `onSecondaryAccent` | Text on a `secondaryAccent` fill | `#0e0e0c` | `#ffffff` |

Contrast: text ≥ 4.5:1, large text and icons ≥ 3:1 on their background, in every theme used.

**Accent rule.** `#1db954` on the light background is 2.35:1 (2.59:1 on `surface`), below 3:1 even for icons. In
light mode `primary` is only a fill (buttons, the selected marker, the own chat bubble) with `onPrimary` text; every
place the accent would be text, a thin line or an icon uses `primaryText`, which is the accent in dark and `text` in
light. This is a token, not a per-screen condition.

**Code names.** The NativeWind classes keep the names the code already used; each maps to a role above:
`background`, `foreground` → `text`, `card` / `card-elevated` → `surface`, `surface-hover`, `secondary` / `muted` →
`surfaceHover`, `secondary-foreground` / `text-soft` → `textSoft`, `muted-foreground` → `textMuted`, `border`,
`border-strong` / `input` → `borderStrong`, `primary`, `primary-foreground` → `onPrimary`, `primary-text`, `ring` →
`primaryText`, `destructive` → `danger`, `destructive-foreground` → `onDanger`, `accent` → `secondaryAccent`,
`accent-foreground` → `onSecondaryAccent`, `event` → `primaryText`, `tab-bar` → `background`. `theme.ts` uses the
camelCase names (`primaryText`, `textSoft`, …) and keeps the older keys (`backgroundElement`, `textSecondary`, …)
mapped to the same roles.

Measured ratios (WCAG 2.x):

| Pair | Dark | Light |
| --- | --- | --- |
| `text` on `background` / `surface` / `surfaceHover` | 16.07 / 15.36 / 14.63 | 16.79 / 18.46 / 15.64 |
| `textSoft` on `background` / `surface` / `surfaceHover` | 8.75 / 8.36 / 7.97 | 8.54 / 9.40 / 7.96 |
| `textMuted` on `background` / `surface` / `surfaceHover` | 6.33 / 6.05 / 5.76 | 5.20 / 5.72 / 4.84 |
| `primaryText` on `background` / `surface` | 7.47 / 7.14 | 16.79 / 18.46 |
| `onPrimary` on `primary` | 7.47 | 7.47 |
| `danger` on `background` / `surface` | 7.11 / 6.80 | 5.42 / 5.96 |
| `onDanger` on `danger` | 7.11 | 5.96 |
| `secondaryAccent` on `background` / `surface` / `surfaceHover` | 14.05 / 13.43 / 12.79 | 6.07 / 6.67 / 5.65 |
| `onSecondaryAccent` on `secondaryAccent` | 14.05 | 6.67 |
| `primary` on `background` (fill only, never text) | 7.47 | 2.35 |
| `borderStrong` on `background` / `surfaceHover` (input / secondary button outline) | 3.38 / 3.08 | 3.62 / 3.37 |

`secondaryAccent` is blue so that it stays distinct from the green accent by hue, and in dark also by brightness
(`#d4daff` vs `#1db954`: 1.88:1). It always comes with a text label, never colour alone.

## 3. Typography

| Variant | Size / line height | Family · weight | Use |
| --- | --- | --- | --- |
| `display` | 56 / 56 (web) · 40 / 44 (mobile) | sans · 800, tight tracking | Page title |
| `title` | 32 / 36 | sans · 700 | Section title, with a mono prefix `01 — Section` |
| `heading` | 18 / 24 | sans · 600 | Card title |
| `body` | 13 / 20 | mono · 400 | Default text |
| `label` | 11 / 16 | mono · 500, uppercase, letter-spacing 0.08em | Labels, nav, buttons |
| `caption` | 11 / 16 | mono · 400 | Metadata |

Families: sans = **Archivo**, mono = **IBM Plex Mono** (Google Fonts on web, `expo-font` on mobile).

In code: `@expo-google-fonts/archivo` (400–800) and `@expo-google-fonts/ibm-plex-mono` (400–700) are loaded with
`useFonts` in `AuthProvider`, which keeps the splash screen up until they are ready (a font that fails to load falls
back to the system font). Text goes through `src/components/ui/text.tsx`, which picks the face from the className:
`text-lg` and up → Archivo, smaller → IBM Plex Mono (`font-sans` / `font-mono` override), weight from `font-medium` …
`font-extrabold` (each weight is its own family on native). The Tailwind size scale is remapped to the variants:
`text-xs` = label / caption (11/16), `text-sm` and `text-base` = body (13/20), `text-lg` and `text-xl` = heading
(18/24), `text-2xl` = title (32/36), `text-3xl` = display (40/44). The label style is
`text-xs font-medium uppercase tracking-label` (0.88px = 0.08em at 11px).

## 4. Spacing, radius, elevation, motion

- Spacing: 4-pt base → 0, 4, 8, 12, 16, 24, 32, 48, 64. Page gutter 28 (18 on small screens). Max width 1400 (web).
- Radius: `0` everywhere — every `rounded-*` key in `tailwind.config.js` is 0, `rounded-full` included, so avatars
  (square crop, §7) and the small status dots are square too.
- Elevation: none; separation by 1px `border` lines (`shadow-*` classes compile to nothing). Faint vertical grid lines on the page background (web).
- Motion: `fast` 120 ms, `normal` 200 ms, ease-out; cursor-like blink allowed on the prompt only; off with reduce motion.
- Buttons: primary = `primary` background, `onPrimary` text, label like `./action →`; secondary = transparent,
  1px `borderStrong`, `textSoft` text.
- Touch targets ≥ 44 pt / 48 dp on mobile, ≥ 40px on web.

## 5. Components inventory

Primitives, defined once and reused (web: `Base*` components; mobile: `src/components/ui/`). A component is listed
here before it is used in two places; a new look is a new variant, never a copy.

| Component | Variants | States | Notes |
| --- | --- | --- | --- |
| `Button` | primary · secondary · ghost · danger (code: `primary`, `secondary` / `outline`, `ghost`, `destructive`) | default · hover/pressed · focus · disabled · loading | One primary action per screen; label in the `label` style, 44 pt min height |
| `Text` / headings | display · title · heading · body · label · caption | — | Only way to style text |
| `Input` / `Field` | default · error | focus · disabled | Label always visible, error below |
| `Card` | — | hover/pressed | |
| `Tag` / `Badge` | neutral · success · warning · danger | — | Colour + text, never colour alone |
| `EmptyState` | — | — | Message + action |
| `ErrorState` | — | — | Message + retry |
| `Skeleton` | line · block | — | Loading content |

## 6. Screens and navigation

Bottom tabs (custom `BottomTabBar`): **Home**, **Explore**, **Friends**, **Profile**. Jams and notifications are
stacks inside the tabs, hidden from the bar.

| Screen | Route | Primary action |
| --- | --- | --- |
| Sign in / Register | `(auth)/login`, `(auth)/register` | Sign in / Create account |
| Home | `(tabs)/index` | Create jam (also: calendar and notifications buttons in the header) |
| Explore (map + filters) | `(tabs)/explore` | Search this area |
| All jams | `jams/all` | Open a jam |
| Jam detail | `jams/[id]` | Join (or Join waitlist / Leave; Edit for the creator) |
| Create / edit jam | `jams/create`, `jams/edit/[id]` | Create jam / Save changes |
| Chat | `jams/chat/[id]` | Send |
| Friends, search, user profile | `friends/`, `friends/search`, `friends/[userId]` | Add friend / Accept |
| Profile, edit profile | `profile/`, `profile/edit` | Save |
| Notifications | `notifications` | Open the notification |

## 7. Icons and images

- Icons: `lucide-react-native`, sizes 16 / 20 / 24 (22 today in the header and quick actions); colour from a theme
  token, never a literal.
- Instruments and styles have their own icons (`src/utils/instrument-icons.ts`) shown in badges.
- Images: avatars through `expo-image` with cache, square crop; a placeholder with initials when there is none.
- Maps: `react-native-maps` with custom markers and clusters.

## 8. Voice

- English only, sentence case ("Create jam", "No jams nearby").
- Short and direct; buttons are verbs ("Join", "Save changes"), empty states say what to do next ("Be the first to
  organize a session in your area.").
- Errors say what failed ("Unable to load jams") and offer "Try again".
- Musician words: jam, session, instruments sought, skill level.

## 9. Do / don't

- Do: reuse primitives, keep one primary action per screen, check both themes and the smallest screen.
- Don't: hard-code colours or sizes, restyle a primitive in a screen, rely on colour alone, remove focus outlines,
  disable font scaling.

## 10. Moving the app to this design

Done on 2026-11-18 (visual change only: no copy, label, role, data or navigation change).

- Tokens: the §2 palette in `src/global.css` (light in `:root`, dark under `prefers-color-scheme: dark`),
  `tailwind.config.js` (colours from the variables, radius 0, no shadows, font families, the §3 size scale,
  `tracking-label`) and `src/constants/theme.ts` (same palette for React Navigation and native props).
- Fonts: Archivo and IBM Plex Mono through `expo-font` (see §3); the `Text` primitive replaces `Text` from
  `react-native` everywhere except the two protected map files below.
- Primitives restyled: `Button` (variants of §4, uppercase mono label), `Input` (label style, 1px `borderStrong`,
  focus line), `Card` (surface + 1px line), `Badge` / `InstrumentBadge` / `StyleBadge` (square tags; styles are
  neutral, the per-style colour map `src/utils/style-colors.ts` is gone), `Avatar`, `EmptyState`, `ErrorState`,
  `Loading`, `BottomTabBar` and the web tabs. Screens: accent text / lines / icons moved to `primaryText`, segmented
  tabs are underlined, field headings use the label style, map markers are square without shadow (selected =
  accent, others = ink), the skill-level marker colours are gone.
- Design check: 54 blocking, 42 major, 16 minor before → 2 blocking, 1 major, 16 minor after.

Remaining:

- `src/features/map/components/jam-map.tsx` (`shadowColor: '#000'`, `borderRadius: 22`, locate-me icon in `primary`
  on a light card = 2.59:1) and `src/features/map/components/map-explore-screen.tsx` (inline `style={{ top: … }}`,
  `Text` from `react-native` so system font, "Search this area" pill) were left out of the restyle because they
  held other uncommitted work; fixed afterwards (no shadow or radius, `primaryText` icon, design `Text`, overlay
  offset memoised). The design check is now 0 blocking, 0 major, 16 minor.
- `borderStrong` raised to ≥ 3:1 (light `#857f72`: 3.62 on `background`, 3.37 on `surfaceHover`; dark `#6b665a`:
  3.38 / 3.08), and the dark `secondaryAccent` lightened to `#d4daff` so it differs from the green by brightness
  too (1.88:1, was 1.02:1; 14.05:1 with `onSecondaryAccent` text).
- 16 `FlatList` → `FlashList` (minor; needs a dependency).
- The splash icon (`assets/images/splash-icon.png`) is still the Expo one; its background is now the dark
  `background` (`#0e0e0c`, `app.json` and `SplashBackground`).
- Not done (optional in the brief): the mono `01 — Section` title prefixes, the `./action →` primary label form,
  web focus outlines on pressables, the faint vertical grid on the web background, a `Skeleton` primitive.
- Not checked on a device or simulator yet: both themes, smallest screen and large text still need a visual pass.
