import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, test } from 'node:test'

import { createInstance } from 'i18next'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { createServer } from 'vite'

import { normalizeSignalStrength } from '../src/types/market.ts'
import { normalizePivotAction } from '../src/types/picks.ts'

const pivotCases = [
  ['STRONG_BUY', 'STRONGLY_BULLISH', 'Strongly bullish', '强烈看涨', 'bull'],
  ['BUY', 'BULLISH', 'Bullish', '看涨', 'bull'],
  ['HOLD', 'NEUTRAL', 'Neutral', '中性', 'neutral'],
  ['SELL', 'BEARISH', 'Bearish', '看跌', 'bear'],
  ['STRONG_SELL', 'STRONGLY_BEARISH', 'Strongly bearish', '强烈看跌', 'bear'],
]
const signalCases = [
  ['strong_buy', 'strongly_bullish'],
  ['buy', 'bullish'],
  ['neutral', 'neutral'],
  ['sell', 'bearish'],
  ['strong_sell', 'strongly_bearish'],
]

test('pivot actions normalize legacy values and preserve directional values', () => {
  for (const [legacy, canonical] of pivotCases) {
    assert.equal(normalizePivotAction(legacy), canonical)
    assert.equal(normalizePivotAction(canonical), canonical)
  }
})

test('technical strengths normalize legacy values and preserve directional values', () => {
  for (const [legacy, canonical] of signalCases) {
    assert.equal(normalizeSignalStrength(legacy), canonical)
    assert.equal(normalizeSignalStrength(canonical), canonical)
  }
})

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => server.close())
const { default: ActionBadge } = await server.ssrLoadModule('/src/components/ui/ActionBadge.tsx')
const i18n = createInstance()
await i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: Object.fromEntries(['en', 'zh'].map(language => [
    language,
    { translation: JSON.parse(readFileSync(new URL(`../src/i18n/locales/${language}.json`, import.meta.url), 'utf8')) },
  ])),
})
const renderBadge = props => renderToStaticMarkup(
  React.createElement(I18nextProvider, { i18n }, React.createElement(ActionBadge, props)),
)

test('old and new actions render identical directional labels, tones and emphasis in both languages', async () => {
  for (const language of ['en', 'zh']) {
    await i18n.changeLanguage(language)
    for (const [legacy, canonical, en, zh, tone] of pivotCases) {
      const markup = renderBadge({ action: legacy })
      assert.equal(markup, renderBadge({ action: canonical }))
      assert.ok(markup.includes(language === 'en' ? en : zh))
      assert.ok(markup.includes(tone === 'neutral' ? 'text-text-secondary' : `text-${tone}`))
      assert.equal(markup.includes('font-semibold'), canonical.startsWith('STRONGLY_'))
    }
  }
})

test('badge overrides retain their label, size and class', () => {
  const markup = renderBadge({ action: 'BUY', label: 'Custom context', size: 'sm', className: 'extra-class' })
  assert.ok(markup.includes('Custom context'))
  assert.ok(markup.includes('text-2xs'))
  assert.ok(markup.includes('extra-class'))
})

test('technical analysis and nested profile responses normalize both API vocabularies', async () => {
  const { apiClient } = await server.ssrLoadModule('/src/services/api.ts')
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } })
  try {
    for (const [legacy, canonical] of signalCases) {
      for (const signal of [legacy, canonical]) {
        const technical = { symbol: 'TEST', signal, signal_score: 0.5 }
        apiClient.client.defaults.adapter = async config => ({
          data: config.url.endsWith('/profile') ? { symbol: 'TEST', technical } : technical,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        })
        assert.deepEqual(await apiClient.getTechnicalAnalysis('TEST'), { ...technical, signal: canonical })
        assert.deepEqual((await apiClient.getSymbolProfile('TEST')).technical, { ...technical, signal: canonical })
      }
    }
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
    else delete globalThis.localStorage
  }
})
