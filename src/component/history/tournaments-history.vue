<template lang="html">
	<div class="history">
		<div v-for="(tournament, t) in tournaments" :key="t" class="wrapper">
			<tournament-history :tournament="tournament" />
		</div>
	</div>
</template>

<script lang="ts">
	import { Tournament } from '@/model/tournament'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'tournaments-history' })
	export default class TournamentsHistory extends Vue {
		@Prop() tournaments!: Tournament[]
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
			min-width: 50%;
		}
	}
</style>