import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { installScrollbars } from '../src/scripts/scrollbars.ts'

const initializeAttribute = 'data-overlayscrollbars-initialize'
const fallbackAttribute = 'data-scrollbars-fallback'
const head = await readFile(new URL('../src/components/Head.astro', import.meta.url), 'utf8')
const bootstrap = [...head.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)]
  .find(match => match[1].includes('pudding:scrollbars-ready'))?.[1]
assert.ok(bootstrap, 'The real early scrollbar bootstrap must be available for execution')

class FakeElement extends EventTarget {
  attributes = new Map()
  setAttribute(name, value) { this.attributes.set(name, value) }
  removeAttribute(name) { this.attributes.delete(name) }
  hasAttribute(name) { return this.attributes.has(name) }
}

class FakeDocument extends EventTarget {
  documentElement = new FakeElement()
  body = new FakeElement()
}

class FakeTimers {
  now = 0
  nextId = 0
  pending = new Map()
  setTimeout(callback, delay) {
    const id = ++this.nextId
    this.pending.set(id, { callback, due: this.now + delay })
    return id
  }
  clearTimeout(id) { this.pending.delete(id) }
  advance(duration) {
    const end = this.now + duration
    for (;;) {
      const next = [...this.pending.entries()].filter(([, timer]) => timer.due <= end)
        .sort((left, right) => left[1].due - right[1].due)[0]
      if (!next) break
      this.now = next[1].due
      this.pending.delete(next[0])
      next[1].callback()
    }
    this.now = end
  }
}

function runBootstrap(doc, timers = new FakeTimers()) {
  vm.runInNewContext(bootstrap, {
    document: doc,
    window: {
      setTimeout: timers.setTimeout.bind(timers),
      clearTimeout: timers.clearTimeout.bind(timers)
    }
  })
  return timers
}

function trackingFactory(doc) {
  const instances = []
  const create = body => {
    assert.ok(doc.documentElement.hasAttribute(initializeAttribute), 'The root is bridged during construction')
    assert.ok(body.hasAttribute(initializeAttribute), 'The target body is bridged during construction')
    const instance = {
      body,
      destroyed: false,
      destroyCalls: 0,
      state() { return { destroyed: this.destroyed } },
      destroy() { this.destroyCalls++; this.destroyed = true }
    }
    instances.push(instance)
    return instance
  }
  return { create, instances }
}

function dispatch(doc, name, extra = {}) {
  const event = Object.assign(new Event(name), extra)
  doc.dispatchEvent(event)
}

test('cold bootstrap bridges before body parsing and restores native scrollbars after a failed load', () => {
  const doc = new FakeDocument()
  doc.body = null
  const timers = runBootstrap(doc)
  assert.ok(doc.documentElement.hasAttribute(initializeAttribute))
  timers.advance(4999)
  assert.equal(doc.documentElement.hasAttribute(fallbackAttribute), false)
  doc.body = new FakeElement()
  doc.body.setAttribute(initializeAttribute, '')
  timers.advance(1)
  assert.ok(doc.documentElement.hasAttribute(fallbackAttribute))
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  assert.equal(doc.body.hasAttribute(initializeAttribute), false)
})

test('successful immediate initialization releases the bridge and cancels the cold-load watchdog', () => {
  const doc = new FakeDocument()
  const timers = runBootstrap(doc)
  const { create, instances } = trackingFactory(doc)
  const dispose = installScrollbars(doc, create)
  assert.equal(instances.length, 1)
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  assert.equal(doc.body.hasAttribute(initializeAttribute), false)
  assert.equal(timers.pending.size, 0)
  timers.advance(10_000)
  assert.equal(doc.documentElement.hasAttribute(fallbackAttribute), false)
  dispose()
})

test('a cold-load watchdog belonging to a replaced document root cannot change the new root', () => {
  const doc = new FakeDocument()
  const timers = runBootstrap(doc)
  doc.documentElement = new FakeElement()
  doc.documentElement.setAttribute(initializeAttribute, '')
  timers.advance(5000)
  assert.equal(doc.documentElement.hasAttribute(fallbackAttribute), false)
  assert.ok(doc.documentElement.hasAttribute(initializeAttribute))
})

test('same-body page-load and after-swap events reuse the active instance', () => {
  const doc = new FakeDocument()
  const { create, instances } = trackingFactory(doc)
  const dispose = installScrollbars(doc, create)
  dispatch(doc, 'astro:page-load')
  dispatch(doc, 'astro:after-swap')
  dispatch(doc, 'astro:page-load')
  assert.equal(instances.length, 1)
  assert.equal(instances[0].destroyCalls, 0)
  dispose()
  assert.equal(instances[0].destroyCalls, 1)
  dispatch(doc, 'astro:page-load')
  assert.equal(instances.length, 1, 'Disposal removes the initialization listeners')
})

test('module installation before body parsing waits safely for the first completed page', () => {
  const doc = new FakeDocument()
  doc.body = null
  const timers = runBootstrap(doc)
  const { create, instances } = trackingFactory(doc)
  const dispose = installScrollbars(doc, create)
  assert.equal(instances.length, 0)
  assert.ok(doc.documentElement.hasAttribute(initializeAttribute))
  doc.body = new FakeElement()
  dispatch(doc, 'astro:page-load')
  assert.equal(instances.length, 1)
  assert.equal(timers.pending.size, 0)
  dispose()
})

test('releasing the bootstrap bridge preserves the library viewport marker that hides native scrollbars', () => {
  const doc = new FakeDocument()
  const { create } = trackingFactory(doc)
  const dispose = installScrollbars(doc, body => {
    const instance = create(body)
    doc.documentElement.setAttribute('data-overlayscrollbars-viewport', 'scrollbarHidden')
    return instance
  })
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  assert.ok(doc.documentElement.hasAttribute('data-overlayscrollbars-viewport'))
  dispose()
})

test('navigation destroys the old instance, bridges both documents, and initializes the new body immediately', () => {
  const doc = new FakeDocument()
  const oldBody = doc.body
  const incoming = new FakeDocument()
  const { create, instances } = trackingFactory(doc)
  const dispose = installScrollbars(doc, create)
  dispatch(doc, 'astro:before-swap', { newDocument: incoming })
  assert.equal(instances[0].destroyCalls, 1)
  assert.ok(doc.documentElement.hasAttribute(initializeAttribute))
  assert.ok(oldBody.hasAttribute(initializeAttribute))
  assert.ok(incoming.documentElement.hasAttribute(initializeAttribute))
  assert.ok(incoming.body.hasAttribute(initializeAttribute))
  // Astro keeps the root element and copies the incoming root's attributes.
  doc.documentElement.attributes = new Map(incoming.documentElement.attributes)
  doc.body = incoming.body
  dispatch(doc, 'astro:after-swap')
  assert.equal(instances.length, 2)
  assert.equal(instances[1].body, incoming.body)
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  assert.equal(doc.body.hasAttribute(initializeAttribute), false)
  dispatch(doc, 'astro:page-load')
  assert.equal(instances.length, 2)
  dispose()
  assert.equal(instances[1].destroyCalls, 1)
})

test('cancelled library initialization restores native scrollbars and stops further attempts on that page', () => {
  const doc = new FakeDocument()
  let calls = 0
  const dispose = installScrollbars(doc, () => {
    calls++
    return { destroy() {}, state() { return { destroyed: true } } }
  })
  assert.equal(calls, 1)
  assert.ok(doc.documentElement.hasAttribute(fallbackAttribute))
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  assert.equal(doc.body.hasAttribute(initializeAttribute), false)
  dispatch(doc, 'astro:page-load')
  assert.equal(calls, 1)
  dispose()
})

test('factory exceptions restore native scrollbars and cancel the watchdog without leaking exceptions', () => {
  const doc = new FakeDocument()
  const timers = runBootstrap(doc)
  let calls = 0
  let dispose
  assert.doesNotThrow(() => {
    dispose = installScrollbars(doc, () => { calls++; throw new Error('Initialization failed') })
  })
  assert.equal(calls, 1)
  assert.ok(doc.documentElement.hasAttribute(fallbackAttribute))
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  assert.equal(doc.body.hasAttribute(initializeAttribute), false)
  assert.equal(timers.pending.size, 0)
  dispatch(doc, 'astro:page-load')
  assert.equal(calls, 1)
  dispose()
})

test('a late module respects watchdog fallback and never replaces an already visible native scrollbar', () => {
  const doc = new FakeDocument()
  const timers = runBootstrap(doc)
  timers.advance(5000)
  let calls = 0
  const dispose = installScrollbars(doc, () => { calls++; throw new Error('Must not run after timeout') })
  dispatch(doc, 'astro:page-load')
  assert.equal(calls, 0)
  assert.ok(doc.documentElement.hasAttribute(fallbackAttribute))
  assert.equal(doc.documentElement.hasAttribute(initializeAttribute), false)
  dispose()
})
