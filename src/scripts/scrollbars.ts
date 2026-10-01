import type { OverlayScrollbars } from 'overlayscrollbars'

const initializeAttribute = 'data-overlayscrollbars-initialize'
const fallbackAttribute = 'data-scrollbars-fallback'

/** Initialize before the new page paints, without rebuilding on page-load. */
export function installScrollbars(
  doc: Document,
  create: (body: HTMLElement) => Pick<OverlayScrollbars, 'destroy' | 'state'>
): () => void {
  let scrollbars: ReturnType<typeof create> | undefined
  let activeBody: HTMLElement | undefined

  function releaseBridge(): void {
    doc.documentElement.removeAttribute(initializeAttribute)
    doc.body?.removeAttribute(initializeAttribute)
    doc.dispatchEvent(new Event('pudding:scrollbars-ready'))
  }

  function initialize(): void {
    const body = doc.body
    if (!body || (activeBody === body && scrollbars && !scrollbars.state().destroyed)) return
    if (doc.documentElement.hasAttribute(fallbackAttribute)) {
      releaseBridge()
      return
    }
    doc.documentElement.setAttribute(initializeAttribute, '')
    body.setAttribute(initializeAttribute, '')
    try {
      scrollbars = create(body)
      if (scrollbars.state().destroyed) {
        scrollbars = undefined
        doc.documentElement.setAttribute(fallbackAttribute, '')
      } else {
        activeBody = body
      }
    } catch {
      scrollbars?.destroy()
      scrollbars = undefined
      doc.documentElement.setAttribute(fallbackAttribute, '')
    } finally {
      releaseBridge()
    }
  }

  function beforeSwap(event: Event): void {
    scrollbars?.destroy()
    scrollbars = undefined
    activeBody = undefined
    // Keep the old page and the incoming page bridged throughout the swap.
    doc.documentElement.setAttribute(initializeAttribute, '')
    doc.body.setAttribute(initializeAttribute, '')
    const incoming = (event as Event & { newDocument: Document }).newDocument
    incoming.documentElement.setAttribute(initializeAttribute, '')
    incoming.body.setAttribute(initializeAttribute, '')
  }

  doc.addEventListener('astro:before-swap', beforeSwap)
  doc.addEventListener('astro:after-swap', initialize)
  doc.addEventListener('astro:page-load', initialize)
  initialize()

  return () => {
    doc.removeEventListener('astro:before-swap', beforeSwap)
    doc.removeEventListener('astro:after-swap', initialize)
    doc.removeEventListener('astro:page-load', initialize)
    scrollbars?.destroy()
    releaseBridge()
  }
}
