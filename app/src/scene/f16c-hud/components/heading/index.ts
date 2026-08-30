// Public API of the heading component: two static tick-strip image tiles that
// flank a centred text box for the live heading (kept off the image channel).
export { HEADING_TICKS, HEADING_NUM } from './types'
export {
  buildHeadingTickContainers,
  buildHeadingNumberContainer,
  startHeadingTicks,
  startHeadingNumberDriver,
  formatHeadingNumber,
} from './heading'
