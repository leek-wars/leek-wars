<template>
	<div class="my-tournaments-widget">
		<loader v-if="!loaded" />
		<div v-else-if="tournaments.length" ref="linesEl" class="lines" :style="{ '--row-height': ROW_HEIGHT + 'px' }">
			<router-link v-for="(tournament, index) in visibleTournaments" :key="index" v-ripple :to="'/tournament/' + tournament.id" class="line">
				<!-- La barre des tours en fond de ligne, comme sur la page d'un poireau
				     ou d'une équipe (`tournament-history`) : c'est le même objet, il se
				     lit de la même façon. Le reste se pose par-dessus. -->
				<div class="rounds">
					<div v-for="(round, r) in roundsOf(tournament)" :key="r" class="round" :class="{ win: round === 1, lose: round === -1 }"></div>
				</div>
				<div class="foreground">
					<v-icon class="kind" :title="t('tournament_' + tournament.kind)">{{ KIND_ICONS[tournament.kind] }}</v-icon>
					<!-- Qui a couru : le poireau, l'éleveur, la composition. C'est toute
					     la raison d'être du panneau — les retrouver au même endroit
					     plutôt qu'une page par poireau. -->
					<span class="who">{{ tournament.name }}</span>
					<span class="date">{{ $filters.duration(tournament.date) }}</span>
				</div>
			</router-link>
		</div>
		<div v-else class="none">{{ t('no_tournament') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'

	defineOptions({ name: 'HomeWidgetMyTournaments' })

	// Participations servies par la requête groupée (cf. home.vue), et
	// hauteur naturelle d'une ligne : celles retenues s'étirent pour remplir le
	// panneau, leur hauteur rendue ne peut donc plus dire combien il en tient.
	const TOURNAMENTS = 12
	const ROW_HEIGHT = 34

	// Un concept, un glyphe : le poireau, l'éleveur, et le blason à
	// l'épée des compositions — c'est une composition qui court un tournoi
	// d'équipes, pas l'équipe entière.
	const KIND_ICONS: Record<string, string> = {
		leek: 'mdi-leek',
		farmer: 'mdi-account',
		team: 'mdi-shield-sword',
	}

	/** `rounds` : { id du participant: { n° de tour: 1 gagné, -1 perdu, 0 nul } }. */
	interface MyTournament { id: number, date: number, rounds: Record<string, Record<string, number>>, kind: string, entity: number, name: string }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré. Pas de repli
	// par appel direct ici : aucun service ne sert cette liste à lui seul, elle
	// n'existe que pour ce panneau.
	const props = defineProps<{ data?: { tournaments: MyTournament[] } | null }>()

	const t = useNamespacedT('home')

	const loaded = ref(false)
	const tournaments = ref<MyTournament[]>([])

	const linesEl = ref<HTMLElement | null>(null)
	const lineCount = useFitCount(linesEl, '.line', TOURNAMENTS, 2, ROW_HEIGHT)
	const visibleTournaments = computed(() => tournaments.value.slice(0, lineCount.value))

	// Le parcours du participant dans le tournoi, tour par tour. Le serveur
	// n'envoie qu'un participant par ligne, mais la forme est celle du reste du
	// site (une entrée par participant), d'où ce déballage.
	function roundsOf(tournament: MyTournament): number[] {
		const participant = Object.values(tournament.rounds ?? {})[0]
		return participant ? Object.values(participant) : []
	}

	watch(() => props.data, (data) => {
		if (data === undefined) { loaded.value = false; return }
		tournaments.value = data === null ? [] : (data.tournaments ?? [])
		loaded.value = true
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	.my-tournaments-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	// La liste occupe toute la hauteur ; on n'affiche que les lignes entières
	// (useFitCount), overflow hidden en filet.
	.lines {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		gap: 2px;
	}
	// Les lignes retenues se partagent TOUTE la hauteur du panneau : pas de blanc
	// résiduel en bas, et c'est `--row-height`, leur hauteur naturelle, qui décide
	// combien il en tient.
	.line {
		position: relative;
		display: flex;
		flex: 1 1 auto;
		min-height: var(--row-height);
		border-radius: var(--radius);
		overflow: hidden;
		text-decoration: none;
		color: var(--text-color);
	}
	.rounds {
		position: absolute;
		inset: 0;
		display: flex;
	}
	// Cinq tours dans un tournoi à 32 : chaque case en prend le cinquième, comme
	// la barre de `tournament-history`, et les tours non joués restent vides.
	.round {
		width: 20%;
	}
	.foreground {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 0 8px;
	}
	.line:hover .foreground {
		background: color-mix(in srgb, var(--text-color) 8%, transparent);
	}
	.kind {
		font-size: 16px;
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		color: var(--text-color-secondary);
	}
	.who {
		flex: 1 1 auto;
		min-width: 0;
		font-weight: bold;
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.date {
		flex-shrink: 0;
		font-size: 11px;
		white-space: nowrap;
		color: var(--text-color-secondary);
	}
	// Les jetons de résultat des cartes de combat, comme la barre des tours de
	// `tournament-history` en v3.
	.round.win {
		background: color-mix(in srgb, var(--result-win) 22%, var(--background-row));
	}
	.round.lose {
		background: color-mix(in srgb, var(--result-defeat) 22%, var(--background-row));
	}
	// Le v2 n'a ni `--background-row` ni ces jetons : ses aplats pastel d'origine.
	body.v2 {
		.line {
			background: var(--grey-12);
		}
		.round.win {
			background: #b6f182;
		}
		.round.lose {
			background: #ffb3ae;
		}
		.line:hover .foreground {
			background: #7772;
		}
	}
	body.v2.dark {
		.line {
			background: var(--grey-3);
		}
		.round.win {
			background: #3c651b;
		}
		.round.lose {
			background: #76342f;
		}
	}
	body:not(.v2) .line {
		background: var(--background-row);
		border: 1px solid var(--border);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
