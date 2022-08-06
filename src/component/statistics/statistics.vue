<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
			</div>
			<div v-if="!LeekWars.mobile" class="tabs">
				<router-link to="/about">
					<div class="tab">
						<v-icon>mdi-information-variant</v-icon>
						{{ $t('main.about') }}
					</div>
				</router-link>
				<router-link to="/changelog">
					<div class="tab">
						<v-icon>mdi-format-list-bulleted-square</v-icon>
						{{ $t('main.changelog') }}
					</div>
				</router-link>
				<router-link to="/app">
					<div class="tab">
						<v-icon>mdi-cellphone-android</v-icon>
						{{ $t('main.app') }}
					</div>
				</router-link>
				<div class="tab" @click="playing = !playing">
					<v-icon>{{ playing ? 'mdi-pause' : 'mdi-play' }}</v-icon>
					<span>{{ $t(playing ? 'pause' : 'play') }}</span>
				</div>
			</div>
		</div>
		<panel v-if="!loaded">
			<loader />
		</panel>
		<panel v-for="(category, category_id) in statistics" v-else :key="category_id" :class="{first: category_id == 1, last: category_id == 8}">
			<h2>{{ $t('category_' + category_id) }}</h2>
			<div :class="{ai: category_id == 3, code: category_id == 6}" class="category">
				<div v-if="category_id == 1" class="chart-wrap left">
					<chartist ref="charts" :data="chartLanguage" :options="chartOptions" class="chart" type="Pie" />
					<div class="title">{{ $t('chart_language') }}</div>
				</div>
				<div v-if="category_id == 2" class="chart-wrap left">
					<chartist ref="charts" :data="chartFightType" :options="chartOptions" class="chart" type="Pie" />
					<div class="title">{{ $t('chart_fight_type') }}</div>
				</div>
				<div v-if="category_id == 3" class="chart-wrap left">
					<chartist ref="charts" :data="chartAI" :options="chartOptions" class="chart" type="Pie" />
					<div class="title">{{ $t('chart_ai_version') }}</div>
				</div>
				<div v-if="category_id == 6" class="chart-wrap left">
					<chartist ref="charts" :data="chartLanguages" :options="chartOptions" class="chart" type="Pie" />
					<div class="title">{{ $t('chart_languages') }}</div>
				</div>
				<div v-if="category_id == 7" class="chart-wrap right">
					<chartist ref="charts" :data="chartItems" :options="chartOptions" class="chart" type="Pie" />
					<div class="title">{{ $t('chart_items') }}</div>
				</div>
				<div v-if="category_id == 8" class="chart-wrap left">
					<chartist ref="charts" :data="chartChests" :options="chartOptions" class="chart left" type="Pie" />
					<div class="title">{{ $t('chart_chests') }}</div>
				</div>
				<template v-for="(statistic, name) in category">
					<div v-if="statistic.visible" :key="name" :class="{private: statistic.private, show_today: statistic.show_today, color: selectedStatistic === name && !!selectedStatisticColor}" class="statistic card" :style="{background: selectedStatistic === name ? selectedStatisticColor : null}" @click="statistic.today_state = statistic.show_today && !statistic.today_state" @mouseenter="hoverStat(name)" @mouseleave="hoverLeave">
						<div class="label"><v-icon v-if="statistic.icon">{{ 'mdi-' + statistic.icon }}</v-icon> {{ $t(name) }}</div>
						<div v-if="!statistic.today_state" class="value total">{{ Math.floor(statistic.value).toLocaleString('fr-FR') }}</div>
						<div v-else class="value today">{{ Math.floor(statistic.today).toLocaleString('fr-FR') }}</div>
						<div class="type">{{ $t(statistic.today_state ? 'today' : 'total') }}</div>
					</div>
					<div v-if="name === 'fight_tournament' || name === 'turrets_killed' || name === 'ais_v4' || name === 'lang_en'" :key="name + '1'" class="delimiter"></div>
					<div v-if="name === 'damage'" class="chart-wrap left"  :key="name + '2'">
						<chartist ref="charts" :data="chartDamage" :options="chartOptions" class="chart" type="Pie" />
						<div class="title">{{ $t('chart_damage_type') }}</div>
					</div>
					<div v-if="name === 'fight_tournament'" class="chart-wrap right" :key="name + '2'">
						<chartist ref="charts" :data="chartFightContext" :options="chartOptions" class="chart" type="Pie" />
						<div class="title">{{ $t('chart_fight_context') }}</div>
					</div>
				</template>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import(/* webpackChunkName: "chartist" */ /* webpackMode: "eager" */ "@/chartist-wrapper")

	const GENERAL_CATEGORY = 1
	const FIGHT_CATEGORY = 2
	const AI_CATEGORY = 3
	const CODE_CATEGORY = 6
	const ITEM_CATEGORY = 7
	const CHEST_CATEGORY = 8
	const DELAY = 80

	class Statistic {
		speed!: number
		value!: number
		today!: number
		visible!: boolean
		interpolate!: boolean
		show_today!: boolean
		today_state!: boolean
	}

	@Component({ name: 'statistics', i18n: {}, mixins: [...mixins] })
	export default class Statistics extends Vue {
		loaded: boolean = false
		statistics: Array<{[key: string]: Statistic}> = []
		statistics_cloned: Array<{[key: string]: Statistic}> = []
		interpolated: Statistic[] = []
		interval: any = null
		playing: boolean = true
		selectedStatistic: string = ''
		selectedStatisticColor: string = ''
		chartOptions = {
			donut: true,
			donutWidth: 50,
			startAngle: 90,
			showLabel: true
		}
		actions = [{icon: 'mdi-play', click: () => this.toggleAction()}]

		get chartFightType() {
			return this.makeChartData(FIGHT_CATEGORY, ['fight_solo', 'fight_farmer', 'fight_team', 'fight_br'])
		}
		get chartFightContext() {
			return this.makeChartData(FIGHT_CATEGORY, ['fight_garden', 'fight_test', 'fight_tournament', 'fight_challenge'])
		}
		get chartDamage() {
			return this.makeChartData(FIGHT_CATEGORY, ['damage_direct', 'damage_poison', 'damage_return', 'damage_life'])
		}
		get chartAI() {
			return this.makeChartData(AI_CATEGORY, ['ais_v1', 'ais_v2', 'ais_v3', 'ais_v4'])
		}
		get chartLanguage() {
			return this.makeChartData(GENERAL_CATEGORY, ['lang_fr', 'lang_en'])
		}
		get chartLanguages() {
			return this.makeChartData(CODE_CATEGORY, ['lw_code_java', 'lw_code_javascript', 'lw_code_php', 'lw_code_css', 'lw_code_vue', 'lw_code_json'])
		}
		get chartItems() {
			return this.makeChartData(ITEM_CATEGORY, [ 'item_resource', 'item_weapon', 'item_chip', 'item_potion', 'item_hat', 'item_pomp' ])
		}
		get chartChests() {
			return this.makeChartData(CHEST_CATEGORY, [ 'chest_wood', 'chest_iron', 'chest_diamond' ])
		}

		makeChartData(category: number, values: string[]) {
			const statistics = this.statistics_cloned[category]
			if (!statistics) { return {} }
			const total = values.reduce((t, s) => t + statistics[s].value, 0)
			const filtered_values = values.filter(s => statistics[s].value / total > 0.01)
			filtered_values.sort((a, b) => statistics[b].value - statistics[a].value)
			return {
				labels: filtered_values.map(s => this.$i18n.te(s + '_chart') ? this.$i18n.t(s + '_chart') : this.$i18n.t(s)),
				series: filtered_values.map(s => { return { value: statistics[s].value, meta: s } })
			}
		}

		created() {
			LeekWars.get('statistic/get-all').then(data => {
				LeekWars.setTitle(this.$i18n.t('title'))
				LeekWars.setActions(this.actions)

				this.statistics = data.statistics

				this.statistics[3].operations.value *= 1000000
				this.statistics[3].operations.speed *= 1000000
				this.statistics[3].operations.today *= 1000000
				this.statistics[3].operations.value += Math.floor(Math.random() * 1000000)
				this.statistics[3].operations.today += Math.floor(Math.random() * 1000000)
				this.statistics[3].operations.speed += Math.floor(Math.random() * 10000)

				this.statistics_cloned = JSON.parse(JSON.stringify(this.statistics))

				for (const c in this.statistics) {
					for (const s in this.statistics[c]) {
						const statistic = this.statistics[c][s]
						Vue.set(statistic, 'today_state', false)
						if (!statistic.visible || !statistic.interpolate) { continue }
						statistic.speed = statistic.speed * (DELAY / 1000)
						if (statistic.speed > 0.002) {
							this.interpolated.push(statistic)
						}
					}
				}

				this.$root.$emit('loaded')
				this.playing = localStorage.getItem('statistics/play') !== 'false'
				if (this.playing) { this.play() }

				this.resize()
				this.loaded = true
				this.$root.$on('resize', () => this.resize())
			})
		}

		beforeDestroy() {
			clearInterval(this.interval)
		}

		resize() {
			setTimeout(() => {
				this.$el.querySelectorAll('.chart').forEach((chart, i) => {
					chart.querySelectorAll('.ct-series path').forEach((e) => (e as HTMLElement).style.strokeWidth = '')
					chart.querySelectorAll('.ct-series').forEach((e, j) => {
						e.addEventListener('mouseenter', () => {
							e.classList.add('selected')
							const path = e.querySelector('path')!
							this.selectedStatistic = path.attributes.getNamedItem('ct:meta')!.value
							this.selectedStatisticColor = getComputedStyle(path).stroke
						})
						e.addEventListener('mouseleave', () => {
							e.classList.remove('selected')
							this.selectedStatistic = ''
							this.selectedStatisticColor = ''
						})
					})
				})
			}, 500)
		}

		toggleAction() {
			this.playing = !this.playing
		}

		@Watch('playing')
		toggle() {
			localStorage.setItem('statistics/play', '' + this.playing)
			this.playing ? this.play() : this.pause()
		}

		play() {
			this.actions[0].icon = 'mdi-pause'
			this.interval = setInterval(() => {
				for (const statistic of this.interpolated) {
					statistic.value += statistic.speed
					statistic.today += statistic.speed
				}
			}, DELAY)
		}

		pause() {
			this.actions[0].icon = 'mdi-play'
			if (this.interval) { clearInterval(this.interval) }
		}

		hoverStat(stat: string) {
			// console.log("hoverStat", stat)
			;(this.$refs.charts as Vue[]).forEach(chart => {
				const series = chart.$el.querySelectorAll('.ct-series')
				series.forEach(s => {
					const path = s.querySelector('path')!
					const name = path.attributes.getNamedItem('ct:meta')
					if (name && name.value === stat) {
						s.classList.add('selected')
						this.selectedStatisticColor = getComputedStyle(path).stroke
					}
				})
			})
			this.selectedStatistic = stat
		}

		hoverLeave() {
			this.selectedStatistic = ''
			this.selectedStatisticColor = ''
			;(this.$refs.charts as Vue[]).forEach(chart => {
				const series = chart.$el.querySelectorAll('.ct-series')
				series.forEach(s => {
					s.classList.remove('selected')
				})
			})
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		text-align: center;
	}
	h2 {
		text-align: center;
		font-weight: 500;
		margin-bottom: 10px;
		font-size: 22px;
		color: #111;
	}
	h2:before, h2:after {
		height: 5px;
		width: 80px;
		vertical-align: middle;
		display: inline-block;
		content: "";
	}
	h2:before {
		background: linear-gradient(to left, #777, rgba(0,0,0,0));
		margin-right: 10px;
	}
	h2:after {
		background: linear-gradient(to right, #777, rgba(0,0,0,0));
		margin-left: 10px;
	}
	#app.app h2 {
		font-size: 22px;
	}
	.stats {
		padding-top: 10px;
		padding-bottom: 20px;
		text-align: center;
	}
	.category.ai {
		max-width: 850px;
		margin: 0 auto;
	}
	.category.code {
		max-width: 850px;
		margin: 0 auto;
	}
	.statistic {
		text-align: left;
		height: 100%;
		vertical-align: top;
		display: inline-block;
		padding: 6px 10px;
		margin: 7px;
		background: white;
		min-width: 130px;
		.label {
			margin-bottom: 4px;
			font-weight: 500;
			display: flex;
			align-items: center;
			gap: 4px;
			.v-icon {
				font-size: 16px;
				transition: none;
			}
		}
		.unit {
			display: inline-block;
			margin-left: 4px;
		}
		.type {
			font-size: 14px;
			font-weight: 300;
			text-align: right;
		}
		.value {
			font-size: 20px;
			display: block;
			color: #777;
			text-align: right;
			&.today {
				color: #00c0e5;
			}
		}
		&.show_today:hover .value.total {
			color: #222;
		}
		&.color {
			.value, .value.total, .label, .type {
				color: white;
			}
		}
		&.show_today.color:hover .value {
			color: white;
		}
	}
	#app.app .statistic {
		margin: 5px;
	}
	.statistic.private {
		background: #eee;
	}
	.statistic.show_today {
		cursor: pointer;
	}
	.chart-wrap {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		margin-top: -6px;
		&.left {
			float: left;
		}
		&.right {
			float: right;
		}
		.title {
			font-weight: 500;
		}
	}
	.chart {
		width: 180px;
		height: 180px;
		margin: 5px;
	}
	.chart ::v-deep .ct-label {
		font-size: 13px;
		fill: white;
		font-weight: bold;
		pointer-events: none;
	}
	.chart ::v-deep .ct-series path {
		stroke-width: 50px;
		transition: stroke-width 0.1s ease;
	}
	.chart ::v-deep .ct-series.selected path {
		stroke-width: 60px !important;
	}
	.chart ::v-deep .ct-series-a path {
		stroke: #003f5c;
	}
	.chart ::v-deep .ct-series-b path {
		stroke: #58508d;
	}
	.chart ::v-deep .ct-series-c path {
		stroke: #bc5090;
	}
	.chart ::v-deep .ct-series-d path {
		stroke: #ff6361;
	}
	.chart ::v-deep .ct-series-e path {
		stroke: #ffa600;
	}
	// .chart ::v-deep .ct-series-f path {
	// 	stroke: #ffa600;
	// }
	.category[category="6"] {
		max-width: 650px;
	}
	.category[category="6"] .statistic {
		width: 120px;
	}
	.group {
		max-width: 800px;
		display: inline-block;
		vertical-align: top;
	}
	.delimiter {
		margin: 35px;
	}
</style>