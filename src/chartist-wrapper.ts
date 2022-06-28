
import 'chartist/dist/scss/chartist.scss'

const Chartist = function (Vue, options = {}) {

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
		  default () {
			return {
			  series: [],
			  labels: []
			}
		  }
		},
		options: {
		  type: Object,
		  default () {
			return {}
		  }
		},
		type: {
		  type: String,
		  required: true,
		  validator (val) {
			return val === 'Pie' || val === 'Line' || val === 'Bar'
		  }
		},
		eventHandlers: {
		  type: Array,
		  default () {
			return []
		  }
		},
		responsiveOptions: {
		  type: Array,
		  default () {
			return []
		  }
		},
		noDataData: {
		  type: Object,
		  default () {
			return {
			  message: '',
			  class: 'ct-nodata'
			}
		  }
		},
	  },
	  data () {
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
		  handler (val) {
			if (val) {
			  this.setNoData()
			} else {
			  this.clear()
			}
		  }
		}
	  },
	  mounted () {
		this.draw()
	  },
	  beforeDestroy() {
		if(this.chart) {
			console.log("detach chart")
			this.chart.detach()
		}
	  },
	  computed: {
		hasNoData () {
		  return !this.data ||
			  !this.data.series ||
			  this.data.series.length < 1 ||
			  (
				  (this.type !== 'Pie' && !this.options.distributeSeries) &&
				  this.data.series.every(series => {
					if (Array.isArray(series)) {
					  return !series.length
					}
					return !series.data.length
				  })
			  )
		},
		noDataOptions () {
		  return {
			message: options.message || this.noDataData.message,
			class: options.class || this.noDataData.class
		  }
		},
	  },
	  methods: {
		clear () {
		  this.noData = false
		  this.message = ''
		},
		draw () {
		  this.chart = this.hasNoData ? null : new this.$chartist[this.type](this.$refs.chart, this.data, this.options, this.responsiveOptions)
		  this.setEventHandlers()
		},
		redraw () {
		  this.chart ? this.chart.update(this.data, this.options) : this.draw()
		},
		resetEventHandlers (eventHandlers, oldEventHandler) {
		  if (!this.chart) {
			return
		  }
		  for (let item of oldEventHandler) {
			this.chart.off(item.event, item.fn)
		  }
		  for (let item of eventHandlers) {
			this.chart.on(item.event, item.fn)
		  }
		},
		setEventHandlers () {
		  if (this.chart && this.eventHandlers) {
			for (let item of this.eventHandlers) {
			  this.chart.on(item.event, item.fn)
			}
		  }
		},
		setNoData () {
		  this.noData = true
		  this.message = this.noDataOptions.message
		}
	  },
	  render (h) {
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

  export default Chartist