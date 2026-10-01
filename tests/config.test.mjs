import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await fs.readFile(new URL('../src/config/i18n.config.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext }
}).outputText
const { getLocale, t } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('unknown locales and inherited object names fall back to the default locale', () => {
  for (const locale of ['fr-FR', 'constructor', 'toString', '__proto__', undefined]) {
    assert.equal(getLocale(locale), 'zh-CN')
  }
  assert.equal(getLocale('en-US'), 'en-US')
  assert.equal(t('fr-FR', 'header.nav.home'), '首页')
})

test('translations preserve zero and empty substitution values', () => {
  assert.equal(t('en-US', 'footer.copyright', { year: 0, author: '' }), '© 0 . All rights reserved.')
  assert.equal(t('zh-CN', 'common.search.ariaLabel.viewArticle', { title: '<hello>' }), '查看文章：<hello>')
  assert.equal(t('en-US', 'footer.copyright', { year: 2026 }), '© 2026 {author}. All rights reserved.')
})

test('translation lookup never returns an object or inherited value', () => {
  const originalWarn = console.warn
  console.warn = () => {}
  try {
    assert.equal(t('en-US', 'header.nav'), 'header.nav')
    assert.equal(t('en-US', 'header.nav.constructor'), 'header.nav.constructor')
    assert.equal(t('en-US', 'missing.key'), 'missing.key')
  } finally {
    console.warn = originalWarn
  }
})
