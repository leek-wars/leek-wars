<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<v-tooltip v-if="row.connected">
				<template #activator="{ props }">
					<span class="online" v-bind="props"></span>
				</template>
				{{ $t('main.connected') }}
			</v-tooltip>
			<router-link :to="'/farmer/' + row.id">
				<rich-tooltip-farmer :id="row.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.name }}</span>
				</rich-tooltip-farmer>
			</router-link>
			<!-- Classement dédupliqué (#3236) : la ligne vaut pour tout le joueur,
			     on dit combien de comptes elle représente. -->
			<v-tooltip v-if="row.accounts && row.accounts > 1">
				<template #activator="{ props }">
					<span class="accounts" v-bind="props">+{{ row.accounts - 1 }}</span>
				</template>
				{{ $t('ranking.linked_accounts', [row.accounts]) }}
			</v-tooltip>
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
		color: var(--text-color-secondary);
		font-style: italic;
	}
	/* Éleveur connecté (#4804) : un carré plein devant le pseudo. Carré et non
	   rond, comme tout le reste du design ; la couleur seule ne suffirait pas à
	   le distinguer, d'où l'infobulle qui le nomme. */
	.online {
		display: inline-block;
		width: 7px;
		height: 7px;
		margin-right: 6px;
		vertical-align: middle;
		background: var(--primary-surface);
	}
	.accounts {
		margin-left: 6px;
		padding: 0 4px;
		font-size: 11px;
		font-weight: normal;
		border: 1px solid var(--border);
		color: var(--text-color-secondary);
	}
</style>
