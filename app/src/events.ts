import { OsEventTypeList, type EvenHubEvent } from '@evenrealities/even_hub_sdk'

/**
 * Resolve the event type out of a single envelope (sysEvent or textEvent).
 *
 * CLICK_EVENT is 0, and protobuf omits zero-value fields on the wire, so a
 * single tap arrives as an envelope whose `eventType` is `undefined`. The
 * default must be resolved INSIDE the envelope check — returning CLICK for a
 * missing envelope would misread every scroll/exit/audio frame as a tap.
 */
function typeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

/** A single tap, from either the sys or text envelope. */
export function isClick(event: EvenHubEvent): boolean {
  return (
    typeOf(event.sysEvent) === OsEventTypeList.CLICK_EVENT ||
    typeOf(event.textEvent) === OsEventTypeList.CLICK_EVENT
  )
}

/** A double tap, from either the sys or text envelope. */
export function isDoubleClick(event: EvenHubEvent): boolean {
  return (
    typeOf(event.sysEvent) === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    typeOf(event.textEvent) === OsEventTypeList.DOUBLE_CLICK_EVENT
  )
}

/** A scroll toward the top (scroll up), from either envelope. */
export function isScrollUp(event: EvenHubEvent): boolean {
  return (
    typeOf(event.sysEvent) === OsEventTypeList.SCROLL_TOP_EVENT ||
    typeOf(event.textEvent) === OsEventTypeList.SCROLL_TOP_EVENT
  )
}

/** A scroll toward the bottom (scroll down), from either envelope. */
export function isScrollDown(event: EvenHubEvent): boolean {
  return (
    typeOf(event.sysEvent) === OsEventTypeList.SCROLL_BOTTOM_EVENT ||
    typeOf(event.textEvent) === OsEventTypeList.SCROLL_BOTTOM_EVENT
  )
}

/** The host is tearing the app down (normal or abnormal exit). */
export function isExit(event: EvenHubEvent): boolean {
  const t = typeOf(event.sysEvent)
  return t === OsEventTypeList.SYSTEM_EXIT_EVENT || t === OsEventTypeList.ABNORMAL_EXIT_EVENT
}
