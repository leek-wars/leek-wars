<template>
	<tr :class="{me: row.me}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/team/' + row.team_id">
				<rich-tooltip-composition :id="row.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.name }}</span>
				</rich-tooltip-composition>
			</router-link>
		</td>
		<td>{{ $filters.number(row.talent) }}</td>
		<td>
			<router-link :to="'/team/' + row.team_id">
				<rich-tooltip-team :id="row.team_id ?? 0" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.team_name }}</span>
				</rich-tooltip-team>
			</router-link>
		</td>
		<td>{{ $filters.number(row.total_level) }}</td>
		<td>{{ row.leek_count }}</td>
	</tr>
</template>

<script setup lang="ts">
import type { RankingCompositionRow } from '@/model/ranking'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'

defineProps<{
	row: RankingCompositionRow
}>()
</script>

<style lang="scss" scoped>
	tr.me td {
		background: var(--background);
		font-weight: bold;
	}
</style>
