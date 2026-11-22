import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { closeTocDisclosure, focusTocTarget, tocScrollbarSettings } from '../src/scripts/toc.ts'

const searchSource = (await readFile(new URL('../src/components/Search.svelte', import.meta.url), 'utf8'))
  .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
  .replace(/^\s*import[^\n]*\n/gm, '')
  .replace(/export let/g, 'let')
  .replaceAll('import.meta.url', JSON.stringify('https://example.com/search.js'))
const searchScript = ts.transpileModule(searchSource, {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
}).outputText

function mountedSearch(t) {
  const workers = []
  const mounts = []
  const context = {
    AbortController,
    EventTarget,
    URL,
    console,
    document: new EventTarget(),
    window: { location: { href: '' } },
    onMount: callback => mounts.push(callback),
    Fuse: class {
      search(query) { return [{ item: { url: `/fallback/${query}/` } }] }
    },
    Worker: class {
      messages = []
      constructor() { workers.push(this) }
      postMessage(message) { this.messages.push(message) }
      terminate() { this.terminated = true }
    }
  }
  vm.createContext(context)
  vm.runInContext(`${searchScript}
    searchContainer = new EventTarget();
    searchInput = {};
    searchToggle = { focus() { document.activeElement = this; } };
    globalThis.searchHarness = {
      start() { isSearchOpen = true; initializeWorker([]); },
      input(value) { handleSearchInput({ target: { value } }); },
      enter() { handleSearchKeydown({ key: 'Enter', target: searchInput, preventDefault() {} }); },
      keyFromResult(event) { return searchContainer.dispatchEvent(event); },
      dismissed() { return !isSearchOpen && document.activeElement === searchToggle; },
      pending() { return isSearchPending; },
      resultCount() { return searchResults.length; }
    }`, context)
  t.after(mounts[0]())
  const search = context.searchHarness
  search.start()
  const worker = workers[0]
  worker.onmessage({ data: { type: 'INITIALIZED' } })
  return {
    search,
    worker,
    location: context.window.location,
    request() { return worker.messages.at(-1).payload.requestId },
    respond(requestId, url) {
      worker.onmessage({ data: { type: 'SEARCH_RESULTS', requestId, payload: [{ item: { url } }] } })
    }
  }
}

test('typing a new worker query removes the previous result before Enter can navigate', t => {
  const { search, location, request, respond } = mountedSearch(t)
  search.input('alpha')
  const alpha = request()
  respond(alpha, '/posts/alpha/')
  assert.equal(search.resultCount(), 1)

  search.input('beta')
  assert.equal(search.pending(), true)
  assert.equal(search.resultCount(), 0)
  search.enter()
  assert.equal(location.href, '')
  respond(alpha, '/posts/stale-alpha/')
  assert.equal(search.pending(), true)
  assert.equal(search.resultCount(), 0)

  respond(request(), '/posts/beta/')
  assert.equal(search.pending(), false)
  search.enter()
  assert.equal(location.href, '/posts/beta/')
})

test('clearing the query also clears pending state and ignores its late result', t => {
  const { search, location, request, respond } = mountedSearch(t)
  search.input('alpha')
  const alpha = request()
  search.input(' ')
  assert.equal(search.pending(), false)
  respond(alpha, '/posts/alpha/')
  search.enter()
  assert.equal(search.resultCount(), 0)
  assert.equal(location.href, '')
})

test('result links retain native Enter activation and Escape restores focus to the search toggle', t => {
  const { search, location, request, respond } = mountedSearch(t)
  search.input('alpha')
  respond(request(), '/posts/first/')
  const key = name => Object.assign(new Event('keydown', { cancelable: true }), { key: name })
  assert.equal(search.keyFromResult(key('Enter')), true)
  assert.equal(location.href, '')
  assert.equal(search.keyFromResult(key('Escape')), false)
  assert.equal(search.dismissed(), true)
})

test('a worker error finishes pending search using the current main-thread query', t => {
  const { search, worker, location } = mountedSearch(t)
  search.input('beta')
  worker.onerror(new Error('Worker unavailable'))
  assert.equal(worker.terminated, true)
  assert.equal(search.pending(), false)
  search.enter()
  assert.equal(location.href, '/fallback/beta/')
})

class FocusElement extends EventTarget {
  attributes = new Map()
  tokens = new Set(['expanded'])
  classList = { remove: token => this.tokens.delete(token) }
  constructor(doc) { super(); this.doc = doc }
  setAttribute(name, value) { this.attributes.set(name, value) }
  getAttribute(name) { return this.attributes.get(name) ?? null }
  hasAttribute(name) { return this.attributes.has(name) }
  removeAttribute(name) { this.attributes.delete(name) }
  focus(options) { this.focusOptions = options; this.doc.activeElement = this }
  set inert(value) {
    this.isInert = value
    if (value && this.doc.activeElement?.parent === this) this.doc.activeElement = this.doc.body
  }
}

test('TOC fragment activation focuses the heading without changing its scroll offset or tab order', () => {
  const doc = {}
  const heading = new FocusElement(doc)
  focusTocTarget(heading)
  assert.equal(doc.activeElement, heading)
  assert.deepEqual(heading.focusOptions, { preventScroll: true })
  assert.equal(heading.getAttribute('tabindex'), '-1')
  heading.dispatchEvent(new Event('blur'))
  assert.equal(heading.hasAttribute('tabindex'), false)
})

test('TOC focus preserves a heading tabindex supplied by the author', () => {
  const heading = new FocusElement({})
  heading.setAttribute('tabindex', '0')
  focusTocTarget(heading)
  heading.dispatchEvent(new Event('blur'))
  assert.equal(heading.getAttribute('tabindex'), '0')
})

test('dismissing the mobile TOC returns focus before its links become inert', () => {
  const doc = { body: {} }
  const toggle = new FocusElement(doc)
  const menu = new FocusElement(doc)
  doc.activeElement = { parent: menu }
  toggle.setAttribute('aria-expanded', 'true')
  closeTocDisclosure(toggle, menu, true)
  assert.equal(doc.activeElement, toggle)
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(menu.tokens.has('expanded'), false)
  assert.equal(menu.isInert, true)
})

test('closing the TOC after selecting a heading does not steal focus back', () => {
  const doc = {}
  const heading = new FocusElement(doc)
  const toggle = new FocusElement(doc)
  const menu = new FocusElement(doc)
  focusTocTarget(heading)
  closeTocDisclosure(toggle, menu)
  assert.equal(doc.activeElement, heading)
})

test('TOC scrollbar settings follow the current theme and reduced-motion preference', () => {
  const root = new FocusElement({})
  root.setAttribute('data-theme', 'light')
  assert.deepEqual(tocScrollbarSettings(root, false), { theme: 'os-theme-dark', clickScroll: true })
  root.setAttribute('data-theme', 'dark')
  assert.deepEqual(tocScrollbarSettings(root, true), { theme: 'os-theme-light', clickScroll: 'instant' })
})
