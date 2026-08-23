<template lang="html">
	<router-link :to="'/tournament/' + tournament.id">
		<div class="tournament">
			<div v-for="(participant, p) of tournament.rounds" :key="p" class="participant">
				<div v-for="(round, r) of participant" :key="r" class="round" :class="{win: round === 1, lose: round === -1}"></div>
			</div>
			<div class="foreground">
				{{ $t('main.tournament_of', [showTime ? LeekWars.formatDateTime(tournament.date) : LeekWars.formatDate(tournament.date)]) }}
				<div class="date">{{ $filters.duration(tournament.date) }}</div>
			</div>
		</div>
	</router-link>
</template>

<script setup lang="ts">
import type { Tournament } from '@/model/tournament'

defineOptions({ name: 'TournamentHistory' })

defineProps<{
	tournament: Tournament
	showTime?: boolean
}>()
</script>

<style lang="scss" scoped>
	.tournament {
		margin: 5px;
		height: 42px;
		min-width: 220px;
		line-height: 42px;
		font-size: 15px;
		text-align: center;
		border-radius: var(--radius-small);
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--grey-12);
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
			&:first-child {
				border-top-left-radius: var(--radius-small);
				border-bottom-left-radius: var(--radius-small);
			}
			&:last-child {
				border-top-right-radius: var(--radius-small);
				border-bottom-right-radius: var(--radius-small);
			}
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
			color: var(--text-color-secondary);
			line-height: normal;
			margin-right: 5px;
			margin-top: -13px;
		}
	}

	body.v2.dark .tournament {
		background: var(--grey-3);
		.win {
			background: #3c651b;
		}
		.lose {
			background: #76342f;
		}
	}

	/* ====== v3 : mêmes jetons de résultat que les cartes de combat ======
	   La barre des tours reste lisible d'un coup d'oeil (c'est sa seule
	   information), mais ses aplats pastel deviennent des teintes du thème,
	   posées sur la surface de rangée plutôt que sur un gris hors palette. */
	body:not(.v2) {
		.tournament {
			background: var(--background-row);
			border: 1px solid var(--border);
			&:hover .foreground {
				background: color-mix(in srgb, var(--text-color) 8%, transparent);
			}
			.round.win {
				background: color-mix(in srgb, var(--result-win) 22%, var(--background-row));
			}
			.round.lose {
				background: color-mix(in srgb, var(--result-defeat) 22%, var(--background-row));
			}
		}
	}
</style>