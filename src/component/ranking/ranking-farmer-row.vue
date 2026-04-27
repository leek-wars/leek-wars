<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/farmer/' + row.id">
				<rich-tooltip-farmer :id="row.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.name }}</span>
				</rich-tooltip-farmer>
			</router-link>
		</td>
		<td>{{ $filters.number(row.talent) }}</td>
		<td>{{ $filters.number(row.trophies) }}</td>
		<td>{{ $filters.number(row.total_level) }}</td>
		<td>{{ row.leek_count }}</td>
		<td>
			<div class="country-wrapper">
				<flag v-if="row.country" :code="row.country" />
			</div>
		</td>
		<td>
			<router-link v-if="row.team" :to="'/team/' + (row.team_id || 0)">
				<rich-tooltip-team :id="row.team_id || 0" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.team }}</span>
				</rich-tooltip-team>
			</router-link>
		</td>
	</tr>
</template>

<script setup lang="ts">
import type { RankingFarmerRow } from '@/model/ranking'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

defineProps<{
	row: RankingFarmerRow
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
