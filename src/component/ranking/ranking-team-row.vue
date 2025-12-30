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
		<td>{{ row.talent | number }}</td>
		<td>{{ row.level }}</td>
		<td>{{ row.total_level | number }}</td>
		<td>{{ row.xp | number }}</td>
		<td>{{ row.farmer_count }}</td>
		<td>{{ row.leek_count }}</td>
	</tr>
</template>

<script lang="ts">
	import { RankingTeamRow } from '@/model/ranking'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	@Component({ components: { RichTooltipTeam } })
	export default class RankingTeamRowElement extends Vue {
		@Prop({ required: true }) row!: RankingTeamRow
	}
</script>
