<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
			</div>
			<div class="tabs">
				<div @click="playing = !playing" class="tab">
					<i class="material-icons">{{ playing ? 'pause' : 'play_arrow' }}</i>
					<span>{{ $t(playing ? 'pause' : 'play') }}</span>
				</div>
			</div>
		</div>
		<div v-if="!loaded" class="panel">
			<loader />
		</div>
		<div v-for="(category, category_id) in statistics" v-else :key="category_id" class="panel">
			<h2>{{ $t('category_' + category_id) }}</h2>
			<div class="category" :class="{ai: category_id == 3, code: category_id == 6}">
				<chartist v-if="category_id == 2" class="chart left" :data="chartFightType" :options="chartOptions" type="Pie" />
				<chartist v-if="category_id == 2" class="chart left" :data="chartFightContext" :options="chartOptions" type="Pie" />
				<chartist v-if="category_id == 3" class="chart left" :data="chartAI" :options="chartOptions" type="Pie" />
				<chartist v-if="category_id == 6" class="chart left" :data="chartLanguages" :options="chartOptions" type="Pie" ref="languageChart" />
				<template v-for="(statistic, name, i) in category" v-if="statistic.visible">
					<div :key="name" :class="{private: statistic.private, show_today: statistic.show_today}" class="statistic" @click="statistic.today_state = statistic.show_today && !statistic.today_state" @mouseenter="category_id == 6 && hoverLanguage(i)" @mouseleave="category_id == 6 && hoverLeave()">
						<div class="label">{{ $t(name) }}</div>
						<div v-if="!statistic.today_state" class="value total" :style="{color: category_id == 6 && selectedLanguage === i ? selectedLanguageColor : null}">{{ Math.floor(statistic.value).toLocaleString('fr-FR') }}</div>
						<div v-else class="value today">{{ Math.floor(statistic.today).toLocaleString('fr-FR') }}</div>
						<div class="type">{{ $t(statistic.today_state ? 'today' : 'total') }}</div>
					</div>
					<br :key="name + '1'" v-if="name === 'resurrects' || name === 'ai_characters'">
					<chartist :key="name + '2'" v-if="name === 'resurrects'" class="chart right" :data="chartDamage" :options="chartOptions" type="Pie" />
				</template>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	const FIGHT_CATEGORY = 2
	const AI_CATEGORY = 3
	const CODE_CATEGORY = 6
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

	@Component({ name: 'statistics', i18n: {} })
	export default class Statistics extends Vue {
		loaded: boolean = false
		statistics: Array<{[key: string]: Statistic}> = []
		interpolated: Statistic[] = []
		interval: any = null
		playing: boolean = true
		selectedLanguage: number = -1
		selectedLanguageColor: string | null = null
		chartDamage: any = {}
		chartOptions = {
			donut: true,
			donutWidth: 38,
			startAngle: 90,
			showLabel: true
		}
		get chartFightType() {
			const statistics = this.statistics[FIGHT_CATEGORY]
			if (!statistics) { return {} }
			const stats: any = {}
			stats[this.$i18n.t('statistics.fight_solo') as string] = statistics.fight_solo.value
			stats[this.$i18n.t('statistics.fight_farmer') as string] = statistics.fight_farmer.value
			stats[this.$i18n.t('statistics.fight_team') as string] = statistics.fight_team.value
			return {labels: Object.keys(stats),	series: Object.values(stats)}
		}
		get chartFightContext() {
			const statistics = this.statistics[FIGHT_CATEGORY]
			if (!statistics) { return {} }
			const stats: any = {}
			stats[this.$i18n.t('statistics.fight_garden') as string] = statistics.fight_garden.value
			stats[this.$i18n.t('statistics.fight_test') as string] = statistics.fight_test.value
			stats[this.$i18n.t('statistics.fight_tournament') as string] = statistics.fight_tournament.value
			stats[this.$i18n.t('statistics.fight_challenge') as string] = statistics.fight_challenge.value
			return {labels: Object.keys(stats),	series: Object.values(stats)}
		}
		get chartAI() {
			const statistics = this.statistics[AI_CATEGORY]
			if (!statistics) { return {} }
			let v1 = statistics.ais_v1.value
			let v2 = statistics.ais_v2.value
			const sum = v1 + v2
			v1 = v1 / sum
			v2 = Math.max(0.04, v2 / sum)
			return {labels: ['V1', 'V2'], series: [v1, v2]}
		}
		get chartLanguages() {
			const statistics = this.statistics[CODE_CATEGORY]
			if (!statistics) { return {} }
			const stats = {
				'Java': statistics.lw_code_java,
				'C++': statistics.lw_code_cpp,
				'JavaScript': statistics.lw_code_javascript,
				'PHP': statistics.lw_code_php,
				'CSS': statistics.lw_code_css,
				'HTML': statistics.lw_code_html,
			}
			const short_names: any = {'Java': 'Java', 'C++': 'C++', 'JavaScript': 'JS', 'PHP': 'PHP', 'CSS': 'CSS', 'HTML': 'HTML'}
			const names = Object.keys(stats)
			for (const n in names) {
				names[n] = short_names[names[n]]
			}
			return {labels: names, series: Object.values(stats)}
		}
		created() {
			LeekWars.get<any>('statistic/get-all').then((data) => {
				LeekWars.setTitle(this.$i18n.t('statistics.title'))
				this.statistics = data.data.statistics
				this.statistics[3].operations.value *= 1000000
				this.statistics[3].operations.speed *= 1000000
				this.statistics[3].operations.today *= 1000000
				this.statistics[3].operations.value += Math.floor(Math.random() * 1000000)
				this.statistics[3].operations.today += Math.floor(Math.random() * 1000000)
				this.statistics[3].operations.speed += Math.floor(Math.random() * 10000)
				this.getChartDamage()
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
				this.playing = localStorage.getItem('statistics/play') === 'true'
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
							if (i === 4) {
								this.selectedLanguage = j + 1
								this.selectedLanguageColor = getComputedStyle(e.querySelector('path')!).stroke
							}
						})
						e.addEventListener('mouseleave', () => {
							e.classList.remove('selected')
							this.selectedLanguage = -1
						})
					})
				})
			}, 500)
		}
		@Watch('playing')
		toggle() {
			localStorage.setItem('statistics/play', '' + this.playing)
			this.playing ? this.play() : this.pause()
		}
		play() {
			this.interval = setInterval(() => {
				for (const statistic of this.interpolated) {
					statistic.value += statistic.speed
					statistic.today += statistic.speed
				}
			}, DELAY)
		}
		pause() {
			if (this.interval) { clearInterval(this.interval) }
		}
		getChartDamage() {
			const statistics = this.statistics[FIGHT_CATEGORY]
			if (!statistics) { return {} }
			const stats: any = {}
			let direct = statistics.damage.value - statistics.damage_poison.value - statistics.damage_return.value
			let poison = statistics.damage_poison.value
			let back = statistics.damage_return.value
			const sum = direct + poison + back
			direct = direct / sum
			poison = poison / sum
			back = Math.max(0.04, back / sum)
			stats[this.$i18n.t('statistics.chart_damage_direct') as string] = direct
			stats[this.$i18n.t('statistics.chart_damage_poison') as string] = poison
			stats[this.$i18n.t('statistics.chart_damage_return') as string] = back
			this.chartDamage = {labels: Object.keys(stats), series: Object.values(stats)}
		}
		hoverLanguage(i: number) {
			if (i > 0 && i < 7) {
				const series = (this.$refs.languageChart as Vue[])[0].$el.querySelectorAll('.ct-series')
				series.forEach((s, j) => s.classList.toggle('selected', j === i - 1))
				this.selectedLanguage = i
				this.selectedLanguageColor = getComputedStyle(series[i - 1].querySelector('path')!).stroke
			}
		}
		hoverLeave() {
			this.selectedLanguage = -1
			;(this.$refs.languageChart as Vue[])[0].$el.querySelectorAll('.ct-series').forEach((s, j) => s.classList.remove('selected'))
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		padding-top: 10px;
		text-align: center;
	}
	h2 {
		text-align: center;
		font-weight: 500;
		font-size: 28px;
	}
	h2:before, h2:after {
		height: 5px;
		width: 80px;
		vertical-align: middle;
		display: inline-block;
		content: "";
	}
	h2:before {
		background: linear-gradient(to left, #aaa, rgba(0,0,0,0));
		margin-right: 5px;
	}
	h2:after {
		background: linear-gradient(to right, #aaa, rgba(0,0,0,0));
		margin-left: 5px;
	}
	.stats {
		padding-top: 10px;
		padding-bottom: 20px;
		text-align: center;
	}
	.category {
		vertical-align: top;
		padding: 5px 15px;
		margin-bottom: 10px;
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
		text-align: center;
		height: 100%;
		vertical-align: top;
		display: inline-block;
		padding: 6px 10px;
		margin: 10px;
		background: white;
		border-radius: 3px;
		border-bottom: 2px solid #ddd;
		padding-bottom: 4px;
		min-width: 120px;
	}
	.statistic.private {
		background: #eee;
	}
	.unit {
		display: inline-block;
		margin-left: 4px;
	}
	.type {
		font-size: 14px;
		color: #888;
		font-weight: 300;
		text-align: right;
		margin-top: -3px;
	}
	.value {
		font-size: 24px;
		display: block;
		color: #888;
		text-align: right;
	}
	.statistic.show_today {
		cursor: pointer;
	}
	.statistic.show_today:hover .value.total {
		color: #222;
	}
	.value.today {
		color: #00c0e5;
	}
	.label {
		text-align: left;
		font-size: 16px;
		color: #888;
		display: block;
		font-weight: 300;
		margin: 0 auto;
	}
	.chart {
		width: 180px;
		height: 180px;
		display: inline-block;
	}
	.chart.left {
		float: left;
	}
	.chart.right {
		float: right;
	}
	.chart /deep/ .ct-label {
		font-size: 13px;
		fill: rgba(0,0,0,.7);
		font-weight: bold;
		pointer-events: none;
	}
	.chart /deep/ .ct-series path {
		cursor: pointer;
		stroke-width: 38px;
		transition: stroke-width 0.1s ease;
	}
	.chart /deep/ .ct-series.selected path {
		stroke-width: 48px;
	}
	.chart /deep/ .ct-series-a path {
		stroke: #55e055;
	}
	.chart /deep/ .ct-series-b path {
		stroke: #ffd45d;
	}
	.chart /deep/ .ct-series-c path {
		stroke: #ff5c5c;
	}
	.chart /deep/ .ct-series-d path {
		stroke: #ff61c6;
	}
	.chart /deep/ .ct-series-e path {
		stroke: #6179ff;
	}
	.chart /deep/ .ct-series-f path {
		stroke: #65e5ff;
	}
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
</style>