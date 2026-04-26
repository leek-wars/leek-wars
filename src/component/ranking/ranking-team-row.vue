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
	</tr>
</template>

<script setup lang="ts">
import type { RankingTeamRow } from '@/model/ranking'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

defineProps<{
	row: RankingTeamRow
}>()
</script>

<style lang="scss" scoped>
	tr.me td {
		background: var(--background);
		font-weight: bold;
	}
	tr.inactive td, tr.inactive a {
		color: #777;
		font-style: italic;
	}
</style>
