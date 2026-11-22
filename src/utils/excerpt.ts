import sanitizeHtml from 'sanitize-html'
import { extractExcerptFromHtml } from './helpers'

/** Keep relative references tied to the article when its content appears on another page. */
function resolveArticleReference(value: string, articleUrl: URL): string {
  try {
    const url = new URL(value, articleUrl)
    if (url.origin === articleUrl.origin && !url.pathname.startsWith('//')) {
      return url.pathname + url.search + url.hash
    }
    return url.href
  } catch {
    return value
  }
}

/** Retain rich article excerpts without carrying scripts, handlers, or interactive embeds onto the home page. */
export function sanitizePostPreviewHtml(html: string, articleUrl?: URL): string {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img', 'figure', 'figcaption', 'span',
      'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace',
      'mfrac', 'msqrt', 'mroot', 'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover',
      'mtable', 'mtr', 'mtd', 'menclose', 'mpadded', 'mphantom', 'mstyle'
    ],
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'aria-hidden', 'data-mode', 'data-hidden', 'role', 'tabindex', 'aria-expanded'],
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      math: ['xmlns', 'display'],
      annotation: ['encoding'],
      mi: ['mathvariant'],
      mn: ['mathvariant'],
      mtext: ['mathvariant'],
      mo: ['mathvariant', 'stretchy', 'fence', 'separator', 'largeop', 'lspace', 'rspace', 'minsize', 'maxsize'],
      mfrac: ['linethickness'],
      mover: ['accent'],
      munder: ['accentunder'],
      menclose: ['notation'],
      mpadded: ['width', 'height', 'depth', 'lspace', 'voffset'],
      mtable: ['columnalign', 'rowspacing', 'columnspacing'],
      mspace: ['width', 'height', 'depth'],
      mstyle: ['mathcolor', 'mathbackground', 'mathsize', 'mathvariant', 'displaystyle', 'scriptlevel']
    },
    allowedStyles: {
      '*': {
        height: [/^-?[\d.]+(?:em|ex|px|%)$/],
        width: [/^-?[\d.]+(?:em|ex|px|%)$/],
        top: [/^-?[\d.]+(?:em|ex|px|%)$/],
        'vertical-align': [/^-?[\d.]+(?:em|ex|px|%)$/],
        'margin-left': [/^-?[\d.]+(?:em|ex|px|%)$/],
        'margin-right': [/^-?[\d.]+(?:em|ex|px|%)$/],
        'padding-left': [/^-?[\d.]+(?:em|ex|px|%)$/],
        'border-bottom-width': [/^[\d.]+(?:em|ex|px)$/],
        'font-size': [/^[\d.]+(?:em|ex|px|%)$/]
      }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    // KaTeX's visual HTML needs SVG paths for roots and accents. Display its
    // native MathML representation in sanitized fragments, including excerpts.
    exclusiveFilter: frame => {
      if (frame.tag === 'span' && frame.attribs.class === 'katex-mathml') return 'excludeTag'
      return frame.tag === 'span' && frame.attribs.class === 'katex-html' && frame.attribs['aria-hidden'] === 'true'
    },
    transformTags: {
      a: (tagName, attribs) => {
        if (articleUrl && attribs.href !== undefined) attribs.href = resolveArticleReference(attribs.href, articleUrl)
        if (attribs.target === '_blank') attribs.rel = 'noopener noreferrer'
        return { tagName, attribs }
      },
      img: (tagName, attribs) => {
        if (articleUrl && attribs.src) attribs.src = resolveArticleReference(attribs.src, articleUrl)
        return { tagName, attribs }
      }
    }
  })
}

export function createSafeExcerpt(html: string, articleUrl?: URL): string {
  return sanitizePostPreviewHtml(extractExcerptFromHtml(html), articleUrl)
}
