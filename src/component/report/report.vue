<template>
	<div v-if="fight">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div class="tab disabled">
					{{ $t('duration', [report.duration]) }}
				</div>
				<div class="action" link="/fight/{fight.id}" icon="undo"></div>
			</div>
		</div>

		<div class="panel">
			<div class="content">
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
							<report-leek-row v-for="leek in leeks" :key="leek.id" :leek="leek" />
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
				<center>
					<router-link :to="'/fight/' + fight.id">
						<div class="button">{{ $t('rewatch_fight') }}</div>
					</router-link>
					<span v-if="$store.getters.connected">
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
								<div v-else class="button">{{ $t('take_revenge') }}</div>
							</router-link>
						</span>
					</span>
				</center>
			</div>
		</div>

		<div class="panel" name="graph">
			<div class="header">
				<h2>Évolution des points de vie</h2>
				<div class="right">
					<div id="graph-type-button" class="button flat">
						<img src="/image/icon/graph_smooth.png">
					</div>
					<div class="button flat expand">
						<i class="material-icons">expand_more</i>
					</div>
				</div>
			</div>
			<div id="chart-panel" class="content">
				<div class="chart">
					<div class="ct-chart"></div>
				</div>
			</div>
		</div>

		<div class="panel" name="statistics">
			<div class="header">
				<h2>Statistiques</h2>
				<div class="right">
					<div class="button flat expand">
						<img src="/image/icon/collapse.png">
					</div>
				</div>
			</div>
			<div class="content scroll-x">
				<report-statistics :fight="fight" />
			</div>
		</div>

		<div v-if="errors.length > 0 || warnings.length > 0" class="warnings-error panel" name="warnings-errors">
			<div class="header">
				<h2>Erreurs et avertissements ({{ errors.length + warnings.length }})</h2>
				<div class="right">
					<div class="button flat expand">
						<img src="/image/icon/collapse.png">
					</div>
				</div>
			</div>
			<div class="content">
				<div class="title"><b>{{ errors.length }}</b> erreurs</div>
				<pre v-for="e in report.errors" :key="e" class="log error">[{{ e.entity }}] {{ e.data }}</pre>
				<br>
				<div class="title"><b>{{ warnings.length }}</b> avertissements</div>
				<pre v-for="(w, i) in warnings" :key="i" class="log warning">[{{ w.entity }}] {{ w.data }}</pre>
			</div>
		</div>
		<div class="panel">
			<div class="header">
				<h2>Actions</h2>
			</div>
			<div class="content">
				<actions :actions="actions" :leeks="leeks" class="actions" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Fight, FightContext, FightLeek, FightType, Report, ReportLeek } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import ActionsElement from './report-actions.vue'
	import ReportBlock from './report-block.vue'
	import ReportStatistics from './report-statistics.vue'

	class FightResponse {
		fight!: Fight
	}
	@Component({ name: 'report', i18n: {}, components: { actions: ActionsElement, ReportBlock, ReportStatistics} })
	export default class ReportPage extends Vue {
		fight: Fight | null = null
		report: Report | null = null
		actions: number[][] | null = null
		leeks: {[key: number]: ReportLeek} = {}
		logs: any[] = []
		FightType = FightType
		FightContext = FightContext
		errors: any[] = []
		warnings: any[] = []
		myFight: boolean = false
		iWin: boolean = false
		enemy: any = null

		get team1Title() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? this.$i18n.t('report.team1') : this.$i18n.t('report.winners')
		}
		get team2Title() {
			if (!this.fight) { return '' }
			return this.fight.report.win === 0 ? this.$i18n.t('report.team2') : this.$i18n.t('report.loosers')
		}

		created() {
			const id = this.$route.params.id
			const url = this.$store.getters.admin ? 'fight/get-private/' + id + '/' + this.$store.state.token : 'fight/get/' + id
			LeekWars.get<FightResponse>(url).then((data) => {
				this.fight = data.data.fight
				this.report = this.fight.report
				this.actions = this.fight.data.actions

				for (const leek of this.fight.data.leeks) {
					this.leeks[leek.id] = leek as any
					if (leek.summon) {
						leek.name = this.$i18n.t('entity.' + leek.name) as string
					}
				}
				if (this.$store.getters.admin) {
					for (const l in this.report.leeks1) {
						this.report.leeks1[l].aiTime = Math.round(this.report.ai_times[l].time / 1000) / 1000
					}
					for (const l in this.report.leeks2) {
						this.report.leeks2[l].aiTime = Math.round(this.report.ai_times[l].time / 1000) / 1000
					}
				}
				LeekWars.get<any>('fight/get-logs/' + id + '/' + this.$store.state.token).then((d) => {
					this.logs = d.data.logs
					this.warningsErrors(this.logs)
				})
				LeekWars.setTitle(this.$i18n.t('report.title') + " - " + this.fight.team1_name + " vs " + this.fight.team2_name)
				this.$root.$emit('loaded')
			})
		}

		warningsErrors(logs: any[]) {
			this.errors = []
			this.warnings = []
			for (const action of logs) {
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
			for (const leek of leeks) {
				if (leek.id === myLeek.id) { return true }
			}
		}

		challenge() {
			if (!this.$store.getters.connected || !this.fight) { return }
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
					if (data.data.success) {
						this.$router.push('/fight/' + data.data.fight)
					} else {
						LeekWars.toast("Erreur : " + data.data.error)
					}
				})
			}
		}

		graph() {
			// function getY(line, x) {

			// 	var path = $('#chart .ct-chart .ct-series path')[line]

			// 	x = Math.max(path.getPointAtLength(0).x, x)
			// 	x = Math.min(path.getPointAtLength(path.getTotalLength()).x, x)

			// 	var pos
			// 	var p1 = 0
			// 	var p2 = path.getTotalLength()
			// 	var c
			// 	var sec = 1000
			// 	while (sec-- > 0) {
			// 		c = (p1 + p2) / 2
			// 		pos = path.getPointAtLength(c)
			// 		if (Math.abs(x - pos.x) < 1) break
			// 		if (pos.x > x) p2 = c
			// 		else p1 = c
			// 	}
			// 	return pos.y
			// }

			// var update = function() {

			// 	var series = []
			// 	var data = []

			// 	for (var i in statistics.leeks) {
			// 		var leek = statistics.leeks[i]
			// 		if (!leek.leek.summon) {
			// 			data = []
			// 			var thisTurn = 0
			// 			for (var j = 0; j <= fight.report.duration; j++) {
			// 				data.push(statistics.life[j][i])
			// 			}
			// 			series.push(data)
			// 		}
			// 	}

			// 	var data = {
			// 		labels: series[0].map(function(i, j) { return (j + 1) }),
			// 		series: series
			// 	}

			// 	var smooth = localStorage['report/graph-type'] === 'smooth'

			// 	var chart = new Chartist.Line('#chart .ct-chart', data, {
			// 		showPoint: false,
			// 		lineSmooth: smooth,
			// 		height: 350,
			// 		fullWidth: true,
			// 		fullHeight: true
			// 	})

			// 	chart.on('draw', function(context) {
			// 		if (context.type === 'line') {
			// 			context.element.attr({
			// 				style: 'stroke: ' + (LW.TEAM_COLORS[statistics.leeks[context.index].leek.team - 1])
			// 			})
			// 		}
			// 	})

			// 	var selected = null
			// 	var tooltipLeek = -1
			// 	var toolTip = $('#chart .ct-chart')
			// 		.append('<div class="tooltip top"><div class="content"></div><div class="arrow"></div></div>')
			// 		.find('.tooltip').hide()

			// 	$('#chart .ct-chart').off('mouseenter', '.ct-line').on('mouseenter', '.ct-line', function() {
			// 		$('#chart .ct-line').css('stroke-opacity', '0.3')
			// 		$(this).css('stroke-opacity', '1').css('stroke-width', '4px')
			// 		tooltipLeek = $(this).parent().index()
			// 		toolTip.show()
			// 		selected = $(this).parent().index()
			// 	})

			// 	$('#chart-panel').off('mouseleave').on('mouseleave', function() {
			// 		$('#chart .ct-line').css('stroke-opacity', '1').css('stroke-width', '3px')
			// 		toolTip.hide()
			// 	})

			// 	$('#chart-panel').off('mousemove').on('mousemove', function(event) {

			// 		if (tooltipLeek == -1) return ;

			// 		var x = event.clientX - $('#chart-panel').offset().left

			// 		var index = Math.floor(series[tooltipLeek].length * x / $('#chart').width())
			// 		if (typeof series[tooltipLeek][index] === 'undefined') return ;

			// 		var top = getY(tooltipLeek, x) - 55

			// 		toolTip.css({
			// 			left: x - toolTip.width() / 2 - 5,
			// 			top: top
			// 		})

			// 		toolTip.find('.content').html(statistics.leeks[tooltipLeek].leek.name + '<br>' + series[tooltipLeek][index] + ' PV')
			// 	})
			// }

			// var smooth = localStorage['report/graph-type'] === 'smooth'

			// var updateSmooth = function() {

			// 	if (smooth) {
			// 		localStorage['report/graph-type'] = 'smooth'
			// 		$('#graph-type-button img').attr('src', LW.staticURL + 'image/icon/graph_angular.png')
			// 	} else {
			// 		localStorage['report/graph-type'] = 'angular'
			// 		$('#graph-type-button img').attr('src', LW.staticURL + 'image/icon/graph_smooth.png')
			// 	}
			// }

			// $('#graph-type-button').click(function() {
			// 	smooth = !smooth
			// 	updateSmooth()
			// 	update()
			// })
			// updateSmooth()
			// update()
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
	h3 {
		text-align: left;
		margin-left: 30px;
		margin-bottom: 10px;
	}
	.report-general .flags {
		margin: 0 auto;
		padding-bottom: 4px;
	}
	.report-general .flags img {
		width: 26px;
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
		font-size: 13px;
		font-family: monospace;
		color: #555;
		margin: 0;
		word-break: break-all;
		white-space: pre-wrap;
	}
	.log.first {
		margin-top: 3px;
	}
	.log.last {
		margin-bottom: 5px;
	}
	.log.pause {
		color: #999;
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
	.chart {
		margin-left: -10px;
		margin-right: -4px;
		margin-bottom: -16px;
		position: relative;
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
	.button {
		margin: 0 2px;
	}
</style>