import { TextContainerProperty, CreateStartUpPageContainer } from '@evenrealities/even_hub_sdk'

/** The single text container this scene renders and later updates in place. */
export const MAIN_CONTAINER = { id: 1, name: 'main' } as const

/** Static hint line reused by the initial view and the tap-counter update. */
export const HINT = 'Tap to count · double-tap to exit.'

/** Build the initial page: one full-screen (576×288) text container. */
export function buildView(): CreateStartUpPageContainer {
  const mainText = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 288,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 4,
    containerID: MAIN_CONTAINER.id,
    containerName: MAIN_CONTAINER.name,
    content: `Hello from G2!\n${HINT}`,
    isEventCapture: 1,
  })

  return new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [mainText],
  })
}
