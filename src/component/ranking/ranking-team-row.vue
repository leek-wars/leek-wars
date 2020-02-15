<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/team/' + row.id">{{ row.name }}</router-link>
		</td>
		<td>{{ row.talent }}</td>
		<td>{{ row.level }}</td>
		<td>{{ row.total_level }}</td>
		<td>{{ row.xp | number }}</td>
		<td>{{ row.farmer_count }}</td>
		<td>{{ row.leek_count }}</td>
	</tr>
</template>

<script lang="ts">
	import { RankingTeamRow } from '@/model/ranking'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class RankingTeamRowElement extends Vue {
		@Prop({ required: true }) row!: RankingTeamRow
	}
</script>
