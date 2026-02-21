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
	}
}