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
