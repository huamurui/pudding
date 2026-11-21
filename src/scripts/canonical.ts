/** Resolve optional frontmatter links while preserving the current page on invalid schemes or URLs. */
export function resolveCanonicalUrl(candidate: string, base: string | URL, fallback: string): string {
  if (!candidate.trim()) return fallback
  try {
    const resolved = new URL(candidate, base)
    return resolved.protocol === 'https:' || resolved.protocol === 'http:' ? resolved.href : fallback
  } catch {
    return fallback
  }
}

/** Use the directory URL for pages, regardless of how a visitor reached them. */
export function canonicalPageUrl(currentUrl: string | URL): string {
  const url = new URL(currentUrl)
  if (!url.pathname.endsWith('/') && !/\/[^/]+\.[^/]+$/.test(url.pathname)) url.pathname += '/'
  return url.href
}
