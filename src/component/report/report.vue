<template>
	<not-found v-if="error" :title="$t('title')" :message="$t('not_found')" />
	<not-found v-else-if="generating" :title="$t('title')" :message="$t('not_generated_yet')">
		<div slot="button" class="button green large" @click="update">
			<i class="material-icons">refresh</i>&nbsp;<span>{{ $t('refresh') }}</span>
		</div>
	</not-found>
	<div v-else>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div v-if="report" class="tab disabled">
					{{ $t('duration', [report.duration]) }}
				</div>
			</div>
		</div>

		<panel class="first">
			<loader v-if="!report" slot="content" />
			<div v-else slot="content" class="content">
				<div v-if="fight.too_long" class="too-long">
					{{ $t('generation_too_long') }}
				</div>
				<div class="report-general">
					<div v-if="fight.type === FightType.BATTLE_ROYALE">
						<h3>Poireaux</h3>
						<table class="report">
							<tr>
								<th>{{ $t('leek') }}</th>
								<th>{{ $t('level') }}</th>
								<th>{{ $t('xp') }}</th>
								<th class="gain">{{ $t('money') }}</th>
								<th v-if="fight.type === FightType.SOLO" class="gain">{{ $t('talent') }}</th>
								<th v-if="$store.getters.admin" class="gain">Time</th>
							</tr>
							<report-leek-row v-for="leek in report.leeks" v-if="!leek.summon" :key="leek.id" :leek="leek" />
						</table>
					</div>
					<div v-else>
						<div v-if="report.win === 1">
							<report-block :title="team1Title" :fight="fight" :leeks="report.leeks1" :farmer="report.farmer1" :team="report.team1" :flags="report.flags1" />
							<report-block :title="team2Title" :fight="fight" :leeks="report.leeks2" :farmer="report.farmer2" :team="report.team2" :flags="report.flags2" />
						</div>
						<div v-else>
							<report-block :title="team1Title" :fight="fight" :leeks="report.leeks2" :farmer="report.farmer2" :team="report.team2" :flags="report.flags2" />
							<report-block :title="team2Title" :fight="fight" :leeks="report.leeks1" :farmer="report.farmer1" :team="report.team1" :flags="report.flags1" />
						</div>
					</div>
				</div>
				<center class="buttons">
					<router-link :to="'/fight/' + fight.id">
						<div class="button">{{ $t('rewatch_fight') }}</div>
					</router-link>
					<span v-if="$store.state.connected">
						<router-link v-if="fight.context === FightContext.GARDEN" to="/garden">
							<div class="button">{{ $t('back_to_garden') }}</div>
						</router-link>
						<span v-else-if="fight.context == FightContext.TEST">
							<router-link to="/editor">
								<div class="button">{{ $t('back_to_editor') }}</div>
							</router-link>
							<div class="button" @click="refight">{{ $t('refight') }}</div>
						</span>
						<span v-else-if="fight.context == FightContext.TOURNAMENT">
							<router-link :to="'/tournament/' + fight.tournament">
								<div class="button">{{ $t('back_to_tournament') }}</div>
							</router-link>
						</span>
						<span v-else-if="fight.context == FightContext.CHALLENGE">
							<router-link v-if="myFight" :to="'/garden/challenge/' + ['leek', 'farmer'][fight.type] + '/' + enemy">
								<div v-if="iWin" class="button">{{ $t('refight') }}</div>
								<div v-else class="button">
									<span v-html="$t('take_revenge')"></span>
								</div>
							</router-link>
						</span>
					</span>
				</center>
			</div>
		</panel>

		<panel title="Évolution des points de vie" toggle="report/graph">
			<div slot="actions">
				<div class="button flat" @click="toggleSmooth">
					<img v-if="smooth" src="/image/icon/graph_angular.png">
					<img v-else src="/image/icon/graph_smooth.png">
				</div>
			</div>
			<loader v-if="!report" />
			<div v-else ref="chartPanel" class="chart-panel" @mouseleave="chartMouseLeave" @mousemove="chartMouseMove">
				<chartist ref="chart" :data="chartData" :options="chartOptions" :event-handlers="chartEvents" class="chart" type="Line" />
				<div v-show="chartTooltipValue" ref="chartTooltip" :style="{top: chartTooltipY + 'px', left: chartTooltipX + 'px'}" class="chart-tooltip v-tooltip__content top" v-html="chartTooltipValue"></div>
			</div>
		</panel>

		<panel title="Statistics" toggle="report/statistics">
			<loader v-if="!report" />
			<div v-else class="scroll-x">
				<report-statistics :fight="fight" :statistics="statistics" />
			</div>
		</panel>

		<panel v-if="errors.length > 0 || warnings.length > 0" class="warnings-error" toggle="report/warnings-errors">
			<h2 slot="title">Erreurs et avertissements ({{ errors.length + warnings.length }})</h2>
			<div class="title"><b>{{ errors.length }}</b> erreurs</div>
			<pre v-for="(e, i) in errors" :key="i" class="log error">[{{ e.entity }}] {{ e.data }}</pre>
			<br>
			<div class="title"><b>{{ warnings.length }}</b> avertissements</div>
			<pre v-for="(w, i) in warnings" :key="errors.length + i" class="log warning">[{{ w.entity }}] {{ w.data }}</pre>
		</panel>

		<panel class="last" title="Actions">
			<loader v-if="!report" />
			<div v-else>
				<actions :actions="actions" :leeks="leeks" class="actions" />
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { Action, ActionType } from '@/model/action'
	import { Fight, FightContext, FightLeek, FightType, Report, ReportLeek, TEAM_COLORS } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import ActionsElement from './report-actions.vue'
	import ReportBlock from './report-block.vue'
	import ReportLeekRow from './report-leek-row.vue'
	import ReportStatistics from './report-statistics.vue'
	import { Statistics } from './statistics'

	class FightResponse {
		success!: boolean
		fight!: Fight
	}
	@Component({ name: 'report', i18n: {}, components: { actions: ActionsElement, ReportLeekRow, ReportBlock, ReportStatistics} })
	export default class ReportPage extends Vue {
		fight: Fight | null = null
		report: Report | null = null
		actions: Action[] | null = null
		leeks: {[key: number]: ReportLeek} = {}
		logs: {[key: number]: any[][]} = {}
		FightType = FightType
		FightContext = FightContext
		errors: any[] = []
		warnings: any[] = []
		myFight: boolean = false
		iWin: boolean = false
		enemy: any = null
		smooth: boolean = false
		statistics: any = null
		chartData: any = null
		chartOptions: any = null
		chartEvents: any = []
		chartSeries: any = null
		chartTooltipValue: any = null
		chartTooltipX: number = 0
		chartTooltipY: number = 0
		chartTooltipLeek: number | null = null
		generating: boolean = false
		error: boolean = false

		get team1Title() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? this.$i18n.t('report.team1') : this.$i18n.t('report.winners')
		}
		get team2Title() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? this.$i18n.t('report.team2') : this.$i18n.t('report.loosers')
		}

		@Watch('$route.params', {immediate: true})
		update() {
			this.generating = false
			this.error = false
			this.fight = null
			this.report = null
			this.actions = null
			this.smooth = localStorage.getItem('report/graph-type') === 'smooth'
			const id = this.$route.params.id
			const url = this.$store.getters.admin ? 'fight/get-private/' + id + '/' + this.$store.state.token : 'fight/get/' + id
			LeekWars.get<FightResponse>(url).then((data) => {
				if (!data.success) {
					this.error = true
					return
				}
				if (data.fight.status === 0) {
					this.generating = true
					return
				}
				this.fight = data.fight
				this.report = this.fight.report
				this.actions = this.fight.data.actions.map(a => new Action(a))
				this.statistics = Statistics.generate(this.fight)

				for (const leek of this.fight.data.leeks) {
					this.leeks[leek.id] = leek as any
					if (leek.summon) {
						leek.name = this.$i18n.t('entity.' + leek.name) as string
					}
				}
				if (this.$store.getters.admin && this.report.ai_times) {
					for (const l in this.report.leeks) {
						this.report.leeks[l].aiTime = Math.round(this.report.ai_times[l].time / 1000) / 1000
					}
					for (const l in this.report.leeks1) {
						this.report.leeks1[l].aiTime = Math.round(this.report.ai_times[l].time / 1000) / 1000
					}
					for (const l in this.report.leeks2) {
						this.report.leeks2[l].aiTime = Math.round(this.report.ai_times[l].time / 1000) / 1000
					}
				}
				LeekWars.get<any>('fight/get-logs/' + id + '/' + this.$store.state.token).then((d) => {
					this.logs = d.logs
					this.processLogs()
					this.warningsErrors()
				})
				this.updateChart()
				if (this.fight.context === FightContext.CHALLENGE) {
					this.challenge()
				}
				LeekWars.setActions([{icon: 'undo', click: () => this.$router.push('/fight/' + id)}])
				LeekWars.setTitle(this.$i18n.t('report.title') + " - " + this.fight.team1_name + " vs " + this.fight.team2_name)
				this.$root.$emit('loaded')
			})
		}
		processLogs() {
			if (!this.actions || !this.logs) { return }
			for (const a in this.actions) {
				const i = parseInt(a, 10) + 1
				if (i in this.logs) {
					this.actions[a].logs.push(...this.logs[i].filter(l => l[1] !== 4))
				}
			}
		}
		warningsErrors() {
			this.errors = []
			this.warnings = []
			for (const a in this.logs) {
				const action = this.logs[a]
				for (const log of action) {
					const leek = log[0]
					const type = log[1]
					if (type === 2) {
						this.warnings.push({entity: this.leeks[leek].name, data: log[2]})
					} else if (type === 3) {
						this.errors.push({entity: this.leeks[leek].name, data: log[2]})
					}
				}
			}
		}

		searchMyLeek(myLeek: any, leeks: ReportLeek[]) {
			for (const l in leeks) {
				if (leeks[l].id === myLeek.id) { return true }
			}
		}

		challenge() {
			if (!this.$store.state.farmer || !this.fight) { return }
			for (const ml in this.$store.state.farmer.leeks) {
				if (this.searchMyLeek(this.$store.state.farmer.leeks[ml], this.fight.report.leeks1)) {
					this.myFight = true
					this.iWin = this.fight.report.win === 1
					if (this.fight.type === FightType.SOLO) {
						this.enemy = this.fight.report.leeks2[0].id
					} else if (this.fight.type === FightType.FARMER) {
						this.enemy = this.fight.farmer2
					}
				}
				if (this.searchMyLeek(this.$store.state.farmer.leeks[ml], this.fight.report.leeks2)) {
					this.myFight = true
					this.iWin = this.fight.report.win === 2
					if (this.fight.type === FightType.SOLO) {
						this.enemy = this.fight.report.leeks1[0].id
					} else if (this.fight.type === FightType.FARMER) {
						this.enemy = this.fight.farmer1
					}
				}
			}
		}

		refight() {
			if (this.fight && this.fight.context === FightContext.TEST) {
				const last = localStorage.getItem('editor/last-scenario-data')
				LeekWars.post('ai/test-new', {data: last}).then((data) => {
					if (data.success) {
						this.$router.push('/fight/' + data.fight)
					} else {
						LeekWars.toast("Erreur : " + data.error)
					}
				})
			}
		}
		toggleSmooth() {
			if (this.smooth) {
				localStorage.setItem('report/graph-type', 'angular')
			} else {
				localStorage.setItem('report/graph-type', 'smooth')
			}
			this.smooth = !this.smooth
			this.updateChart()
		}
		chartGetY(line: number, x: number) {
			const path = (this.$refs.chart as Vue).$el.querySelectorAll('.ct-series path')[line] as any
			x = Math.max(path.getPointAtLength(0).x, x)
			x = Math.min(path.getPointAtLength(path.getTotalLength()).x, x)
			let pos
			let p1 = 0
			let p2 = path.getTotalLength()
			let c
			let sec = 1000
			while (sec-- > 0) {
				c = (p1 + p2) / 2
				pos = path.getPointAtLength(c)
				if (Math.abs(x - pos.x) < 1) { break }
				if (pos.x > x) { p2 = c }
				else { p1 = c }
			}
			return pos.y
		}
		updateChart() {
			if (!this.fight) { return }
			this.chartSeries = []
			for (const i in this.statistics.leeks) {
				const leek = this.statistics.leeks[i]
				if (!leek.leek.summon) {
					const data = []
					for (let j = 0; j <= this.fight.report.duration; j++) {
						data.push(this.statistics.life[j][i])
					}
					this.chartSeries.push(data)
				}
			}
			this.chartData = {
				labels: this.chartSeries[0].map((i: number, j: number) => j + 1),
				series: this.chartSeries
			}
			this.chartOptions = {
				showPoint: false,
				lineSmooth: this.smooth,
				height: 350,
				fullWidth: true,
				fullHeight: true
			}
			this.chartEvents = [{
				event: 'draw', fn: (context: any) => {
					if (context.type === 'line') {
						context.element.attr({
							style: 'stroke: ' + (TEAM_COLORS[this.statistics.leeks[context.index].leek.team - 1])
						})
					}
				}
			}, { event: 'created', fn: () => {
				if (!this.$refs.chart) { return }
				const chart = (this.$refs.chart as Vue).$el
				chart.querySelectorAll('.ct-line').forEach((e, i) => {
					e.addEventListener('mouseenter', () => {
						chart.querySelectorAll('.ct-line').forEach((el) => (el as HTMLElement).style.strokeOpacity = '0.3')
						;(e as HTMLElement).style.strokeOpacity = '1'
						;(e as HTMLElement).style.strokeWidth = '4px'
						this.chartTooltipLeek = i
					})
				})
			}}]
		}
		chartMouseLeave() {
			const chart = (this.$refs.chart as Vue).$el
			chart.querySelectorAll('.ct-line').forEach((e) => {
				(e as HTMLElement).style.strokeOpacity = '1'
				;(e as HTMLElement).style.strokeWidth = '3px'
			})
			this.chartTooltipLeek = null
			this.chartTooltipValue = null
		}
		chartMouseMove(e: MouseEvent) {
			const chart = (this.$refs.chart as Vue).$el as HTMLElement
			const chartPanel = this.$refs.chartPanel as HTMLElement
			const tooltip = this.$refs.chartTooltip as HTMLElement
			if (this.chartTooltipLeek === null) { return }
			const x = e.clientX - chartPanel.getBoundingClientRect().left
			const index = Math.floor(this.chartSeries[this.chartTooltipLeek].length * x / chart.offsetWidth)
			if (typeof this.chartSeries[this.chartTooltipLeek][index] === 'undefined') { return }
			const top = this.chartGetY(this.chartTooltipLeek, x) - 40
			this.chartTooltipX = x - tooltip.offsetWidth / 2 - 5,
			this.chartTooltipY = top
			this.chartTooltipValue = this.statistics.leeks[this.chartTooltipLeek].leek.name + '<br>' + this.chartSeries[this.chartTooltipLeek][index] + ' PV'
		}

		expandTabs() {
			// var update = function(panel) {
			// 	var name = $(panel).attr('name')
			// 	var collapsed = localStorage['report/' + name + '-collapsed'] === 'true'
			// 	if (collapsed) {
			// 		$(panel).find('.button.expand img').attr('src', LW.staticURL + 'image/icon/expand.png')
			// 		$(panel).find('.content').hide()
			// 	} else {
			// 		$(panel).find('.button.expand img').attr('src', LW.staticURL + 'image/icon/collapse.png')
			// 		$(panel).find('.content').show()
			// 	}

			// 	if (name == 'graph') LW.pages.report.updateGraph()
			// }

			// $('#report-page .panel[name]').each(function() {

			// 	var name = $(this).attr('name')
			// 	var panel = this

			// 	$(this).find('.button.expand').click(function() {
			// 		localStorage['report/' + name + '-collapsed'] = !(localStorage['report/' + name + '-collapsed'] === 'true')
			// 		update(panel)
			// 	})

			// 	update(panel)
			// })
		}
	}
</script>

<style lang="scss" scoped>
	.report-general .flags {
		margin: 0 auto;
		padding-bottom: 4px;
	}
	.report-general .flags img {
		width: 26px;
	}
	.report {
		width: 100%;
		margin-bottom: 10px;
		background: #f8f8f8;
	}
	.report th {
		border: 1px solid #ddd;
		padding: 8px;
		background: white;
		font-weight: normal;
		color: #777;
	}
	.actions {
		padding: 0 30px;
	}
	.turn {
		font-size: 18px;
		color: #888;
		margin-left: -20px;
	}
	.log {
		padding: 2px 0;
		font-size: 11px;
		margin: 0;
		white-space: normal;
	}
	.warning {
		color: #ff5f00;
	}
	.error {
		color: #ff1900;
	}
	.too-long {
		padding: 10px;
		margin: 20px 100px;
		background: #ffb6b6;
		border-radius: 2px;
	}
	.chart-panel {
		position: relative;
	}
	.chart {
		margin-left: -10px;
		margin-right: -4px;
		margin-bottom: -16px;
		.ct-line {
			stroke: rgba(95,173,27,0.7);
			stroke-width: 3px;
		}
		.ct-area {
			fill: rgba(95,173,27,1);
			fill-opacity: 0.2;
		}
		.ct-label.ct-horizontal {
			text-align: center;
		}
		.tooltip {
			pointer-events: none;
		}
	}
	.warnings-errors .title {
		font-size: 18px;
		margin-bottom: 5px;
	}
	.buttons .button {
		margin: 0 4px;
	}
</style>