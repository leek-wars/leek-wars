<template>
	<tr :class="{me: row.me, inactive: !row.active}">
		<td>{{ row.rank }}</td>
		<td :class="row.style">
			<router-link :to="'/farmer/' + row.id">{{ row.name }}</router-link>
		</td>
		<td>{{ row.talent }}</td>
		<td>{{ row.total_level }}</td>
		<td>{{ row.leek_count }}</td>
		<td>
			<div class="country-wrapper">
				<img v-if="row.country" :title="$t('country.' + row.country)" :src="'/image/flag/' + row.country + '.png'">
			</div>
		</td>
		<td>
			<router-link v-if="row.team" :to="'/team/' + row.team_id">{{ row.team }}</router-link>
		</td>
	</tr>
</template>

<script lang="ts">
	import { RankingLeekRow } from '@/model/ranking'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class RankingLeekRowElement extends Vue {
		@Prop({ required: true }) row!: RankingLeekRow
	}
</script>
