<template>
	<error v-if="error" :title="$t('title')" :message="$t('not_found')" />
	<error v-else-if="generating" :title="$t('title')" :message="$t('not_generated_yet')">
		<template #button>
			<v-btn size="large" color="primary" @click="update">
			<v-icon>mdi-refresh</v-icon>&nbsp;<span>{{ $t('refresh') }}</span>
		</v-btn>
		</template>
	</error>
	<div class="page" v-else>
		<div class="page-header page-bar">
			<div>
				<h1><breadcrumb v-if="fight && fightTypeLabel" :items="breadcrumbItems" :raw="true" /><span v-else>{{ $t('title') }}</span></h1>
				<div v-if="fight" class="info">{{ $filters.date(fight.date) }}</div>
			</div>
			<div class="tabs">
				<div v-if="report && fight && $store.getters.admin" class="tab disabled">
					{{ $filters.number(fight.size / 1000) }} Ko
				</div>
				<div v-if="report && fight && fight.generation_time && $store.getters.admin" class="tab disabled">
					{{ $filters.number(fight.generation_time / 1000, 1) }}s
				</div>
				<a v-if="report && (errors.length > 0 || warnings.length > 0)" href="#errors" class="tab">
					<span v-if="errors.length > 0"><v-icon class="error">mdi-alert-circle</v-icon> {{ errors.length }} </span>
					<span v-if="warnings.length > 0"><v-icon class="warning">mdi-alert</v-icon> {{ warnings.length }}</span>
				</a>
				<div v-if="report" class="tab disabled">
					{{ $t('duration', [report.duration]) }}
				</div>
			</div>
		</div>

		<panel class="first">
			<template #content>
				<loader v-if="!report" />
				<div v-else class="content">
				<div v-if="fight.too_long" class="too-long">
					{{ $t('generation_too_long') }}
				</div>
				<div class="report-general">
					<div v-if="fight.type === FightType.BATTLE_ROYALE">
						<h3>{{ $t('main.leeks') }}</h3>
						<div class="scroll-x">
							<table class="report">
								<tr>
									<th>{{ $t('main.leek') }}</th>
									<th>{{ $t('main.level') }}</th>
									<!-- <th v-if="$store.getters.admin" class="power">Power</th> -->
									<th>{{ $t('main.xp') }}</th>
									<th class="gain">{{ $t('main.habs') }}</th>
									<th v-if="fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="resources">{{ $t('main.resources') }}</th>
									<th v-if="fight.type === FightType.SOLO" class="gain">{{ $t('main.talent') }}</th>
									<!-- <th>Opérations</th> -->
									<!-- <th v-if="$store.getters.admin" class="gain">Time</th> -->
								</tr>
								<template v-for="leek in report.leeks" :key="leek.id">
									<report-leek-row v-if="!leek.summon" :leek="leek" :fight="fight" />
								</template>
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

				<div class="center buttons">
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
								(R)
							</v-btn>
						</span>
						<span v-else-if="fight.context == FightContext.TOURNAMENT && fight.tournament != -1">
							<router-link :to="'/tournament/' + fight.tournament">
								<v-btn>
									<v-icon>mdi-trophy</v-icon>
									{{ $t('back_to_tournament') }}
								</v-btn>
							</router-link>
						</span>
						<span v-else-if="fight.context == FightContext.CHALLENGE">
							<router-link v-if="myFight" :to="'/garden/challenge/' + ['leek', 'farmer', 'team'][fight.type] + '/' + enemy">
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
				</div>

				<div class="seed"><v-icon>mdi-seed</v-icon>{{ $t('seed', [fight.seed]) }}</div>

				<template v-if="fight.trophies.length">
					<h3 class="trophies-title">{{ $t('trophies') }}</h3>
					<div class="trophies">
						<router-link v-for="(trophy, t) in fight.trophies" :key="t" v-ripple :to="'/trophy/' + trophy.name" class="trophy card">
							<img :src="'/image/trophy/' + trophy.name + '.svg'" class="image">
							<div class="info">
								<div class="name">{{ $t('trophy.' + trophy.name) }}</div>
								<div class="farmer">
									<avatar :farmer="trophy.farmer" />
									{{ trophy.farmer.name }}
								</div>
							</div>
						</router-link>
					</div>
				</template>
				</div>
			</template>
		</panel>

		<panel v-if="fight" :title="$t('main.comments') + ' (' + fight.comments.length + ')'" icon="mdi-comment-multiple-outline">
			<comments :comments="fight.comments" @comment="comment" />
		</panel>

		<report-life-chart v-if="fight && statistics" :fight="fight" :statistics="statistics" />

		<panel :title="$t('damages_title')" toggle="report/damage" icon="mdi-chart-pie">
			<loader v-if="!loaded" />
			<template v-else>
				<div class="damage-options">
					<v-radio-group v-model="damageChartType" :inline="true" :hide-details="true">
						<v-radio :value="0" :label="$t('inflicted_damage')" :ripple="false" />
						<v-radio :value="1" :label="$t('received_damage')" :ripple="false" />
						<v-radio :value="2" :label="$t('heal')" :ripple="false" />
						<v-radio :value="3" label="Tank" :ripple="false" />
					</v-radio-group>
					<div class="spacer"></div>
					<v-radio-group v-if="fight.type !== FightType.BATTLE_ROYALE && fight.type !== FightType.SOLO" v-model="damagesTeams" :inline="true" :hide-details="true">
						<v-radio :value="0" label="Entités" :ripple="false" />
						<v-radio :value="1" label="Équipes" :ripple="false" />
					</v-radio-group>
					<v-switch v-model="damagesDisplaySummons" :disabled="damagesTeams === 1" :label="$t('display_summons')" :hide-details="true" :ripple="false" />
				</div>
				<div class="damages">
					<div class="damage-chart">
						<Doughnut :data="damageChartDamage" :options="damageChartOptions" :class="{heal: damageChartType === 2, tank: damageChartType === 3}" class="right" />
						<div class="legend">
							<div v-for="(damage, d) in damageChartDamage.datasets[0].data" :key="d">
								<span :style="{color: legends[d]}">{{ damageChartDamage.labels[d] }}</span> <div class="value">{{ $filters.number(damage) }}</div>
							</div>
						</div>
					</div>
					<div class="damages-bars" :style="{minHeight: damagesBarsHeight + 'px'}">
						<Bar :data="damagesBarsData" :options="damagesBarsOptions" :plugins="[damagesBarsTotal]" :class="{heal: damageChartType === 2, tank: damageChartType === 3}" class="chart" />
					</div>
				</div>
			</template>
		</panel>

		<panel :title="$t('statistics')" toggle="report/statistics" icon="mdi-table-large">
			<loader v-if="!statistics" />
			<div v-else class="scroll-x">
				<report-statistics :fight="fight" :statistics="statistics" />
			</div>
		</panel>

		<panel :title="$t('movements')" toggle="report/movements" icon="mdi-map-outline">
			<loader v-if="!loaded" />
			<div v-else class="movements">
				<lw-map v-if="map_obstacles" :teams="map_teams" :obstacles="map_obstacles" />

				<v-btn class="all" @click="walkedCells(999)">{{ $t('all') }}</v-btn>
				<template v-if="fight.type !== FightType.BATTLE_ROYALE">
					<v-btn :style="{background: TEAM_COLORS[0]}" @click="walkedCells(-1)">{{ $t('team1') }}</v-btn>
					<v-btn :style="{background: TEAM_COLORS[1]}" @click="walkedCells(-2)">{{ $t('team2') }}</v-btn>
				</template>
				<span v-for="(entity, e) in fight.data.leeks" :key="e">
					<v-btn :style="{background: TEAM_COLORS[entity.team - 1]}" :class="'t' + entity.team" @click="walkedCells(entity.id)">{{ entity.translatedName }}</v-btn>
				</span>
			</div>
		</panel>

		<panel v-if="hasErrWarn" id="errors" class="warnings-error" toggle="report/warnings-errors" icon="mdi-alert">
			<template #title>{{ $t('errors_warnings') }} ({{ errors.length + warnings.length }})</template>
			<div class="logs">
				<div class="turn">
					<div id="turn-0" class="black">
						<span class="label" @click="goToTurn(0)">{{ $t('errors') }}</span>
						<v-icon v-if="report" class="disabled">mdi-chevron-left</v-icon>
						<v-icon v-if="report" @click="goToTurn(1)">mdi-chevron-right</v-icon>
					</div>
				</div>
				<div v-if="errors.length" class="title">{{ $t('n_errors', errors.length) }}</div>
				<div class="errors" @mouseover="mouseover">
					<div v-for="(e, i) in errors" :key="i" class="log error" :a="e.action" :i="e.index">
						<pre>[{{ e.entity }}] {{ e.data }} <span v-if="e.resolvedAI" class="ai" @click="goToAI(e.resolvedAI, e.line)">[{{ e.resolvedAI.path }}:{{ e.line }}]</span></pre>
					</div>
				</div>
				<div v-if="warnings.length" class="title">
					<i18n-t keypath="n_warnings">
						<template #n>
						<b>{{ warnings.length }}</b>
					</template>
					</i18n-t>
				</div>
				<div class="errors" @mouseover="mouseover">
					<div v-for="(w, i) in warnings" :key="i" class="log warning" :a="w.action" :i="w.index">
						<pre>[{{ w.entity }}] {{ w.data }} <span v-if="w.resolvedAI" class="ai" @click="goToAI(w.resolvedAI, w.line)">[{{ w.resolvedAI.path }}:{{ w.line }}]</span></pre>
					</div>
				</div>
			</div>
		</panel>

		<panel class="last actions" title="Actions" toggle="report/actions" icon="mdi-format-list-bulleted">
			<div v-if="hasPersonalLogs" class="actions-options">
				<div class="spacer"></div>
				<v-switch v-model="actionsDisplayLogs" :label="$t('display_logs')" :hide-details="true" :ripple="false" />
				<v-switch v-model="actionsDisplayAlliesLogs" :label="$t('display_allies_logs')" :hide-details="true" :ripple="false" />
			</div>
			<loader v-if="!loaded" />
			<actions v-else :has-err-warn="hasErrWarn" :fight="fight" :report="report" :actions="fightActions" :leeks="leeks" :display-logs="actionsDisplayLogs" :display-allies-logs="actionsDisplayAlliesLogs" class="actions" />
		</panel>
	</div>
</template>

<script setup lang="ts">
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import Map from '@/component/app/map.vue'
	import { locale } from '@/locale'
	import { Action, ActionType } from '@/model/action'
	import { Comment } from '@/model/comment'
	import { Fight, FightContext, FightType, ReportLeek } from '@/model/fight'
	import { i18n, mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { TEAM_COLORS } from '@/model/team'
	import ActionsElement from './report-actions.vue'
	import ReportBlock from './report-block.vue'
	import ReportLeekRow from './report-leek-row.vue'
	import { FightStatistics } from './statistics'
	import Comments from '@/component/comment/comments.vue'
	import { CHIPS } from '@/model/chips'
	import { fileSystem } from '@/model/filesystem'
	import router from '@/router'
	import { emitter } from '@/model/vue'
	import { computed, defineAsyncComponent, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute } from 'vue-router'
	import { Bar, Doughnut } from 'vue-chartjs'
	import { Tooltip } from 'chart.js'
	import ReportLifeChart from './report-life-chart.vue'

	const ReportStatistics = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/report/report-statistics.${locale}.i18n`))

	;(Tooltip.positioners as any).stackCenter = function(items: any[]) {
		if (!items.length) return false
		const first = items[0].element
		const xStart = Math.min(first.base, first.x)
		const xEnd = Math.max(...items.map((i: any) => Math.max(i.element.x, i.element.base)))
		return { x: (xStart + xEnd) / 2, y: first.y }
	}

	defineOptions({ name: 'report', i18n: {}, mixins: [...mixins], components: { actions: ActionsElement, 'lw-map': Map } })

	const { t, te } = useI18n()
	const route = useRoute()
	const instance = getCurrentInstance()

	const fight = ref<Fight | null>(null)
	const report = ref<any>(null)
	const fightActions = ref<Action[] | null>(null)
	const leeks = ref<{[key: number]: ReportLeek}>({})
	const farmers = ref<{[key: number]: any}>({})
	const logs = ref<{[key: number]: any[][]}>({})
	const loaded = ref(false)
	const fightTypeLabel = ref<string | null>(null)

	const breadcrumbItems = computed(() => {
		if (!fight.value || !fightTypeLabel.value) return []
		return [{ name: fightTypeLabel.value, link: '/fight/' + fight.value.id }, { name: t('title') as string, link: '' }]
	})
	const errors = ref<any[]>([])
	const warnings = ref<any[]>([])
	const hasErrWarn = ref(false)
	const myFight = ref(false)
	const iWin = ref(false)
	const enemy = ref<any>(null)
	const statistics = ref<FightStatistics | null>(null)
	const actionsDisplayAlliesLogs = ref(true)
	const actionsDisplayLogs = ref(true)
	const generating = ref(false)
	const error = ref(false)
	const damageEntities = ref<any>(null)
	const damageChartType = ref(0)
	const damageChartDamage = ref<any>({})
	const damageChartOptions = {
		donut: true, cutout: '70%', rotation: 90, showLabel: false,
		plugins: { legend: { display: false } },
	}
	const damagesBarsData = ref<any>({})
	const damagesBarsOptions = ref<any>(null)
	const damagesBarsTotal = {
		id: 'stackTotal',
		afterDatasetsDraw(chart: any) {
			const ctx = chart.ctx
			const meta = chart.getDatasetMeta(chart.data.datasets.length - 1)
			ctx.save()
			ctx.font = 'bold 13px sans-serif'
			ctx.fillStyle = getComputedStyle(chart.canvas).getPropertyValue('--text-color-secondary') || '#888'
			ctx.textBaseline = 'middle'
			meta.data.forEach((bar: any, i: number) => {
				const total = chart.data.datasets.reduce((sum: number, ds: any) => sum + (ds.data[i] || 0), 0)
				if (total > 0) {
					const lastMeta = chart.getDatasetMeta(chart.data.datasets.length - 1)
					const x = lastMeta.data[i].x
					ctx.fillText(total.toLocaleString(), x + 6, bar.y)
				}
			})
			ctx.restore()
		}
	}
	const damagesTeams = ref(0)
	const damagesBarsHeight = ref(0)
	const damagesDisplaySummons = ref(false)
	const map_obstacles = ref<any>(null)
	const map_teams = ref<any>(null)
	const legends = ref<any>(null)
	let currentLink: Element | null = null

	const id = computed(() => route.params.id)
	const team1Title = computed(() => {
		if (!fight.value) { return '' }
		return fight.value.report.win === 0 ? t('team1') : t('winners')
	})
	const team2Title = computed(() => {
		if (!fight.value) { return '' }
		return fight.value.report.win === 0 ? t('team2') : t('loosers')
	})
	const team1Icon = computed(() => {
		if (!fight.value) { return '' }
		return fight.value.report.win === 0 ? '' : 'mdi-trophy-outline'
	})
	const team2Icon = computed(() => {
		if (!fight.value) { return '' }
		return fight.value.report.win === 0 ? '' : 'mdi-skull-outline'
	})

	const hasPersonalLogs = computed(() => {
		if (logs.value) {
			for (const farmer in logs.value) {
				for (const _ in logs.value[farmer]) { return true }
			}
		}
		return false
	})

	watch(id, () => update(), { immediate: true })

	function update() {
		generating.value = false
		error.value = false
		loaded.value = false
		fight.value = null
		report.value = null
		fightActions.value = null
		fightTypeLabel.value = null
		myFight.value = false
		iWin.value = false
		enemy.value = null

		if (localStorage.getItem('fight/turrets') === null) { localStorage.setItem('fight/turrets', 'true') }
		if (localStorage.getItem('fight/logs') === null) { localStorage.setItem('fight/logs', 'true') }
		if (localStorage.getItem('fight/allies-logs') === null) { localStorage.setItem('fight/allies-logs', 'true') }
		actionsDisplayLogs.value = localStorage.getItem('report/logs') !== 'false'
		actionsDisplayAlliesLogs.value = localStorage.getItem('report/allies-logs') === 'true'

		const fightId = route.params.id
		const url = store.getters.admin ? 'fight/get-private/' + fightId : 'fight/get/' + fightId
		LeekWars.get<Fight>(url).then(data => {
			if (data.status === 0) {
				generating.value = true
				return
			}
			Object.freeze(data.data)
			fight.value = data
			report.value = fight.value.report

			for (const fid in fight.value.farmers1) {
				farmers.value[fid] = fight.value.farmers1[fid]
			}
			for (const fid in fight.value.farmers2) {
				farmers.value[fid] = fight.value.farmers2[fid]
			}

			for (const leek of fight.value.data.leeks) {
				leeks.value[leek.id] = leek as any
				;(leek as any).translatedName = leek.name
				if (leek.type !== 0) {
					;(leek as any).translatedName = te('entity.' + leek.name) ? t('entity.' + leek.name) as string : leek.name
				}
				;(leek as any).farmer = farmers.value[leek.farmer]
			}

			let currentPlayer: ReportLeek | null = null
			const effects = {} as any
			fightActions.value = fight.value.data.actions.map((a: any) => {
				const action = new Action(a)
				if (a[0] === ActionType.LEEK_TURN) {
					currentPlayer = leeks.value[a[1]]
				} else if (a[0] === ActionType.SET_WEAPON_OLD) {
					leeks.value[a[1]].weapon = LeekWars.weapons[a[2]]
				} else if (a[0] === ActionType.SET_WEAPON) {
					currentPlayer!.weapon = LeekWars.weapons[a[1]]
				} else if (a[0] === ActionType.USE_WEAPON || a[0] === ActionType.USE_WEAPON_OLD) {
					action.item = currentPlayer!.weapon
				} else if (a[0] === ActionType.USE_CHIP) {
					action.item = CHIPS[LeekWars.chipTemplates[a[1]].item]
				} else if (a[0] === ActionType.ADD_CHIP_EFFECT || a[0] === ActionType.ADD_WEAPON_EFFECT) {
					effects[a[2]] = { turns: a[7], value: a[6], type: a[5], target: a[4] }
				} else if (a[0] === ActionType.STACK_EFFECT) {
					action.item = effects[a[1]]
				}
				;(action as any).entity = currentPlayer
				return action
			})

			statistics.value = new FightStatistics()
			statistics.value.generate(fight.value)

			getChartDamage()
			updateMap()
			walkedCells(999)
			if (fight.value.context === FightContext.CHALLENGE) {
				challenge()
			}
			LeekWars.setActions([{icon: 'mdi-undo', click: () => router.push('/fight/' + fightId)}])
			let title = t('title') + " - "
			if (fight.value.type === FightType.BATTLE_ROYALE) {
				title += t('main.battle_royale') as string
			} else if (fight.value.type === FightType.WAR) {
				title += t('main.war') as string
			} else if (fight.value.type === FightType.CHEST_HUNT) {
				title += t('main.chest_hunt') as string
			} else if (fight.value.type === FightType.COLOSSUS) {
				title += t('main.colossus') as string
			} else if (fight.value.type === FightType.BOSS) {
				title += t('entity.' + fight.value.boss_name) as string
			} else {
				title += fight.value.team1_name + " vs " + fight.value.team2_name
			}
			const arenaTypes: Record<number, string> = {
				[FightType.BATTLE_ROYALE]: t('main.battle_royale') as string,
				[FightType.WAR]: t('main.war') as string,
				[FightType.CHEST_HUNT]: t('main.chest_hunt') as string,
				[FightType.COLOSSUS]: t('main.colossus') as string,
			}
			fightTypeLabel.value = arenaTypes[fight.value.type] || null
			LeekWars.setTitle(title)
			loaded.value = true
			if (store.state.farmer) {
				LeekWars.get('fight/get-logs/' + fightId).then(d => {
					logs.value = Object.freeze(d) as any
					processLogs()
					warningsErrors()
					setTimeout(() => emitter.emit('loaded'), 100)
				})
			} else {
				nextTick(() => emitter.emit('loaded'))
			}
		})
		.error(() => error.value = true)
	}

	;(async () => {
		emitter.on('keyup', keyup)
		const fightMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/fight.${locale}.lang`)
		i18n.global.mergeLocaleMessage(locale, { fight: fightMessages.default })
	})()

	function keyup(e: KeyboardEvent) {
		if (e.key === 'r') {
			refight()
			e.preventDefault()
		}
	}

	onBeforeUnmount(() => {
		emitter.off('keyup', keyup)
	})

	function processLogs() {
		if (!fightActions.value || !logs.value) { return }
		for (const a in fightActions.value) {
			const i = parseInt(a, 10)
			for (const farmer in logs.value) {
				const farmerLogs = logs.value[farmer]
				if (i in farmerLogs) {
					;(fightActions.value[+a] as any).me = parseInt(farmer, 10) === store.state.farmer!.id
					fightActions.value[+a].logs.push(...farmerLogs[i].filter(l => l[1] !== 4 && l[1] !== 9 && l[1] !== 10))
				}
			}
		}
	}

	function warningsErrors() {
		errors.value = []
		warnings.value = []
		for (const farmer in logs.value) {
			if (parseInt(farmer, 10) !== store.state.farmer!.id) { continue }
			const farmerLogs = logs.value[farmer]
			for (const a in farmerLogs) {
				const action = farmerLogs[a]
				let i = 0
				for (const log of action) {
					const leek = log[0]
					const type = log[1]
					const message = (type >= 6 && type <= 8) ? i18n.t('leekscript.error_' + log[3], log[4]) + "\n" + log[2] : log[2]
					if (type === 2 || type === 7) {
						warnings.value.push({entity: leeks.value[leek].name, data: message, action: a, index: i, ai: log[4], line: log[5], resolvedAI: fileSystem.ais[log[4]]})
					} else if (type === 3 || type === 8) {
						errors.value.push({entity: leeks.value[leek].name, data: message, action: a, index: i, ai: log[4], line: log[5], resolvedAI: fileSystem.ais[log[4]]})
					}
					i++
				}
			}
		}
		hasErrWarn.value = errors.value.length > 0 || warnings.value.length > 0
	}

	function searchMyLeek(myLeek: any, leeks: ReportLeek[]) {
		for (const l in leeks) {
			if (leeks[l].id === myLeek.id) { return true }
		}
	}

	function challenge() {
		if (!store.state.farmer || !fight.value) { return }
		const myFarmerId = store.state.farmer.id
		let mySide = 0
		for (const ml in store.state.farmer.leeks) {
			if (searchMyLeek(store.state.farmer.leeks[ml], fight.value.report.leeks1)) {
				mySide = 1
				break
			} else if (searchMyLeek(store.state.farmer.leeks[ml], fight.value.report.leeks2)) {
				mySide = 2
				break
			}
		}
		if (mySide === 0) { return }
		myFight.value = true
		iWin.value = fight.value.report.win === mySide
		if (fight.value.type === FightType.SOLO) {
			enemy.value = mySide === 1
				? fight.value.report.leeks2[0].id
				: (fight.value.report.leeks1.length ? fight.value.report.leeks1[0].id : -1)
		} else if (fight.value.type === FightType.FARMER) {
			enemy.value = fight.value.farmer1 === myFarmerId ? fight.value.farmer2 : fight.value.farmer1
		} else if (fight.value.type === FightType.TEAM && fight.value.team1 && fight.value.team2) {
			const myTeamId = store.state.farmer.team?.id ?? null
			enemy.value = fight.value.team1.id === myTeamId ? fight.value.team2.id : fight.value.team1.id
		}
	}

	function refight() {
		if (fight.value && fight.value.context === FightContext.TEST) {
			const last = localStorage.getItem('editor/last-scenario')
			const last_ai = localStorage.getItem('editor/last-scenario-ai')
			LeekWars.post('ai/test-scenario', {scenario_id: last, ai_id: last_ai}).then(data => {
				router.push('/fight/' + data.fight)
			}).error(error => {
				LeekWars.toast("Erreur : " + error)
			})
		}
	}

	function comment(comment: Comment) {
		if (fight.value) {
			LeekWars.post('fight/comment', {fight_id: fight.value.id, comment: comment.comment}).then(() => {
				if (fight.value) {
					fight.value.comments.push(comment)
				}
			})
		}
	}

	watch([damageChartType, damagesDisplaySummons, damagesTeams, () => LeekWars.darkMode], () => getChartDamage())

	function getChartDamage() {
		if (!statistics.value || !fight.value) return
		const entities: any[][] = []

		for (const e in statistics.value.entities) {
			const entity = statistics.value.entities[e]
			let total = 0
			let stats: any[] = []
			const name = entity.translatedName
			if (damageChartType.value === 0) {
				total = entity.dmg_out
				stats = [name, entity.leek.id, entity.leek.team, total, entity.direct_dmg_out, entity.poison_out, entity.return_out, entity.nova_out, entity.life_dmg_out]
			} else if (damageChartType.value === 1) {
				total = entity.dmg_in
				stats = [name, entity.leek.id, entity.leek.team, total, entity.direct_dmg_in, entity.poison_in, entity.return_in, entity.nova_in, entity.life_dmg_in]
			} else if (damageChartType.value === 2) {
				total = entity.heal_out + entity.life_steal_out + entity.max_life_out
				stats = [name, entity.leek.id, entity.leek.team, total, entity.heal_out, entity.life_steal_out, entity.max_life_out]
			} else {
				total = entity.tank
				stats = [name, entity.leek.id, entity.leek.team, total, entity.tank]
			}
			if (damagesTeams.value === 1) {
				const team = entities.find(ee => ee[2] === entity.leek.team)
				if (team) {
					team[3] += total
					for (let v = 4; v < stats.length; ++v) {
						team[v] += stats[v]
					}
				} else {
					stats[0] = t('team' + (stats[2]))
					entities.push(stats)
				}
			} else if (entity.leek.summon && !damagesDisplaySummons.value) {
				const summoner = entities.find(ee => ee[1] === entity.leek.owner)!
				summoner[3] += total
				for (let v = 4; v < stats.length; ++v) {
					summoner[v] += stats[v]
				}
			} else {
				entities.push(stats)
			}
		}
		entities.sort((a, b) => {
			const team1 = statistics.value!.entities[a[1]].leek.team
			const team2 = statistics.value!.entities[b[1]].leek.team
			if (fight.value!.type !== FightType.BATTLE_ROYALE && team1 !== team2) {
				return team2 - team1
			}
			return a[3] - b[3]
		})
		const series = []
		for (let v = 4; v < entities[0].length; ++v) {
			series.push(entities.map(e => e[v]))
		}
		damageEntities.value = entities

		let labelKeys: string[] = []
		let colors: string[] = []
		if (damageChartType.value === 0 || damageChartType.value === 1) {
			labelKeys = ['direct', 'poison', 'return', 'nova', 'life']
			colors = ['#e22424', '#a017d6', '#41d3ff', '#38e9ae', '#f28dff']
			legends.value = ['#e22424', '#a017d6', '#32b2da', '#2bc491', '#f28dff']
		} else if (damageChartType.value === 2) {
			labelKeys = ['direct', 'steal', 'max_life']
			colors = ['#5fad1b', '#e22424', '#38e9ae']
			legends.value = ['#5fad1b', '#e22424', '#38e9ae']
		} else {
			labelKeys = ['direct']
			colors = ['orange']
			legends.value = ['orange']
		}
		const labels = labelKeys.map(k => t('stat_' + k) as string)

		damagesBarsData.value = {
			labels: entities.map(e => e[0]),
			datasets: series.map((s, i) => ({ label: labels[i], data: s, stack: 'total', backgroundColor: colors[i] }) )
		}
		damagesBarsHeight.value = Math.max(370, entities.length * 25)
		const el = instance?.proxy?.$el as HTMLElement
		const style = el ? getComputedStyle(el) : null
		const textColor = style?.getPropertyValue('--text-color-secondary').trim() || '#888'
		damagesBarsOptions.value = {
			maintainAspectRatio: false,
			barThickness: 15,
			layout: { padding: { right: 45 } },
			plugins: {
				legend: { display: false },
				tooltip: {
					mode: 'index' as any,
					intersect: true,
					position: 'stackCenter' as any,
					yAlign: 'top',
					callbacks: {
						title: (items: any[]) => items[0]?.label || '',
						label: (context: any) => context.raw ? `${context.dataset.label} : ${context.raw.toLocaleString()}` : null,
					}
				}
			},
			indexAxis: 'y',
			scales: {
				x: { stacked: true, grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: textColor } },
				y: { stacked: true, reverse: true, grid: { display: false }, ticks: { color: textColor } },
			}
		}

		const chartSeries = []
		for (let v = 4; v < entities[0].length; ++v) {
			chartSeries.push(entities.reduce((sum, e) => sum + e[v], 0))
		}
		damageChartDamage.value = {
			labels,
			datasets: [{
				data: chartSeries,
				backgroundColor: colors
			}]
		}
	}

	watch(actionsDisplayLogs, () => {
		localStorage.setItem('report/logs', '' + actionsDisplayLogs.value)
	})
	watch(actionsDisplayAlliesLogs, () => {
		localStorage.setItem('report/allies-logs', '' + actionsDisplayAlliesLogs.value)
	})

	function updateMap() {
		map_obstacles.value = fight.value!.data.map.obstacles
	}

	function walkedCells(fid: number) {
		if (!statistics.value) return
		if (fid === 999) {
			map_teams.value = statistics.value.teams
		} else if (fid < 0) {
			map_teams.value = {[-fid]: statistics.value.teams[-fid]}
		} else {
			map_teams.value = {[statistics.value.entities[fid].team]: statistics.value.entities[fid].walkedCells}
		}
	}

	function goToAI(ai: { path: string }, line: number) {
		router.push('/editor/' + ai.path + '?line=' + line)
	}

	function goToTurn(turn: number) {
		const element = document.getElementById('turn-' + turn)
		if (element) {
			const sibling = element.parentElement!.nextElementSibling!
			window.scrollTo(0, sibling.getBoundingClientRect().top + window.scrollY - 48)
		}
	}

	function mouseover(e: MouseEvent) {
		let target = (e.target as Element)
		if (target.tagName === 'PRE') target = target.parentElement as Element
		else if (target.tagName === 'A') target = target.parentElement as Element
		else if (target.tagName === 'SPAN') target = target.closest('.log') as Element || target
		if (currentLink && currentLink !== target) {
			const l = currentLink.querySelector('a')
			if (l) {
				currentLink.removeChild(l)
			}
		}
		currentLink = target
		const link = target.querySelector('a')
		if (!link) {
			const action = target.getAttribute('a')
			const index = target.getAttribute('i')
			const l = document.createElement('a')
			l.innerText = '➡️'
			l.onclick = (e) => {
				const error = document.querySelector('.fight-actions [l="' + action + '"][i="' + index + '"') as HTMLElement
				if (error) {
					window.scrollTo(0, error.offsetTop - 100)
				}
				e.preventDefault()
			}
			target.appendChild(l)
		}
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
		background: var(--pure-white);
	}
	.report th {
		border: 1px solid var(--border);
		padding: 8px;
		background: var(--background-header);
		font-weight: normal;
		color: var(--text-color-secondary);
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
		word-break: break-all;
		white-space: pre-wrap;
		display: flex;
		align-items: center;
		gap: 4px;
		&:deep(a) {
			cursor: pointer;
		}
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
	.warnings-error .ai {
		color: var(--text-color-secondary);
		cursor: pointer;
		&:hover {
			color: var(--primary);
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
			min-width: 0;
		}
		.legend {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
			font-weight: 500;
			margin-top: 15px;
			& > div {
				display: flex;
				padding: 2px 0;
				border-bottom: 1px solid var(--border);
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
	@media screen and (max-width: 800px) {
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
	}
	.damages-bars {
		flex: 1.8;
		min-width: 0;
		.chart {
			width: 100%;
			height: 100%;
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
		color: var(--text-color-secondary);
		.v-icon {
			font-size: 20px;
		}
	}
	#app:not(.app) {
		.panel.actions {
			.actions {
				padding: 0 15px;
			}
		}
		.panel.warnings-error {
			.logs {
				padding: 0 15px;
			}
		}
	}
	.actions-options {
		display: flex;
		background: var(--background);
		position: sticky;
		height: 45px;
		top: 0;
		padding-top: 10px;
		padding-bottom: 10px;
		.spacer {
			flex: 1;
		}
		& > * {
			margin-left: 15px;
		}
	}
	.movements {
		.map {
			margin-bottom: 10px;
		}
		.v-btn {
			margin-bottom: 6px;
			&:not(.all):not(.t4) {
				color: white;
			}
		}
	}
	:deep(.turn) {
		position: sticky;
		top: 0;
		background: var(--background);
		padding: 7px 0;
		margin: 0;
		display: inline-block;
		.black {
			font-size: 16px;
			background: #333;
			color: #eee;
			font-weight: 500;
			display: inline-flex;
			padding: 3px 10px;
			padding-right: 3px;
			border-radius: 4px;
			align-items: center;
			.label {
				padding-right: 5px;
				cursor: pointer;
			}
			.v-icon.disabled {
				opacity: 0.3;
				pointer-events: none;
				cursor: initial;
			}
		}
	}
pre {
	white-space: pre-wrap;
}
</style>
