<template lang="html">
	<div class="history-table-wrapper">
		<v-data-table
			:headers="headers"
			:items="fights"
			:items-per-page="50"
			:items-per-page-options="[25, 50, 100, 200]"
			density="compact"
			:row-props="rowProps"
			class="fights-table elevation-0"
			@click:row="onRowClick">

			<template #header.levelups="{ column, isSorted, getSortIcon, toggleSort }">
				<span class="sortable-icon-header" @click="toggleSort(column)">
					<v-icon :title="$t('levelups')">mdi-arrow-up-thick</v-icon>
					<v-icon class="sort-icon" :class="{ active: isSorted(column) }">{{ getSortIcon(column) }}</v-icon>
				</span>
			</template>
			<template #header.trophies="{ column, isSorted, getSortIcon, toggleSort }">
				<span class="sortable-icon-header" @click="toggleSort(column)">
					<v-icon :title="$t('trophies')">mdi-trophy</v-icon>
					<v-icon class="sort-icon" :class="{ active: isSorted(column) }">{{ getSortIcon(column) }}</v-icon>
				</span>
			</template>
			<template #header.chests="{ column, isSorted, getSortIcon, toggleSort }">
				<span class="sortable-icon-header" @click="toggleSort(column)">
					<v-icon :title="$t('chests')">mdi-treasure-chest</v-icon>
					<v-icon class="sort-icon" :class="{ active: isSorted(column) }">{{ getSortIcon(column) }}</v-icon>
				</span>
			</template>
			<template #header.rareloot="{ column, isSorted, getSortIcon, toggleSort }">
				<span class="sortable-icon-header" @click="toggleSort(column)">
					<v-icon :title="$t('rare_loot')">mdi-leaf</v-icon>
					<v-icon class="sort-icon" :class="{ active: isSorted(column) }">{{ getSortIcon(column) }}</v-icon>
				</span>
			</template>
			<template #header.comments="{ column, isSorted, getSortIcon, toggleSort }">
				<span class="sortable-icon-header" @click="toggleSort(column)">
					<v-icon :title="$t('comments')">mdi-chat</v-icon>
					<v-icon class="sort-icon" :class="{ active: isSorted(column) }">{{ getSortIcon(column) }}</v-icon>
				</span>
			</template>

			<template #item.type="{ item }">
				<rich-tooltip-fight :id="item.id" v-slot="{ props: tooltipProps }">
					<span v-bind="tooltipProps" class="type-cell">
						<v-icon v-if="item.status == 0" class="timersand">mdi-timer-sand-empty</v-icon>
						<v-icon v-else-if="item.context == FightContext.CHALLENGE" :title="$t('challenge')">mdi-flag-outline</v-icon>
						<v-icon v-else-if="item.type == FightType.BOSS" :title="$t('boss')">mdi-crown</v-icon>
						<v-icon v-else-if="item.context == FightContext.TOURNAMENT" :title="$t('tournament')">mdi-trophy-outline</v-icon>
						<v-icon v-else-if="item.type == FightType.WAR" :title="$t('war')">mdi-shield-sword</v-icon>
						<v-icon v-else-if="item.type == FightType.CHEST_HUNT" :title="$t('chest_hunt')">mdi-treasure-chest-outline</v-icon>
						<v-icon v-else-if="item.type == FightType.COLOSSUS" :title="$t('colossus')">mdi-skull-outline</v-icon>
						<v-icon v-else-if="item.type == FightType.BATTLE_ROYALE" :title="$t('battle_royale')">mdi-sword-cross</v-icon>
						<img v-else src="/image/icon/black/garden.png" :title="$t('garden')">
					</span>
				</rich-tooltip-fight>
			</template>

			<template #item.result="{ item }">
				<v-icon v-if="item.result === 'win'" class="result-icon win" :title="$t('win')">mdi-trophy</v-icon>
				<v-icon v-else-if="item.result === 'defeat'" class="result-icon defeat" :title="$t('defeat')">mdi-skull-outline</v-icon>
				<v-icon v-else-if="item.result === 'draw'" class="result-icon draw" :title="$t('draw')">mdi-equal</v-icon>
			</template>

			<template #item.match="{ item }">
				<div class="match" @click.stop>
					<span class="side left">
						<template v-if="isArena(item)">
							<span class="text">{{ arenaLabel(item)[0] }}</span>
						</template>
						<router-link v-else-if="item.type == FightType.SOLO && item.leeks1[0]" :to="'/leek/' + item.leeks1[0].id" class="link">
							<rich-tooltip-leek :id="item.leeks1[0].id" v-slot="{ props }">
								<span v-bind="props">{{ item.leeks1[0].name }}</span>
							</rich-tooltip-leek>
						</router-link>
						<router-link v-else-if="item.type == FightType.FARMER" :to="'/farmer/' + item.farmer1" class="link">
							<rich-tooltip-farmer :id="item.farmer1" v-slot="{ props }">
								<span v-bind="props">{{ item.farmer1_name }}</span>
							</rich-tooltip-farmer>
						</router-link>
						<router-link v-else-if="item.type == FightType.TEAM" :to="'/team/' + item.team1" class="link">
							<rich-tooltip-composition :id="item.composition1 || 0" v-slot="{ props }">
								<span v-bind="props">[{{ item.team1_name }}]</span>
							</rich-tooltip-composition>
						</router-link>
						<span v-else-if="item.type == FightType.BOSS" class="text">{{ $t('main.n_leeks', [item.leeks1.length]) }}</span>
					</span>
					<v-icon class="vs">mdi-sword-cross</v-icon>
					<span class="side right">
						<template v-if="isArena(item)">
							<span class="text">{{ arenaLabel(item)[1] }}</span>
						</template>
						<router-link v-else-if="item.type == FightType.SOLO && item.leeks2[0]" :to="'/leek/' + item.leeks2[0].id" class="link">
							<rich-tooltip-leek :id="item.leeks2[0].id" v-slot="{ props }">
								<span v-bind="props">{{ item.leeks2[0].name }}</span>
							</rich-tooltip-leek>
						</router-link>
						<router-link v-else-if="item.type == FightType.FARMER" :to="'/farmer/' + item.farmer2" class="link">
							<rich-tooltip-farmer :id="item.farmer2" v-slot="{ props }">
								<span v-bind="props">{{ item.farmer2_name }}</span>
							</rich-tooltip-farmer>
						</router-link>
						<router-link v-else-if="item.type == FightType.TEAM" :to="'/team/' + item.team2" class="link">
							<rich-tooltip-composition :id="item.composition2 || 0" v-slot="{ props }">
								<span v-bind="props">[{{ item.team2_name }}]</span>
							</rich-tooltip-composition>
						</router-link>
						<span v-else-if="item.type == FightType.BOSS" class="text">{{ $t('entity.' + item.boss_name) }}</span>
					</span>
				</div>
			</template>

			<template #item.date="{ item }">
				<span :title="LeekWars.formatDateTime(item.date)">{{ LeekWars.formatDuration(item.date) }}</span>
			</template>

			<template #item.duration="{ item }">
				<span v-if="item.duration" v-html="$t('effect.n_turns', item.duration)"></span>
			</template>

			<template #item.levelups="{ item }">
				<span v-if="item.levelups">{{ item.levelups }}</span>
			</template>
			<template #item.trophies="{ item }">
				<span v-if="item.trophies">{{ item.trophies }}</span>
			</template>
			<template #item.chests="{ item }">
				<span v-if="item.chests">{{ item.chests }}</span>
			</template>
			<template #item.rareloot="{ item }">
				<span v-if="item.rareloot">{{ item.rareloot }}</span>
			</template>
			<template #item.comments="{ item }">
				<span v-if="item.comments">{{ item.comments }}</span>
			</template>
		</v-data-table>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { mixins } from '@/model/i18n'
import { type Fight, FightContext, FightType } from '@/model/fight'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
import RichTooltipFight from '@/component/rich-tooltip/rich-tooltip-fight.vue'

defineOptions({ name: 'fights-history-table', i18n: {}, mixins: [...mixins] })

defineProps<{
	fights: Fight[]
}>()

const { t } = useI18n()
const router = useRouter()

const RESULT_ORDER: Record<string, number> = { win: 3, draw: 2, defeat: 1, '?': 0 }

const headers = computed<any[]>(() => [
	{ title: t('type'), key: 'type', align: 'center', sortable: true, width: '60px' },
	{ title: t('result'), key: 'result', align: 'center', sortable: true, width: '60px', sortRaw: (a: Fight, b: Fight) => (RESULT_ORDER[a.result] ?? 0) - (RESULT_ORDER[b.result] ?? 0) },
	{ title: t('match'), key: 'match', align: 'center', sortable: false },
	{ title: t('date'), key: 'date', align: 'center', sortable: true },
	{ title: t('duration'), key: 'duration', align: 'center', sortable: true, width: '90px' },
	{ title: '', key: 'levelups', align: 'center', sortable: true, width: '60px' },
	{ title: '', key: 'trophies', align: 'center', sortable: true, width: '60px' },
	{ title: '', key: 'chests', align: 'center', sortable: true, width: '60px' },
	{ title: '', key: 'rareloot', align: 'center', sortable: true, width: '60px' },
	{ title: '', key: 'comments', align: 'center', sortable: true, width: '60px' },
])

function rowProps({ item }: { item: Fight }) {
	const cls: string[] = ['fight-row']
	if (item.status == 0) cls.push('generating')
	else if (item.result === 'win') cls.push('win')
	else if (item.result === 'defeat') cls.push('defeat')
	else if (item.result === 'draw') cls.push('draw')
	return { class: cls.join(' ') }
}

function isArena(fight: Fight) {
	const ft = fight.type
	return ft === FightType.BATTLE_ROYALE || ft === FightType.WAR || ft === FightType.CHEST_HUNT || ft === FightType.COLOSSUS
}

function arenaLabel(fight: Fight): [string, string] {
	switch (fight.type) {
		case FightType.WAR: return [t('main.n_leeks', [fight.leeks1?.length || 0]) as string, t('main.n_leeks', [fight.leeks2?.length || 0]) as string]
		case FightType.CHEST_HUNT: return [t('main.n_leeks', [fight.leeks1?.length || 0]) as string, t('main.n_chests', [fight.leeks2?.length || 0]) as string]
		case FightType.COLOSSUS: {
			const colossusName = fight.leeks2?.[0]?.name || 'Colosse'
			return [t('main.n_leeks', [fight.leeks1?.length || 0]) as string, colossusName]
		}
		default: return ['Battle', 'Royale']
	}
}

function onRowClick(_event: Event, { item }: { item: Fight }) {
	router.push('/fight/' + item.id)
}
</script>

<style lang="scss" scoped>
	.history-table-wrapper {
		padding: 5px;
	}
	.fights-table {
		background: var(--pure-white);
		:deep(thead) {
			background: var(--background-header);
		}
		:deep(td), :deep(th) {
			padding: 4px 10px !important;
			text-align: center;
		}
		:deep(.v-data-table-footer) {
			color: var(--text-color-secondary);
		}
	}
	:deep(.fight-row) {
		cursor: pointer;
		transition: filter 0.1s;
		&:hover {
			filter: brightness(1.06);
		}
	}
	:deep(.fight-row.win > td:first-child) { box-shadow: inset 4px 0 0 #6fbf3e; }
	:deep(.fight-row.draw > td:first-child) { box-shadow: inset 4px 0 0 #aaa; }
	:deep(.fight-row.defeat > td:first-child) { box-shadow: inset 4px 0 0 #d96058; }
	:deep(.fight-row.generating > td:first-child) { box-shadow: inset 4px 0 0 var(--text-color-secondary); }

	body.dark :deep(.fight-row.win > td:first-child) { box-shadow: inset 4px 0 0 #7ddc7d; }
	body.dark :deep(.fight-row.draw > td:first-child) { box-shadow: inset 4px 0 0 #888; }
	body.dark :deep(.fight-row.defeat > td:first-child) { box-shadow: inset 4px 0 0 #ff7068; }

	:deep(.fight-row.win > td:nth-child(2)) { background-color: rgba(111, 191, 62, 0.18); }
	:deep(.fight-row.draw > td:nth-child(2)) { background-color: rgba(170, 170, 170, 0.18); }
	:deep(.fight-row.defeat > td:nth-child(2)) { background-color: rgba(217, 96, 88, 0.18); }

	body.dark :deep(.fight-row.win > td:nth-child(2)) { background-color: rgba(125, 220, 125, 0.15); }
	body.dark :deep(.fight-row.draw > td:nth-child(2)) { background-color: rgba(180, 180, 180, 0.12); }
	body.dark :deep(.fight-row.defeat > td:nth-child(2)) { background-color: rgba(255, 112, 104, 0.18); }

	.type-cell {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		.v-icon {
			font-size: 22px;
			color: #333;
			&.timersand { animation: rotate 2s linear infinite; }
		}
		img {
			width: 20px;
			height: 20px;
			opacity: 0.85;
			vertical-align: middle;
		}
	}
	.result-icon {
		font-size: 20px;
		&.win { color: #2e7d32; }
		&.defeat { color: #c62828; }
		&.draw { color: var(--text-color-secondary); }
	}
	body.dark .result-icon {
		&.win { color: #c8e6c9; }
		&.defeat { color: #ffcdd2; }
	}
	body.dark .type-cell .v-icon { color: var(--text-color); }

	.match {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 0;
		.side {
			flex: 1 1 0;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.side.left { text-align: right; }
		.side.right { text-align: left; }
		.link {
			color: inherit;
			text-decoration: none;
			&:hover { text-decoration: underline; }
		}
		.text { color: inherit; }
		.vs {
			flex: 0 0 auto;
			font-size: 16px;
			color: rgba(0, 0, 0, 0.4);
		}
	}
	body.dark .match .vs { color: rgba(255, 255, 255, 0.5); }

	.sortable-icon-header {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		cursor: pointer;
		user-select: none;
		.sort-icon {
			font-size: 16px;
			opacity: 0;
			transition: opacity 0.15s;
		}
		&:hover .sort-icon { opacity: 0.5; }
		.sort-icon.active { opacity: 1; }
	}

	@keyframes rotate {
		0% { transform: rotate(0); }
		20% { transform: rotate(180deg); }
		100% { transform: rotate(180deg); }
	}
</style>
