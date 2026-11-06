<template>
	<div ref="rootEl" class="registrations-widget" :class="{ thumbs }">
		<div v-if="!rows.length" class="none">{{ t('no_leek') }}</div>
		<table v-else>
			<thead>
				<tr>
					<!-- « Tout inscrire » loge dans la case vide de l'en-tête : une ligne
						de plus sous le tableau agrandirait la taille minimale du widget. -->
					<th class="all">
						<v-btn v-if="missing" size="x-small" color="primary" prepend-icon="mdi-check-all" @click="registerAll">{{ t('register_all') }}</v-btn>
					</th>
					<th>
						<v-tooltip location="bottom">
							<template #activator="{ props }">
								<span v-bind="props" class="column"><v-icon>mdi-tournament</v-icon><span class="text">{{ t('registrations_tournament') }}</span></span>
							</template>
							<div>{{ t('tournament_time_leek') }}</div>
							<div>{{ t('tournament_time_farmer') }}</div>
						</v-tooltip>
					</th>
					<th>
						<v-tooltip location="bottom" :text="t('arena_time')">
							<template #activator="{ props }">
								<span v-bind="props" class="column"><v-icon>mdi-stadium</v-icon><span class="text">{{ t('registrations_arena') }}</span></span>
							</template>
						</v-tooltip>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.key">
					<td class="name">
						<component :is="row.farmer ? RichTooltipFarmer : RichTooltipLeek" :id="row.id" v-slot="{ props }" :bottom="true">
							<router-link v-bind="props" :to="row.link" class="entity">
								<template v-if="thumbs">
									<avatar v-if="row.farmer" :farmer="store.state.farmer" class="thumb avatar" />
									<leek-image v-else-if="row.leek" :leek="row.leek" head class="thumb leek-head" />
								</template>
								<v-icon v-else>{{ row.farmer ? 'mdi-account' : 'mdi-sprout' }}</v-icon>
								<span class="label">{{ row.name }}</span>
							</router-link>
						</component>
					</td>
					<td>
						<div v-if="row.tournament" class="cell">
							<lw-switch :model-value="row.tournament.registered" @update:model-value="toggleTournament(row)" />
							<router-link v-if="row.tournament.current" :to="'/tournament/' + row.tournament.current" :title="t('see_tournament')" class="current">
								<v-icon>mdi-arrow-right</v-icon>
							</router-link>
						</div>
						<span v-else-if="row.loading" class="pending">…</span>
					</td>
					<td>
						<lw-switch v-if="row.arena !== null" :model-value="row.arena" @update:model-value="toggleArena(row)" />
						<span v-else-if="row.loading" class="pending">…</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script lang="ts">
	import type { Farmer } from '@/model/farmer'

	// Mêmes conditions que les boutons des pages éleveur et poireau : le tournoi
	// d'éleveur demande deux poireaux, l'arène automatique un poireau niveau 20.
	const FARMER_TOURNAMENT_MIN_LEEKS = 2
	const ARENA_MIN_LEVEL = 20

	// Hauteurs mesurées, en pixels, du tableau en lignes compactes (sans
	// miniatures) : celle de l'en-tête, qui porte « Tout inscrire », et celle
	// d'une ligne.
	const HEADER_HEIGHT = 30
	const ROW_HEIGHT = 27
	// Ligne avec miniature, et largeur à partir de laquelle on les montre.
	const LARGE_ROW_HEIGHT = 40
	const LARGE_MIN_WIDTH = 340

	function farmerRow(farmer: Farmer): boolean {
		const enoughLeeks = Object.keys(farmer.leeks).length >= FARMER_TOURNAMENT_MIN_LEEKS
		return !!(farmer.tournaments_enabled && enoughLeeks && farmer.tournament)
	}

	/**
	 * Hauteur de contenu qu'il faut au widget pour montrer toutes ses lignes
	 * sans défiler : l'accueil en tire la taille minimale du panneau, qui dépend
	 * donc du nombre de poireaux de l'éleveur.
	 */
	export function registrationsContentHeight(farmer: Farmer | null): number {
		if (!farmer) return HEADER_HEIGHT
		const rows = Object.keys(farmer.leeks).length + (farmerRow(farmer) ? 1 : 0)
		return HEADER_HEIGHT + rows * ROW_HEIGHT
	}
</script>

<script setup lang="ts">
	import { computed, onBeforeUnmount, ref, watch } from 'vue'
	import { type ApiError, isReportedByTransport } from '@/model/api-error'
	import type { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	defineOptions({ name: 'HomeWidgetRegistrations' })

	const t = useNamespacedT('home')

	interface Registration { registered: boolean, current?: number | null }
	/** Les seuls champs lus dans la fiche d'un poireau (leek/get-private). */
	interface LeekRegistrations { level: number, tournament: Registration | null, auto_br: boolean }
	interface Row {
		key: string
		farmer: boolean
		id: number
		name: string
		link: string
		/** Le poireau du store, pour sa miniature. */
		leek?: Leek
		/** null : pas inscriptible (ou pas encore chargé, cf. `loading`). */
		tournament: Registration | null
		arena: boolean | null
		loading: boolean
	}

	const rows = ref<Row[]>([])

	// Le tournoi de l'éleveur est dans le store dès la connexion. Ceux des
	// poireaux et leur arène automatique ne sont que dans leur fiche : une requête
	// par poireau, la même que leur page.
	function load() {
		const farmer = store.state.farmer
		if (!farmer) { rows.value = []; return }
		const list: Row[] = []
		const own = farmer.tournament
		if (farmerRow(farmer) && own) {
			list.push({
				key: 'farmer', farmer: true, id: farmer.id, name: farmer.name, link: '/farmer',
				tournament: { registered: !!own.registered, current: own.current },
				arena: null, loading: false,
			})
		}
		for (const leek of Object.values(farmer.leeks)) {
			list.push({
				key: 'leek-' + leek.id, farmer: false, id: leek.id, name: leek.name, leek,
				link: '/leek/' + leek.id, tournament: null, arena: null, loading: true,
			})
		}
		rows.value = list
		loadLeeks(rows.value.filter(row => !row.farmer), farmer.id)
	}

	// Une fiche après l'autre et non toutes à la fois : l'accueil envoie déjà ses
	// propres requêtes au chargement, et une rafale de fiches complètes déclenche
	// la limitation de débit du serveur (429).
	async function loadLeeks(list: Row[], farmerId: number) {
		for (const row of list) {
			// Changement de compte en cours de route : ces lignes ne sont plus affichées.
			const farmer = store.state.farmer
			if (farmer?.id !== farmerId) return
			try {
				const leek = await LeekWars.get<LeekRegistrations>('leek/get-private/' + row.id)
				const tournament = farmer.tournaments_enabled ? leek.tournament : null
				row.tournament = tournament ? { ...tournament } : null
				const arena = leek.level >= ARENA_MIN_LEVEL && farmer.br_enabled
				row.arena = arena ? !!leek.auto_br : null
			} catch {
				// Ligne laissée sans interrupteur : la page du poireau reste à un clic.
			}
			row.loading = false
		}
	}

	watch(() => store.state.farmer?.id, load, { immediate: true })

	// Miniatures quand le panneau a la place de les loger toutes, en largeur
	// comme en hauteur : sinon on garde les lignes compactes plutôt que de
	// faire défiler.
	const rootEl = ref<HTMLElement | null>(null)
	const size = ref({ width: 0, height: 0 })
	const thumbs = computed(() => size.value.width >= LARGE_MIN_WIDTH
		&& size.value.height >= HEADER_HEIGHT + rows.value.length * LARGE_ROW_HEIGHT)
	const observer = new ResizeObserver(entries => {
		const box = entries[0].contentRect
		size.value = { width: box.width, height: box.height }
	})
	watch(rootEl, (el, previous) => {
		if (previous) observer.unobserve(previous)
		if (el) observer.observe(el)
	})
	onBeforeUnmount(() => observer.disconnect())

	// Inscriptions à la volée, comme sur les pages éleveur et poireau : on bascule
	// tout de suite et on revient en arrière si le serveur refuse.
	function send(url: string, body: Record<string, unknown>, rollback: () => void) {
		LeekWars.post(url, body).error((error: ApiError) => {
			rollback()
			if (!isReportedByTransport(error)) LeekWars.toast(t('registration_failed'))
		})
	}

	function toggleTournament(row: Row) {
		const tournament = row.tournament
		if (!tournament) return
		const next = !tournament.registered
		tournament.registered = next
		const rollback = () => { tournament.registered = !next }
		const verb = next ? 'register' : 'unregister'
		if (row.farmer) send('farmer/' + verb + '-tournament', {}, rollback)
		else send('leek/' + verb + '-tournament', { leek_id: row.id }, rollback)
	}

	function toggleArena(row: Row) {
		if (row.arena === null) return
		const next = !row.arena
		row.arena = next
		const verb = next ? 'register' : 'unregister'
		send('leek/' + verb + '-auto-br', { leek_id: row.id }, () => { row.arena = !next })
	}

	// Ce qu'il reste à inscrire : le bouton n'apparaît que s'il a quelque chose à
	// faire, et il ne désinscrit jamais rien.
	const missing = computed(() => rows.value.some(row =>
		(row.tournament && !row.tournament.registered) || row.arena === false))

	function registerAll() {
		for (const row of rows.value) {
			if (row.tournament && !row.tournament.registered) toggleTournament(row)
			if (row.arena === false) toggleArena(row)
		}
	}
</script>

<style lang="scss" scoped>
	// Le panneau ne défile pas (noScroll) : sa taille minimale loge toutes les
	// lignes (cf. registrationsContentHeight).
	.registrations-widget {
		height: 100%;
		container-type: inline-size;
	}
	// Panneau étroit : les intitulés de colonne laissent la place aux noms, les
	// icônes restent, avec les horaires dans leur infobulle.
	@container (max-width: 300px) {
		.column .text {
			display: none;
		}
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		height: 30px;
		box-sizing: border-box;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-color-secondary);
		text-align: left;
		padding: 0 6px 4px;
		white-space: nowrap;
	}
	th.all {
		padding-left: 0;
	}
	.column {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		.v-icon {
			font-size: 16px;
		}
	}
	td {
		height: 27px;
		box-sizing: border-box;
		padding: 0 6px;
		border-top: 1px solid var(--border);
		vertical-align: middle;
	}
	.thumbs td {
		height: 40px;
	}
	.name {
		width: 100%;
		max-width: 0;
		.v-icon {
			flex: none;
			font-size: 18px;
			color: var(--text-color-secondary);
		}
	}
	// L'infobulle enveloppe le lien dans un `span` en ligne : un bloc flex dans
	// une boîte en ligne gonflait la ligne du tableau de 27 à 40 px.
	.name :deep(.rich-tooltip-activator) {
		display: flex;
		min-width: 0;
	}
	.entity {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 6px;
		color: var(--text-color);
	}
	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.thumb {
		flex: none;
		width: 32px;
		height: 32px;
	}
	// Comme dans le menu : la tête du poireau et son chapeau débordent de leur
	// case, la ligne garde sa hauteur.
	.thumb.leek-head {
		margin: -4px;
		width: 40px;
		height: 40px;
	}
	.cell {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.current .v-icon {
		font-size: 18px;
		color: var(--primary);
	}
	.pending {
		color: var(--text-color-secondary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px 0;
	}
</style>
