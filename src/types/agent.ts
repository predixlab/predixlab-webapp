export type AgentKeyDuration = 30 | 90 | 365

export interface AgentConnection {
  mcp_url: string
  scope: 'mcp:read'
  default_expires_in_days: AgentKeyDuration
  expires_in_days_options: AgentKeyDuration[]
}

export interface AgentApiKey {
  id: string
  name: string
  prefix: string
  scope: 'mcp:read'
  created_at: string
  expires_at: string
  last_used_at: string | null
  revoked_at: string | null
  status: 'active' | 'expired' | 'revoked'
  version: number
  expires_in_days: AgentKeyDuration
}

export interface AgentApiKeyList {
  items: AgentApiKey[]
  total_count: number
  limit: number
  offset: number
  max_keys: number
  non_revoked_count: number
}

export interface AgentApiKeyCreate {
  name: string
  expires_in_days: AgentKeyDuration
}

export interface AgentApiKeyIssued {
  api_key: string
  key: AgentApiKey
}
