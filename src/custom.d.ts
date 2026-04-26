declare module '*.wiki' {
	const content: any
	export default content
}

export {}

declare module 'vue' {
	interface ComponentCustomProperties {
		$filters: {
			number: (value: number) => string
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
		$t: (key: string, ...args: any[]) => string
		$tc: (key: string, choice?: number, ...args: any[]) => string
		$te: (key: string) => boolean
		$i18n: { locale: string, t: (key: string, ...args: any[]) => string, tc: (key: string, choice?: number, ...args: any[]) => string, te: (key: string) => boolean }
	}
}