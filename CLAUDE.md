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
  (`create<Name>Scene()` with `enter`/`leave`), `view.ts` (`buildView()` +
  shared consts), and `event-handlers/`.
- **Event handlers are `register<Thing>(bridge)`** — they subscribe immediately
  and **return their unsubscribe**. The scene collects these and runs them in
  `leave`. Do **not** name them `use*` or put them in a `hooks/` folder — they
  are not React hooks.
- **Never read `event.sysEvent?.eventType` directly.** Use the predicates in
  `src/events.ts` (`isClick` / `isDoubleClick` / `isExit`); add new ones there.
  (Rationale: `CLICK_EVENT` is 0 and protobuf drops zero-value fields, so a tap
  arrives with `eventType === undefined`.)

## Image / graphical symbology

- Draw graphics with the **Canvas 2D API** (white-on-black), export PNG bytes
  (`canvas.toBlob('image/png')` → `Uint8Array`), and pass that Uint8Array as
  `imageData` to `updateImageRawData`. The host converts to 4-bit greyscale.
- Do NOT pass base64 strings or hand-packed raw pixels — they fail
  (`sendFailed` / `imageException`). Only ENCODED image bytes work. Sends must
  be serial. Image containers need a transparent capture text layer behind them.
  See ARCHITECTURE.md "Graphical symbology" and `scene/f16c-hud/render.ts`.

## Hard SDK constraints

- `createStartUpPageContainer` may be called **only once**, at first render.
  Change the screen afterwards with `textContainerUpgrade` or
  `RebuildPageContainer` — never a second `createStartUpPageContainer`.
- **Exactly one** container per page has `isEventCapture=1`; others `0`.
- `containerTotalNum` 1–12; at most 8 text containers; initial text ≲1000 chars.
- Canvas is `576 × 288` per eye, origin top-left, 4-bit grayscale (green).

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
`preview.html` / `src/preview.ts` are dev tools — not part of the packaged app.

## Testing on real hardware

Previewing on the glasses needs the **user** to scan a QR with the phone and
has real hardware in hand — Claude cannot do this step. When a change needs
on-device verification, run `make dev`, tell the user to run `make qr` and
scan, and ask them what the glasses showed.

## Notes

- `NOTES.md` is git-ignored local scratch notes (findings, decisions). Keep it
  updated but it is not part of the public repo.
