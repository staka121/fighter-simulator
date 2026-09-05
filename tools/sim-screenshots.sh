#!/usr/bin/env bash
#
# Capture Even store-listing screenshots from a running evenhub-simulator via its
# automation API. The output is the simulator's RAW 576x288 RGBA framebuffer —
# no editing, cropping, or post-processing. Even's review requires unedited
# simulator captures (self-composed / recoloured images get rejected).
#
# Usage: start the simulator first with `make sim` (it loads the dev server with
# `?demo`, so the GPS/IMU-driven readouts are populated), then `make screenshots`
# runs this. Override the output dir / port with SHOTS_DIR / SIM_PORT.
set -euo pipefail

PORT="${SIM_PORT:-9898}"
OUT="${SHOTS_DIR:-screenshots}"
API="http://127.0.0.1:${PORT}/api"

mkdir -p "$OUT"

# Wait for the simulator's control plane to come up.
for _ in $(seq 1 30); do
  [ "$(curl -s -m1 "$API/ping" 2>/dev/null || true)" = "pong" ] && break
  sleep 1
done
if [ "$(curl -s -m1 "$API/ping" 2>/dev/null || true)" != "pong" ]; then
  echo "error: simulator not reachable on :$PORT — run 'make sim' (and 'make dev')" >&2
  exit 1
fi

shot() { curl -s "$API/screenshot/glasses" -o "$OUT/$1"; echo "  saved $OUT/$1"; }
# Drive the touchpad: click / up / down. Second arg = seconds to settle after.
tap() {
  curl -s -X POST "$API/input" -H 'Content-Type: application/json' \
    -d "{\"action\":\"$1\"}" -o /dev/null
  sleep "${2:-1}"
}

echo "Capturing store screenshots into $OUT/ ..."
sleep 5 # let SDK init finish, the tiles render, and the IMU ease into its bank

shot "1-hud.png" # HUD: banked attitude + fully populated readouts

tap down 1 # scroll down -> open the settings screen (cursor on the first row)
shot "2-settings.png"

tap down 1  # cursor -> Reload
tap down 1  # cursor -> Close
tap click 3 # activate Close -> back to the HUD (attitude re-levels)
shot "3-hud-alt.png"

echo "Done. These are raw simulator captures — submit them unedited."
