/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // adicione aqui outras envs VITE_ se um dia precisar
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
