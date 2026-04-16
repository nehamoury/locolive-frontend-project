declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisterError?: (error: any) => void;
    onRegisterSkip?: () => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reload?: boolean) => Promise<void>;
}