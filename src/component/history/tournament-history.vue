<template lang="html">
	<router-link :to="'/tournament/' + tournament.id">
		<div class="tournament">{{ $t('leek.tournament_of', [LeekWars.formatDate(tournament.date)]) }}
			<div class="date">{{ tournament.date | duration }}</div>
		</div>
	</router-link>
</template>

<script lang="ts">
	import { Tournament } from '@/model/tournament'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'tournament-history' })
	export default class TournamentHistory extends Vue {
		@Prop() tournament!: Tournament
	}
</script>

<style lang="scss" scoped>
	.tournament {
		margin: 5px;
		height: 42px;
		min-width: 220px;
		line-height: 42px;
		font-size: 15px;
		text-align: center;
		color: #333;
		border-radius: 3px;
		background-color: #dcdcdc;
		.date {
			font-size: 10px;
			text-align: right;
			color: #888;
			line-height: normal;
			margin-right: 5px;
			margin-top: -15px;
		}
	}
</style>