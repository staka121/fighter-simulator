import type { Store } from '../scene/f16c-hud/store'
import { parseGoalInput, formatCoord } from './coords'
import { saveGoals } from './goalStorage'
import { mountGoalMap } from './map'
import { fetchElevation } from './elevation'

const STYLE_ID = 'goal-panel-style'

// ER brand dark surface; large tap targets for a phone held at arm's length.
const CSS = `
.gp { width: 100%; max-width: 360px; text-align: left; }
.gp-title { margin: 0 0 2px; font-size: 18px; font-weight: 600; }
.gp-sub { margin: 0 0 16px; font-size: 12px; opacity: 0.6; }
.gp-card { background: #2c2c2c; border: 1px solid #3a3a3a; border-radius: 12px; padding: 16px; }
.gp-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; margin-bottom: 8px; }
.gp-row span { opacity: 0.6; }
.gp-row b { font-variant-numeric: tabular-nums; }
.gp-list { margin: 8px 0 4px; display: flex; flex-direction: column; gap: 6px; }
.gp-empty { font-size: 12px; opacity: 0.5; padding: 6px 2px; }
.gp-item { display: flex; align-items: center; gap: 8px; background: #232323; border: 1px solid #3a3a3a; border-radius: 8px; padding: 8px 10px; }
.gp-item.active { border-color: #e5e5e5; }
.gp-pick { flex: 1; display: flex; align-items: center; gap: 8px; text-align: left; background: none; border: 0; color: #e5e5e5; font-size: 13px; padding: 0; }
.gp-mark { width: 12px; opacity: 0.9; }
.gp-n { opacity: 0.6; font-variant-numeric: tabular-nums; }
.gp-c { font-variant-numeric: tabular-nums; }
.gp-del { background: none; border: 0; color: #ff8a8a; font-size: 16px; padding: 2px 6px; }
.gp-map { height: 220px; border-radius: 8px; overflow: hidden; margin: 10px 0 4px; background: #232323; }
.gp-hint { font-size: 11px; opacity: 0.5; margin: 0 0 2px; }
.gp-sep { border: 0; border-top: 1px solid #3a3a3a; margin: 12px 0; }
/* Leaflet controls readable on the dark surface. */
.gp-map .leaflet-control-attribution { font-size: 10px; }
.gp-field { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 13px; opacity: 0.8; }
.gp-field input { flex: 1; background: #232323; border: 1px solid #444; border-radius: 8px; color: #e5e5e5; padding: 10px 12px; font-size: 16px; font-variant-numeric: tabular-nums; }
.gp-err { min-height: 16px; margin-top: 8px; font-size: 12px; color: #ff8a8a; }
.gp-btns { display: flex; gap: 10px; margin-top: 4px; }
.gp-btn { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #444; background: #e5e5e5; color: #232323; font-size: 14px; font-weight: 600; }
`

function injectStyleOnce(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

/**
 * Render the phone-side goal panel into `root`: the live GPS position, a list of
 * saved destinations (tap to make active, ✕ to delete), and an add form. Writes
 * the goal list into the shared store and persists it. The glasses navigate to
 * the active goal (`activeGoal(store)`).
 */
export function mountGoalPanel(root: HTMLElement, store: Store): void {
  injectStyleOnce()
  root.innerHTML = `
    <div class="gp">
      <h1 class="gp-title">Fighter HUD</h1>
      <p class="gp-sub">Running — check the glasses.</p>
      <div class="gp-card">
        <div class="gp-row"><span>Now</span><b id="gp-now">acquiring…</b></div>
        <div class="gp-list" id="gp-list"></div>
        <hr class="gp-sep" />
        <p class="gp-hint">Tap the map to pick a goal, or type coordinates.</p>
        <div class="gp-map" id="gp-map"></div>
        <label class="gp-field">Lat<input id="gp-lat" inputmode="decimal" placeholder="35.68120" /></label>
        <label class="gp-field">Lon<input id="gp-lon" inputmode="decimal" placeholder="139.76710" /></label>
        <label class="gp-field">Alt<input id="gp-alt" inputmode="decimal" placeholder="auto from location" /></label>
        <div id="gp-err" class="gp-err"></div>
        <div class="gp-btns"><button id="gp-add" class="gp-btn">Add Goal</button></div>
      </div>
    </div>`

  const pick = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!
  const nowEl = pick('gp-now')
  const listEl = pick('gp-list')
  const errEl = pick('gp-err')
  const latInput = pick<HTMLInputElement>('gp-lat')
  const lonInput = pick<HTMLInputElement>('gp-lon')
  const altInput = pick<HTMLInputElement>('gp-alt')

  // Altitude is hard to enter by hand, so derive it from the coordinate via the
  // elevation API and fill the field. Editable, so it can still be overridden.
  const autofillAlt = async (lat: number, lon: number) => {
    altInput.value = ''
    altInput.placeholder = 'fetching…'
    const elev = await fetchElevation(lat, lon)
    altInput.placeholder = 'auto from location'
    if (elev != null) altInput.value = String(Math.round(elev))
  }

  // Tapping the map fills the add form and auto-fetches the altitude.
  const goalMap = mountGoalMap(pick('gp-map'), store, (lat, lon) => {
    latInput.value = lat.toFixed(5)
    lonInput.value = lon.toFixed(5)
    errEl.textContent = ''
    void autofillAlt(lat, lon)
  })

  const renderNow = () => {
    nowEl.textContent =
      store.lat != null && store.lon != null ? formatCoord(store.lat, store.lon) : 'acquiring…'
  }

  const renderList = () => {
    if (store.goals.length === 0) {
      listEl.innerHTML = `<div class="gp-empty">No goals yet — add one below.</div>`
      return
    }
    listEl.innerHTML = store.goals
      .map((g, i) => {
        const active = i === store.activeGoalIndex
        const coord = formatCoord(g.lat, g.lon) + (g.alt != null ? ` (${Math.round(g.alt)}m)` : '')
        return `
          <div class="gp-item${active ? ' active' : ''}">
            <button class="gp-pick" data-pick="${i}">
              <span class="gp-mark">${active ? '▸' : ''}</span>
              <span class="gp-n">${i + 1}</span>
              <span class="gp-c">${coord}</span>
            </button>
            <button class="gp-del" data-del="${i}" aria-label="delete">✕</button>
          </div>`
      })
      .join('')
  }

  renderNow()
  renderList()
  setInterval(renderNow, 1000)

  // Select (make active) or delete via event delegation — rows are rebuilt.
  listEl.addEventListener('click', event => {
    const el = (event.target as HTMLElement).closest<HTMLElement>('[data-pick],[data-del]')
    if (!el) return
    if (el.dataset.del != null) {
      const i = Number(el.dataset.del)
      store.goals.splice(i, 1)
      if (store.activeGoalIndex === i) store.activeGoalIndex = store.goals.length ? 0 : -1
      else if (store.activeGoalIndex > i) store.activeGoalIndex -= 1
      if (store.goals.length === 0) store.fromSteerpoint = 0 // back to the nav start
    } else if (el.dataset.pick != null) {
      store.activeGoalIndex = Number(el.dataset.pick)
    }
    saveGoals(store)
    renderList()
    goalMap.refreshGoals()
  })

  pick<HTMLButtonElement>('gp-add').addEventListener('click', async () => {
    // Derive the altitude from the coordinates when the field is left blank
    // (e.g. coordinates typed by hand rather than picked on the map).
    if (altInput.value.trim() === '') {
      const lat = Number(latInput.value)
      const lon = Number(lonInput.value)
      if (Number.isFinite(lat) && Number.isFinite(lon)) await autofillAlt(lat, lon)
    }
    const goal = parseGoalInput(latInput.value, lonInput.value, altInput.value)
    if (!goal) {
      errEl.textContent = 'Enter a valid lat (−90..90), lon (−180..180), alt numeric.'
      return
    }
    errEl.textContent = ''
    store.goals.push(goal)
    store.activeGoalIndex = store.goals.length - 1 // newest becomes active
    saveGoals(store)
    latInput.value = ''
    lonInput.value = ''
    altInput.value = ''
    renderList()
    goalMap.refreshGoals()
  })
}
