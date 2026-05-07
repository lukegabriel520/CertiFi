/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_DEFAULT_CHAIN_ID?: string;
  readonly VITE_ENABLE_ONCHAIN_DEMO?: string;
  readonly VITE_SHOW_DEBUG?: string;
  /** Dev-only: vite.config.ts proxies /api to this origin when set. */
  readonly VITE_DEV_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
