<template lang="html">
	<div class="history">
		<div v-for="(tournament, t) in tournaments" :key="t" class="wrapper">
			<tournament-history :tournament="tournament" :show-time="showTime" />
		</div>
	</div>
</template>

<script lang="ts">
	import { Tournament } from '@/model/tournament'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import TournamentHistory from '@/component/history/tournament-history.vue'

	@Options({ name: 'tournaments-history', components: { TournamentHistory } })
	export default class TournamentsHistory extends Vue {
		@Prop() tournaments!: Tournament[]
		@Prop() showTime!: boolean
	}
</script>

<style lang="scss" scoped>
	.history {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		flex-wrap: wrap;
		padding: 5px;
		.wrapper {
			flex-grow: 1;
		}
	}
</style>