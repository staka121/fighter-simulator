import { MenuContainerProperty, MenuItemProperty } from '@evenrealities/even_hub_sdk'

// Long-press (tap then hold) opens the OS contextual menu built from these
// items — no ring required, so it works for everyone on the glasses alone.
// `itemID` must be a non-zero uint32, unique in the menu.
export const MENU_ITEMS = {
  toggleArm: 1,
  reload: 2,
} as const

/** Weapons menu attached to the page via `menuObject`. */
export function buildMenu(): MenuContainerProperty {
  return new MenuContainerProperty({
    menuItems: [
      new MenuItemProperty({ itemName: 'Master Arm', itemID: MENU_ITEMS.toggleArm }),
      new MenuItemProperty({ itemName: 'Reload', itemID: MENU_ITEMS.reload }),
    ],
  })
}
