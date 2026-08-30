import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Store } from '../scene/f16c-hud/store'

// Fallback centre until the first GPS fix (central Tokyo).
const DEFAULT_CENTER: [number, number] = [35.681, 139.767]
const DEFAULT_ZOOM = 15

export interface GoalMap {
  /** Redraw the goal markers (call after the list or active goal changes). */
  refreshGoals(): void
  /** Tear the map down. */
  destroy(): void
}

/**
 * Render an OSM slippy map into `el` for picking goals. Tapping the map calls
 * `onPick` with the coordinates (the caller fills the add form). Shows the live
 * position and the saved goals as markers. Uses OpenStreetMap tiles under their
 * Tile Usage Policy: HTTPS, attribution shown, only the viewed tiles loaded.
 */
export function mountGoalMap(
  el: HTMLElement,
  store: Store,
  onPick: (lat: number, lon: number) => void,
): GoalMap {
  const hasFix = store.lat != null && store.lon != null
  const center: [number, number] = hasFix ? [store.lat!, store.lon!] : DEFAULT_CENTER

  const map = L.map(el, { center, zoom: DEFAULT_ZOOM })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  // Default markers rely on image assets that break under bundlers; circle
  // markers are pure SVG, so no asset wiring is needed.
  const goalLayer = L.layerGroup().addTo(map)
  let nowMarker: L.CircleMarker | null = null
  let pickMarker: L.CircleMarker | null = null
  let centered = hasFix

  const refreshNow = () => {
    if (store.lat == null || store.lon == null) return
    const p: [number, number] = [store.lat, store.lon]
    if (nowMarker) nowMarker.setLatLng(p)
    else
      nowMarker = L.circleMarker(p, {
        radius: 6,
        color: '#4da3ff',
        fillColor: '#4da3ff',
        fillOpacity: 1,
      }).addTo(map)
    if (!centered) {
      map.setView(p, DEFAULT_ZOOM)
      centered = true
    }
  }

  const refreshGoals = () => {
    goalLayer.clearLayers()
    store.goals.forEach((g, i) => {
      const active = i === store.activeGoalIndex
      const color = active ? '#e5e5e5' : g.reached ? '#5a5a5a' : '#9a9a9a'
      L.circleMarker([g.lat, g.lon], {
        radius: 7,
        color,
        fillColor: color,
        fillOpacity: g.reached ? 0.5 : 0.9,
      })
        .bindTooltip(String(i + 1), { permanent: true, direction: 'top', offset: [0, -6] })
        .addTo(goalLayer)
    })
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    if (pickMarker) pickMarker.setLatLng([lat, lng])
    else
      pickMarker = L.circleMarker([lat, lng], {
        radius: 6,
        color: '#ffd24d',
        fillColor: '#ffd24d',
        fillOpacity: 0.9,
      }).addTo(map)
    onPick(lat, lng)
  })

  refreshNow()
  refreshGoals()
  const nowTimer = window.setInterval(refreshNow, 1000)
  // The container is sized by CSS after mount; recalc once laid out.
  setTimeout(() => map.invalidateSize(), 0)

  return {
    refreshGoals,
    destroy() {
      window.clearInterval(nowTimer)
      map.remove()
    },
  }
}
