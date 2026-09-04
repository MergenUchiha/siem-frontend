/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** A toast raised from outside React — see `Header`, which registers it. */
export interface AppNotification {
  title: string;
  message: string;
  type: "critical" | "warning" | "info";
  time: string;
}

declare global {
  interface Window {
    /**
     * Registered by `Header` while it is mounted. `App` calls it from the
     * WebSocket handlers, which live outside the component that owns the
     * notification list.
     */
    addNotification?: (notification: AppNotification) => void;
  }
}
