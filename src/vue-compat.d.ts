declare module '@vue/compat' {
	import { App, Component } from 'vue'

	export { configureCompat } from 'vue'
	export * from 'vue'

	export interface VueConstructor {
		component(id: string, definition?: Component): any
		directive(id: string, definition?: any): any
		filter(id: string, definition?: Function): any
		mixin(mixin: any): void
		use(plugin: any, ...options: any[]): void
		nextTick(callback?: () => void): Promise<void>
		config: {
			productionTip: boolean
			[key: string]: any
		}
	}

	const Vue: VueConstructor
	export default Vue
}
