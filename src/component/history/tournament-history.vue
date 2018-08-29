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