export const USER_NOTICE_VERSION = '2026-08-09'

export type LegalDocumentType = 'terms' | 'privacy'

export const getPortalLegalUrl = (
  language: string,
  document: LegalDocumentType,
) => {
  const portalUrl = import.meta.env.PROD ? 'https://predixlab.com' : 'http://localhost:3000'
  const url = new URL(document, `${portalUrl}/`)
  url.searchParams.set('lng', language.startsWith('zh') ? 'zh' : 'en')
  return url.toString()
}
