# F-16C HUD (Even Realities G2)

An Even Hub app for the Even Realities **G2** smart glasses that renders F-16C
HUD symbology on the glasses while you walk around. Vite + TypeScript; the app
runs on the phone (in the Even app's WebView) and the glasses render.

This is the app package. Dev tooling (Docker, Makefile) and architecture docs
live in the repository root — see `../ARCHITECTURE.md` and `../CLAUDE.md`.

## Develop

From the repository root (tooling runs in Docker so the host stays clean):

```bash
make up          # start the Node 22 container
make dev         # start the Vite dev server
make qr          # print a QR; scan it in the Even app's "Scan QR"
make typecheck   # tsc --noEmit
make help        # list all targets
```

## Structure

```
src/
├── main.ts            # bootstrap: bridge + mount the scene
├── events.ts          # event predicates (isClick / isDoubleClick / isExit)
└── scene/f16c-hud/    # the HUD scene
    ├── index.ts       # lifecycle (enter / leave)
    ├── view.ts        # page containers
    ├── render.ts      # Canvas 2D → PNG bytes for image symbology
    └── event-handlers/ # register*(bridge) handlers
```
