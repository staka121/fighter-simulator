# Fighter HUD

A fighter-jet-inspired heads-up display for the **Even Realities G2** smart
glasses, reimagined for walking. HUD symbology inspired by the F-16C is rendered
on the glasses and driven from your phone by GPS and motion — no controllers,
just you and the horizon. It's an homage, not an exact replica.

> The glasses only render; a Vite + TypeScript web app runs on the phone inside
> the Even app's WebView and bridges to the glasses over BLE.

## Features

**On the glasses**

- Pitch ladder, horizon line, boresight cross, and an IMU-driven flight path
  marker that leans with your movement.
- GPS airspeed and altitude boxes; a magnetic heading readout with a tick scale;
  a live clock.
- A heading-up radar **minimap** (top-right) showing where your goals are.
- Left block: master-arm state + missiles, average pace, exercise intensity
  (from motion), movement class (STOP / WALK / RUN / VEHICLE), and position.
- **Goal navigation** (right block): range, goal altitude, bearing, time-to-go,
  and steerpoint — a route with auto-advance and arrival tracking.

**On the phone**

- Pick destinations on an OpenStreetMap map (or type coordinates); altitude is
  auto-filled via Open-Meteo. Multiple goals, with reached ones struck through.

**Controls** — tap to fire missiles (with sound); scroll down for a settings
screen (Master Arm / Reload); double-tap to exit. Scroll works on the glasses
temple and the ring.

## Getting started (development)

Node 22 runs inside Docker so the host stays clean; drive it with the Makefile.

```bash
make build   # build the Node 22 image (first time only)
make up      # start the container
make dev     # (re)start the Vite dev server
make qr      # print a QR — scan it in the Even app's "Scan QR" (needs the glasses)
```

Dev-only browser tools (open after `make dev`):

- `http://localhost:5173/preview.html` — tune the central graphics with
  pitch/roll/FPM sliders.
- `http://localhost:5173/screenshot.html` — export 576×288 store-listing PNGs.

Run the checks before pushing (inside the container, e.g. `make sh`):

```bash
cd app && npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

## Project layout

- `app/` — the app (Vite + TypeScript). See **[ARCHITECTURE.md](ARCHITECTURE.md)**
  for the design and conventions, and **[CLAUDE.md](CLAUDE.md)** for the short
  rule list.
- `app/src/scene/f16c-hud/` — the glasses HUD scene (components, drivers,
  shared state, input handlers).
- `app/src/goal/` — the phone-side goal-setting UI.

## Contributing & releases

`main` is protected: land changes via a pull request; CI (typecheck, lint,
format, tests, build, secret scan, SAST) must pass. To release, bump
`app/app.json`'s `version` and push a matching `vX.Y.Z` tag — the release
workflow builds, packs the `.ehpk`, and creates the GitHub release.

## Privacy & attribution

No first-party data collection; goals are stored locally on your device. See
**[PRIVACY.md](PRIVACY.md)**. Maps © OpenStreetMap contributors; elevation by
Open-Meteo.
