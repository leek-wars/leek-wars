<template>
	<error v-if="error" :title="$t('title')" :message="$t('not_found')" />
	<error v-else-if="generating" :title="$t('title')" :message="$t('not_generated_yet')">
		<v-btn slot="button" large color="primary" @click="update">
			<v-icon>mdi-refresh</v-icon>&nbsp;<span>{{ $t('refresh') }}</span>
		</v-btn>
	</error>
	<div v-else>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div v-if="report && $store.getters.admin" class="tab disabled">
					{{ fight.size | number }} Ko
				</div>
				<a v-if="report && (errors.length > 0 || warnings.length > 0)" href="#errors" class="tab">
					<span v-if="errors.length > 0"><v-icon class="error">mdi-alert-circle</v-icon> {{ errors.length }}</span>
					<span v-if="warnings.length > 0"><v-icon class="warning">mdi-alert</v-icon> {{ warnings.length }}</span>
				</a>
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
						<div class="scroll-x">
							<table class="report">
								<tr>
									<th>{{ $t('main.leek') }}</th>
									<th>{{ $t('main.level') }}</th>
									<th v-if="$store.getters.admin" class="power">Power</th>
									<th>{{ $t('main.xp') }}</th>
									<th class="gain">{{ $t('main.habs') }}</th>
									<th v-if="fight.type === FightType.SOLO" class="gain">{{ $t('main.talent') }}</th>
									<!-- <th>Opérations</th> -->
									<!-- <th v-if="$store.getters.admin" class="gain">Time</th> -->
								</tr>
								<report-leek-row v-for="leek in report.leeks" v-if="!leek.summon" :key="leek.id" :leek="leek" :fight="fight" />
							</table>
						</div>
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
								<v-icon>mdi-sync</v-icon>
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

				<div v-if="fight.seed" class="seed"><v-icon>mdi-seed</v-icon>{{ $t('seed', [fight.seed]) }}</div>

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

		<panel :title="$t('life_chart')" toggle="report/graph" icon="mdi-chart-line">
			<div slot="actions">
				<div class="button flat" @click="toggleLog">
					<v-icon>mdi-percent-outline</v-icon>
				</div>
				<div class="button flat" @click="toggleSmooth">
					<img v-if="smooth" src="/image/icon/graph_angular.png">
					<img v-else src="/image/icon/graph_smooth.png">
				</div>
			</div>
			<loader v-if="!report" />
			<div v-else ref="chartPanel" class="chart-panel" @mouseleave="chartMouseLeave" @mousemove="chartMouseMove">
				<div class="damage-options">
					<div class="spacer"></div>
					<v-switch v-model="chartDisplaySummons" :label="$t('display_summons')" :hide-details="true" />
				</div>
				<chartist ref="chart" :data="chartData" :options="chartOptions" :event-handlers="chartEvents" ratio="ct-major-eleventh" class="chart" :class="{long: statistics.lives.length >= 30}" type="Line" />
				<div v-show="chartTooltipValue" ref="chartTooltip" :style="{top: chartTooltipY + 'px', left: chartTooltipX + 'px'}" class="chart-tooltip v-tooltip__content top" v-html="chartTooltipValue"></div>
			</div>
		</panel>

		<panel :title="$t('damages_title')" toggle="report/damage" icon="mdi-chart-pie">
			<loader v-if="!loaded" />
			<template v-else>
				<div class="damage-options">
					<v-radio-group v-model="damageChartType" :row="true" :dense="true" :hide-details="true">
						<v-radio :label="$t('inflicted_damage')" />
						<v-radio :label="$t('received_damage')" />
						<v-radio :label="$t('heal')" />
						<v-radio label="Tank" />
					</v-radio-group>
					<div class="spacer"></div>
					<v-radio-group v-if="fight.type !== FightType.BATTLE_ROYALE && fight.type !== FightType.SOLO" v-model="damagesTeams" :row="true" :dense="true" :hide-details="true">
						<v-radio label="Entités" />
						<v-radio label="Équipes" />
					</v-radio-group>
					<v-switch v-model="damagesDisplaySummons" :disabled="damagesTeams === 1" :label="$t('display_summons')" :hide-details="true" />
				</div>
				<div class="damages">
					<div class="damage-chart">
						<chartist :data="damageChartDamage" :options="damageChartOptions" :class="{heal: damageChartType === 2, tank: damageChartType === 3}" class="right" type="Pie" />
						<div class="legend">
							<div v-for="(damage, d) in damageChartDamage.series" :key="d">
								<span :style="{color: legends[d]}">{{ $t('stat_' + damageChartDamage.labels[d]) }}</span> <div class="value">{{ damage | number }}</div>
							</div>
						</div>
					</div>
					<div class="damages-bars" :style="{height: (damagesBarsHeight - 10) + 'px'}">
						<chartist :data="damagesBarsData" :options="damagesBarsOptions" :event-handlers="damagesBarsEvents" :class="{heal: damageChartType === 2, tank: damageChartType === 3}" :style="{height: damagesBarsHeight + 'px'}" class="chart" type="Bar" />
					</div>
				</div>
			</template>
		</panel>

		<panel :title="$t('statistics')" toggle="report/statistics" icon="mdi-table-large">
			<loader v-if="!report" />
			<div v-else class="scroll-x">
				<report-statistics :fight="fight" :statistics="statistics" />
			</div>
		</panel>

		<!-- <panel :title="$t('statistics')" toggle="report/statistics" icon="mdi-table-large">
			<loader v-if="!loaded" />
			<div v-else>
				<lw-map v-if="cells" :cells="cells" />

				<span v-for="(entity, e) in fight.data.leeks" :key="e">
					<v-btn @click="walkedCells(entity.id)">{{ entity.name }}</v-btn>
				</span>
			</div>
		</panel> -->

		<panel v-if="errors.length > 0 || warnings.length > 0" id="errors" class="warnings-error" toggle="report/warnings-errors" icon="mdi-alert">
			<template slot="title">Erreurs et avertissements ({{ errors.length + warnings.length }})</template>
			<div v-if="errors.length" class="title"><b>{{ errors.length }}</b> erreurs</div>
			<pre v-for="(e, i) in errors" :key="i" class="log error">[{{ e.entity }}] {{ e.data }}</pre>
			<div v-if="warnings.length" class="title"><b>{{ warnings.length }}</b> avertissements</div>
			<pre v-for="(w, i) in warnings" :key="errors.length + i" class="log warning">[{{ w.entity }}] {{ w.data }}</pre>
		</panel>

		<panel class="last" title="Actions" icon="mdi-format-list-bulleted">
			<loader v-if="!loaded" />
			<div v-else>
				<actions :actions="actions" :leeks="leeks" class="actions" />
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import Map from '@/component/app/map.vue'
	import { locale } from '@/locale'
	import { Action, ActionType } from '@/model/action'
	import { Comment } from '@/model/comment'
	import { Fight, FightContext, FightLeek, FightType, Report, ReportFarmer, ReportLeek, TEAM_COLORS } from '@/model/fight'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import Chartist from 'chartist'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import ActionsElement from './report-actions.vue'
	import ReportBlock from './report-block.vue'
	import ReportLeekRow from './report-leek-row.vue'
	const ReportStatistics = () => import(/* webpackChunkName: "[request]" */ `@/component/report/report-statistics.${locale}.i18n`)
	import { FightStatistics } from './statistics'
	import(/* webpackChunkName: "chartist" */ /* webpackMode: "eager" */ "@/chartist-wrapper")
	import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/fight.${locale}.lang`)

	@Component({ name: 'report', i18n: {}, mixins, components: { actions: ActionsElement, ReportLeekRow, ReportBlock, ReportStatistics, 'lw-map': Map } })
	export default class ReportPage extends Vue {
		fight: Fight | null = null
		report: Report | null = null
		actions: Action[] | null = null
		leeks: {[key: number]: ReportLeek} = {}
		farmers: {[key: number]: any} = {}
		logs: {[key: number]: any[][]} = {}
		FightType = FightType
		FightContext = FightContext
		loaded: boolean = false
		errors: any[] = []
		warnings: any[] = []
		myFight: boolean = false
		iWin: boolean = false
		enemy: any = null
		smooth: boolean = false
		log: boolean = false
		statistics!: FightStatistics
		chartData: any = null
		chartOptions: any = null
		chartEvents: any = []
		chartTooltipValue: any = null
		chartTooltipX: number = 0
		chartTooltipY: number = 0
		chartTooltipLeek: number | null = null
		chartScale: number = 1
		chart: any
		chartDisplaySummons: boolean = false
		generating: boolean = false
		error: boolean = false
		damageEntities: any = null
		damageChartType: number = 0
		damageChartDamage: any = {}
		damageChartOptions = {
			donut: true,
			donutWidth: 38,
			startAngle: 90,
			showLabel: false
		}
		damagesBarsData: any = {}
		damagesBarsOptions = {
			stackBars: true,
			horizontalBars: true,
			showLabel: true,
			chartPadding: {
				top: 10,
				right: 35,
				bottom: 0,
				left: 90
			}
		}
		damagesTeams: number = 0
		damagesBarsHeight: number = 0
		damagesBarsEvents: any
		damagesDisplaySummons: boolean = false
		cells: any = null
		legends: any

		get id() {
			return this.$route.params.id
		}
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

		@Watch('id', {immediate: true})
		update() {
			this.generating = false
			this.error = false
			this.loaded = false
			this.fight = null
			this.report = null
			this.actions = null
			this.smooth = localStorage.getItem('report/graph-type') === 'smooth'
			this.log = localStorage.getItem('report/log') === 'true'
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
				this.statistics = new FightStatistics()
				this.statistics.generate(this.fight)
				// console.log(this.statistics)

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
				// if (this.$store.getters.admin && this.fight.data.times) {
				// 	for (const l in this.fight.data.times) {
				// 		const id = parseInt(l, 10)
				// 		const leek = this.report.leeks1.find(x => x.id === id)
				// 		if (leek) {
				// 			leek.time = this.fight.data.times[l]
				// 		}
				// 		const leek2 = this.report.leeks2.find(x => x.id === id)
				// 		if (leek2) {
				// 			leek2.time = this.fight.data.times[l]
				// 		}
				// 	}
				// }
				LeekWars.get('fight/get-logs/' + id).then(d => {
					this.logs = d.logs
					this.processLogs()
					this.warningsErrors()
				})
				this.updateChart()
				this.getChartDamage()
				if (this.fight.context === FightContext.CHALLENGE) {
					this.challenge()
				}
				LeekWars.setActions([{icon: 'mdi-undo', click: () => this.$router.push('/fight/' + id)}])
				LeekWars.setTitle(this.$i18n.t('title') + " - " + this.fight.team1_name + " vs " + this.fight.team2_name)
				this.$root.$emit('loaded')
				this.loaded = true
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
		toggleLog() {
			this.log = !this.log
			localStorage.setItem('report/log', '' + this.log)
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

		@Watch('chartDisplaySummons')
		updateChart() {
			if (!this.fight) { return }
			let series = this.log ? this.statistics.lives_percent : this.statistics.lives
			if (!this.chartDisplaySummons) {
				series = series.filter((value, index) => !this.statistics.entities[index].leek.summon)
			}
			this.chartData = {
				series
			}
			this.chartOptions = {
				showPoint: false,
				lineSmooth: this.smooth,
				fullWidth: true,
				fullHeight: true,
				axisX: {
					type: Chartist.FixedScaleAxis,
					divisor: this.fight.report.duration,
				}
			}
			this.chartEvents = [{
				event: 'draw', fn: (context: any) => {
					if (context.type === 'line') {
						context.element.attr({
							style: 'stroke: ' + (TEAM_COLORS[this.statistics.entities[context.index].leek.team - 1])
						})
					}
					if (context.type === 'label') {
						if (this.fight!.report.duration >= 30 && context.axis.units.pos === 'x' && context.text % 2 === 0) {
							context.element.attr({style: 'padding-top: 12px; overflow: visible'})
						}
					}
				}
			}, { event: 'created', fn: (c: any) => {
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
				this.chartScale = (c.axisY.bounds.max - c.axisY.bounds.min)
				this.chart = c
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
			const x = e.clientX - chartPanel.getBoundingClientRect().left + 10

			const top = this.chartGetY(this.chartTooltipLeek, x)
			this.chartTooltipX = x - tooltip.offsetWidth / 2 - 10,
			this.chartTooltipY = top - 40

			const value = Math.round((this.chart.chartRect.y1 - top) * (this.chartScale / (this.chart.chartRect.y1 - this.chart.chartRect.y2)))
			this.chartTooltipValue = this.statistics.entities[this.chartTooltipLeek].leek.name + '<br>' + value + (this.log ? '%' : '') + ' PV'
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

		@Watch('damageChartType')
		@Watch('damagesDisplaySummons')
		@Watch('damagesTeams')
		getChartDamage() {
			const entities: any[][] = [] // Entities or teams

			for (const e in this.statistics.entities) {
				const entity = this.statistics.entities[e]
				let total = 0
				let stats: any[] = []
				const name = entity.leek.summon ? this.$t('entity.' + entity.name) : entity.name
				if (this.damageChartType === 0) {
					total = entity.dmg_out
					stats = [name, entity.leek.id, entity.leek.team, total, entity.direct_dmg_out, entity.poison_out, entity.return_out, entity.nova_out, entity.life_dmg_out]
				} else if (this.damageChartType === 1) {
					total = entity.dmg_in
					stats = [name, entity.leek.id, entity.leek.team, total, entity.direct_dmg_in, entity.poison_in, entity.return_in, entity.nova_in, entity.life_dmg_in]
				} else if (this.damageChartType === 2) {
					total = entity.heal_out + entity.life_steal_out + entity.max_life_out
					stats = [name, entity.leek.id, entity.leek.team, total, entity.heal_out, entity.life_steal_out, entity.max_life_out]
				} else {
					total = entity.tank
					stats = [name, entity.leek.id, entity.leek.team, total, entity.tank]
				}
				if (this.damagesTeams === 1) {
					const team = entities.find(ee => ee[2] === entity.leek.team)
					if (team) {
						team[3] += total
						for (let v = 4; v < stats.length; ++v) {
							team[v] += stats[v]
						}
					} else {
						stats[0] = this.$t('team' + (stats[2]))
						entities.push(stats)
					}
				} else if (entity.leek.summon && !this.damagesDisplaySummons) {
					const summoner = entities.find(ee => ee[1] === entity.leek.owner)!
					summoner[3] += total
					for (let v = 4; v < stats.length; ++v) {
						summoner[v] += stats[v]
					}
				} else {
					entities.push(stats)
				}
			}
			entities.sort((a: any, b: any) => {
				const team1 = this.statistics.entities[a[1]].leek.team
				const team2 = this.statistics.entities[b[1]].leek.team
				if (this.fight!.type !== FightType.BATTLE_ROYALE && team1 !== team2) {
					return team2 - team1
				}
				return a[3] - b[3]
			})
			const series = []
			for (let v = 4; v < entities[0].length; ++v) {
				series.push(entities.map(e => e[v]))
			}
			this.damageEntities = entities
			this.damagesBarsData = {
				labels: entities.map(e => e[0]),
				series
			}
			this.damagesBarsHeight = Math.max(370, entities.length * 25)
			this.damagesBarsEvents = [{
				event: 'draw', fn: (data: any) => {
					if (data.type === 'bar' && data.seriesIndex === this.damagesBarsData.series.length - 1) {
						const node = new Chartist.Svg('text', {
							x: data.x2 + 5,
							y: data.y2 + 5,
						}, 'total')
						node._node.textContent = this.damageEntities[data.index][3]
						data.group.append(node, 'ct-slice-pie')
					}
				}
			}]

			// Chart
			const chartSeries = []
			for (let v = 4; v < entities[0].length; ++v) {
				chartSeries.push(entities.reduce((sum, e) => sum + e[v], 0))
			}
			let labels = []
			if (this.damageChartType === 0) {
				labels = ['direct', 'poison', 'return', 'nova', 'life']
				this.legends = ['#e22424', '#a017d6', '#32b2da', '#2bc491', '#f28dff']
			} else if (this.damageChartType === 1) {
				labels = ['direct', 'poison', 'return', 'nova', 'life']
				this.legends = ['#e22424', '#a017d6', '#32b2da', '#2bc491', '#f28dff']
			} else if (this.damageChartType === 2) {
				labels = ['direct', 'steal', 'max_life']
				this.legends = ['#5fad1b', '#e22424', '#38e9ae']
			} else {
				labels = ['direct']
				this.legends = ['orange']
			}
			this.damageChartDamage = {
				labels,
				series: chartSeries
			}
			// setTimeout(() => {
			// 	this.$el.querySelectorAll('.damage-chart').forEach((chart, i) => {
			// 		chart.querySelectorAll('.ct-series path').forEach((e) => (e as HTMLElement).style.strokeWidth = '')
			// 		chart.querySelectorAll('.ct-series').forEach((e, j) => {
			// 			e.addEventListener('mouseenter', () => {
			// 				e.classList.add('selected')
			// 			})
			// 			e.addEventListener('mouseleave', () => {
			// 				e.classList.remove('selected')
			// 			})
			// 		})
			// 	})
			// }, 500)
		}

		walkedCells(fid: number) {
			this.cells = this.statistics.entities[fid].walkedCells
		}

		// walkedCells(fid: number) {
		// 	console.log("fid", fid)
		// 	const farmer = this.fight.data.leeks.find(l => l.id === fid).farmer.id
		// 	console.log("farmer", farmer)
		// 	const walked = this.statistics.entities[fid].
		// 	const parts = walked.split(',')
		// 	const data = parts[0]
		// 	const start = parseInt(parts[1], 10)
		// 	let array = this.convertStringToUTF8ByteArray(atob(data))
		// 	console.log(array)
		// 	let bits = new Uint8Array(613)
		// 	let cells = new Set<number>()
		// 	let b = start
		// 	for (let i = 0; i < array.length; i++) {
		// 		for (let j = 0; j < 8; ++j) {
		// 			const on = (array[i] & (1 << j)) != 0
		// 			if (on) { cells.add(b) }
		// 			bits[b] = on ? 1 : 0
		// 			b++
		// 		}
		// 	}
		// 	console.log("bits = " + bits)
		// 	console.log("cells = ", cells)
		// 	this.cells = cells
		// }

		// convertStringToUTF8ByteArray(str: string) {
		// 	let binaryArray = new Uint8Array(str.length)
		// 	Array.prototype.forEach.call(binaryArray, function (el, idx, arr) { arr[idx] = str.charCodeAt(idx) })
		// 	return binaryArray
		// }
	}
</script>

<style lang="scss" scoped>
	.tab .v-icon {
		font-size: 20px;
		margin-right: 0;
		&.error {
			color: red;
		}
		&.warning {
			color: orange;
		}
	}
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
		::v-deep .ct-line {
			stroke-width: 3px;
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
	.damages {
		display: flex;
		& > * {
			flex: 270px 0 0;
		}
		.legend {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
			font-weight: 500;
			margin-top: 15px;
			& > div {
				display: flex;
				padding: 2px 0;
				border-bottom: 1px solid #ccc;
			}
			span {
				min-width: 55px;
				text-align: left;
			}
			.value {
				flex: 1;
				text-align: right;
				padding-right: 10px;
			}
		}
	}
	@media screen and (max-width: 599px) {
		.damages {
			flex-direction: column;
		}
	}
	.damage-chart {
		text-align: center;
		width: 100%;
		padding: 10px;
		padding-top: 15px;
		padding-bottom: 5px;
		svg {
			width: 220px;
			height: 220px;
		}
		::v-deep .ct-label {
			font-size: 13px;
			fill: rgba(0,0,0,.7);
			font-weight: bold;
			pointer-events: none;
		}
		::v-deep .ct-series path {
			cursor: pointer;
			stroke-width: 38px;
			transition: stroke-width 0.1s ease;
		}
		::v-deep .ct-series.selected path {
			stroke-width: 48px;
		}
		::v-deep .ct-series-a path {
			stroke: #e22424;
		}
		::v-deep .ct-series-b path {
			stroke: #a017d6;
		}
		::v-deep .ct-series-c path {
			stroke: #32b2da;
		}
		::v-deep .ct-series-d path {
			stroke: #38e9ae;
		}
		::v-deep .ct-series-e path {
			stroke: #f28dff;
		}
		.heal {
			::v-deep .ct-series-a path {
				stroke: #5fad1b;
			}
			::v-deep .ct-series-b path {
				stroke: #e22424;
			}
			::v-deep .ct-series-c path {
				stroke: #38e9ae;
			}
		}
		.tank {
			::v-deep .ct-series-a path {
				stroke: orange;
			}
		}
	}
	.damages-bars {
		flex: 1.8;
		width: 100%;
		height: 356px;
		.chart {
			height: 380px;
		}
		::v-deep .ct-bar {
			stroke-width: 15px;
		}
		::v-deep .ct-series-a line {
			stroke: #e22424;
		}
		::v-deep .ct-series-b line {
			stroke: #a017d6;
		}
		::v-deep .ct-series-c line {
			stroke: #41d3ff;
		}
		::v-deep .ct-series-d line {
			stroke: #38e9ae;
		}
		::v-deep .ct-series-e line {
			stroke: #f28dff;
		}
		.heal {
			::v-deep .ct-series-a line {
				stroke: #5fad1b;
			}
			::v-deep .ct-series-b line {
				stroke: #e22424;
			}
			::v-deep .ct-series-c line {
				stroke: #38e9ae;
			}
		}
		.tank {
			::v-deep .ct-series-a line {
				stroke: orange;
			}
		}
		::v-deep .total {
			font-weight: 500;
			font-size: 14px;
		}
		::v-deep .ct-label.ct-vertical {
			color: #444;
			white-space: nowrap;
		}
	}
	.damage-options {
		display: flex;
		.spacer {
			flex: 1;
		}
	}
	.seed {
		text-align: right;
		color: #333;
		.v-icon {
			font-size: 20px;
		}
	}
</style>