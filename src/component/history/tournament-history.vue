<template lang="html">
	<router-link :to="'/tournament/' + tournament.id">
		<div class="tournament">
			<div v-for="(participant, p) of tournament.rounds" :key="p" class="participant">
				<div v-for="(round, r) of participant" :key="r" class="round" :class="{win: round === 1, lose: round === -1}"></div>
			</div>
			<div class="foreground">
				{{ $t('main.tournament_of', [LeekWars.formatDate(tournament.date)]) }}
				<div class="date">{{ tournament.date | duration }}</div>
			</div>
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
		position: relative;
		display: flex;
		flex-direction: column;
		background: #ddd;
		&:hover .foreground {
			background: #7772;
		}
		.foreground {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
		}
		.participant {
			display: flex;
			width: 100%;
			height: 100%;
		}
		.round {
			width: 20%;
			&.win {
				background: #b6f182;
			}
			&.lose {
				background: #ffb3ae;
			}
		}
		.date {
			font-size: 10px;
			text-align: right;
			color: #888;
			line-height: normal;
			margin-right: 5px;
			margin-top: -13px;
		}
	}
</style>