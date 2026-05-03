declare module 'js-beautify' {
	const js_beautify: any
	export default js_beautify
	export { js_beautify }
}

declare module 'markdown-it' {
	const md: any
	export default md
}

declare module '*.yaml' {
	const content: any
	export default content
}

declare module 'vuex' {
	import { App } from 'vue'
	const Vuex: any
	export default Vuex
	export class Store<S = any> {
		constructor(options: any)
		state: S
		getters: any
		commit(type: string, payload?: any, options?: any): void
		dispatch(type: string, payload?: any, options?: any): Promise<any>
		subscribe(fn: (mutation: any, state: S) => void): () => void
		watch<T>(getter: (state: S) => T, cb: (value: T, oldValue: T) => void, options?: any): () => void
		registerModule(path: string | string[], module: any, options?: any): void
		unregisterModule(path: string | string[]): void
		hasModule(path: string | string[]): boolean
		hotUpdate(options: any): void
		install(app: App, injectKey?: any): void
	}
	export function createStore<S>(options: any): Store<S>
	export function mapState(...args: any[]): any
	export function mapGetters(...args: any[]): any
	export function mapMutations(...args: any[]): any
	export function mapActions(...args: any[]): any
}
