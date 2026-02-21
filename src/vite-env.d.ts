/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_DEV: string
	readonly VITE_BETA: string
	readonly VITE_LOCAL: string
	readonly VITE_SIGN_UP: string
	readonly VITE_SOCIAL: string
	readonly VITE_BANK: string
	readonly VITE_API: string
	readonly VITE_AVATAR: string
	readonly VITE_STATIC: string
	readonly VITE_WEBSOCKET: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
