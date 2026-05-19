declare module 'js-beautify' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const js_beautify: any
	export default js_beautify
	export { js_beautify }
}

declare module 'markdown-it' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const md: any
	export default md
}

declare module '*.yaml' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const content: any
	export default content
}

declare module 'vuex' {
	import { App } from 'vue'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Vuex: any
	export default Vuex
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export class Store<S = any> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		constructor(options: any)
		state: S
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		getters: any
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		commit(type: string, payload?: any, options?: any): void
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(type: string, payload?: any, options?: any): Promise<any>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		subscribe(fn: (mutation: any, state: S) => void): () => void
		watch<T>(getter: (state: S) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): () => void
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		registerModule(path: string | string[], module: any, options?: any): void
		unregisterModule(path: string | string[]): void
		hasModule(path: string | string[]): boolean
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		hotUpdate(options: any): void
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		install(app: App, injectKey?: any): void
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function createStore<S>(options: any): Store<S>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function mapState(...args: any[]): any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function mapGetters(...args: any[]): any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function mapMutations(...args: any[]): any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function mapActions(...args: any[]): any

	interface WatchOptions {
		deep?: boolean
		immediate?: boolean
		flush?: 'pre' | 'post' | 'sync'
	}
}
