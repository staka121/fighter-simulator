# Architecture

How this app is structured, and the conventions to follow when adding to it.
Read this before implementing a new feature so the codebase stays consistent.

## Mental model

This is an **Even Hub app for the Even Realities G2 glasses**. Three facts drive
every design decision:

- **The app is a web app that runs on the phone**, inside the Even app's WebView.
  The glasses only render; the phone holds the logic and bridges to the glasses
  over BLE. The same WebView also shows a **phone-side UI** (the goal panel).
- **Everything glasses-facing goes through the bridge.** `waitForEvenAppBridge()`
  returns an `EvenAppBridge`; every glasses command (`createStartUpPageContainer`,
  `rebuildPageContainer`, `textContainerUpgrade`, `updateImageRawData`,
  `onEvenHubEvent`, …) is a method on it.
- **The display is small and monochrome.** Each eye is `576 × 288` px, origin
  top-left (X right, Y down), 4-bit grayscale (green). Text color levels 0–4.

The runtime is Node 22 inside Docker (the host stays clean); see **Dev workflow**.

## Directory layout

```
src/
├── main.ts                # Bootstrap: get the bridge, create the shared store,
│                          # load persisted goals, mount the phone goal panel,
│                          # enter the scene (passing the store), tear down on exit.
├── events.ts              # Event predicates: isClick / isDoubleClick /
│                          # isScrollUp / isScrollDown / isExit (hides the
│                          # protobuf zero-value quirk, below).
├── goal/                  # Phone-side UI (renders into the WebView, not the glasses).
│   ├── goalPanel.ts       #   destination list + add form + live position; polls
│   │                      #   the shared store so glasses-driven changes show up.
│   ├── map.ts             #   Leaflet + OpenStreetMap tap-to-pick map.
│   ├── elevation.ts       #   Open-Meteo elevation lookup (auto-fills goal altitude).
│   ├── goalStorage.ts     #   localStorage persistence of the goal list.
│   └── coords.ts          #   coordinate parse/format (pure, tested).
└── scene/
    ├── types.ts           # The Scene interface (enter / leave).
    └── f16c-hud/          # One scene = one directory = one glasses screen.
        ├── index.ts       #   createF16cHudScene(store): lifecycle + wiring + mode switch.
        ├── view.ts        #   page builders (buildView / buildHudRebuild / buildSettingsRebuild).
        ├── store.ts       #   shared state contract (Store, createStore, GoalPoint, …).
        ├── geo.ts         #   geodesy helpers (distance, bearing, angle).
        ├── image-sender.ts#   the one serial image-send channel (below).
        ├── settings.ts    #   the scroll-opened settings screen (cursor list).
        ├── event-handlers/#   register<Thing>(bridge): one input/subscription per file.
        └── components/    #   feature units — each exposes a public API via index.ts.
```

**Components today:** `center-panel` (moving central graphics — ladder / horizon
/ boresight / flight-path marker), `speed`, `altitude`, `heading` (static tick
strips + a text number box), `minimap` (heading-up radar image tile), `left-data`
(weapons + walking telemetry text block), `goal-nav` (right block: range /
bearing / ETA / steerpoint), `clock`, and `weapons` (master arm + missiles).

## Core concepts

### Scene (`scene/types.ts`)

A **Scene** is one glasses screen. Its lifecycle mirrors mount/unmount:

```ts
interface Scene {
  enter(bridge: EvenAppBridge): Promise<void>  // render + register handlers
  leave(): void                                // run every cleanup
}
```

`createF16cHudScene(store)` takes the shared store (owned by `main.ts`). It keeps
**two cleanup groups**: `persistent` (data sources, tap/scroll input) live for
the whole scene; `hud` (the rendering drivers + weapons) run only in HUD mode and
are torn down while the settings screen is shown, so drivers never send to
containers that aren't on the current page.

### Shared state (`scene/<name>/store.ts`)

The store is a **scene-level contract**, not a component: data sources write it,
renderers read it.

- **Sources** (`register*` handlers) mutate it: `registerLocation` writes GPS
  speed / heading / altitude / position and the goal list is written by the
  phone UI; `registerImuSampler` / `registerIntensity` write motion state.
- **Renderers** (component drivers) read it and push to the glasses.
- `main.ts` creates the store and passes it to **both** the scene and the phone
  goal panel, so the glasses and the phone share one source of truth. Adding a
  field is an explicit change to the contract (touch `store.ts`), not a reach
  into a component.

### Components (`scene/<name>/components/<component>/`)

A component is a self-contained region of the HUD or a subsystem. Each one:

- lives in its own directory under `components/`;
- exposes its public API through an **`index.ts` barrel** (`export { ... }`);
- keeps everything else internal — implementation, `types.ts` (constants +
  types), pure logic in a testable file (e.g. `format.ts`, `projection.ts`),
  and a `render/` folder (one draw function per file) for graphics.

A typical component owns three things: a **container builder**
(`build<X>Container()`), a **pure formatter/geometry** (unit-tested), and a
**driver** (`start<X>Driver(...)`) that reads the store and pushes to the glasses
~1 Hz on change, returning a stop fn. **Import components through their barrel**
(`./components/<name>`), never a deep path.

### Event handlers (`scene/<name>/event-handlers/register*.ts`)

Each is a function named **`register<Thing>(bridge, …)`** that:

1. **Runs immediately** — subscribes via `bridge.onEvenHubEvent(...)` on call.
2. **Returns its unsubscribe** — the cleanup the scene runs on `leave`.

`onEvenHubEvent` supports multiple concurrent listeners, so each handler
subscribes independently and filters for only its own event type; handlers never
collide. Do **not** name them `use*` or put them in a `hooks/` folder — they are
not React hooks; `register*` states the truth ("call now, a subscription is
created, you get a disposer back").

### Event predicates (`events.ts`)

Never read `event.sysEvent?.eventType` directly. `CLICK_EVENT` is `0`, and
protobuf omits zero-value fields, so a real tap arrives with `eventType ===
undefined`. `events.ts` centralizes this: use `isClick`, `isDoubleClick`,
`isScrollUp`, `isScrollDown`, `isExit`. Add new predicates there.

## Input model & screen switching

- **Tap** (`CLICK`): fires a missile in HUD mode; activates the cursor row in
  settings mode. One handler dispatches by mode.
- **Double-tap**: exits the app.
- **Scroll** (`SCROLL_TOP` / `SCROLL_BOTTOM`, works on the glasses temple *and*
  the ring): scroll down opens settings from the HUD, otherwise moves the
  settings cursor; scroll up moves the cursor / returns to the HUD.
- The HUD ↔ settings switch uses **`rebuildPageContainer`** (not a second
  `createStartUpPageContainer`, which is one-shot). Entering settings stops the
  HUD drivers and rebuilds to the settings page; leaving rebuilds the HUD page
  and restarts the drivers.
- The **OS long-press menu is not used**: the SDK menu is a flat list the
  firmware sandwiches between its own items (no submenus, no ordering control),
  so settings live in the scroll-opened screen instead.

## Display & SDK constraints (must-know)

- **`createStartUpPageContainer` only once**, at first render. Change the screen
  with `textContainerUpgrade` or `rebuildPageContainer` afterwards.
- **Exactly one container** per page has `isEventCapture=1`; all others `0`.
- `containerTotalNum` **1–12**; at most **8** text containers and **4** image
  containers per page; initial text ≲ 1,000 chars.
- Canvas is `576 × 288` per eye, origin top-left, 4-bit grayscale (green).

## Graphical symbology via Canvas → PNG (verified recipe)

Text containers cover alphanumeric readouts. For graphics use **image
containers** with this recipe (reverse-engineered, verified on-device):

- Draw white-on-black with the **Canvas 2D API**, then export PNG bytes:
  `canvas.toBlob('image/png')` → `arrayBuffer()` → `Uint8Array`. White = lit
  green, black = off. See `components/center-panel/render/` (`drawHud`,
  `renderTilePng`).
- **Do not** pass base64 or hand-packed raw pixels — both fail (`sendFailed` /
  `imageException`). Only ENCODED image bytes work.
- **Image width must be ≤ 288**; a wider image breaks page creation. Moving
  graphics live in centred tiles (the panel is one 288×144 tile).
- Image containers can't `isEventCapture`. A full-canvas transparent text
  container (`content: ' '`, `isEventCapture: 1`) sits behind them to catch
  taps/scrolls.

### The shared image sender (`image-sender.ts`)

The glasses require raw-image sends to be **serial**, but the panel, minimap and
heading tiles are independent loops. All of them send through one
`createImageSender(bridge, priorityId)`:

- keeps **one send in flight** at a time;
- **coalesces per tile** — only the latest pending frame per tile is sent, stale
  frames are dropped (bounded backlog);
- drains a **priority tile** (the moving panel) first, so its cadence stays
  regular while slower tiles fill the gaps.

Drivers call the injected `send(id, name, bytes)` — never `updateImageRawData`
directly. Static images (the heading tick strips) are sent once and re-sent on a
slow heartbeat so they survive an image reset.

## Animated symbology (throttled redraw loop)

Dynamic graphics use an async loop that recomputes state each tick and re-renders
**only when the output actually changed** (a pixel-quantised key), throttled to a
few Hz. The scene owns the loops and stops them in `leave` / on entering
settings.

- IMU: `imuControl(true, ImuReportPace.P500)` streams `sysEvent.imuData {x,y,z}`
  (accelerometer; head pitch→x, yaw→y, z≈vertical). `registerImuSampler` samples
  the latest value into a mutable sink the panel loop reads.
- Motion is smoothed (low-pass + spring-damper) and hard-clamped so violent
  turns can't push symbology off-screen.

## Phone-side UI (`src/goal/`)

The WebView shows a **goal panel** on the phone: the live position, a list of
destinations (tap to make active, ✕ to delete; reached goals struck through), a
tap-to-pick **OpenStreetMap** map (Leaflet), and an add form whose altitude is
auto-filled from the **Open-Meteo** elevation API. It reads/writes the same
`store.goals` the glasses navigate to, persists to `localStorage`, and polls the
store ~1 Hz so glasses-driven changes (auto-advance / reached) show up live.

Both external services are disclosed in `PRIVACY.md`; there is no first-party
data collection.

## Naming conventions

- **Directories** kebab-case; **event handlers** `register<Thing>`; **scene
  factories** `create<Name>Scene`; **drivers** `start<X>Driver`; files match
  their primary export.
- **Comments and identifiers**: English (public repo).

## Dev workflow

```bash
make build   # build the Node 22 image (first time)
make up      # start the container
make dev     # (re)start Vite in the container
make qr      # print the QR; scan it in the Even app's "Scan QR"
make sh      # shell into the container
```

Dev-only browser tools (not packaged): `preview.html` tunes the central graphics
with pitch/roll/FPM sliders; `screenshot.html` composes the whole HUD at
576×288 and exports store-listing PNGs.

Ship via a `vX.Y.Z` tag: bump `app/app.json` (in a PR), push the matching tag,
and `.github/workflows/release.yml` builds, packs the `.ehpk`, and cuts the
GitHub release.
