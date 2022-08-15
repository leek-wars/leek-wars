
import 'chartist/dist/scss/chartist.scss'
import Vue from 'vue'

const Chartist = function(Vue: any, options = {}) {

	Vue.chartist = require('chartist')
	Vue.prototype.$chartist = require('chartist')

	Vue.component('Chartist', {
		props: {
			ratio: {
				type: String,
				default: 'ct-square'
			},
			data: {
				type: Object,
				default() {
					return {
						series: [],
						labels: []
					}
				}
			},
			options: {
				type: Object,
				default() {
					return {}
				}
			},
			type: {
				type: String,
				required: true,
				validator(val: string) {
					return val === 'Pie' || val === 'Line' || val === 'Bar'
				}
			},
			eventHandlers: {
				type: Array,
				default() {
					return []
				}
			},
			responsiveOptions: {
				type: Array,
				default() {
					return []
				}
			},
			noDataData: {
				type: Object,
				default() {
					return {
						message: '',
						class: 'ct-nodata'
					}
				}
			},
		},
		data() {
			return {
				chart: null,
				noData: false,
				message: '',
			}
		},
		watch: {
			ratio: 'redraw',
			options: { handler: 'redraw', deep: true },
			responsiveOptions: { handler: 'redraw', deep: true },
			data: { handler: 'redraw', deep: true },
			type: 'draw',
			eventHandlers: 'resetEventHandlers',
			hasNoData: {
				immediate: true,
				handler(val: string) {
					if (val) {
						(this as any).setNoData()
					} else {
						(this as any).clear()
					}
				}
			}
		},
		mounted() {
			this.draw()
		},
		beforeDestroy() {
			if (this.chart) {
				this.chart.detach()
			}
		},
		computed: {
			hasNoData(): any {
				return !(this as any).data ||
					!(this as any).data.series ||
					(this as any).data.series.length < 1 ||
					(
						((this as any).type !== 'Pie' && !(this as any).options.distributeSeries) &&
						(this as any).data.series.every((series: any) => {
							if (Array.isArray(series)) {
								return !series.length
							}
							return !series.data.length
						})
					)
			},
			noDataOptions(): any {
				return {
					message: (options as any).message || (this as any).noDataData.message,
					class: (options as any).class || (this as any).noDataData.class
				}
			},
		},
		methods: {
			clear() {
				(this as any).noData = false;
				(this as any).message = ''
			},
			draw() {
				if ((this as any).chart) {
					(this as any).chart.detach()
				}
				(this as any).chart = (this as any).hasNoData ? null : new (this as any).$chartist[(this as any).type]((this as any).$refs.chart, (this as any).data, (this as any).options, (this as any).responsiveOptions)
				this.setEventHandlers()
			},
			redraw() {
				(this as any).chart ? (this as any).chart.update((this as any).data, (this as any).options) : this.draw()
			},
			resetEventHandlers(eventHandlers: any, oldEventHandler: any) {
				if (!(this as any).chart) {
					return
				}
				for (const item of oldEventHandler) {
					(this as any).chart.off(item.event, item.fn)
				}
				for (const item of eventHandlers) {
					(this as any).chart.on(item.event, item.fn)
				}
			},
			setEventHandlers() {
				if ((this as any).chart && (this as any).eventHandlers) {
					for (const item of (this as any).eventHandlers) {
						(this as any).chart.on(item.event, item.fn)
					}
				}
			},
			setNoData() {
				(this as any).noData = true;
				(this as any).message = (this as any).noDataOptions.message
			}
		},
		render(h: any) {
			const children = this.message || this.$slots.default || [];

			return h('div', {
				ref: 'chart',
				'class': [
					this.ratio,
					{ [this.noDataOptions.class]: this.noData }
				]
			}, children)
		}
	})
}

Vue.use(Chartist)
