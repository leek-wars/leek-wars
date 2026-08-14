<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/team/' + row.id">
				<rich-tooltip-team :id="row.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.name }}</span>
				</rich-tooltip-team>
			</router-link>
		</td>
		<td>{{ $filters.number(row.talent) }}</td>
		<td>{{ row.level }}</td>
		<td>{{ $filters.number(row.total_level) }}</td>
		<td>{{ $filters.number(row.xp) }}</td>
		<td>{{ row.farmer_count }}</td>
		<td>{{ row.leek_count }}</td>
		<td>
			<v-tooltip v-if="activityLabel">
				<template #activator="{ props }">
					<span v-bind="props" class="activity">{{ activityLabel }}</span>
				</template>
				{{ activityTooltip }}
			</v-tooltip>
		</td>
	</tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RankingTeamRow } from '@/model/ranking'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

const props = defineProps<{
	row: RankingTeamRow
}>()

const { t } = useI18n()

// Mêmes paliers que la page des équipes qui recrutent (teams.vue) : la mesure
// est la même, elle doit se lire pareil des deux côtés.
const activityLabel = computed(() => {
	const score = props.row.activity ?? 0
	if (score >= 250) return '🔥🔥🔥'
	if (score >= 100) return '🔥🔥'
	if (score >= 10) return '🔥'
	return ''
})
const activityTooltip = computed(() => {
	const score = props.row.activity ?? 0
	if (score >= 250) return t('main.very_active')
	if (score >= 100) return t('main.active')
	return t('main.low_activity')
})
</script>

<style lang="scss" scoped>
	tr.me td {
		background: var(--background);
		font-weight: bold;
	}
	tr.inactive td, tr.inactive a {
		color: var(--text-color-secondary);
		font-style: italic;
	}
</style>
