declare module '*.vue' {
	import Vue from 'vue'
	export default Vue
}

declare let ga: Function

declare module 'vuetify/lib/framework';
declare module 'vuetify/lib/components/transitions/createTransition';
declare module '@/vtooltip-fast';

declare module 'vue-chartist' {
	const Chartist: any
	export = Chartist
}
declare module 'chartist' {
	const Chartist: any
	export = Chartist
}
declare module 'katex' {
	const katex: any
	export = katex
}
declare module 'js-beautify' {
	const js_beautify: any
	export = js_beautify
}
declare module 'markdown-it' {
	const markdown: any
	export = markdown
}
declare module 'sanitize-html' {
	const sanitizeHtml: any
	export = sanitizeHtml
}
declare module 'vue-awesome-swiper' {
	const VueAwesomeSwiper: any
	export = VueAwesomeSwiper
}