<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/leek/' + row.id">
				<rich-tooltip-leek :id="row.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.name }}</span>
				</rich-tooltip-leek>
			</router-link>
		</td>
		<td>{{ $filters.number(row.talent) }}</td>
		<td>{{ row.level }}</td>
		<td>{{ $filters.number(row.xp) }}</td>
		<td>
			<v-tooltip v-if="row.farmer_connected">
				<template #activator="{ props }">
					<span class="online" v-bind="props"></span>
				</template>
				{{ $t('main.connected') }}
			</v-tooltip>
			<router-link :to="'/farmer/' + row.farmer_id">
				<rich-tooltip-farmer :id="row.farmer_id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.farmer }}</span>
				</rich-tooltip-farmer>
			</router-link>
		</td>
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
import type { RankingLeekRow } from '@/model/ranking'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

defineProps<{
	row: RankingLeekRow
}>()
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
	/* Éleveur connecté (#4804), même pastille que le classement des éleveurs. */
	.online {
		display: inline-block;
		width: 7px;
		height: 7px;
		margin-right: 6px;
		vertical-align: middle;
		background: var(--primary);
	}
</style>
