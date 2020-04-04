<template>
	<not-found v-if="error" :title="$t('title')" :message="$t('not_found')" />
	<not-found v-else-if="generating" :title="$t('title')" :message="$t('not_generated_yet')">
		<v-btn slot="button" large color="primary" @click="update">
			<v-icon>mdi-refresh</v-icon>&nbsp;<span>{{ $t('refresh') }}</span>
		</v-btn>
	</not-found>
	<div v-else>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div v-if="report && $store.getters.admin" class="tab disabled">
					{{ fight.size | number }} Ko
				</div>
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
							<report-leek-row v-for="leek in report.leeks" v-if="!leek.summon" :key="leek.id" :leek="leek" :fight="fight" />
						</table>
					</div>
					<div v-else>
						<div v-if="report.win === 1">
							<report-block :icon="team1Icon" :title="team1Title" :fight="fight" :leeks="report.leeks1" :farmer="report.farmer1" :team="report.team1" :flags="report.flags1" />
							<report-block :icon="team2Icon" :title="team2Title" :fight="fight" :leeks="report.leeks2" :farmer="report.farmer2" :team="report.team2" :flags="report.flags2" />
						</div>
						<div v-else>
							<report-block :icon="team1Icon" :title="team1Title" :fight="fight" :leeks="report.leeks2" :farmer="report.farmer2" :team="report.team2" :flags="report.flags2" />
							<report-block :icon="team2Icon" :title="team2Title" :fight="fight" :leeks="report.leeks1" :farmer="report.farmer1" :team="report.team1" :flags="report.flags1" />
						</div>
					</div>
				</div>

				<center class="buttons">
					<router-link :to="'/fight/' + fight.id">
						<v-btn>
							<v-icon>mdi-replay</v-icon>
							{{ $t('rewatch_fight') }}
						</v-btn>
					</router-link>
					<span v-if="$store.state.connected">
						<router-link v-if="fight.context === FightContext.GARDEN" to="/garden">
							<v-btn>
								<v-icon>mdi-undo</v-icon>
								{{ $t('back_to_garden') }}
							</v-btn>
						</router-link>
						<span v-else-if="fight.context == FightContext.TEST">
							<router-link to="/editor">
								<v-btn>
									<v-icon>mdi-undo</v-icon>
									{{ $t('back_to_editor') }}
								</v-btn>
							</router-link>
							<v-btn @click="refight">
								<v-icon>mdi-undo</v-icon>
								{{ $t('refight') }}
							</v-btn>
						</span>
						<span v-else-if="fight.context == FightContext.TOURNAMENT">
							<router-link :to="'/tournament/' + fight.tournament">
								<v-btn>
									<v-icon>mdi-trophy</v-icon>
									{{ $t('back_to_tournament') }}
								</v-btn>
							</router-link>
						</span>
						<span v-else-if="fight.context == FightContext.CHALLENGE">
							<router-link v-if="myFight" :to="'/garden/challenge/' + ['leek', 'farmer'][fight.type] + '/' + enemy">
								<v-btn v-if="iWin">
									<v-icon>mdi-undo</v-icon>
									{{ $t('refight') }}
								</v-btn>
								<v-btn v-else>
									<v-icon>mdi-undo</v-icon>
									<span v-html="$t('take_revenge')"></span>
								</v-btn>
							</router-link>
						</span>
					</span>
				</center>

				<template v-if="fight.trophies.length">
					<h3 class="trophies-title">{{ $t('trophies') }}</h3>
					<div class="trophies">
						<div v-for="(trophy, t) in fight.trophies" :key="t" class="trophy card">
							<img :src="'/image/trophy/big/' + trophy.name + '.png'" class="image">
							<div class="info">
								<div class="name">{{ $t('trophy.' + trophy.name) }}</div>
								<div class="farmer">
									<avatar :farmer="trophy.farmer" />
									{{ trophy.farmer.name }}
								</div>
							</div>
						</div>
					</div>
				</template>
			</div>
		</panel>

		<panel v-if="fight" :title="$t('main.comments') + ' (' + fight.comments.length + ')'" icon="mdi-comment-multiple-outline">
			<comments :comments="fight.comments" @comment="comment" />
		</panel>

		<panel title="Évolution des points de vie" toggle="report/graph" icon="mdi-chart-line">
			<div slot="actions">
				<div class="button flat" @click="toggleSmooth">
					<img v-if="smooth" src="/image/icon/graph_angular.png">
					<img v-else src="/image/icon/graph_smooth.png">
				</div>
			</div>
			<loader v-if="!report" />
			<div v-else ref="chartPanel" class="chart-panel" @mouseleave="chartMouseLeave" @mousemove="chartMouseMove">
				<chartist ref="chart" :data="chartData" :options="chartOptions" :event-handlers="chartEvents" ratio="ct-major-eleventh" class="chart" :class="{long: report.duration >= 30}" type="Line" />
				<div v-show="chartTooltipValue" ref="chartTooltip" :style="{top: chartTooltipY + 'px', left: chartTooltipX + 'px'}" class="chart-tooltip v-tooltip__content top" v-html="chartTooltipValue"></div>
			</div>
		</panel>

		<panel :title="$t('statistics')" toggle="report/statistics" icon="mdi-table-large">
			<loader v-if="!report" />
			<div v-else class="scroll-x">
				<report-statistics :fight="fight" :statistics="statistics" />
			</div>
		</panel>

		<panel v-if="errors.length > 0 || warnings.length > 0" class="warnings-error" toggle="report/warnings-errors" icon="mdi-alert">
			<template slot="title">Erreurs et avertissements ({{ errors.length + warnings.length }})</template>
			<div class="title"><b>{{ errors.length }}</b> erreurs</div>
			<pre v-for="(e, i) in errors" :key="i" class="log error">[{{ e.entity }}] {{ e.data }}</pre>
			<br>
			<div class="title"><b>{{ warnings.length }}</b> avertissements</div>
			<pre v-for="(w, i) in warnings" :key="errors.length + i" class="log warning">[{{ w.entity }}] {{ w.data }}</pre>
		</panel>

		<panel class="last" title="Actions" icon="mdi-format-list-bulleted">
			<loader v-if="!report" />
			<div v-else>
				<actions :actions="actions" :leeks="leeks" class="actions" />
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Action, ActionType } from '@/model/action'
	import { Comment } from '@/model/comment'
	import { Fight, FightContext, FightLeek, FightType, Report, ReportFarmer, ReportLeek, TEAM_COLORS } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import ActionsElement from './report-actions.vue'
	import ReportBlock from './report-block.vue'
	import ReportLeekRow from './report-leek-row.vue'
	const ReportStatistics = () => import(/* webpackChunkName: "[request]" */ `@/component/report/report-statistics.${locale}.i18n`)
	import { Statistics } from './statistics'
	import(/* webpackChunkName: "chartist" */ "@/chartist-wrapper")
	import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/fight.${locale}.lang`)

	@Component({ name: 'report', i18n: {}, components: { actions: ActionsElement, ReportLeekRow, ReportBlock, ReportStatistics} })
	export default class ReportPage extends Vue {
		fight: Fight | null = null
		report: Report | null = null
		actions: Action[] | null = null
		leeks: {[key: number]: ReportLeek} = {}
		farmers: {[key: number]: any} = {}
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
			return this.fight.report.win === 0 ? this.$i18n.t('team1') : this.$i18n.t('winners')
		}
		get team2Title() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? this.$i18n.t('team2') : this.$i18n.t('loosers')
		}
		get team1Icon() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? '' : 'mdi-trophy-outline'
		}
		get team2Icon() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? '' : 'mdi-skull-outline'
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
			const url = this.$store.getters.admin ? 'fight/get-private/' + id : 'fight/get/' + id
			LeekWars.get<Fight>(url).then(data => {
				if (data.status === 0) {
					this.generating = true
					return
				}
				this.fight = data
				this.report = this.fight.report
				this.actions = this.fight.data.actions.map(a => new Action(a))
				this.statistics = Statistics.generate(this.fight)

				for (const fid in this.fight.farmers1) {
					this.farmers[fid] = this.fight.farmers1[fid]
				}
				for (const fid in this.fight.farmers2) {
					this.farmers[fid] = this.fight.farmers2[fid]
				}

				for (const leek of this.fight.data.leeks) {
					this.leeks[leek.id] = leek as any
					if (leek.summon) {
						leek.name = this.$i18n.t('entity.' + leek.name) as string
					}
					leek.farmer = this.farmers[leek.farmer]
				}
				for (const action of this.actions) {
					if (action.params[0] === ActionType.SET_WEAPON) {
						this.leeks[action.params[1]].weapon_name = LeekWars.weapons[LeekWars.weaponTemplates[action.params[2]].item].name
					} else if (action.params[0] === ActionType.USE_WEAPON) {
						action.weapon = this.leeks[action.params[1]].weapon_name
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
				LeekWars.get('fight/get-logs/' + id).then(d => {
					this.logs = d.logs
					this.processLogs()
					this.warningsErrors()
				})
				this.updateChart()
				if (this.fight.context === FightContext.CHALLENGE) {
					this.challenge()
				}
				LeekWars.setActions([{icon: 'mdi-undo', click: () => this.$router.push('/fight/' + id)}])
				LeekWars.setTitle(this.$i18n.t('title') + " - " + this.fight.team1_name + " vs " + this.fight.team2_name)
				this.$root.$emit('loaded')
			})
			.error(error => this.error = true)
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
				const last = localStorage.getItem('editor/last-scenario')
				LeekWars.post('ai/test-scenario', {scenario_id: last}).then(data => {
					this.$router.push('/fight/' + data.fight)
				}).error(error => {
					LeekWars.toast("Erreur : " + error)
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
			const top = this.chartGetY(this.chartTooltipLeek, x) - 52
			this.chartTooltipX = x - tooltip.offsetWidth / 2 - 5,
			this.chartTooltipY = top
			this.chartTooltipValue = this.statistics.leeks[this.chartTooltipLeek].leek.name + '<br>' + this.chartSeries[this.chartTooltipLeek][index] + ' PV'
		}

		comment(comment: Comment) {
			if (this.fight) {
				LeekWars.post('fight/comment', {fight_id: this.fight.id, comment: comment.comment}).then(data => {
					if (this.fight) {
						this.fight.comments.push(comment)
					}
				})
			}
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
		&.long::v-deep .ct-labels *:nth-child(even) .ct-label.ct-horizontal.ct-end {
			padding-top: 12px;
		}
	}
	.warnings-errors .title {
		font-size: 18px;
		margin-bottom: 5px;
	}
	.buttons button {
		margin: 4px;
		i {
			padding-right: 4px;
		}
	}
	.trophies-title {
		margin-top: 0;
	}
	.trophies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		grid-gap: 8px;
		.trophy {
			padding: 6px;
			display: flex;
			align-items: center;
			.name {
				font-size: 18px;
				margin-bottom: 4px;
			}
			.image {
				width: 46px;
				height: 46px;
				margin-right: 10px;
				flex: 0 0 46px;
			}
			.info {
				flex: 1;
			}
			.avatar {
				width: 26px;
				height: 26px;
				margin-right: 6px;
			}
			.farmer {
				display: flex;
				align-items: center;
			}
		}
	}
</style>