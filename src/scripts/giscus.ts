import type { SiteConfig } from '@/config/site.config'

const giscusOrigin = 'https://giscus.app'
const sessionKey = 'giscus-session'
const loadTimeout = 15000

type GiscusConfig = NonNullable<SiteConfig['giscus']>
type ColorScheme = 'light' | 'dark'
type Status = 'loading' | 'ready' | 'error'

interface PageContext {
  url: URL;
  title: string;
  ogTitle: string;
  description: string;
  backlink: string;
  anchor?: string;
}

export function giscusWidgetUrl(config: GiscusConfig, page: PageContext, theme: string, session: string): URL {
  const url = new URL('/widget', giscusOrigin)
  if (config.lang) url.pathname = `/${encodeURIComponent(config.lang)}/widget`
  const pageUrl = new URL(page.url)
  pageUrl.searchParams.delete('giscus')
  pageUrl.hash = ''
  const returnUrl = new URL(pageUrl)
  returnUrl.hash = page.anchor || ''
  const params = new URLSearchParams({
    origin: returnUrl.href,
    session,
    repo: config.repo,
    repoId: config.repoId,
    category: config.category,
    categoryId: config.categoryId,
    strict: config.strict,
    reactionsEnabled: config.reactionsEnabled,
    emitMetadata: config.emitMetadata,
    inputPosition: config.inputPosition,
    description: page.description,
    backLink: page.backlink || pageUrl.href,
    theme
  })
  switch (config.mapping) {
    case 'url': params.set('term', pageUrl.href); break
    case 'title': params.set('term', page.title); break
    case 'og:title': params.set('term', page.ogTitle); break
    case 'specific': params.set('term', config.term || ''); break
    case 'number': params.set('number', config.term || ''); break
    default: params.set('term', pageUrl.pathname.slice(1).replace(/\.\w+$/, '') || 'index')
  }
  url.search = params.toString()
  return url
}

function readSession(pageUrl: URL): string {
  const login = pageUrl.searchParams.get('giscus')
  if (login) {
    try { localStorage.setItem(sessionKey, JSON.stringify(login)) } catch { /* Storage can be blocked. */ }
    const cleanUrl = new URL(pageUrl)
    cleanUrl.searchParams.delete('giscus')
    history.replaceState(history.state, '', cleanUrl)
    return login
  }

  try {
    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null')
    return typeof stored === 'string' ? stored : ''
  } catch {
    return ''
  }
}

export function mountGiscus(
  container: HTMLElement,
  config: GiscusConfig,
  themeFor: (scheme: ColorScheme) => string,
  title: string,
  setStatus: (status: Status) => void
): { retry: () => void; destroy: () => void } {
  const root = document.documentElement
  const meta = (key: string): string => document.querySelector<HTMLMetaElement>(
    `meta[property="og:${key}"], meta[name="${key}"]`
  )?.content || ''
  const page: PageContext = {
    url: new URL(location.href),
    title: document.title,
    ogTitle: meta('title'),
    description: meta('description'),
    backlink: meta('giscus:backlink'),
    anchor: container.closest('[id]')?.id
  }
  let session = readSession(page.url)
  let iframe: HTMLIFrameElement | undefined
  let observer: IntersectionObserver | undefined
  let timeout: number | undefined
  let ready = false
  let theme = ''

  const scheme = (): ColorScheme => root.dataset.theme === 'dark' ? 'dark' : 'light'
  function syncTheme(): void {
    if (!iframe) return
    const colorScheme = scheme()
    const current = themeFor(colorScheme)
    iframe.style.colorScheme = colorScheme
    if (!ready || current === theme) return
    iframe.contentWindow?.postMessage({ giscus: { setConfig: { theme: current } } }, giscusOrigin)
    theme = current
  }

  function clearFrame(): void {
    window.clearTimeout(timeout)
    iframe?.remove()
    iframe = undefined
    ready = false
  }

  function fail(): void {
    clearFrame()
    setStatus('error')
  }

  function load(): void {
    observer?.disconnect()
    clearFrame()
    setStatus('loading')
    const frame = document.createElement('iframe')
    iframe = frame
    frame.title = title
    frame.allow = 'clipboard-write'
    frame.setAttribute('scrolling', 'no')
    theme = themeFor(scheme())
    frame.style.colorScheme = scheme()
    frame.src = giscusWidgetUrl(config, page, theme, session).href
    frame.addEventListener('error', () => { if (iframe === frame) fail() }, { once: true })
    container.append(frame)
    timeout = window.setTimeout(fail, loadTimeout)
  }

  function handleMessage(event: MessageEvent): void {
    if (!iframe || event.origin !== giscusOrigin || event.source !== iframe.contentWindow) return
    const data = event.data?.giscus
    if (!data || typeof data !== 'object') return

    const error = typeof data.error === 'string' ? data.error : ''
    if (data.signOut || (session && /Bad credentials|Invalid state value|State has expired/i.test(error))) {
      session = ''
      try { localStorage.removeItem(sessionKey) } catch { /* Storage can be blocked. */ }
      load()
      return
    }

    // An empty discussion can still accept its first comment.
    if (error && !/Discussion not found/i.test(error)) {
      fail()
      return
    }
    if (typeof data.resizeHeight !== 'number' || !Number.isFinite(data.resizeHeight) || data.resizeHeight <= 0) return
    iframe.style.height = `${data.resizeHeight}px`
    if (ready) return
    ready = true
    window.clearTimeout(timeout)
    syncTheme()
    setStatus('ready')
  }

  const themeObserver = new MutationObserver(syncTheme)
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  window.addEventListener('message', handleMessage)
  if (config.loading === 'lazy' && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) load()
    }, { rootMargin: '300px' })
    observer.observe(container)
  } else {
    load()
  }

  return {
    retry: load,
    destroy: (): void => {
      observer?.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('message', handleMessage)
      clearFrame()
    }
  }
}
