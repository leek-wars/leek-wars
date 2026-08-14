<template>
	<div ref="root" class="leeks-widget" :style="{ '--cols': columns, '--rows': rows }">
		<rich-tooltip-leek v-for="leek in leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
			<router-link v-ripple :to="'/leek/' + leek.id" class="leek" v-bind="props">
				<leek-image :leek="leek" :scale="0.75" />
				<div class="name">{{ leek.name }}</div>
				<div class="talent-ranking">
					<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
					<ranking-badge v-if="leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
				</div>
				<span class="level">{{ t('main.level_n', [leek.level]) }}</span>
			</router-link>
		</rich-tooltip-leek>
		<router-link v-if="canCreate" v-ripple to="/new-leek" class="leek new">
			<v-icon>mdi-plus</v-icon>
			<span>{{ t('main.new_leek') }}</span>
		</router-link>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, ref, watch } from 'vue'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	defineOptions({ name: 'HomeWidgetLeeks' })

	const t = useNamespacedT('home')

	const leeks = computed(() => store.state.farmer ? Object.values(store.state.farmer.leeks) : [])
	const canCreate = computed(() => !!store.state.farmer?.can_create_leek && leeks.value.length < 4)

	/*
	 * Grille équilibrée plutôt qu'un simple retour à la ligne : à quatre cartes
	 * dans un panel qui en tient trois, on veut 2 × 2 et pas 3 + 1. D'où le
	 * rééquilibrage : on prend le nombre de colonnes qui tient dans la largeur,
	 * on en déduit le nombre de rangées, puis on ramène les colonnes au strict
	 * nécessaire pour ces rangées. Le nombre de rangées sert aussi à la hauteur
	 * de l'image (voir le style) : sur deux rangées, chaque poireau ne dispose
	 * plus que de la moitié du panel.
	 */
	const CARD_WIDTH = 130
	const GAP = 10

	const root = ref<HTMLElement | null>(null)
	const width = ref(0)
	let observer: ResizeObserver | null = null

	watch(root, el => {
		observer?.disconnect()
		observer = null
		if (el) {
			observer = new ResizeObserver(() => width.value = el.clientWidth)
			observer.observe(el)
			width.value = el.clientWidth
		}
	}, { immediate: true })

	onBeforeUnmount(() => {
		observer?.disconnect()
		observer = null
	})

	const count = computed(() => Math.max(1, leeks.value.length + (canCreate.value ? 1 : 0)))

	const columns = computed(() => {
		const fit = Math.max(1, Math.floor((width.value + GAP) / (CARD_WIDTH + GAP)))
		const rows = Math.ceil(count.value / Math.min(fit, count.value))
		return Math.ceil(count.value / rows)
	})

	const rows = computed(() => Math.ceil(count.value / columns.value))
</script>

<style lang="scss" scoped>
	// Répartition équitable dans l'espace du panel. Le nombre de colonnes est
	// calculé (voir le script) pour donner une grille équilibrée : 2 × 2 à
	// quatre poireaux, pas 3 + 1. Les cases prennent tout l'espace disponible
	// (colonnes et rangées en `1fr`) au lieu de cartes de 130 px espacées : la
	// zone cliquable — et donc le rectangle du survol — couvre la part entière
	// de chaque poireau, sans bande morte entre les cartes.
	.leeks-widget {
		display: grid;
		grid-template-columns: repeat(var(--cols, 1), minmax(0, 1fr));
		grid-auto-rows: minmax(0, 1fr);
		gap: 10px;
		height: 100%;
	}
	.leek {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 0;
		padding: 10px;
		text-decoration: none;
		color: var(--text-color);
		// Le liseré est là dès le repos, transparent : la carte ne bouge pas
		// d'un pixel quand il s'allume au survol.
		border: 1px solid transparent;
		transition: background-color .12s ease, border-color .12s ease;
	}
	// L'image s'adapte à la hauteur du panel (container = contenu du panel) :
	// grande quand il y a de la place, réduite sur un panel bas, sans couper.
	// La hauteur disponible se partage entre les rangées, gaps déduits, moins
	// la place du nom et des badges sous chaque poireau.
	// Enfant direct seulement : ne pas toucher les petites icônes svg des badges.
	.leek > :deep(svg) {
		width: auto;
		height: clamp(40px, (100cqh - 10px * (var(--rows, 1) - 1)) / var(--rows, 1) - 100px, 160px);
	}
	.leek:hover {
		background: var(--background-secondary);
	}
	// Le survol v2 ci-dessus donne `--background-secondary`, qui EST la surface
	// du panel en v3 : invisible. On lui donne donc de vrais états (doctrine :
	// pas de ripple, des états francs), mais discrets : la surface de rangée au
	// survol, le liseré vert au clic. Rien ne bouge, le poireau ne joue pas.
	body:not(.v2) {
		.leek:hover {
			background: var(--background-row);
			border-color: var(--border-strong);
		}
		.leek:active {
			border-color: var(--primary);
		}
	}
	.name {
		font-weight: bold;
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.talent-ranking {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 2px 0;
	}
	.level {
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.leek.new {
		justify-content: center;
		color: var(--text-color-secondary);
		border: 2px dashed var(--border);
		background: transparent;
		.v-icon {
			font-size: 32px;
		}
	}
</style>
