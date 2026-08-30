# CLAUDE.md

Guidance for Claude Code when working in this repo. Read `ARCHITECTURE.md` for
the full design; this file is the short list of rules to follow.

## What this is

An Even Hub app for the Even Realities **G2** smart glasses. The app is a
**Vite + TypeScript web app that runs on the phone** (inside the Even app's
WebView); the glasses only render. All glasses commands go through the
`EvenAppBridge` from `waitForEvenAppBridge()`. App code lives in `app/`.

## Environment — always use Docker, never the host

The Even Hub tooling targets **Node 22**, kept isolated in Docker. Do **not**
install Node or npm packages on the host. Use the Makefile:

```bash
make up          # start the container
make dev         # (re)start Vite (background)
make typecheck   # tsc --noEmit  ← run this after code changes
make qr          # print the QR (the USER scans it; see below)
make sh          # shell into the container
make help        # list targets
```

Run npm/npx/tsc **inside** the container (`make sh`, or
`docker compose exec dev bash -lc 'cd /workspace/app && ...'`), not on the host.

## Architecture rules (see ARCHITECTURE.md for detail)

- **One scene = one directory** under `src/scene/<name>/`: `index.ts`
  (`create<Name>Scene(store)` with `enter`/`leave`), `view.ts` (the page
  builders), `event-handlers/`, and `components/`. Scene-level cross-cutting
  modules live beside them: `store.ts` (shared state), `geo.ts`,
  `image-sender.ts`, `settings.ts`.
- **Features are components** under `components/<name>/`, each exposing a public
  API via an **`index.ts` barrel**. Import from the barrel (`./components/<name>`),
  never a deep path. Split internals (`types.ts`, a `render/` folder, …) only as
  a component grows. This is the target shape for new features.
- **Shared state is `store.ts`** — a scene-level contract: data-source handlers
  write it, components render from it. `main.ts` owns the store and passes it to
  both the glasses scene and the phone-side UI (`src/goal/`), so both read/write
  one state. Adding a field is an explicit change to that contract.
- **Event handlers are `register<Thing>(bridge)`** — they subscribe immediately
  and **return their unsubscribe**. The scene collects these and runs them in
  `leave`. Do **not** name them `use*` or put them in a `hooks/` folder — they
  are not React hooks.
- **Never read `event.sysEvent?.eventType` directly.** Use the predicates in
  `src/events.ts` (`isClick` / `isDoubleClick` / `isScrollUp` / `isScrollDown` /
  `isExit`); add new ones there. (Rationale: `CLICK_EVENT` is 0 and protobuf
  drops zero-value fields, so a tap arrives with `eventType === undefined`.)

## Image / graphical symbology

- Draw graphics with the **Canvas 2D API** (white-on-black), export PNG bytes
  (`canvas.toBlob('image/png')` → `Uint8Array`), and pass that Uint8Array as
  `imageData` to `updateImageRawData`. The host converts to 4-bit greyscale.
- Do NOT pass base64 strings or hand-packed raw pixels — they fail
  (`sendFailed` / `imageException`). Only ENCODED image bytes work. Image
  containers need a transparent capture text layer behind them.
- **All image sends go through the shared `image-sender.ts`** — the glasses
  require serial sends, so it keeps one in flight, coalesces to the latest frame
  per tile, and drains a priority tile (the moving panel) first. Never call
  `updateImageRawData` directly from a driver; use the injected sender.
  See ARCHITECTURE.md "Graphical symbology" and
  `scene/f16c-hud/components/center-panel/render/`.

## Hard SDK constraints

- `createStartUpPageContainer` may be called **only once**, at first render.
  Change the screen afterwards with `textContainerUpgrade` or
  `RebuildPageContainer` — never a second `createStartUpPageContainer`. (The
  HUD ↔ settings switch uses `RebuildPageContainer`; scroll opens settings.)
- **Custom OS long-press menu is a flat list only** (`menuItems`, ≤10, `itemName`
  + `itemID`) and the firmware sandwiches it between its own items. No submenus,
  no position control — that's why settings moved to a scroll-opened screen.
- **Exactly one** container per page has `isEventCapture=1`; others `0`.
- `containerTotalNum` 1–12; at most 8 text containers; initial text ≲1000 chars.
- Canvas is `576 × 288` per eye, origin top-left, 4-bit grayscale (green).

## CI & PR flow

- `main` is protected — land changes via a pull request, never push to `main`.
  Branch, push, open a PR; CI must pass before merge.
- CI (`.github/workflows/ci.yml`) runs in `app/`: `npm run typecheck`, `lint`
  (ESLint), `format:check` (Prettier), `test` (Vitest), `build` — plus secret
  scanning (betterleaks) and SAST (semgrep). Run these locally before pushing:
  `cd app` then `npm run typecheck && npm run lint && npm run format:check &&
  npm test`. `npm run format` auto-fixes style. Add a Vitest `*.test.ts` for new
  pure logic.
- **Release is tag-triggered.** Bump `app/app.json` `version` (via a PR), then
  push a matching `vX.Y.Z` tag; `.github/workflows/release.yml` builds, packs the
  `.ehpk` (`npm run pack`), and creates the GitHub release. The tag must equal
  the `app.json` version or the workflow fails.

## Third-party services (disclose in PRIVACY.md)

The phone UI calls two external services — keep `PRIVACY.md` in sync if this
changes: **OpenStreetMap** tiles (map picker; attribution shown, light use per
their tile policy) and **Open-Meteo** elevation (auto-fills a goal's altitude).
No first-party data collection; goals live in `localStorage`.

## Conventions

- **English only** for all code, comments, and committed docs (public repo).
- Directories kebab-case; scene factories `create<Name>Scene`; handlers
  `register<Thing>`; files match their primary export.
- After changing app code, run `make typecheck` before considering it done.

## Visual iteration (browser preview)

For tuning the LOOK of graphical symbology without scanning the glasses each
time, use the dev-only preview: `make dev`, then open
`http://localhost:5173/preview.html` in a browser. It renders the real
`drawHud` code to a canvas (green-on-black, with pitch/roll/FPM sliders).
`http://localhost:5173/screenshot.html` composes the whole HUD (all real
components) at 576×288 and exports store-listing PNGs. Both `*.html` /
`src/{preview,screenshot}.ts` are dev tools — not part of the packaged app.

## Testing on real hardware

Previewing on the glasses needs the **user** to scan a QR with the phone and
has real hardware in hand — Claude cannot do this step. When a change needs
on-device verification, run `make dev`, tell the user to run `make qr` and
scan, and ask them what the glasses showed.

## Notes

- `NOTES.md` is git-ignored local scratch notes (findings, decisions). Keep it
  updated but it is not part of the public repo.
