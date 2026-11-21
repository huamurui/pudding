import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPageUrl } from '../src/scripts/canonical.ts'

test('page canonical URLs normalize directories without dropping the deployment base or changing files', () => {
  assert.equal(canonicalPageUrl('https://example.com/pudding/about'), 'https://example.com/pudding/about/')
  assert.equal(
    canonicalPageUrl('https://example.com/pudding/posts/tech/math/'),
    'https://example.com/pudding/posts/tech/math/'
  )
  assert.equal(
    canonicalPageUrl('https://example.com/pudding/about?view=1#section'),
    'https://example.com/pudding/about/?view=1#section'
  )
  assert.equal(canonicalPageUrl('https://example.com/pudding/404.html'), 'https://example.com/pudding/404.html')
  assert.equal(
    canonicalPageUrl('https://example.com/pudding/rss.xml?view=1'),
    'https://example.com/pudding/rss.xml?view=1'
  )
  const url = new URL('https://example.com/pudding/timeline')
  assert.equal(canonicalPageUrl(url), 'https://example.com/pudding/timeline/')
  assert.equal(url.pathname, '/pudding/timeline')
})
