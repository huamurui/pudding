/** Giscus owns the contents of this otherwise empty embed container. */
export function mountGiscus(container: HTMLElement, options: Record<string, string>): () => void {
  const script = document.createElement('script')
  for (const [key, value] of Object.entries(options)) script.setAttribute(`data-${key}`, value)
  script.src = 'https://giscus.app/client.js'
  script.crossOrigin = 'anonymous'
  script.async = true
  container.appendChild(script)
  return () => script.remove()
}
