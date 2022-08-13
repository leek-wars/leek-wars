<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/leek/' + row.id">
				<rich-tooltip-leek :id="row.id" v-slot="{ on }" :bottom="true">
					<span v-on="on">{{ row.name }}</span>
				</rich-tooltip-leek>
			</router-link>
		</td>
		<td>{{ row.talent | number }}</td>
		<td>{{ row.level }}</td>
		<td>{{ row.xp | number }}</td>
		<td>
			<router-link :to="'/farmer/' + row.farmer_id">
				<rich-tooltip-farmer :id="row.farmer_id" v-slot="{ on }" :bottom="true">
					<span v-on="on">{{ row.farmer }}</span>
				</rich-tooltip-farmer>
			</router-link>
		</td>
		<td>
			<div class="country-wrapper">
				<img v-if="row.country" :title="$t('country.' + row.country)" :src="'/image/flag/' + row.country + '.png'">
			</div>
		</td>
		<td>
			<router-link v-if="row.team" :to="'/team/' + row.team_id">
				<rich-tooltip-team :id="row.team_id" v-slot="{ on }" :bottom="true">
					<span v-on="on">{{ row.team }}</span>
				</rich-tooltip-team>
			</router-link>
		</td>
	</tr>
</template>

<script lang="ts">
	import { RankingLeekRow } from '@/model/ranking'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	@Component({ components: { RichTooltipFarmer, RichTooltipLeek, RichTooltipTeam } })
	export default class RankingLeekRowElement extends Vue {
		@Prop({ required: true }) row!: RankingLeekRow
	}
</script>
