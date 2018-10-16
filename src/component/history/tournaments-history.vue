<template lang="html">
	<div class="history">
		<div v-for="tournament in tournaments" :key="tournament.id" class="wrapper">
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
		display: flex;
		flex-wrap: wrap;
		padding: 5px;
		.wrapper {
			flex-grow: 1;
			min-width: 50%;
		}
	}
</style>