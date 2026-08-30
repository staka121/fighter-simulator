// Public API of the heading component: a static tick-scale image tile plus a
// centred text box for the live heading (kept off the image send channel).
export { HEADING_TILE, HEADING_NUM } from './types'
export {
  buildHeadingImageContainer,
  buildHeadingNumberContainer,
  startHeadingTicks,
  startHeadingNumberDriver,
  formatHeadingNumber,
} from './heading'
