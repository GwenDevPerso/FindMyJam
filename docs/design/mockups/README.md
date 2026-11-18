# Mockups — neon night

Visual reference for `DESIGN.md` (neon night). One file per screen, exported from the design canvas
"FindMyJam — style néon nocturne":

| File | Screen | Shows |
| --- | --- | --- |
| `home.dc.html` | Home | Header (calendar, bell with unread count), "Your next jam" hero with the horizon, "Jams near you" list sorted by distance |
| `explore-map.dc.html` | Explore | Distance segment (5/10/25/50 km), date chips, "Search this area", markers, radius circle, selected-jam sheet, empty state |
| `jam-detail.dc.html` | Jam detail | Horizon header, recurring badge, info grid, instruments sought, avatar stack, full jam → waitlist rank, locked chat for visitors |
| `chat.dc.html` | Chat | Series room header, bubbles (own = pink), composer, "messages can't be edited" hint |

The files are web markup (`.dc.html`, inline styles): read them for layout, sizes, colours and states, then build
with NativeWind tokens and the primitives of `DESIGN.md` §5 — never copy inline values into the app. Copy and sample
data in them are examples. Links between files use the canvas names (`Main`, `Map`, `Jam`, `Chat`).
