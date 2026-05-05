declare module '*.wiki' {
	const content: unknown
	export default content
}

declare module 'vuetify/styles' {
	// side-effect import for Vuetify CSS
}

declare global {
	interface Window {
		__FARMER__?: { farmer: { id: number } } | null
		Module?: unknown
	}

	interface Document {
		onwebkitfullscreenchange: ((this: Document, ev: Event) => void) | null
		onmozfullscreenchange: ((this: Document, ev: Event) => void) | null
		MSFullscreenChange: ((this: Document, ev: Event) => void) | null
		webkitExitFullscreen?: () => Promise<void>
		mozCancelFullScreen?: () => Promise<void>
		msExitFullscreen?: () => Promise<void>
	}

	interface HTMLElement {
		webkitRequestFullscreen?: () => Promise<void>
		mozRequestFullScreen?: () => Promise<void>
		msRequestFullscreen?: () => Promise<void>
	}

	const umami: {
		track: (event: string, data?: Record<string, unknown>) => void
	} | undefined
}

export {}

declare module 'vue' {
	interface ComponentCustomProperties {
		$filters: {
			number: (value: number, decimals?: number) => string
			date: (value: number) => string
			datetime: (value: number) => string
			timeseconds: (value: number) => string
			time: (value: number) => string
			duration: (value: number) => string
		}
		// Injecté par la mixin globale dans src/model/vue.ts
		LeekWars: typeof import('@/model/leekwars').LeekWars
		env: typeof import('@/env').env
		// Plugins globaux (Vuex / vue-router / vue-i18n)
		$store: typeof import('@/model/store').store
		$route: import('vue-router').RouteLocationNormalizedLoaded
		$router: import('vue-router').Router
		$t: (key: string, ...args: unknown[]) => string
		$tc: (key: string, choice?: number, ...args: unknown[]) => string
		$te: (key: string) => boolean
		$i18n: { locale: string, t: (key: string, ...args: unknown[]) => string, tc: (key: string, choice?: number, ...args: unknown[]) => string, te: (key: string) => boolean }
	}
}