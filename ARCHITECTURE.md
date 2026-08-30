# Architecture

How this app is structured, and the conventions to follow when adding to it.
Read this before implementing a new feature so the codebase stays consistent.

## Mental model

This is an **Even Hub app for the Even Realities G2 glasses**. Three facts drive
every design decision:

- **The app is a web app that runs on the phone**, inside the Even app's WebView.
  The glasses only render; the phone holds the logic and bridges to the glasses
  over BLE.
- **Everything goes through the bridge.** `waitForEvenAppBridge()` returns an
  `EvenAppBridge`; every glasses command (`createStartUpPageContainer`,
  `textContainerUpgrade`, `shutDownPageContainer`, `onEvenHubEvent`, …) is a
  method on it.
- **The display is small and monochrome.** Each eye is `576 × 288` px, origin
  top-left (X right, Y down), 4-bit grayscale (green). Text color levels 0–4.

The runtime is Node 22 inside Docker (the host stays clean). See `README`-level
dev commands below; deeper notes live in `NOTES.md` (git-ignored).

## Directory layout

```
src/
├── main.ts              # Bootstrap: get the bridge, mount the initial scene,
│                        # tear it down on exit. Nothing app-specific here.
├── events.ts            # Shared event predicates: isClick / isDoubleClick /
│                        # isExit. Hides the protobuf zero-value quirk (below).
└── scene/
    ├── types.ts         # The Scene interface (enter / leave).
    └── <name>/          # One scene = one directory = one screen.
        ├── index.ts     # create<Name>Scene(): the lifecycle + wiring.
        ├── view.ts      # buildView(): assembles all the page containers.
        ├── readouts.ts  # text-container layout (positions, sizes, initial text).
        ├── event-handlers/          # register<Thing>(bridge): one input/subscription per file.
        │   └── register<Thing>.ts
        └── components/              # feature units — each exposes a public API via index.ts
            └── <component>/
                ├── index.ts         # barrel: re-exports the component's public API
                ├── <logic>.ts       # driver / system / state
                ├── types.ts         # (when it grows) shared constants + types
                └── <sub>/           # (when it grows) e.g. render/ — one draw fn per file
```

The `f16c-hud` scene's components today: `center-panel` (the moving central
graphics — `types.ts`, `hudDriver.ts`, `render/`), `telemetry` (the left data
block: weapons + movement), and `weapons` (master arm + missiles).

## Core concepts

### Scene (`scene/types.ts`)

A **Scene** is one screen. Its lifecycle mirrors mount/unmount:

```ts
interface Scene {
  enter(bridge: EvenAppBridge): Promise<void>  // render + register handlers
  leave(): void                                // run every cleanup
}
```

`enter` renders the view and registers the scene's event handlers, keeping each
handler's unsubscribe. `leave` runs them all to tear the subscriptions down.

### Components (`scene/<name>/components/<component>/`)

A component is a self-contained feature unit (a region of the HUD or a
subsystem). Each one:

- lives in its own directory under `components/`;
- exposes its public API through an **`index.ts` barrel** (`export { ... }`);
- keeps everything else internal — implementation, `types.ts` (shared constants
  + types, added once it grows), and subfolders like `render/` (one draw
  function per file) when the file count warrants it.

**Import components through their barrel** (`./components/<name>`), never a deep
path. Small components can be just `index.ts` + an implementation file; only
split further when a file gets crowded. This is the target shape for every new
component.

### Event handlers (`scene/<name>/event-handlers/register*.ts`)

Each event handler is a function named **`register<Thing>(bridge)`** that:

1. **Runs immediately** — it subscribes via `bridge.onEvenHubEvent(...)` on call.
2. **Returns its unsubscribe** — the cleanup the scene runs on `leave`.

```ts
export function registerTapCounter(bridge: EvenAppBridge): () => void {
  let taps = 0
  return bridge.onEvenHubEvent(event => {   // subscribe now
    if (!isClick(event)) return
    taps += 1
    bridge.textContainerUpgrade(/* ... */)
  })                                        // ← the returned unsubscribe
}
```

The scene collects them:

```ts
cleanups = [registerExitOnDoubleTap(bridge), registerTapCounter(bridge)]
// leave(): cleanups.forEach(unsubscribe => unsubscribe())
```

> **Why `register*`, not `use*`/`hooks/`?** These are not React hooks — there is
> no reactivity and no render cycle. `register*` states the truth: "call now, a
> subscription is created, you get a disposer back." Do not reintroduce the
> `use*` naming.

> **Multiple listeners are fine.** `onEvenHubEvent` supports multiple concurrent
> listeners (verified on-device), so each handler subscribes independently. A
> handler filters for only its own event type, so handlers never collide — e.g.
> the tap counter only reacts to CLICK, exit only to DOUBLE_CLICK.

### Event predicates (`events.ts`)

Never read `event.sysEvent?.eventType` directly. `CLICK_EVENT` is `0`, and
protobuf omits zero-value fields, so a real tap arrives as an envelope whose
`eventType` is `undefined`. `events.ts` centralizes this: use `isClick`,
`isDoubleClick`, `isExit`. Add new predicates there rather than re-deriving the
quirk in a handler.

## How to add a new scene

1. `mkdir src/scene/<name>` with `index.ts`, `view.ts`, `event-handlers/`.
2. `view.ts`: export `buildView()` returning a `CreateStartUpPageContainer` (or
   the appropriate rebuild payload — see the switching note below). Keep the
   container id/name and any reused strings as exported consts here.
3. `event-handlers/register<Thing>.ts`: one handler per file, `register*(bridge)`
   returning an unsubscribe. Filter events with the `events.ts` predicates.
4. `index.ts`: `export function create<Name>Scene(): Scene` that renders in
   `enter`, pushes each `register*` result into `cleanups`, and runs them in
   `leave`.
5. Mount it from `main.ts` (until a scene manager exists — see below).

## Naming conventions

- **Directories**: kebab-case (`event-handlers`, `scene`).
- **Event handlers**: `register<Thing>` (verb-first, returns unsubscribe).
- **Scene factories**: `create<Name>Scene`.
- **Files**: match the primary export (`registerTapCounter.ts`).
- **Comments and identifiers**: English (this is a public repo).

## Display & SDK constraints (must-know)

- **`createStartUpPageContainer` may be called only once**, at first render.
  Calling it again has no effect. To change what's on screen afterwards, use
  `textContainerUpgrade` (update a container in place) or `RebuildPageContainer`.
- **Exactly one container** in a page must have `isEventCapture=1`; all others
  `0`.
- `containerTotalNum` is **1–12**; at most **8** text containers per page.
- Initial text content is capped around **1,000 chars**.
- Image containers need `updateImageRawData` after creation to show content.

## Graphical symbology via Canvas → PNG (verified recipe)

Text containers cover alphanumeric readouts. For graphics (cross, FPM, pitch
ladder, circles/lines), use **image containers** with this recipe — reverse-
engineered and verified on-device:

- Draw white-on-black with the **Canvas 2D API**, then export PNG bytes:
  `canvas.toBlob('image/png')` → `arrayBuffer()` → `Uint8Array`. White = lit
  green, black = off. See `components/center-panel/render/` (`drawHud`,
  `renderTilePng`).
- Pass those bytes to `bridge.updateImageRawData({ containerID, containerName,
  imageData })` as a **`Uint8Array` of ENCODED image bytes**. The host decodes,
  resizes, and converts to 4-bit greyscale itself.
  - Do **not** pass a base64 string or hand-packed raw pixels — both fail
    (`sendFailed` / `imageException`). Encoded PNG/JPEG bytes are what works.
- `updateImageRawData` result is `success` | `imageException` |
  `imageSizeInvalid` | `imageToGray4Failed` | `sendFailed`. Must be **serial**
  (one send in flight at a time); await each.
- Image containers can't `isEventCapture`. Put a full-canvas transparent text
  container (content `' '`, `isEventCapture: 1`) behind them to receive taps.

## Animated symbology (throttled redraw loop)

Dynamic graphics (e.g. the IMU-driven flight path marker) use an async loop that
recomputes state each tick and re-sends the image — but **only when the pixels
actually changed**, throttled (`~8 Hz`) because images can't be sent too often.
The scene owns the loop and stops it in `leave` (also `imuControl(false)` and
unsubscribe). See `components/center-panel/hudDriver.ts`.

- IMU: `imuControl(true, ImuReportPace.P500)` streams `sysEvent.imuData {x,y,z}`
  (accelerometer; head pitch→x, yaw→y, z≈vertical). A `register*` handler
  samples the latest value into a mutable sink the loop reads.
- Motion is smoothed with a low-pass on the input + a spring-damper, and the
  position is hard-clamped so violent turns can't push symbology off-screen.

## Open design questions

- **Scene switching.** Only one scene exists today, mounted once. Because
  `createStartUpPageContainer` is one-shot, switching scenes must go through
  `RebuildPageContainer` (not a second `createStartUpPageContainer`). A
  `SceneManager` (mount/unmount/switch) should be introduced when the second
  scene lands, and this section updated with the chosen approach.

## Dev workflow

```bash
make build   # build the Node 22 image (first time)
make up      # start the container
make dev     # (re)start Vite in the container
make qr      # print the QR; scan it in the Even app's "Scan QR"
make sh      # shell into the container
make help    # list targets
```

The CLI is a project devDependency (not global); npm scripts and `make qr` run
it via the project's `node_modules`.
