/** Resolve directory keys from URLs so display labels can be localized independently. */
export function breadcrumbDirectoryPath(href: string, postsRoot: string): string {
  const pathname = new URL(href, 'https://breadcrumb.invalid').pathname.replace(/\/+$/, '')
  const root = new URL(postsRoot, 'https://breadcrumb.invalid').pathname.replace(/\/+$/, '')
  if (pathname !== root && !pathname.startsWith(`${root}/`)) return ''
  const relative = pathname.slice(root.length).replace(/^\/+/, '')
  try {
    return decodeURIComponent(relative)
  } catch {
    return relative
  }
}
