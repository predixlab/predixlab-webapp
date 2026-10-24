import type { AgentApiKey, AgentApiKeyIssued } from '../types/agent.ts'

export type AgentKeyDialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'rotate' | 'revoke'; key: AgentApiKey }
  | { kind: 'issued'; issued: AgentApiKeyIssued; rotated: boolean }
  | { kind: 'conflict' }

export interface AgentKeyState {
  dialog: AgentKeyDialog
  pending: boolean
  error: string
}

export const initialAgentKeyState: AgentKeyState = {
  dialog: { kind: 'closed' },
  pending: false,
  error: '',
}

type AgentKeyAction =
  | { type: 'open'; dialog: Extract<AgentKeyDialog, { kind: 'create' | 'rotate' | 'revoke' }> }
  | { type: 'close' }
  | { type: 'pending' }
  | { type: 'issued'; issued: AgentApiKeyIssued; rotated: boolean }
  | { type: 'failed'; error: string }
  | { type: 'conflict' }
  | { type: 'revoked' }

// Only the mounted panel owns this state. Refreshing metadata never touches it.
export function agentKeyReducer(state: AgentKeyState, action: AgentKeyAction): AgentKeyState {
  switch (action.type) {
    case 'open':
      if (state.pending || state.dialog.kind === 'issued') return state
      return { dialog: action.dialog, pending: false, error: '' }
    case 'close':
      return state.pending ? state : initialAgentKeyState
    case 'pending':
      if (!['create', 'rotate', 'revoke'].includes(state.dialog.kind) || state.pending) return state
      return { ...state, pending: true, error: '' }
    case 'issued':
      if (!state.pending || (state.dialog.kind !== 'create' && state.dialog.kind !== 'rotate')) return state
      return { dialog: { kind: 'issued', issued: action.issued, rotated: action.rotated }, pending: false, error: '' }
    case 'failed':
      if (!state.pending) return state
      return { ...state, pending: false, error: action.error }
    case 'conflict':
      if (!state.pending || (state.dialog.kind !== 'rotate' && state.dialog.kind !== 'revoke')) return state
      return { dialog: { kind: 'conflict' }, pending: false, error: 'conflict' }
    case 'revoked':
      if (!state.pending || state.dialog.kind !== 'revoke') return state
      return initialAgentKeyState
  }
}
