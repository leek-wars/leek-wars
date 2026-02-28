<template>
	<tr :class="{me: row.me}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/team/' + row.team_id">{{ row.name }}</router-link>
		</td>
		<td>{{ $filters.number(row.talent) }}</td>
		<td>
			<router-link :to="'/team/' + row.team_id">
				<rich-tooltip-team :id="row.team_id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ row.team_name }}</span>
				</rich-tooltip-team>
			</router-link>
		</td>
		<td>{{ $filters.number(row.total_level) }}</td>
		<td>{{ row.leek_count }}</td>
	</tr>
</template>

<script lang="ts">
	import { RankingCompositionRow } from '@/model/ranking'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	@Options({ components: { RichTooltipTeam } })
	export default class RankingCompositionRowElement extends Vue {
		@Prop({ required: true }) row!: RankingCompositionRow
	}
</script>
