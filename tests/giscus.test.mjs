import assert from 'node:assert/strict'
import test from 'node:test'
import { giscusWidgetUrl, mountGiscus } from '../src/scripts/giscus.ts'

const config = {
  enabled: true,
  repo: 'example/blog',
  repoId: 'repo',
  category: 'General',
  categoryId: 'category',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  lang: 'zh-CN',
  loading: 'eager'
}
const giscusOrigin = 'https://giscus.app'

function fixture(t, options = config) {
  const statuses = []
  const messages = []
  const frames = []
  const timers = new Map()
  const root = { dataset: { theme: 'light' } }
  let themeChanged
  let intersect
  let listener
  const window = {
    IntersectionObserver: class {},
    setTimeout(callback) {
      timers.set(callback, callback)
      return callback
    },
    clearTimeout(id) { timers.delete(id) },
    addEventListener(_, callback) { listener = callback },
    removeEventListener(_, callback) { if (listener === callback) listener = undefined }
  }
  const container = {
    closest: () => ({ id: 'giscus-container' }),
    append: frame => { frames.push(frame) }
  }
  const document = {
    documentElement: root,
    querySelector: () => null,
    createElement: () => ({
      style: {},
      setAttribute() {},
      addEventListener(_, callback) { this.emitError = callback },
      remove() { this.removed = true },
      contentWindow: { postMessage: (...args) => messages.push(args) }
    })
  }

  const globals = {
    window, document,
    location: { href: 'https://example.com/blog/posts/nested/post/' },
    localStorage: { getItem() { throw new Error('Storage blocked') } },
    MutationObserver: class {
      constructor(callback) { themeChanged = callback }
      observe() {}
      disconnect() { themeChanged = undefined }
    },
    IntersectionObserver: class {
      constructor(callback) { intersect = callback }
      observe() {}
      disconnect() { intersect = undefined }
    }
  }
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, value })
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key])
  }
  const widget = mountGiscus(container, options, scheme => scheme, 'Comments', state => statuses.push(state))
  return {
    widget, frames, statuses, messages,
    setTheme(theme) { root.dataset.theme = theme; themeChanged?.() },
    show() { intersect?.([{ isIntersecting: true }]) },
    timeout() { for (const callback of timers.keys()) callback() },
    send(frame, data, origin = giscusOrigin) {
      listener?.({ source: frame.contentWindow, origin, data: { giscus: data } })
    }
  }
}

test('widget mapping keeps the existing deployed path and removes the login callback from public URLs', () => {
  const page = {
    url: new URL('https://example.com/blog/posts/some-post/?giscus=login-return&view=1#heading'),
    title: 'Post',
    ogTitle: 'Post',
    description: '',
    backlink: '',
    anchor: 'giscus-container'
  }
  const url = giscusWidgetUrl(config, page, 'dark', '')
  assert.equal(url.href.split('?')[0], 'https://giscus.app/zh-CN/widget')
  assert.equal(url.searchParams.get('term'), 'blog/posts/some-post/')
  assert.equal(url.searchParams.get('origin'), 'https://example.com/blog/posts/some-post/?view=1#giscus-container')
  assert.equal(url.searchParams.get('backLink'), 'https://example.com/blog/posts/some-post/?view=1')
  assert.equal(giscusWidgetUrl({ ...config, mapping: 'number', term: '42' }, page, 'dark', '')
    .searchParams.get('number'), '42')
})

test('lazy comments wait for visibility and apply the latest theme when the frame is ready', t => {
  const f = fixture(t, { ...config, loading: 'lazy' })
  assert.equal(f.frames.length, 0)
  f.show()
  const [frame] = f.frames
  const src = frame.src
  f.setTheme('dark')
  assert.equal(f.messages.length, 0)
  f.send(frame, { resizeHeight: 300 }, 'https://example.com')
  assert.deepEqual(f.statuses, ['loading'])
  f.send(frame, { error: 'Discussion not found' })
  f.send(frame, { resizeHeight: 400 })
  assert.deepEqual(f.statuses, ['loading', 'ready'])
  assert.equal(frame.style.height, '400px')
  assert.deepEqual(f.messages, [[{ giscus: { setConfig: { theme: 'dark' } } }, giscusOrigin]])
  assert.equal(frame.src, src)
  f.timeout()
  assert.equal(f.statuses.at(-1), 'ready')
  f.widget.destroy()
  assert.equal(frame.removed, true)
})

test('unresponsive comments can be retried without accepting messages from the old frame', t => {
  const f = fixture(t)
  const [oldFrame] = f.frames
  f.timeout()
  assert.equal(f.statuses.at(-1), 'error')
  assert.equal(oldFrame.removed, true)

  f.widget.retry()
  const frame = f.frames.at(-1)
  f.send(oldFrame, { resizeHeight: 800 })
  oldFrame.emitError()
  assert.equal(f.statuses.at(-1), 'loading')
  f.send(frame, { resizeHeight: 440 })
  assert.equal(f.statuses.at(-1), 'ready')
  f.send(frame, { error: 'API rate limit exceeded' })
  assert.equal(f.statuses.at(-1), 'error')
  assert.equal(frame.removed, true)
  f.widget.destroy()
})
