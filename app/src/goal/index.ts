// Phone-side goal (destination) UI + persistence. The glasses navigate to the
// active goal (see activeGoal in the store).
export { parseGoalInput, formatCoord } from './coords'
export { loadGoals, saveGoals } from './goalStorage'
export { mountGoalPanel } from './goalPanel'
