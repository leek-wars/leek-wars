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
		<td>{{ row.talent | number }}</td>
		<td>{{ row.trophies | number }}</td>
		<td>{{ row.total_level | number }}</td>
		<td>{{ row.leek_count }}</td>
		<td>
			<div class="country-wrapper">
				<flag v-if="row.country" :code="row.country" />
			</div>
		</td>
		<td>
			<router-link v-if="row.team" :to="'/team/' + row.team_id">
				<rich-tooltip-team :id="row.team_id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.team }}</span>
				</rich-tooltip-team>
			</router-link>
		</td>
	</tr>
</template>

<script lang="ts">
	import { RankingLeekRow } from '@/model/ranking'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	@Component({ components: { RichTooltipFarmer, RichTooltipTeam } })
	export default class RankingLeekRowElement extends Vue {
		@Prop({ required: true }) row!: RankingLeekRow
	}
</script>
