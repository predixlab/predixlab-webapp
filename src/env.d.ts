/// <reference types="vite-plugin-pwa/client" />

/// Type declarations for import.meta.env used by Vite
/// Keeps TypeScript happy when accessing import.meta.env.PROD and other vars

interface ImportMetaEnv {
  readonly PROD: boolean
  readonly VITE_API_URL?: string
  // add other Vite env vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
