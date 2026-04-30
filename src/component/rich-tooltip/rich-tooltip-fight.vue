<template>
	<v-menu ref="menu" v-model="value" :close-on-content-click="false" offset-overflow :disabled="disabled || id <= 0" :nudge-width="expand ? 500 : 200" :open-delay="_open_delay" :close-delay="_close_delay" :location="bottom ? 'bottom' : 'top'" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" offset-y @update:model-value="open($event)">
		<template #activator="{ props: activatorProps }">
			<slot :props="activatorProps"></slot>
		</template>
		<div class="card" :class="{expanded: expand}" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<loader v-if="!data" :size="30" />
			<template v-else>
				<div class="header">
					<v-icon v-if="data.status == 0" class="type-icon timersand">mdi-timer-sand-empty</v-icon>
					<v-icon v-else-if="data.context == FightContext.CHALLENGE" class="type-icon">mdi-flag-outline</v-icon>
					<v-icon v-else-if="data.type == FightType.BOSS" class="type-icon">mdi-crown</v-icon>
					<v-icon v-else-if="data.context == FightContext.TOURNAMENT" class="type-icon">mdi-trophy-outline</v-icon>
					<v-icon v-else-if="isArena" class="type-icon">mdi-sword-cross</v-icon>
					<img v-else src="/image/icon/black/garden.png" class="type-icon-img">
					<div class="type-info">
						<div class="type-label">{{ typeLabel }}</div>
						<div class="date">{{ $filters.datetime(data.date) }}</div>
					</div>
					<div class="spacer"></div>
					<div v-if="data.status != 0" class="result-badge" :class="resultClass">
						<v-icon v-if="resultClass === 'win'">mdi-trophy</v-icon>
						<v-icon v-else-if="resultClass === 'defeat'">mdi-skull-outline</v-icon>
						<v-icon v-else-if="resultClass === 'draw'">mdi-equal</v-icon>
					</div>
					<v-btn class="expand" variant="text" size="x-small" :icon="expand ? 'mdi-chevron-up' : 'mdi-chevron-down'" @click="expand = !expand" />
				</div>

				<div class="sides">
					<div class="side" :class="{winner: data.report?.win === 1}">
						<template v-if="data.type == FightType.TEAM && data.team1">
							<div class="team-line">
								<emblem :team="data.team1" />
								<span class="team-name">{{ data.team1.name }}</span>
							</div>
						</template>
						<template v-if="isMulti(1)">
							<div class="fighter summary"><span class="name">{{ $t('main.n_leeks', [data.leeks1.length]) }}</span></div>
						</template>
						<template v-else>
							<div v-for="leek in data.leeks1" :key="leek.id" class="fighter">
								<span class="name">{{ leek.name }}</span>
								<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
								<span v-if="expand && leekGain(leek.id, 1) !== null" class="gain" :class="{up: leekGain(leek.id, 1)! > 0, down: leekGain(leek.id, 1)! < 0}">{{ formatGain(leekGain(leek.id, 1)!) }}</span>
							</div>
						</template>
						<div v-if="data.type == FightType.FARMER && data.farmer1_name" class="farmer-name">
							({{ data.farmer1_name }})
							<span v-if="expand && data.report?.farmer1?.talent_gain" class="gain" :class="{up: data.report.farmer1.talent_gain > 0, down: data.report.farmer1.talent_gain < 0}">{{ formatGain(data.report.farmer1.talent_gain) }}</span>
						</div>
					</div>
					<div class="vs"><v-icon>mdi-sword-cross</v-icon></div>
					<div class="side" :class="{winner: data.report?.win === 2}">
						<template v-if="data.type == FightType.BOSS && data.boss_name">
							<div class="fighter"><span class="name">{{ $t('entity.' + data.boss_name) }}</span></div>
						</template>
						<template v-else>
							<template v-if="data.type == FightType.TEAM && data.team2">
								<div class="team-line">
									<emblem :team="data.team2" />
									<span class="team-name">{{ data.team2.name }}</span>
								</div>
							</template>
							<template v-if="isMulti(2)">
								<div class="fighter summary"><span class="name">{{ $t('main.n_leeks', [data.leeks2.length]) }}</span></div>
							</template>
							<template v-else>
								<div v-for="leek in data.leeks2" :key="leek.id" class="fighter">
									<span class="name">{{ leek.name }}</span>
									<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
									<span v-if="expand && leekGain(leek.id, 2) !== null" class="gain" :class="{up: leekGain(leek.id, 2)! > 0, down: leekGain(leek.id, 2)! < 0}">{{ formatGain(leekGain(leek.id, 2)!) }}</span>
								</div>
							</template>
							<div v-if="data.type == FightType.FARMER && data.farmer2_name" class="farmer-name">
								({{ data.farmer2_name }})
								<span v-if="expand && data.report?.farmer2?.talent_gain" class="gain" :class="{up: data.report.farmer2.talent_gain > 0, down: data.report.farmer2.talent_gain < 0}">{{ formatGain(data.report.farmer2.talent_gain) }}</span>
							</div>
						</template>
					</div>
				</div>

				<template v-if="expand">
					<table v-if="isBR" class="participants">
						<thead>
							<tr>
								<th>{{ $t('main.name') }}</th>
								<th>{{ $t('main.level') }}</th>
								<th><img src="/image/talent.png"></th>
								<th><v-icon>mdi-arrow-up-down</v-icon></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="row in brParticipants" :key="row.side + '-' + row.leek.id">
								<td class="leek-name">{{ row.leek.name }}</td>
								<td class="num">{{ row.leek.level }}</td>
								<td class="num">{{ row.leek.talent ?? '' }}</td>
								<td class="num gain" :class="{up: (leekGain(row.leek.id, row.side) ?? 0) > 0, down: (leekGain(row.leek.id, row.side) ?? 0) < 0}">
									<template v-if="leekGain(row.leek.id, row.side) !== null">{{ formatGain(leekGain(row.leek.id, row.side)!) }}</template>
								</td>
							</tr>
						</tbody>
					</table>
					<template v-else>
						<table v-for="side in tableSides" :key="side" class="participants" :class="'team-' + side">
							<thead>
								<tr>
									<th class="leek-name">{{ sideName(side) }}</th>
									<th>{{ $t('main.level') }}</th>
									<th><img src="/image/talent.png"></th>
									<th><v-icon>mdi-arrow-up-down</v-icon></th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="leek in (side === 1 ? data.leeks1 : data.leeks2)" :key="leek.id">
									<td class="leek-name">{{ leek.name }}</td>
									<td class="num">{{ leek.level }}</td>
									<td class="num">{{ leek.talent ?? '' }}</td>
									<td class="num gain" :class="{up: (leekGain(leek.id, side) ?? 0) > 0, down: (leekGain(leek.id, side) ?? 0) < 0}">
										<template v-if="leekGain(leek.id, side) !== null">{{ formatGain(leekGain(leek.id, side)!) }}</template>
									</td>
								</tr>
							</tbody>
						</table>
					</template>
				</template>

				<div v-if="metaItems.length" class="meta">
					<span v-for="item in metaItems" :key="item.icon" class="meta-item">
						<v-icon>{{ item.icon }}</v-icon>
						<span v-if="item.html" v-html="item.html"></span>
						<span v-else>{{ item.text }}</span>
					</span>
				</div>

				<div v-if="expand && data.trophies && data.trophies.length" class="trophies">
					<img v-for="t in data.trophies" :key="t.trophy" :src="'/image/trophy/' + t.name + '.svg'" :title="$te('trophy.' + t.name) ? ($t('trophy.' + t.name) as string) : t.name">
				</div>

				<div class="footer">
					<router-link :to="'/fight/' + data.id" class="report-link">
						<v-icon>mdi-text-box-outline</v-icon>
						{{ $t('main.report') }}
					</router-link>
				</div>
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeekWars } from '@/model/leekwars'
import { i18n } from '@/model/i18n'
import { FightContext, FightType } from '@/model/fight'

const props = defineProps<{
	id: number
	disabled?: boolean
	bottom?: boolean
	instant?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const tc = (key: string, count: number): string => (i18n.global as any).tc(key, count)

const content_created = ref(false)
const data = ref<any>(null)
const expand = ref(false)
const locked = ref(false)
const mouse = ref(false)
const value = ref(false)

const _open_delay = computed(() => props.instant ? 1 : 500)
const _close_delay = computed(() => props.instant ? 1 : 200)

watch(() => props.id, () => {
	data.value = null
	content_created.value = false
})

function open(v: boolean) {
	emit('update:modelValue', v)
	expand.value = localStorage.getItem('richtooltipfight/expanded') === 'true'
	if (content_created.value) return
	content_created.value = true
	if (props.id > 0 && !data.value) {
		LeekWars.get<any>('fight/rich-tooltip/' + props.id).then(d => {
			data.value = d
		})
	}
}

watch(expand, () => {
	localStorage.setItem('richtooltipfight/expanded', expand.value ? 'true' : 'false')
})

const isArena = computed(() => {
	const t = data.value?.type
	return t === FightType.BATTLE_ROYALE || t === FightType.WAR || t === FightType.CHEST_HUNT || t === FightType.COLOSSUS
})

const typeLabel = computed(() => {
	const d = data.value
	if (!d) return ''
	if (d.type === FightType.BOSS && d.boss_name) return t('entity.' + d.boss_name)
	if (d.type === FightType.BATTLE_ROYALE) return t('main.battle_royale')
	if (d.type === FightType.WAR) return t('main.war')
	if (d.type === FightType.CHEST_HUNT) return t('main.chest_hunt')
	if (d.type === FightType.COLOSSUS) return t('main.colossus')
	const typeKey = d.type === FightType.FARMER ? 'main.farmer' : d.type === FightType.TEAM ? 'main.team' : 'main.fight_solo'
	const ctxKey = d.context === FightContext.CHALLENGE ? 'main.fight_challenge'
		: d.context === FightContext.TOURNAMENT ? 'main.tournament'
		: d.context === FightContext.TEST ? 'main.fight_test'
		: 'main.garden'
	return t(typeKey) + ' • ' + t(ctxKey)
})

const resultClass = computed(() => {
	const d = data.value
	if (!d || !d.report) return ''
	if (d.report.win === 0) return 'draw'
	if (d.report.win === 1) return 'win'
	if (d.report.win === 2) return 'defeat'
	return ''
})

function isMulti(side: 1 | 2): boolean {
	const arr = side === 1 ? data.value?.leeks1 : data.value?.leeks2
	return Array.isArray(arr) && arr.length > 1
}

function isRealLeek(leek: any): boolean {
	return leek && !leek.boss && !leek.chest
}

const isBR = computed(() => data.value?.type === FightType.BATTLE_ROYALE)

const tableSides = computed<(1 | 2)[]>(() => {
	const d = data.value
	if (!d) return []
	const sides: (1 | 2)[] = []
	if (Array.isArray(d.leeks1) && d.leeks1.filter(isRealLeek).length > 1) sides.push(1)
	if (Array.isArray(d.leeks2) && d.leeks2.filter(isRealLeek).length > 1) sides.push(2)
	return sides
})

const brParticipants = computed<{ leek: any, side: 1 | 2 }[]>(() => {
	const d = data.value
	if (!d) return []
	const rows: { leek: any, side: 1 | 2 }[] = []
	for (const l of d.leeks1 || []) if (isRealLeek(l)) rows.push({ leek: l, side: 1 })
	for (const l of d.leeks2 || []) if (isRealLeek(l)) rows.push({ leek: l, side: 2 })
	return rows
})

function sideName(side: 1 | 2): string {
	const d = data.value
	if (!d) return ''
	if (d.type === FightType.TEAM) {
		const team = side === 1 ? d.team1 : d.team2
		if (team?.name) return team.name
	}
	return t('main.team') + ' ' + side
}

function leekGain(leekId: number, side: 1 | 2): number | null {
	const arr = side === 1 ? data.value?.report?.leeks1 : data.value?.report?.leeks2
	if (!arr) return null
	const found = arr.find((l: any) => l.id === leekId)
	return found && typeof found.talent_gain === 'number' ? found.talent_gain : null
}

function formatGain(g: number) {
	return g > 0 ? '+' + g : '' + g
}

const metaItems = computed(() => {
	const d = data.value
	if (!d) return []
	const items: { icon: string, text?: string, html?: string }[] = []
	if (d.report?.duration) {
		items.push({ icon: 'mdi-timer-outline', html: tc('effect.n_turns', d.report.duration) as string })
	}
	if (d.report?.bonus && d.report.bonus > 1) {
		items.push({ icon: 'mdi-star-outline', text: '×' + d.report.bonus })
	}
	if (d.starter && d.starter.name) {
		items.push({ icon: 'mdi-play-circle-outline', text: d.starter.name })
	}
	if (d.views) {
		items.push({ icon: 'mdi-eye-outline', text: LeekWars.formatNumber(d.views) })
	}
	return items
})
</script>

<style lang="scss" scoped>
	.card {
		padding: 8px;
		background: var(--pure-white);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.type-icon {
		font-size: 26px;
		color: var(--text-color);
		&.timersand { animation: rotate 2s linear infinite; }
	}
	.type-icon-img {
		width: 24px;
		height: 24px;
		opacity: 0.85;
	}
	.type-info {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.type-label {
		font-size: 16px;
		font-weight: 500;
	}
	.date {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.spacer { flex: 1; }
	.expand {
		margin-left: 4px;
	}
	.result-badge {
		display: inline-flex;
		align-items: center;
		.v-icon { font-size: 22px; }
		&.win .v-icon { color: #4caf50; }
		&.defeat .v-icon { color: #e53935; }
		&.draw .v-icon { color: var(--text-color-secondary); }
	}
	body.dark .result-badge.win .v-icon { color: #7ddc7d; }
	body.dark .result-badge.defeat .v-icon { color: #ff7068; }

	.sides {
		display: flex;
		align-items: stretch;
		gap: 8px;
		padding: 8px 0 6px;
	}
	.side {
		flex: 1;
		min-width: 0;
		padding: 2px 4px;
		text-align: center;
		&.winner .name { font-weight: 500; }
	}
	.team-line {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		margin-bottom: 4px;
		.emblem {
			width: 22px;
			height: 22px;
		}
	}
	.team-name {
		font-size: 15px;
	}
	.fighter {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 6px;
		font-size: 15px;
		overflow: hidden;
		.name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.level {
			color: var(--text-color-secondary);
			font-weight: normal;
			font-size: 13px;
		}
	}
	.farmer-name {
		font-size: 13px;
		color: var(--text-color-secondary);
		margin-top: 2px;
		text-align: center;
	}
	.gain {
		font-size: 12px;
		font-weight: 500;
		&.up { color: #4caf50; }
		&.down { color: #e53935; }
	}
	body.dark .gain.up { color: #7ddc7d; }
	body.dark .gain.down { color: #ff7068; }

	.vs {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		color: var(--text-color-secondary);
		.v-icon { font-size: 18px; }
	}

	.participants {
		width: calc(100% + 16px);
		margin: 6px -8px 0;
		text-align: left;
		border-top: 1px solid var(--border);
		border-collapse: collapse;
		& + .participants {
			margin-top: 0;
			border-top: none;
		}
		tr {
			border-bottom: 1px solid var(--border);
		}
		tr:last-child {
			border-bottom: none;
		}
		th, td {
			padding: 3px 8px;
			font-size: 13px;
		}
		th {
			background: var(--background);
			font-weight: 500;
			color: var(--text-color-secondary);
			img {
				width: 16px;
				vertical-align: middle;
			}
			.v-icon {
				font-size: 16px;
			}
		}
		th.leek-name {
			color: var(--text-color);
			font-weight: 600;
		}
		.leek-name {
			max-width: 180px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.num {
			text-align: right;
			width: 40px;
			font-variant-numeric: tabular-nums;
		}
		&.team-1 th.leek-name { box-shadow: inset 3px 0 0 #4caf50; }
		&.team-2 th.leek-name { box-shadow: inset 3px 0 0 #e53935; }
	}
	body.dark .participants.team-1 th.leek-name { box-shadow: inset 3px 0 0 #7ddc7d; }
	body.dark .participants.team-2 th.leek-name { box-shadow: inset 3px 0 0 #ff7068; }

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding-top: 6px;
		border-top: 1px solid var(--border);
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.meta-item {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		.v-icon {
			font-size: 16px;
			opacity: 0.7;
		}
	}

	.trophies {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding-top: 6px;
		margin-top: 6px;
		border-top: 1px solid var(--border);
		img {
			width: 28px;
			height: 28px;
		}
	}

	.footer {
		padding-top: 6px;
		margin-top: 6px;
		border-top: 1px solid var(--border);
	}
	.report-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: var(--primary);
		.v-icon { font-size: 16px; }
		&:hover { text-decoration: underline; }
	}

	@keyframes rotate {
		0% { transform: rotate(0); }
		20% { transform: rotate(180deg); }
		100% { transform: rotate(180deg); }
	}
</style>
