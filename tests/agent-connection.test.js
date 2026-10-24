import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, test } from 'node:test'

import { AxiosError } from 'axios'
import { createInstance } from 'i18next'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { createServer } from 'vite'

import {
  agentErrorKey,
  buildAgentConfig,
  buildDirectKeyConfig,
  loadAllAgentKeys,
  validateMcpUrl,
} from '../src/utils/agentConnection.ts'
import { agentKeyReducer, initialAgentKeyState } from '../src/utils/agentKeyState.ts'

const endpoint = 'https://mcp.example.com/mcp'
const key = {
  id: 'a'.repeat(32),
  name: 'Research laptop',
  prefix: 'plmcp_abcd1234',
  scope: 'mcp:read',
  created_at: '2026-10-01T00:00:00Z',
  expires_at: '2026-12-30T00:00:00Z',
  last_used_at: null,
  revoked_at: null,
  status: 'active',
  version: 1,
  expires_in_days: 90,
}
const issued = { api_key: 'test-only-secret-not-a-real-credential', key }
const connection = {
  mcp_url: endpoint,
  scope: 'mcp:read',
  default_expires_in_days: 90,
  expires_in_days_options: [30, 90, 365],
}

test('key list loads every backend page without hiding older revoked records', async () => {
  const items = Array.from({ length: 205 }, (_, index) => ({
    ...key, id: `key-${index}`, status: index > 9 ? 'revoked' : 'active',
  }))
  const requests = []
  const result = await loadAllAgentKeys(async (limit, offset) => {
    requests.push([limit, offset])
    return {
      items: items.slice(offset, offset + limit),
      total_count: items.length,
      limit, offset, max_keys: 10, non_revoked_count: 10,
    }
  })
  assert.deepEqual(requests, [[100, 0], [100, 100], [100, 200]])
  assert.deepEqual(result.items, items)
  assert.equal(result.total_count, 205)
  assert.equal(result.non_revoked_count, 10)
  assert.equal(result.offset, 0)
})

test('empty key lists need only one request and incomplete loads fail explicitly', async () => {
  let requests = 0
  const empty = { items: [], total_count: 0, limit: 100, offset: 0, max_keys: 10, non_revoked_count: 0 }
  assert.deepEqual(await loadAllAgentKeys(async () => { requests++; return empty }), empty)
  assert.equal(requests, 1)
  const first = { ...empty, items: [key], total_count: 2, limit: 1 }
  for (const next of [
    { ...first, offset: 1, items: [] },
    { ...first, offset: 1, total_count: 3 },
    { ...first, offset: 1 },
    { ...first, offset: 0 },
  ]) {
    await assert.rejects(loadAllAgentKeys(async (_limit, offset) => offset ? next : first))
  }
  await assert.rejects(loadAllAgentKeys(async (_limit, offset) => {
    if (offset) throw new Error('network unavailable')
    return first
  }), /network unavailable/)
})

test('generic agent template uses a clear key placeholder without client-specific interpolation', () => {
  assert.deepEqual(JSON.parse(buildAgentConfig(endpoint)), {
    mcpServers: {
      predixlab: {
        type: 'http',
        url: endpoint,
        headers: { Authorization: 'Bearer YOUR_API_KEY' },
      },
    },
  })
  const output = buildAgentConfig(endpoint)
  assert.ok(!output.includes(issued.api_key))
  assert.ok(!output.includes(key.prefix))
  assert.doesNotMatch(output, /\$\{|vscode|copilot|promptString/i)
})

test('agent endpoints reject unsafe protocols, user info, queries, fragments and URL parser ambiguities', () => {
  for (const unsafe of [
    'javascript:alert(1)', 'data:text/plain,secret', 'file:///etc/passwd',
    'vscode:mcp/install?fake', 'ftp://example.com/mcp', '//example.com/mcp',
    'https:example.com/mcp', 'http://mcp.example.com/mcp',
    'https://user:secret@example.com/mcp', 'https://user@example.com/mcp',
    'https://@example.com/mcp', 'https://example.com/mcp?token=secret',
    'https://example.com/mcp?', 'https://example.com/mcp#secret', 'https://example.com/mcp#',
    ' https://example.com/mcp', 'https://example.com/mcp\n', 'https://example.com\\mcp',
    'http://localhost.example.com/mcp', 'http://127.0.0.1.example.com/mcp',
  ]) {
    for (const helper of [validateMcpUrl, buildAgentConfig]) {
      assert.throws(() => helper(unsafe), undefined, unsafe)
    }
  }
})

test('explicit agent config uses a literal key and the same generic structure as the template', () => {
  const secret = `plmcp_${'a'.repeat(32)}_${'b'.repeat(43)}`
  const server = {
    type: 'http',
    url: endpoint,
    headers: { Authorization: `Bearer ${secret}` },
  }
  assert.deepEqual(JSON.parse(buildDirectKeyConfig(endpoint, secret)), {
    mcpServers: { predixlab: server },
  })
  const config = buildDirectKeyConfig(endpoint, secret)
  assert.doesNotMatch(config, /\$\{|vscode|copilot|promptString/i)
  assert.equal(buildAgentConfig(endpoint).replace('YOUR_API_KEY', secret), config)
  assert.throws(() => buildDirectKeyConfig('http://remote.example/mcp', secret))
  for (const invalid of ['', '${input:predixlab-api-key}', 'Bearer '+secret, secret+'\n']) {
    assert.throws(() => buildDirectKeyConfig(endpoint, invalid))
  }
  assert.ok(!buildAgentConfig(endpoint).includes(secret))
})

test('HTTPS and actual loopback HTTP endpoints are supported without a hardcoded service origin', () => {
  for (const url of [
    endpoint, 'https://other.example.com:8443/custom/mcp',
    'http://localhost:8000/mcp', 'http://127.0.0.1:8000/mcp', 'http://[::1]:8000/mcp',
  ]) {
    assert.equal(validateMcpUrl(url), url)
    const payload = JSON.parse(buildAgentConfig(url))
    assert.equal(payload.mcpServers.predixlab.url, url)
  }
})

test('safe error categories never display arbitrary response data or secrets', () => {
  for (const field of ['detail', 'message']) {
    assert.equal(agentErrorKey({
      status_code: 409,
      [field]: { code: 'mcp_key_limit', message: issued.api_key, max_keys: 10 },
    }), 'keyLimit')
  }
  assert.equal(agentErrorKey({ status_code: 403, detail: { code: 'mcp_key_limit' } }), 'requestFailed')
  for (const [status, expected] of [
    [409, 'conflict'], [429, 'rateLimited'], [501, 'mockUnavailable'],
    [401, 'unauthorized'], [404, 'notFound'], [422, 'invalidRequest'], [500, 'requestFailed'],
  ]) {
    assert.equal(agentErrorKey({ status_code: status, detail: issued.api_key }), expected)
  }
  assert.equal(agentErrorKey(new Error(issued.api_key)), 'requestFailed')
  assert.equal(agentErrorKey(null), 'requestFailed')
})

test('PWA precaches static files only and excludes API navigations without runtime API caching', () => {
  const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
  assert.match(config, /navigateFallbackDenylist:\s*\[\/\^\\\/api\\\/\/\]/)
  assert.doesNotMatch(config, /runtimeCaching\s*:/)
  assert.match(config, /globPatterns:\s*\['\*\*\/\*\.\{js,css,html,ico,png,svg,woff2\}'\]/)
})

test('create flow blocks dismissal while pending, shows secret once and clears it on close', () => {
  let state = agentKeyReducer(initialAgentKeyState, { type: 'open', dialog: { kind: 'create' } })
  state = agentKeyReducer(state, { type: 'pending' })
  assert.equal(state.pending, true)
  assert.equal(agentKeyReducer(state, { type: 'close' }), state)
  state = agentKeyReducer(state, { type: 'issued', issued, rotated: false })
  assert.equal(state.dialog.kind, 'issued')
  assert.equal(state.dialog.issued.api_key, issued.api_key)
  // Metadata failures/stale callbacks cannot replace a newly issued secret.
  for (const action of [
    { type: 'failed', error: 'requestFailed' }, { type: 'conflict' },
    { type: 'revoked' }, { type: 'open', dialog: { kind: 'create' } },
  ]) {
    assert.equal(agentKeyReducer(state, action), state)
  }
  state = agentKeyReducer(state, { type: 'close' })
  assert.deepEqual(state, initialAgentKeyState)
  assert.ok(!JSON.stringify(state).includes(issued.api_key))
  assert.equal(agentKeyReducer(state, { type: 'issued', issued, rotated: false }), state)
})

test('expired keys rotate, revocation requires confirmation, conflicts require a fresh action', () => {
  for (const kind of ['rotate', 'revoke']) {
    const record = { ...key, status: 'expired' }
    let state = agentKeyReducer(initialAgentKeyState, { type: 'open', dialog: { kind, key: record } })
    assert.equal(state.pending, false)
    assert.equal(state.dialog.key.version, 1)
    state = agentKeyReducer(state, { type: 'pending' })
    const conflict = agentKeyReducer(state, { type: 'conflict' })
    assert.equal(conflict.error, 'conflict')
    assert.equal(conflict.dialog.kind, 'conflict')
    assert.equal(agentKeyReducer(conflict, { type: 'pending' }), conflict)
    const retry = agentKeyReducer(state, { type: 'failed', error: 'rateLimited' })
    assert.equal(retry.pending, false)
    assert.equal(retry.dialog.kind, kind)
    assert.equal(retry.error, 'rateLimited')
    if (kind === 'rotate') {
      const result = agentKeyReducer(state, { type: 'issued', issued: { ...issued, key: { ...key, version: 2 } }, rotated: true })
      assert.equal(result.dialog.rotated, true)
      assert.equal(result.dialog.issued.key.version, 2)
    } else {
      assert.deepEqual(agentKeyReducer(state, { type: 'revoked' }), initialAgentKeyState)
    }
  }
})

const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => server.close())
const { apiClient } = await server.ssrLoadModule('/src/services/api.ts')
const { api } = await server.ssrLoadModule('/src/services/apiAdapter.ts')
const { default: AgentConnectionPanel, AgentKeyGroups } = await server.ssrLoadModule('/src/components/profile/AgentConnectionPanel.tsx')

test('real adapter routes all lifecycle endpoints through website JWT client with optimistic versions', async () => {
  const originalWindow = globalThis.window
  const originalStorage = globalThis.localStorage
  const originalAdapter = apiClient.client.defaults.adapter
  const requests = []
  globalThis.window = { location: { search: '' } }
  globalThis.localStorage = {
    getItem: name => name === 'access_token' ? 'test-website-session' : null,
    setItem: () => assert.fail('MCP credentials must not be written to localStorage'),
  }
  apiClient.client.defaults.adapter = async config => {
    requests.push(config)
    const data = config.url.endsWith('/connection') ? connection
      : config.method === 'get' ? { items: [key], total_count: 1, limit: 10, offset: 0, max_keys: 10, non_revoked_count: 1 }
        : config.method === 'delete' ? undefined : issued
    return { data, status: config.method === 'delete' ? 204 : 200, statusText: 'OK', headers: {}, config }
  }
  try {
    assert.deepEqual(await api.getAgentConnection(), connection)
    assert.equal((await api.listAgentApiKeys(10, 20)).items[0].id, key.id)
    assert.deepEqual(await api.createAgentApiKey({ name: ' Research laptop ', expires_in_days: 90 }), issued)
    assert.deepEqual(await api.rotateAgentApiKey(key.id, 3), issued)
    assert.equal(await api.revokeAgentApiKey(key.id, 4), undefined)
    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
      ['get', '/v1/agent/connection'],
      ['get', '/v1/agent/api-keys'],
      ['post', '/v1/agent/api-keys'],
      ['post', `/v1/agent/api-keys/${key.id}/rotate`],
      ['delete', `/v1/agent/api-keys/${key.id}`],
    ])
    assert.deepEqual(requests[1].params, { limit: 10, offset: 20 })
    assert.deepEqual(JSON.parse(requests[2].data), { name: 'Research laptop', expires_in_days: 90 })
    assert.deepEqual(JSON.parse(requests[3].data), { version: 3 })
    assert.deepEqual(requests[4].params, { version: 4 })
    assert.ok(requests.every(request => request.headers.Authorization === 'Bearer test-website-session'))
    assert.ok(requests.every(request => !JSON.stringify(request).includes(issued.api_key)))
  } finally {
    apiClient.client.defaults.adapter = originalAdapter
    globalThis.window = originalWindow
    globalThis.localStorage = originalStorage
  }
})

test('mock mode explicitly rejects every agent method without issuing fake credentials or real requests', async () => {
  const originalWindow = globalThis.window
  const originalAdapter = apiClient.client.defaults.adapter
  globalThis.window = { location: { search: '?mock=true' } }
  apiClient.client.defaults.adapter = () => assert.fail('Mock mode must not call the real agent service')
  try {
    for (const call of [
      () => api.getAgentConnection(), () => api.listAgentApiKeys(),
      () => api.createAgentApiKey({ name: 'Research laptop', expires_in_days: 90 }),
      () => api.rotateAgentApiKey(key.id, 1), () => api.revokeAgentApiKey(key.id, 1),
    ]) {
      await assert.rejects(call, error => error.status_code === 501)
    }
  } finally {
    globalThis.window = originalWindow
    apiClient.client.defaults.adapter = originalAdapter
  }
})

test('issuance never automatically retries network errors, conflicts, quota or server errors', async () => {
  const originalWindow = globalThis.window
  const originalStorage = globalThis.localStorage
  const originalAdapter = apiClient.client.defaults.adapter
  globalThis.window = { location: { search: '' } }
  globalThis.localStorage = { getItem: () => null }
  try {
    for (const status of [undefined, 409, 429, 503]) {
      for (const call of [
        () => api.createAgentApiKey({ name: 'Research laptop', expires_in_days: 90 }),
        () => api.rotateAgentApiKey(key.id, 1),
      ]) {
        let attempts = 0
        apiClient.client.defaults.adapter = async config => {
          attempts++
          const response = status ? { status, data: { detail: 'Request failed' }, config } : undefined
          throw new AxiosError('Network Error', 'ERR_NETWORK', config, undefined, response)
        }
        await assert.rejects(call)
        assert.equal(attempts, 1)
      }
    }
  } finally {
    globalThis.window = originalWindow
    globalThis.localStorage = originalStorage
    apiClient.client.defaults.adapter = originalAdapter
  }
})

test('key groups prioritize active keys, fold inactive records, and make revoked history read-only', async () => {
  const i18n = createInstance()
  await i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: Object.fromEntries(['en', 'zh'].map(language => [
      language,
      { translation: JSON.parse(readFileSync(new URL(`../src/i18n/locales/${language}.json`, import.meta.url), 'utf8')) },
    ])),
  })
  const active = { ...key, name: 'Active agent' }
  const expired = { ...key, id: 'b'.repeat(32), name: 'Expired agent', status: 'expired' }
  const revoked = { ...key, id: 'c'.repeat(32), name: 'Revoked agent', status: 'revoked', revoked_at: '2026-10-20T00:00:00Z' }
  const render = (items, busy = false) => renderToStaticMarkup(
    React.createElement(I18nextProvider, { i18n }, React.createElement(AgentKeyGroups, {
      items, busy, stale: false, onAction: () => assert.fail('Rendering must not mutate keys'),
    })),
  )
  for (const language of ['en', 'zh']) {
    await i18n.changeLanguage(language)
    const markup = render([revoked, expired, active])
    const main = markup.slice(markup.indexOf('<section'), markup.indexOf('</section>'))
    assert.ok(main.includes('Active agent'))
    assert.ok(!main.includes('Expired agent'))
    assert.ok(!main.includes('Revoked agent'))
    assert.ok(markup.includes(i18n.t('agent.expiredKeys', { count: 1 })))
    assert.ok(markup.includes(i18n.t('agent.revokedKeys', { count: 1 })))
    assert.doesNotMatch(markup, /<details[^>]*\sopen(?:[=>\s])/)
    assert.ok(markup.includes(i18n.t('agent.rotateLabel', { name: 'Active agent' })))
    assert.ok(markup.includes(i18n.t('agent.rotateLabel', { name: 'Expired agent' })))
    assert.ok(!markup.includes(i18n.t('agent.rotateLabel', { name: 'Revoked agent' })))
    assert.ok(!markup.includes(i18n.t('agent.revokeLabel', { name: 'Revoked agent' })))
    assert.equal((markup.match(/<button\b/g) || []).length, 4)
    const disabled = render([active, expired, revoked], true).match(/<button\b[^>]*>/g)
    assert.equal(disabled.length, 4)
    assert.ok(disabled.every(button => button.includes('disabled=""')))
    const empty = render([])
    assert.ok(empty.includes(i18n.t('agent.emptyTitle')))
    assert.ok(!empty.includes(i18n.t('agent.revokedKeys', { count: 0 })))
    const onlyHistory = render([revoked])
    assert.ok(onlyHistory.includes(i18n.t('agent.noActiveTitle')))
    assert.ok(onlyHistory.includes(i18n.t('agent.revokedHelp')))
    assert.equal((onlyHistory.match(/<button\b/g) || []).length, 0)
    assert.ok(onlyHistory.includes('dateTime="2026-10-20T00:00:00Z"'))
  }
})

test('stacked panel renders localized loading and disabled states without client-specific content', async () => {
  const i18n = createInstance()
  await i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: Object.fromEntries(['en', 'zh'].map(language => [
      language,
      { translation: JSON.parse(readFileSync(new URL(`../src/i18n/locales/${language}.json`, import.meta.url), 'utf8')) },
    ])),
  })
  for (const language of ['en', 'zh']) {
    await i18n.changeLanguage(language)
    const markup = renderToStaticMarkup(
      React.createElement(I18nextProvider, { i18n }, React.createElement(AgentConnectionPanel, { userId: 'test-user' })),
    )
    assert.ok(markup.includes(i18n.t('agent.title')))
    assert.ok(markup.includes(i18n.t('agent.scopeNotice')))
    assert.ok(!markup.includes('xl:grid-cols-'))
    assert.ok(!markup.includes('xl:border-r'))
    assert.ok(i18n.t('agent.expiresOn', { date: '2027-01-01' }).includes('2027-01-01'))
    assert.notEqual(i18n.t('agent.statusLabel'), 'agent.statusLabel')
    assert.ok(markup.includes('aria-busy="true"'))
    assert.ok(markup.includes('disabled=""'))
    assert.ok(!markup.includes(issued.api_key))
    assert.ok(!markup.includes('agent.errors.'))
    assert.doesNotMatch(i18n.t('agent.updateClient'), /MCP:\s*(?:Reset|Clear)/i)
    assert.ok(i18n.t('agent.configHelp').includes('YOUR_API_KEY'))
    assert.ok(i18n.t('agent.configHelp').includes('mcpServers'))
    assert.ok(i18n.t('agent.directConfigWarning').includes('0600'))
    assert.ok(i18n.t('agent.directConfigConsent'))
    const agentCopy = i18n.getResourceBundle(language, 'translation').agent
    assert.doesNotMatch(JSON.stringify(agentCopy), /vscode|vs\s*code|copilot|promptString|vscode:mcp|\.vscode/i)
    assert.doesNotMatch(JSON.stringify(agentCopy), /\$\{(?:input|env):/)
    for (const status of ['active', 'expired', 'revoked']) {
      assert.notEqual(i18n.t(`agent.status.${status}`), `agent.status.${status}`)
    }
  }
})
