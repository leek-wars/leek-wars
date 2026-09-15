<template>
	<div class="tournaments-widget">
		<loader v-if="!loaded" />
		<template v-else-if="groups.length">
			<!-- Une section par type de tournoi : une édition, c'est une vingtaine de
			     tournois de poireaux, une poignée d'éleveurs et d'équipes, et sans
			     l'intertitre la liste n'est qu'un tas de noms. -->
			<div v-for="group in groups" :key="group.type" class="group">
				<div class="group-header">
					<span class="group-title">{{ $t(group.title) }}</span>
					<span class="group-date">{{ $filters.date(group.date) }}</span>
				</div>
				<div v-for="w in group.winners" :key="w.tournament" class="winner">
					<!-- L'avatar mène à l'éleveur (à l'équipe pour un tournoi d'équipes),
					     le nom au vainqueur lui-même : deux liens distincts, chacun avec
					     son infobulle riche. Les enveloppes portent la mise en page : le
					     composant d'infobulle rend un <span> inline autour de son
					     activateur, qui décalerait la ligne de base (cf. rare-trophies). -->
					<span class="portrait-tooltip">
						<rich-tooltip-farmer v-if="w.winner.farmer_id" :id="w.winner.farmer_id" v-slot="{ props }" :bottom="true">
							<router-link :to="'/farmer/' + w.winner.farmer_id" class="portrait" v-bind="props">
								<img :src="LeekWars.getAvatar(w.winner.farmer_id, w.winner.avatar_changed || 0)" class="avatar" loading="lazy">
							</router-link>
						</rich-tooltip-farmer>
						<rich-tooltip-team v-else-if="w.winner.team_id" :id="w.winner.team_id" v-slot="{ props }" :bottom="true">
							<router-link :to="'/team/' + w.winner.team_id" class="portrait" v-bind="props">
								<emblem :team="{id: w.winner.team_id, emblem_changed: w.winner.emblem_changed || 0}" class="avatar" />
							</router-link>
						</rich-tooltip-team>
					</span>

					<div class="info">
						<div class="name-tooltip">
							<!-- `|| 0` : une infobulle sans id reste fermée plutôt que de
							     partir chercher un poireau qui n'existe pas. Le serveur part
							     en prod avant le client, mais l'inverse arrive aussi. -->
							<component :is="tooltipOf(w.type)" :id="w.winner.id || 0" v-slot="{ props }" :bottom="true">
								<router-link :to="w.winner.link" class="name" v-bind="props">{{ w.winner.name }}</router-link>
							</component>
						</div>
						<!-- Pour une équipe, `name` est celui de l'équipe : la composition
						     qui a gagné est une autre information, et c'est elle qui joue. -->
						<span v-if="w.winner.composition" class="composition">{{ w.winner.composition }}</span>
						<span v-else-if="w.winner.level" class="composition">{{ $t('main.level_n', [w.winner.level]) }}</span>
					</div>

					<span v-if="w.winner.talent" class="talent"><img src="/image/talent.png"> {{ $filters.number(w.winner.talent) }}</span>
					<router-link :to="'/tournament/' + w.tournament" class="bracket" :title="$t('main.tournament')">
						<v-icon>mdi-tournament</v-icon>
					</router-link>
				</div>
			</div>
		</template>
		<div v-else class="none">{{ t('no_tournament') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	defineOptions({ name: 'HomeWidgetTournaments' })

	const t = useNamespacedT('home')

	// Types de tournoi, côté serveur (Tournament::LEEK_32 / TEAM_32 / FARMER_32).
	const LEEK = 1
	const TEAM = 2
	const FARMER = 3

	interface Winner {
		tournament: number
		type: number
		date: number
		winner: {
			// `id` est celui du vainqueur dans son propre monde : le poireau, l'éleveur,
			// ou la COMPOSITION pour une équipe — c'est ce que prend chaque infobulle.
			id: number
			name: string
			link: string
			level: number
			talent: number
			farmer_id?: number
			farmer_name?: string
			avatar_changed?: number
			composition?: string
			team_id?: number
			emblem_changed?: number
		}
	}

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { winners: Winner[] } | null }>()

	const loaded = ref(false)
	const winners = ref<Winner[]>([])

	function titleKey(type: number): string {
		return type === LEEK ? 'main.leeks' : type === TEAM ? 'main.teams' : 'main.farmers'
	}

	function tooltipOf(type: number) {
		return type === LEEK ? RichTooltipLeek : type === TEAM ? RichTooltipComposition : RichTooltipFarmer
	}

	// Les vainqueurs arrivés du serveur, regroupés par type sans en réordonner les
	// sections (poireaux, éleveurs, équipes) ni les lignes (classées par niveau).
	// La date est celle de l'édition, donc du premier tournoi de la section.
	const groups = computed(() => {
		const result: { type: number, title: string, date: number, winners: Winner[] }[] = []
		for (const w of winners.value) {
			let group = result.find(g => g.type === w.type)
			if (!group) {
				group = { type: w.type, title: titleKey(w.type), date: w.date, winners: [] }
				result.push(group)
			}
			group.winners.push(w)
		}
		return result
	})

	function load() {
		LeekWars.get<{ winners: Winner[] }>('tournament/get-recent-winners').then((data) => {
			winners.value = data.winners ?? []
			loaded.value = true
		}).error(() => { loaded.value = true })
	}

	watch(() => props.data, (data) => {
		if (data === undefined) return
		if (data === null) { load(); return }
		winners.value = data.winners ?? []
		loaded.value = true
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	.tournaments-widget {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.group-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 2px 6px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 2px;
	}
	.group-title {
		font-weight: bold;
		text-transform: uppercase;
		font-size: 12px;
		letter-spacing: 0.5px;
		color: var(--text-color-secondary);
	}
	.group-date {
		margin-left: auto;
		font-size: 11px;
		color: var(--text-color-secondary);
	}
	.winner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 6px;
		border-radius: var(--radius);
		min-width: 0;
	}
	.winner:hover {
		background: var(--background-secondary);
	}
	// Le <span> d'activation rendu par le composant d'infobulle est inline : il doit
	// se comporter comme le contenu qu'il porte, sinon l'avatar retombe sur la ligne
	// de base et le nom perd sa coupure. La carte de l'infobulle est téléportée hors
	// du widget, ces sélecteurs ne l'atteignent donc jamais.
	.portrait-tooltip, .portrait-tooltip :deep(span), .portrait {
		display: flex;
		flex-shrink: 0;
	}
	.avatar {
		width: 28px;
		height: 28px;
		object-fit: cover;
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	.name-tooltip, .name-tooltip :deep(span) {
		display: block;
		min-width: 0;
	}
	.name {
		display: block;
		font-weight: bold;
		color: var(--text-color);
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.composition {
		font-size: 12px;
		color: var(--text-color-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.talent {
		flex-shrink: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-color-secondary);
		white-space: nowrap;
		img {
			width: 14px;
			vertical-align: -2px;
		}
	}
	.bracket {
		flex-shrink: 0;
		display: flex;
		color: var(--text-color-secondary);
		i {
			font-size: 20px;
		}
	}
	.bracket:hover i {
		color: var(--primary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
