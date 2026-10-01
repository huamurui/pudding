import { buildUrl } from '@/utils/helpers'
import { activePreviewCount } from './preview-state'

type PreviewContent = {
  title: string
  html: string
  date: string
}

type PopupState = {
  element: HTMLDivElement
  link: HTMLAnchorElement
  isHovered: boolean
  isLinkHovered: boolean
}

const LINK_SELECTOR = '.markdown-body a, .backlinks-section .posts-list a, .preview-link'
const cache = new Map<string, PreviewContent>()
const popupStack: PopupState[] = []
let openTimer: number | undefined
let pendingLink: HTMLAnchorElement | null = null
let closeTimer: number | undefined
let initialized = false

function getPreviewLink(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null
  const link = target.closest<HTMLAnchorElement>(LINK_SELECTOR)
  if (!link || link.origin !== window.location.origin) return null
  const root = buildUrl('posts').replace(/\/$/, '')
  return link.pathname.startsWith(`${root}/`) ? link : null
}

function getLevel(link: HTMLAnchorElement): number {
  const parentPopup = link.closest<HTMLElement>('.link-preview-popup')
  return parentPopup ? Number.parseInt(parentPopup.dataset.level || '0', 10) + 1 : 0
}

function closeFrom(level: number): void {
  while (popupStack.length > level) {
    const popup = popupStack.pop()
    if (!popup) continue
    popup.element.classList.remove('is-visible')
    popup.element.inert = true
    window.setTimeout(() => popup.element.remove(), 200)
  }
}

function closeAll(): void {
  window.clearTimeout(openTimer)
  pendingLink = null
  window.clearTimeout(closeTimer)
  closeFrom(0)
}

function scheduleClose(): void {
  window.clearTimeout(closeTimer)
  closeTimer = window.setTimeout(() => {
    closeFrom(activePreviewCount(popupStack))
  }, 300)
}

function createPopup(level: number, link: HTMLAnchorElement): HTMLDivElement {
  const existing = popupStack[level]
  if (existing?.link === link) return existing.element
  if (existing) closeFrom(level)

  const element = document.createElement('div')
  element.className = 'link-preview-popup'
  element.dataset.level = String(level)
  element.style.zIndex = String(1000 + level)
  document.body.appendChild(element)

  const state: PopupState = {
    element,
    link,
    isHovered: false,
    isLinkHovered: true
  }
  popupStack[level] = state

  element.addEventListener('mouseenter', () => {
    state.isHovered = true
    window.clearTimeout(closeTimer)
  })
  element.addEventListener('mouseleave', () => {
    state.isHovered = false
    scheduleClose()
  })

  return element
}

async function fetchPostContent(id: string): Promise<PreviewContent | null> {
  const cached = cache.get(id)
  if (cached) return cached

  try {
    const response = await fetch(buildUrl(['api', 'post-content', `${id}.html`]))
    if (!response.ok) return null

    const documentFragment = new DOMParser().parseFromString(await response.text(), 'text/html')
    const wrapper = documentFragment.getElementById('preview-wrapper')
    if (!wrapper) return null

    const content = {
      title: wrapper.dataset.title || '',
      html: wrapper.innerHTML,
      date: wrapper.dataset.date || ''
    }
    cache.set(id, content)
    return content
  } catch {
    return null
  }
}

function renderPopup(element: HTMLDivElement, post: PreviewContent, level: number): void {
  element.replaceChildren()

  const header = document.createElement('div')
  header.className = 'link-preview-header'
  const title = document.createElement('h5')
  title.className = 'link-preview-title'
  title.textContent = post.title
  header.appendChild(title)

  const body = document.createElement('div')
  body.className = 'link-preview-body'
  body.id = `preview-body-${level}`
  const markdown = document.createElement('div')
  markdown.className = 'markdown-body'
  markdown.innerHTML = post.html
  body.appendChild(markdown)

  const footer = document.createElement('div')
  footer.className = 'link-preview-footer'
  footer.id = `preview-footer-${level}`

  element.append(header, body, footer)
}

function renderStatus(element: HTMLDivElement, message: string): void {
  element.replaceChildren()
  const status = document.createElement('div')
  status.className = 'link-preview-loading'
  status.textContent = message
  element.appendChild(status)
}

function scrollToFragment(element: HTMLDivElement, hash: string, level: number): void {
  const container = element.querySelector<HTMLElement>(`#preview-body-${level}`)
  if (!container) return
  if (!hash) {
    container.scrollTop = 0
    return
  }

  let targetId = hash.slice(1)
  try { targetId = decodeURIComponent(targetId) } catch { /* Invalid fragments are still literal IDs. */ }
  const targets = element.querySelectorAll<HTMLElement>('[id], [name]')
  const target = Array.from(targets).find(candidate => {
    const candidateId = candidate.id || candidate.getAttribute('name') || ''
    return candidateId === targetId || candidateId.toLowerCase() === targetId.toLowerCase()
  })
  if (!target) return

  window.setTimeout(() => {
    if (!element.isConnected || element.inert) return
    const relativeTop = target.getBoundingClientRect().top
      - container.getBoundingClientRect().top
      + container.scrollTop
    container.scrollTo({ top: Math.max(0, relativeTop - 10), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    target.classList.add('preview-highlight')
  }, 50)
}

async function showPreview(link: HTMLAnchorElement): Promise<void> {
  const url = new URL(link.href)
  const root = buildUrl('posts').replace(/\/$/, '')
  if (url.origin !== window.location.origin || !url.pathname.startsWith(`${root}/`)) return
  const postId = url.pathname.slice(root.length + 1).replace(/\/$/, '')
  if (!postId) return
  const level = getLevel(link)
  window.clearTimeout(openTimer)
  pendingLink = link
  openTimer = window.setTimeout(async() => {
    if (pendingLink !== link || !link.isConnected) return
    pendingLink = null
    const popup = createPopup(level, link)
    const rect = link.getBoundingClientRect()
    const popupWidth = Math.min(550, window.innerWidth - 30)
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`
    popup.style.left = `${Math.min(
      Math.max(15, rect.left + window.scrollX - popupWidth / 2 + rect.width / 2 + (level > 0 ? 20 : 0)),
      window.innerWidth - popupWidth - 15
    )}px`
    popup.classList.add('is-visible')

    if (popup.dataset.currentPost !== postId) {
      renderStatus(popup, 'Loading...')
    }

    const post = await fetchPostContent(postId)
    if (popupStack[level]?.element !== popup || !popup.isConnected || popup.inert) return
    if (!post) {
      renderStatus(popup, 'Unavailable')
      return
    }
    if (popup.dataset.currentPost !== postId) {
      renderPopup(popup, post, level)
      popup.dataset.currentPost = postId
    }

    const footer = popup.querySelector<HTMLElement>(`#preview-footer-${level}`)
    if (footer) footer.textContent = url.hash ? `Fragment: ${url.hash}` : `Level ${level} Preview`
    scrollToFragment(popup, url.hash, level)
  }, 250)
}

function handleMouseOver(event: MouseEvent): void {
  const link = getPreviewLink(event.target)
  if (!link || (event.relatedTarget instanceof Node && link.contains(event.relatedTarget))) return
  popupStack.forEach(popup => {
    if (popup.link === link) popup.isLinkHovered = true
  })
  window.clearTimeout(closeTimer)
  void showPreview(link)
}

function handleMouseOut(event: MouseEvent): void {
  const link = getPreviewLink(event.target)
  if (!link || (event.relatedTarget instanceof Node && link.contains(event.relatedTarget))) return
  if (pendingLink === link) {
    window.clearTimeout(openTimer)
    pendingLink = null
  }
  popupStack.forEach(popup => {
    if (popup.link === link) popup.isLinkHovered = false
  })
  scheduleClose()
}

export function initLinkPreviews(): void {
  if (initialized) return
  initialized = true
  document.addEventListener('mouseover', handleMouseOver)
  document.addEventListener('mouseout', handleMouseOut)
  document.addEventListener('astro:before-swap', closeAll)
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAll() })
}
