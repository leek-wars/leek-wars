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
						<div v-for="leek in data.leeks1" :key="leek.id" class="fighter">
							<span class="name">{{ leek.name }}</span>
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
							<span v-if="expand && leekGain(leek.id, 1) !== null" class="gain" :class="{up: leekGain(leek.id, 1)! > 0, down: leekGain(leek.id, 1)! < 0}">{{ formatGain(leekGain(leek.id, 1)!) }}</span>
						</div>
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
							<div v-for="leek in data.leeks2" :key="leek.id" class="fighter">
								<span class="name">{{ leek.name }}</span>
								<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
								<span v-if="expand && leekGain(leek.id, 2) !== null" class="gain" :class="{up: leekGain(leek.id, 2)! > 0, down: leekGain(leek.id, 2)! < 0}">{{ formatGain(leekGain(leek.id, 2)!) }}</span>
							</div>
							<div v-if="data.type == FightType.FARMER && data.farmer2_name" class="farmer-name">
								({{ data.farmer2_name }})
								<span v-if="expand && data.report?.farmer2?.talent_gain" class="gain" :class="{up: data.report.farmer2.talent_gain > 0, down: data.report.farmer2.talent_gain < 0}">{{ formatGain(data.report.farmer2.talent_gain) }}</span>
							</div>
						</template>
					</div>
				</div>

				<div v-if="expand && metaItems.length" class="meta">
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
const _close_delay = computed(() => props.instant ? 1 : 1)

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
	if (d.context === FightContext.TOURNAMENT) return t('main.tournament')
	if (d.type === FightType.BATTLE_ROYALE) return t('main.battle_royale')
	if (d.type === FightType.WAR) return t('main.war')
	if (d.type === FightType.CHEST_HUNT) return t('main.chest_hunt')
	if (d.type === FightType.COLOSSUS) return t('main.colossus')
	return t('main.fight')
})

const resultClass = computed(() => {
	const d = data.value
	if (!d || !d.report) return ''
	if (d.report.win === 0) return 'draw'
	if (d.report.win === 1) return 'win'
	if (d.report.win === 2) return 'defeat'
	return ''
})

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
		&.winner .name { font-weight: 500; }
	}
	.team-line {
		display: flex;
		align-items: center;
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
