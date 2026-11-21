/** Match native fragment navigation without undoing the header's scroll offset. */
export function focusTocTarget(target: HTMLElement): void {
  const temporaryTabIndex = !target.hasAttribute('tabindex')
  if (temporaryTabIndex) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  if (temporaryTabIndex) {
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
}

/** Move focus outside the menu before its links become inert. */
export function closeTocDisclosure(toggle: HTMLElement | null, menu: HTMLElement | null, restoreFocus = false): void {
  if (restoreFocus) toggle?.focus({ preventScroll: true })
  toggle?.setAttribute('aria-expanded', 'false')
  menu?.classList.remove('expanded')
  if (menu) menu.inert = true
}

export function tocScrollbarSettings(
  root: Pick<HTMLElement, 'getAttribute'>,
  reducedMotion: boolean
): { theme: string; clickScroll: true | 'instant' } {
  return {
    theme: root.getAttribute('data-theme') === 'dark' ? 'os-theme-light' : 'os-theme-dark',
    clickScroll: reducedMotion ? 'instant' : true
  }
}
