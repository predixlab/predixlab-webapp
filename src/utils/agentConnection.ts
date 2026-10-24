import type { AgentApiKeyList } from '@/types/agent'

export async function loadAllAgentKeys(
  fetchPage: (limit: number, offset: number) => Promise<AgentApiKeyList>,
): Promise<AgentApiKeyList> {
  let page = await fetchPage(100, 0)
  const total = page.total_count
  const items = [...page.items]
  if (page.offset !== 0 || page.limit < 1) throw new Error('Invalid API-key list page')
  while (items.length < total) {
    const offset: number = page.offset + page.limit
    page = await fetchPage(100, offset)
    if (page.offset !== offset || page.limit < 1 || page.items.length === 0 || page.total_count !== total) {
      throw new Error('API-key list changed while loading. Refresh and try again.')
    }
    items.push(...page.items)
  }
  if (items.length !== total || new Set(items.map(item => item.id)).size !== total) {
    throw new Error('API-key list changed while loading. Refresh and try again.')
  }
  return { ...page, items, offset: 0 }
}

export function validateMcpUrl(value: string): string {
  if (!/^https?:\/\//i.test(value) || value !== value.trim() || /[\\\s]/.test(value)) {
    throw new Error('Invalid MCP URL')
  }
  const url = new URL(value)
  const loopback = url.hostname === 'localhost' ||
    url.hostname === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(url.hostname)
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
    url.username || url.password || /^https?:\/\/[^/]*@/i.test(value) ||
    value.includes('?') || value.includes('#')
  ) {
    throw new Error('Invalid MCP URL')
  }
  return url.href
}

function buildConfig(mcpUrl: string, apiKey: string): string {
  return JSON.stringify({
    mcpServers: {
      predixlab: {
        type: 'http',
        url: validateMcpUrl(mcpUrl),
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    },
  }, null, 2)
}

export function buildAgentConfig(mcpUrl: string): string {
  return buildConfig(mcpUrl, 'YOUR_API_KEY')
}

export function buildDirectKeyConfig(mcpUrl: string, apiKey: string): string {
  if (apiKey.length !== 82 || !/^plmcp_[a-f0-9]{32}_[A-Za-z0-9_-]{43}$/.test(apiKey)) {
    throw new Error('Invalid MCP API key format')
  }
  return buildConfig(mcpUrl, apiKey)
}

export function agentErrorKey(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'status_code' in error
    ? error.status_code
    : undefined
  if (status === 409 && typeof error === 'object' && error !== null) {
    const detail = 'detail' in error ? error.detail : 'message' in error ? error.message : undefined
    if (typeof detail === 'object' && detail !== null && 'code' in detail && detail.code === 'mcp_key_limit') {
      return 'keyLimit'
    }
  }
  switch (status) {
    case 409: return 'conflict'
    case 429: return 'rateLimited'
    case 501: return 'mockUnavailable'
    case 401: return 'unauthorized'
    case 404: return 'notFound'
    case 422: return 'invalidRequest'
    default: return 'requestFailed'
  }
}
