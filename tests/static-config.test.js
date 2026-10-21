import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const config = JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'))
const headers = config.globalHeaders
const policy = headers['Content-Security-Policy']
const directives = new Map(policy.split(';').map(directive => {
  const [name, ...sources] = directive.trim().split(/\s+/)
  return [name, sources]
}))

test('static hosting retains SPA routing and noindex alongside the response headers', () => {
  assert.equal(config.navigationFallback.rewrite, '/index.html')
  assert.ok(config.navigationFallback.exclude.includes('/assets/*'))
  assert.ok(config.navigationFallback.exclude.includes('/fonts/*'))
  assert.equal(headers['X-Robots-Tag'], 'noindex')
  assert.equal(headers['Strict-Transport-Security'], 'max-age=31536000; includeSubDomains')
  assert.equal(headers['X-Frame-Options'], 'DENY')
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
})

test('CSP hashes every inline script without allowing arbitrary inline scripts or eval', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
  for (const [, attributes, body] of scripts) {
    if (/\bsrc\s*=/.test(attributes)) continue
    const hash = createHash('sha256').update(body).digest('base64')
    assert.ok(directives.get('script-src').includes(`'sha256-${hash}'`), 'Update CSP when an inline script changes')
  }
  assert.ok(!directives.get('script-src').includes("'unsafe-inline'"))
  assert.ok(!policy.includes("'unsafe-eval'"))
})

test('CSP keeps local assets and PWA workers, denies embedding and allows integration defaults', () => {
  for (const name of ['default-src', 'font-src', 'worker-src', 'base-uri']) {
    assert.deepEqual(directives.get(name), ["'self'"])
  }
  for (const name of ['object-src', 'frame-ancestors']) {
    assert.deepEqual(directives.get(name), ["'none'"])
  }
  assert.deepEqual(directives.get('style-src'), ["'self'", "'unsafe-inline'"])
  assert.deepEqual(directives.get('img-src'), ["'self'", 'data:', 'https:', 'blob:'])
  const requiredSources = {
    'script-src': [
      "'self'",
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://js.stripe.com',
      'https://accounts.google.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.predixlab.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://api.stripe.com',
      'https://accounts.google.com',
      'https://login.microsoftonline.com',
      'https://login.live.com',
    ],
    'frame-src': ['https://*.stripe.com', 'https://hooks.stripe.com', 'https://accounts.google.com'],
    'form-action': [
      "'self'",
      'https://checkout.stripe.com',
      'https://accounts.google.com',
      'https://login.microsoftonline.com',
      'https://login.live.com',
    ],
  }
  for (const [name, sources] of Object.entries(requiredSources)) {
    for (const source of sources) assert.ok(directives.get(name).includes(source), `${name} must allow ${source}`)
  }
})
