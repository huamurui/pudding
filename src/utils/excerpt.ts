import sanitizeHtml from 'sanitize-html'
import { extractExcerptFromHtml } from './helpers'

/** Retain rich article excerpts without carrying scripts, handlers, or interactive embeds onto the home page. */
export function sanitizePostPreviewHtml(html: string): string {
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
      mo: ['stretchy', 'fence', 'separator', 'lspace', 'rspace', 'minsize', 'maxsize'],
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
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: attributes.target === '_blank'
          ? { ...attributes, rel: 'noopener noreferrer' }
          : attributes
      })
    }
  })
}

export function createSafeExcerpt(html: string): string {
  return sanitizePostPreviewHtml(extractExcerptFromHtml(html))
}
