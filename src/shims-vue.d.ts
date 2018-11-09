declare module '*.vue' {
	import Vue from 'vue'
	export default Vue
}

declare var ga: Function;

declare module 'vue-chartist' {
	var Chartist: any
	export = Chartist
}
declare module 'twemoji' {
	var twemoji: any
	export = twemoji
}
declare module 'katex' {
	var katex: any
	export = katex
}
declare module 'js-beautify' {
	var js_beautify: any
	export = js_beautify
}
