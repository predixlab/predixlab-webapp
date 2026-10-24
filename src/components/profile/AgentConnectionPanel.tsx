import { ChevronRight, KeyRound, RotateCw, Trash2 } from 'lucide-react'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, Badge, Button, EmptyState, Field, Modal, Panel, Skeleton } from '@/components/ui'
import { api } from '@/services/apiAdapter'
import type { AgentApiKey, AgentApiKeyList, AgentConnection, AgentKeyDuration } from '@/types/agent'
import { formatDate, formatDateTime } from '@/utils'
import {
  agentErrorKey,
  buildAgentConfig,
  buildDirectKeyConfig,
  loadAllAgentKeys,
  validateMcpUrl,
} from '@/utils/agentConnection'
import { agentKeyReducer, initialAgentKeyState } from '@/utils/agentKeyState'

const CopyText: React.FC<{ label: string; value: string; rows?: number; inline?: boolean }> = ({
  label, value, rows = 2, inline = false,
}) => {
  const { t } = useTranslation()
  const [copyState, setCopyState] = useState<'idle' | 'pending' | 'copied' | 'error'>('idle')
  const mounted = useRef(true)
  const field = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const copy = async () => {
    setCopyState('pending')
    try {
      await navigator.clipboard.writeText(value)
      if (mounted.current) setCopyState('copied')
    } catch {
      if (!mounted.current) return
      setCopyState('error')
      field.current?.focus()
      field.current?.select()
    }
  }

  const copyButton = (
    <Button
      variant="secondary"
      className="min-h-11 shrink-0 whitespace-nowrap"
      onClick={() => void copy()}
      loading={copyState === 'pending'}
      aria-label={t('agent.copyLabel', { label })}
    >
      {t(copyState === 'error' ? 'agent.retryCopy' : 'common.copy')}
    </Button>
  )

  return (
    <div className="min-w-0 space-y-2">
      <Field label={label}>
        {props => inline ? (
          <div className="flex min-w-0 items-center gap-2">
            <input
              {...props}
              ref={node => { field.current = node }}
              type="text"
              value={value}
              readOnly
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="input min-h-11 min-w-0 flex-1 font-mono text-base sm:text-sm"
            />
            {copyButton}
          </div>
        ) : (
          <textarea
            {...props}
            ref={node => { field.current = node }}
            value={value}
            readOnly
            rows={rows}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="input w-full min-w-0 resize-y font-mono text-base [overflow-wrap:anywhere] sm:text-sm"
          />
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        {!inline ? copyButton : null}
        <span role="status" className="text-xs text-text-secondary">
          {copyState === 'copied' ? t('agent.copied') : ''}
        </span>
      </div>
      {copyState === 'error' ? <Alert tone="error">{t('agent.copyFailed')}</Alert> : null}
    </div>
  )
}

const DirectKeyConfiguration: React.FC<{ mcpUrl: string; apiKey: string }> = ({
  mcpUrl, apiKey,
}) => {
  const { t } = useTranslation()
  const [includeSecret, setIncludeSecret] = useState(false)
  return (
    <details className="min-w-0 border-t border-border pt-4">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold text-text-primary">
        {t('agent.directConfigTitle')}
      </summary>
      <div className="min-w-0 space-y-4 pt-3">
        <Alert tone="warning">{t('agent.directConfigWarning')}</Alert>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-text-secondary">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-accent"
            checked={includeSecret}
            onChange={event => setIncludeSecret(event.target.checked)}
          />
          <span>{t('agent.directConfigConsent')}</span>
        </label>
        {includeSecret ? (
          <>
            <CopyText
              label={t('agent.directConfigLabel')}
              value={buildDirectKeyConfig(mcpUrl, apiKey)}
              rows={8}
            />
            <p className="text-sm leading-6 text-text-secondary">{t('agent.directConfigHelp')}</p>
          </>
        ) : null}
      </div>
    </details>
  )
}

interface AgentKeyListProps {
  items: AgentApiKey[]
  busy: boolean
  stale: boolean
  onAction: (kind: 'rotate' | 'revoke', key: AgentApiKey) => void
}

const AgentKeyRecords: React.FC<AgentKeyListProps> = ({ items, busy, stale, onAction }) => {
  const { t } = useTranslation()
  const revoked = items[0]?.status === 'revoked'
  return (
    <>
      <div
        aria-hidden
        className="hidden grid-cols-[minmax(0,1fr)_7.5rem_5rem_1rem] items-center gap-3 border-b border-border pb-2 text-xs text-text-muted sm:grid"
      >
        <span>{t('agent.name')}</span>
        <span className="text-right">{t(revoked ? 'agent.revokedAt' : 'agent.expiresAt')}</span>
        <span className="text-right">{t('agent.statusLabel')}</span>
        <span />
      </div>
      <ul className="min-w-0 divide-y divide-border">
        {items.map(key => {
          const date = key.status === 'revoked' ? key.revoked_at : key.expires_at
          return (
            <li key={key.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
              <details className="group min-w-0">
                <summary
                  aria-label={t('agent.keyDetailsLabel', { name: key.name })}
                  className="grid min-h-11 min-w-0 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem_5rem_1rem] [&::-webkit-details-marker]:hidden"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">{key.name}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className="font-mono [overflow-wrap:anywhere]">{key.prefix}…</span>
                      <span className="num sm:hidden">
                        {t(key.status === 'revoked' ? 'agent.revokedOn' : 'agent.expiresOn', { date: formatDate(date) })}
                      </span>
                    </div>
                  </div>
                  <time dateTime={date ?? undefined} className="num hidden text-right text-xs text-text-secondary sm:block">
                    {formatDate(date)}
                  </time>
                  <div className="justify-self-end">
                    <Badge tone={key.status === 'active' ? 'info' : key.status === 'expired' ? 'warn' : 'neutral'}>
                      {t(`agent.status.${key.status}`)}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 justify-self-end text-text-muted group-open:rotate-90" aria-hidden />
                </summary>
                <dl className="mt-3 grid min-w-0 grid-cols-1 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-2">
                  {[
                    ['createdAt', formatDateTime(key.created_at)],
                    ['expiresAt', formatDateTime(key.expires_at)],
                    ['lastUsedAt', key.last_used_at ? formatDateTime(key.last_used_at) : t('agent.neverUsed')],
                    ['revokedAt', formatDateTime(key.revoked_at)],
                    ['scope', key.scope],
                    ['duration', t('agent.days', { count: key.expires_in_days })],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-text-muted">{t(`agent.${label}`)}</dt>
                      <dd className="num mt-1 text-text-secondary [overflow-wrap:anywhere]">{value}</dd>
                    </div>
                  ))}
                </dl>
                {key.status !== 'revoked' ? (
                  <div className="flex flex-wrap gap-2 pt-4">
                    <Button
                      variant="secondary"
                      className="min-h-11"
                      disabled={busy || stale}
                      aria-label={t('agent.rotateLabel', { name: key.name })}
                      onClick={() => onAction('rotate', key)}
                    >
                      <RotateCw className="h-4 w-4" aria-hidden />
                      {t('agent.rotateKey')}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11 text-danger"
                      disabled={busy || stale}
                      aria-label={t('agent.revokeLabel', { name: key.name })}
                      onClick={() => onAction('revoke', key)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      {t('agent.revokeKey')}
                    </Button>
                  </div>
                ) : null}
              </details>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export const AgentKeyGroups: React.FC<AgentKeyListProps> = props => {
  const { t } = useTranslation()
  const active = props.items.filter(key => key.status === 'active')
  const expired = props.items.filter(key => key.status === 'expired')
  const revoked = props.items.filter(key => key.status === 'revoked')
  return (
    <div className="min-w-0 space-y-5">
      <section className="min-w-0 space-y-3" aria-label={t('agent.activeKeys', { count: active.length })}>
        <h4 className="text-sm font-semibold text-text-primary">{t('agent.activeKeys', { count: active.length })}</h4>
        {active.length ? <AgentKeyRecords {...props} items={active} /> : (
          <EmptyState
            title={t(props.items.length ? 'agent.noActiveTitle' : 'agent.emptyTitle')}
            description={t(props.items.length ? 'agent.noActiveDescription' : 'agent.emptyDescription')}
          />
        )}
      </section>
      {expired.length ? (
        <details className="min-w-0 border-t border-border pt-3">
          <summary className="min-h-11 cursor-pointer text-sm font-semibold text-warn">
            {t('agent.expiredKeys', { count: expired.length })}
          </summary>
          <div className="min-w-0 space-y-3 pt-2">
            <p className="text-sm leading-6 text-text-secondary">{t('agent.expiredHelp')}</p>
            <AgentKeyRecords {...props} items={expired} />
          </div>
        </details>
      ) : null}
      {revoked.length ? (
        <details className="min-w-0 border-t border-border pt-3">
          <summary className="min-h-11 cursor-pointer text-sm font-medium text-text-secondary">
            {t('agent.revokedKeys', { count: revoked.length })}
          </summary>
          <div className="min-w-0 space-y-3 pt-2">
            <p className="text-sm leading-6 text-text-muted">{t('agent.revokedHelp')}</p>
            <AgentKeyRecords {...props} items={revoked} />
          </div>
        </details>
      ) : null}
    </div>
  )
}

const AgentConnectionContent: React.FC = () => {
  const { t } = useTranslation()
  const [connection, setConnection] = useState<AgentConnection | null>(null)
  const [connectionLoading, setConnectionLoading] = useState(true)
  const [connectionError, setConnectionError] = useState('')
  const [list, setList] = useState<AgentApiKeyList | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [state, dispatch] = useReducer(agentKeyReducer, initialAgentKeyState)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState<AgentKeyDuration>(90)
  const [notice, setNotice] = useState('')
  const mounted = useRef(false)
  const connectionRequest = useRef(0)
  const listRequest = useRef(0)
  const mutationPending = useRef(false)

  const loadConnection = useCallback(async () => {
    const request = ++connectionRequest.current
    setConnectionLoading(true)
    setConnectionError('')
    try {
      const result = await api.getAgentConnection()
      if (!mounted.current || request !== connectionRequest.current) return
      try {
        validateMcpUrl(result.mcp_url)
        if (result.scope !== 'mcp:read' ||
          !result.expires_in_days_options.length ||
          result.expires_in_days_options.some(days => ![30, 90, 365].includes(days)) ||
          !result.expires_in_days_options.includes(result.default_expires_in_days)) {
          throw new Error('Invalid connection metadata')
        }
      } catch {
        setConnection(null)
        setConnectionError('unsafeConnection')
        return
      }
      setConnection(result)
      setDuration(result.default_expires_in_days)
    } catch (error) {
      if (mounted.current && request === connectionRequest.current) {
        setConnection(null)
        setConnectionError(agentErrorKey(error))
      }
    } finally {
      if (mounted.current && request === connectionRequest.current) setConnectionLoading(false)
    }
  }, [])

  const loadList = useCallback(async () => {
    const request = ++listRequest.current
    setListLoading(true)
    setListError('')
    try {
      const result = await loadAllAgentKeys((limit, offset) => {
        if (!mounted.current || request !== listRequest.current) {
          throw new Error('API-key list request superseded')
        }
        return api.listAgentApiKeys(limit, offset)
      })
      if (mounted.current && request === listRequest.current) setList(result)
    } catch (error) {
      if (mounted.current && request === listRequest.current) setListError(agentErrorKey(error))
    } finally {
      if (mounted.current && request === listRequest.current) setListLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void loadConnection()
    void loadList()
    return () => {
      mounted.current = false
    }
  }, [loadConnection, loadList])

  const openCreate = () => {
    if (!list || listLoading || listError || list.non_revoked_count >= list.max_keys) return
    setName('')
    setDuration(connection?.default_expires_in_days ?? 90)
    setNotice('')
    dispatch({ type: 'open', dialog: { kind: 'create' } })
  }

  const openConfirmation = (kind: 'rotate' | 'revoke', key: AgentApiKey) => {
    setNotice('')
    dispatch({ type: 'open', dialog: { kind, key } })
  }

  const mutate = async () => {
    const dialog = state.dialog
    if (mutationPending.current || !['create', 'rotate', 'revoke'].includes(dialog.kind)) return
    const trimmedName = name.trim()
    if (dialog.kind === 'create' && (!trimmedName || [...trimmedName].length > 64 || !connection)) return
    mutationPending.current = true
    dispatch({ type: 'pending' })
    try {
      if (dialog.kind === 'create' || dialog.kind === 'rotate') {
        const issued = dialog.kind === 'create'
          ? await api.createAgentApiKey({ name: trimmedName, expires_in_days: duration })
          : await api.rotateAgentApiKey(dialog.key.id, dialog.key.version)
        if (!mounted.current) return
        dispatch({ type: 'issued', issued, rotated: dialog.kind === 'rotate' })
      } else if (dialog.kind === 'revoke') {
        await api.revokeAgentApiKey(dialog.key.id, dialog.key.version)
        if (!mounted.current) return
        dispatch({ type: 'revoked' })
        setNotice('revokedSuccess')
      }
      if (mounted.current) {
        // The issued secret stays in its dialog even if this metadata request fails.
        void loadList()
      }
    } catch (error) {
      if (!mounted.current) return
      const errorKey = agentErrorKey(error)
      if (errorKey === 'conflict') {
        dispatch({ type: 'conflict' })
        void loadList()
      } else {
        dispatch({ type: 'failed', error: errorKey })
        if (errorKey === 'notFound' || errorKey === 'keyLimit') void loadList()
      }
    } finally {
      mutationPending.current = false
    }
  }

  const dialog = state.dialog
  const dialogOpen = dialog.kind !== 'closed'
  const nameInvalid = !name.trim() || [...name.trim()].length > 64
  const confirmation = dialog.kind === 'rotate' || dialog.kind === 'revoke'
  const ambiguousIssuance = state.error === 'requestFailed' &&
    (dialog.kind === 'create' || dialog.kind === 'rotate')
  const modalTitle = dialog.kind === 'issued'
    ? t('agent.secretTitle')
    : dialog.kind === 'conflict'
      ? t('agent.conflictTitle')
      : t(`agent.${dialog.kind === 'closed' ? 'create' : dialog.kind}Title`)
  const busy = state.pending || listLoading
  const atKeyLimit = Boolean(list && list.non_revoked_count >= list.max_keys)

  return (
    <Panel
      title={t('agent.title')}
      subtitle={t('agent.description')}
      icon={<KeyRound className="h-4 w-4" />}
    >
      <div className="space-y-6">
        <section className="min-w-0 space-y-4" aria-busy={connectionLoading}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-text-primary">{t('agent.connectTitle')}</h3>
            <Badge tone="neutral">HTTP</Badge>
          </div>
          {connectionLoading ? (
            <>
              <Skeleton height={48} />
              <p role="status" className="sr-only">{t('common.loading')}</p>
            </>
          ) : connectionError ? (
            <div className="space-y-3">
              <Alert tone="error">{t(`agent.errors.${connectionError}`)}</Alert>
              <Button variant="secondary" className="min-h-11" onClick={() => void loadConnection()}>
                {t('agent.retryConnection')}
              </Button>
            </div>
          ) : connection ? (
            <>
              <CopyText label={t('agent.endpoint')} value={connection.mcp_url} inline />
              <p className="text-sm leading-6 text-text-secondary">{t('agent.connectionHelp')}</p>
              <details className="min-w-0 border-t border-border pt-4">
                <summary className="min-h-11 cursor-pointer text-sm font-semibold text-text-primary">
                  {t('agent.manualConfig')}
                </summary>
                <div className="min-w-0 space-y-5 pt-3">
                  <p className="text-sm leading-6 text-text-secondary">{t('agent.configHelp')}</p>
                  <CopyText label={t('agent.configLabel')} value={buildAgentConfig(connection.mcp_url)} rows={8} />
                </div>
              </details>
            </>
          ) : null}
          <p className="border-t border-border pt-4 text-xs leading-5 text-text-muted">{t('agent.scopeNotice')}</p>
        </section>

        <section className="min-w-0 space-y-4 border-t border-border pt-6" aria-busy={listLoading}>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-text-primary">{t('agent.keysTitle')}</h3>
              {list ? (
                <span role="status" className="num text-xs text-text-secondary">
                  {t('agent.keyUsage', { used: list.non_revoked_count, max: list.max_keys })}
                </span>
              ) : null}
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button
                className="min-h-11"
                disabled={!connection || connectionLoading || busy || !list || Boolean(listError) || atKeyLimit}
                onClick={openCreate}
              >
                {t('agent.createKey')}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11"
                loading={listLoading}
                disabled={state.pending}
                onClick={() => void loadList()}
              >
                {t('agent.refreshList')}
              </Button>
            </div>
          </div>
          <p className="text-sm leading-6 text-text-secondary">{t('agent.keyHelp')}</p>
          {atKeyLimit ? <Alert tone="info">{t('agent.errors.keyLimit')}</Alert> : null}
          {notice ? <Alert tone="success">{t(`agent.${notice}`)}</Alert> : null}
          {listError ? (
            <div className="space-y-3">
              <Alert tone="error">{t(`agent.errors.${listError}`)} {list ? t('agent.staleList') : ''}</Alert>
              <Button variant="secondary" className="min-h-11" disabled={listLoading} onClick={() => void loadList()}>
                {t('agent.retryList')}
              </Button>
            </div>
          ) : null}
          {listLoading && !list ? (
            <div role="status" className="space-y-3">
              <Skeleton height={96} />
              <span className="sr-only">{t('common.loading')}</span>
            </div>
          ) : list ? (
            <AgentKeyGroups
              items={list.items}
              busy={busy}
              stale={Boolean(listError)}
              onAction={openConfirmation}
            />
          ) : null}
        </section>
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => dispatch({ type: 'close' })}
        title={modalTitle}
        footer={
          dialog.kind === 'issued' || dialog.kind === 'conflict' ? (
            <Button fullWidth className="min-h-11" onClick={() => dispatch({ type: 'close' })}>
              {t(dialog.kind === 'issued' ? 'agent.savedKey' : 'common.close')}
            </Button>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" className="min-h-11" disabled={state.pending} onClick={() => dispatch({ type: 'close' })}>
                {t('common.cancel')}
              </Button>
              <Button
                type={dialog.kind === 'create' ? 'submit' : 'button'}
                form={dialog.kind === 'create' ? 'agent-key-create' : undefined}
                variant={confirmation ? 'danger' : 'primary'}
                className="min-h-11"
                loading={state.pending}
                disabled={ambiguousIssuance || (dialog.kind === 'create' && (nameInvalid || !connection))}
                onClick={dialog.kind === 'create' ? undefined : () => void mutate()}
              >
                {t(dialog.kind === 'rotate' ? 'agent.confirmRotate' : dialog.kind === 'revoke' ? 'agent.confirmRevoke' : 'agent.createKey')}
              </Button>
            </div>
          )
        }
      >
        <div className="min-w-0 space-y-5">
          {state.error ? <Alert tone="error">{t(`agent.errors.${state.error}`)}</Alert> : null}
          {ambiguousIssuance ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-text-secondary">{t('agent.reviewAfterFailure')}</p>
              <Button variant="secondary" className="min-h-11" loading={listLoading} onClick={() => void loadList()}>
                {t('agent.refreshList')}
              </Button>
              {listError ? <Alert tone="error">{t(`agent.errors.${listError}`)}</Alert> : null}
            </div>
          ) : null}
          {state.pending ? <p role="status" className="text-sm text-text-secondary">{t('agent.pending')}</p> : null}
          {dialog.kind === 'create' ? (
            <form id="agent-key-create" className="space-y-5" onSubmit={event => { event.preventDefault(); void mutate() }}>
              <p className="text-sm leading-6 text-text-secondary">{t('agent.createHelp')}</p>
              <Field label={t('agent.name')} hint={t('agent.nameHint')} error={[...name.trim()].length > 64 ? t('agent.nameTooLong') : undefined} required>
                {props => <input {...props} className="input min-h-11 w-full" value={name} onChange={event => setName(event.target.value)} disabled={state.pending} autoComplete="off" required />}
              </Field>
              <Field label={t('agent.expiry')}>
                {props => (
                  <select {...props} className="input min-h-11 w-full" value={duration} disabled={state.pending} onChange={event => setDuration(Number(event.target.value) as AgentKeyDuration)}>
                    {connection?.expires_in_days_options.map(days => <option key={days} value={days}>{t('agent.days', { count: days })}</option>)}
                  </select>
                )}
              </Field>
            </form>
          ) : confirmation ? (
            <>
              <p className="text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">{dialog.key.name}</p>
              <p className="font-mono text-xs text-text-secondary [overflow-wrap:anywhere]">{dialog.key.prefix}…</p>
              <p className="text-sm leading-6 text-text-secondary">{t(dialog.kind === 'rotate' ? 'agent.rotateWarning' : 'agent.revokeWarning')}</p>
              {dialog.kind === 'rotate' ? <p className="text-sm leading-6 text-text-secondary">{t('agent.rotateDuration', { count: dialog.key.expires_in_days })}</p> : null}
            </>
          ) : dialog.kind === 'issued' ? (
            <>
              <Alert tone="success">{t(dialog.rotated ? 'agent.rotatedSuccess' : 'agent.createdSuccess')}</Alert>
              <p className="text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">{dialog.issued.key.name}</p>
              <Alert tone="warning">{t('agent.oneTimeWarning')}</Alert>
              <CopyText label={t('agent.secretLabel')} value={dialog.issued.api_key} rows={3} />
              <p className="text-sm leading-6 text-text-secondary">{t('agent.secretHelp')}</p>
              {connection ? (
                <DirectKeyConfiguration
                  mcpUrl={connection.mcp_url}
                  apiKey={dialog.issued.api_key}
                />
              ) : null}
              {dialog.rotated ? <Alert tone="info">{t('agent.updateClient')}</Alert> : null}
              {listError ? <Alert tone="warning">{t('agent.secretRefreshFailed')}</Alert> : null}
            </>
          ) : null}
        </div>
      </Modal>
    </Panel>
  )
}

// Remounting on account changes drops secrets and ignores old in-flight responses.
const AgentConnectionPanel: React.FC<{ userId: string }> = ({ userId }) => (
  <AgentConnectionContent key={userId} />
)

export default AgentConnectionPanel
