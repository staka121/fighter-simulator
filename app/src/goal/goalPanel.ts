import type { Store } from '../scene/f16c-hud/store'
import { parseGoalInput, formatCoord } from './coords'
import { saveGoal } from './goalStorage'

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
.gp-field { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 13px; opacity: 0.8; }
.gp-field input { flex: 1; background: #232323; border: 1px solid #444; border-radius: 8px; color: #e5e5e5; padding: 10px 12px; font-size: 16px; font-variant-numeric: tabular-nums; }
.gp-err { min-height: 16px; margin-top: 8px; font-size: 12px; color: #ff8a8a; }
.gp-btns { display: flex; gap: 10px; margin-top: 4px; }
.gp-btn { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #444; background: #232323; color: #e5e5e5; font-size: 14px; }
.gp-primary { background: #e5e5e5; color: #232323; border-color: #e5e5e5; font-weight: 600; }
`

function injectStyleOnce(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

/**
 * Render the phone-side goal panel into `root`: shows the live GPS position and
 * the active goal, and lets the user type a destination (lat/lon) to set or
 * clear. Writes the goal into the shared store and persists it. The glasses
 * navigation reads `store.goal`.
 */
export function mountGoalPanel(root: HTMLElement, store: Store): void {
  injectStyleOnce()
  root.innerHTML = `
    <div class="gp">
      <h1 class="gp-title">F-16C HUD</h1>
      <p class="gp-sub">Running — check the glasses.</p>
      <div class="gp-card">
        <div class="gp-row"><span>Now</span><b id="gp-now">acquiring…</b></div>
        <div class="gp-row"><span>Goal</span><b id="gp-goal">none</b></div>
        <label class="gp-field">Lat<input id="gp-lat" inputmode="decimal" placeholder="35.68120" /></label>
        <label class="gp-field">Lon<input id="gp-lon" inputmode="decimal" placeholder="139.76710" /></label>
        <div id="gp-err" class="gp-err"></div>
        <div class="gp-btns">
          <button id="gp-set" class="gp-btn gp-primary">Set Goal</button>
          <button id="gp-clear" class="gp-btn">Clear</button>
        </div>
      </div>
    </div>`

  const pick = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!
  const nowEl = pick('gp-now')
  const goalEl = pick('gp-goal')
  const errEl = pick('gp-err')
  const latInput = pick<HTMLInputElement>('gp-lat')
  const lonInput = pick<HTMLInputElement>('gp-lon')

  const renderNow = () => {
    nowEl.textContent =
      store.lat != null && store.lon != null ? formatCoord(store.lat, store.lon) : 'acquiring…'
  }
  const renderGoal = () => {
    goalEl.textContent = store.goal ? formatCoord(store.goal.lat, store.goal.lon) : 'none'
  }

  if (store.goal) {
    latInput.value = String(store.goal.lat)
    lonInput.value = String(store.goal.lon)
  }
  renderNow()
  renderGoal()
  setInterval(renderNow, 1000)

  pick<HTMLButtonElement>('gp-set').addEventListener('click', () => {
    const goal = parseGoalInput(latInput.value, lonInput.value)
    if (!goal) {
      errEl.textContent = 'Enter a valid lat (−90..90) and lon (−180..180).'
      return
    }
    errEl.textContent = ''
    store.goal = goal
    saveGoal(goal)
    renderGoal()
  })

  pick<HTMLButtonElement>('gp-clear').addEventListener('click', () => {
    store.goal = null
    saveGoal(null)
    latInput.value = ''
    lonInput.value = ''
    errEl.textContent = ''
    renderGoal()
  })
}
