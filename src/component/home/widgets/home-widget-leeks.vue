<template>
	<div ref="root" class="leeks-widget" :class="{ horizontal: layout.horizontal }" :style="{ '--cols': layout.columns, '--image': layout.image + 'px' }">
		<rich-tooltip-leek v-for="leek in leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
			<router-link v-ripple :to="'/leek/' + leek.id" class="leek" v-bind="props">
				<leek-image :leek="leek" :scale="0.75" />
				<div class="info">
					<div class="name">{{ leek.name }}</div>
					<div class="talent-ranking">
						<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
						<ranking-badge v-if="leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
					</div>
					<span class="level">{{ t('main.level_n', [leek.level]) }}</span>
				</div>
			</router-link>
		</rich-tooltip-leek>
		<router-link v-if="canCreate" v-ripple to="/new-leek" class="leek new">
			<v-icon>mdi-plus</v-icon>
			<span>{{ t('main.new_leek') }}</span>
		</router-link>
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	defineOptions({ name: 'HomeWidgetLeeks' })

	const t = useNamespacedT('home')

	const leeks = computed(() => store.state.farmer ? Object.values(store.state.farmer.leeks) : [])
	const canCreate = computed(() => !!store.state.farmer?.can_create_leek && leeks.value.length < 4)

	/*
	 * Le widget cherche la plus grande image de poireau que le panel permet.
	 * Deux choses sont libres : la grille (2 × 2, 4 × 1…) et le sens de la carte.
	 * Un panel haut veut la carte debout, poireau au-dessus de ses infos ; un
	 * panel bas veut la carte couchée, poireau à gauche de ses infos — c'est là
	 * que la place se trouve, et une carte debout dans un panel bas ne donne
	 * qu'un poireau minuscule au-dessus d'un nom écrasé. On essaie donc toutes
	 * les combinaisons et on garde celle qui donne le plus gros poireau ; à
	 * poireau égal, la grille sans case vide, puis la carte debout.
	 *
	 * Les deux encombrements du contenu sont MESURÉS et non devinés : la ligne
	 * talent + classement ne se compresse pas (chiffres et badge) et elle est
	 * bien plus large avec un badge qu'avec le seul talent ; le bloc d'infos
	 * change de hauteur avec la police et la langue. Dans une colonne flex ils
	 * gardent leur taille intrinsèque, même en débordant : on peut donc les
	 * mesurer tels qu'ils sont rendus.
	 */
	const MIN_INFO_WIDTH = 110
	const PADDING = 20
	const GAP = 10
	const MIN_IMAGE = 40
	const MAX_IMAGE = 160
	// La carte debout reste la disposition de référence : coucher la carte doit
	// rapporter un gain net (15 %), pas deux pixels. Sans cette préférence, les
	// deux sens se valent souvent et le widget bascule de l'un à l'autre au
	// moindre redimensionnement.
	const UPRIGHT_PREFERENCE = 1.15

	const root = ref<HTMLElement | null>(null)
	const width = ref(0)
	const height = ref(0)
	const infoWidth = ref(MIN_INFO_WIDTH)
	const infoHeight = ref(0)
	let observer: ResizeObserver | null = null

	const measure = () => {
		const el = root.value
		if (!el) { return }
		width.value = el.clientWidth
		height.value = el.clientHeight
		let contentWidth = 0
		let contentHeight = 0
		// La ligne talent + classement donne la largeur (le nom, lui, s'ellipse),
		// le bloc d'infos entier donne la hauteur.
		for (const row of el.querySelectorAll('.talent-ranking')) {
			contentWidth = Math.max(contentWidth, (row as HTMLElement).offsetWidth)
		}
		for (const info of el.querySelectorAll('.info')) {
			contentHeight = Math.max(contentHeight, (info as HTMLElement).offsetHeight)
		}
		infoWidth.value = Math.max(MIN_INFO_WIDTH, contentWidth)
		infoHeight.value = contentHeight
	}

	// Le contenu est observé lui aussi : sa taille bouge au chargement des
	// polices et quand un poireau change de talent, de classement ou de nom.
	const observeAll = () => {
		const el = root.value
		if (!el || !observer) { return }
		observer.disconnect()
		observer.observe(el)
		// Les deux sont observés : `.info` est borné par la largeur de sa case,
		// il ne bouge donc pas quand la ligne de talent, elle, s'élargit.
		for (const info of el.querySelectorAll('.info, .talent-ranking')) { observer.observe(info) }
		measure()
	}

	watch(root, el => {
		observer?.disconnect()
		observer = null
		if (el) {
			observer = new ResizeObserver(measure)
			observeAll()
		}
	}, { immediate: true })

	watch([leeks, canCreate], () => nextTick(observeAll))

	onBeforeUnmount(() => {
		observer?.disconnect()
		observer = null
	})

	const count = computed(() => Math.max(1, leeks.value.length + (canCreate.value ? 1 : 0)))

	interface Layout { columns: number, rows: number, horizontal: boolean, image: number, score: number, room: number, cellWidth: number, holes: number, fits: boolean }

	const layout = computed(() => {
		let best: Layout | null = null
		for (let r = 1; r <= count.value; r++) {
			// Colonnes au strict nécessaire pour ces rangées : pas de case vide
			// en trop (4 poireaux sur 2 rangées, c'est 2 × 2, jamais 3 + 2).
			const columns = Math.ceil(count.value / r)
			const rows = Math.ceil(count.value / columns)
			const cellWidth = (width.value - GAP * (columns - 1)) / columns
			const cellHeight = (height.value - GAP * (rows - 1)) / rows
			const holes = columns * rows - count.value
			for (const horizontal of [false, true]) {
				// Place restante pour le poireau : les infos sont sous lui quand la
				// carte est debout, à côté de lui quand elle est couchée.
				const room = horizontal
					? Math.min(cellHeight - PADDING, cellWidth - PADDING - GAP - infoWidth.value)
					: Math.min(cellHeight - PADDING - infoHeight.value, cellWidth - PADDING)
				// Une carte debout doit aussi loger ses infos en largeur, sans quoi
				// la ligne de talent déborde de sa case.
				const fits = room >= MIN_IMAGE && (horizontal || cellWidth - PADDING >= infoWidth.value)
				const image = Math.min(MAX_IMAGE, Math.max(MIN_IMAGE, room))
				const candidate: Layout = { columns, rows, horizontal, image, score: horizontal ? image : image * UPRIGHT_PREFERENCE, room, cellWidth, holes, fits }
				const better = !best ? true
					: candidate.fits !== best.fits ? candidate.fits
					// Quand rien ne tient (panel minuscule), on sauve d'abord la
					// lisibilité : les cases les plus larges, donc le moins de
					// colonnes, quitte à ce que le poireau soit tout petit.
					: !candidate.fits ? (candidate.cellWidth !== best.cellWidth ? candidate.cellWidth > best.cellWidth : candidate.room > best.room)
					: candidate.score !== best.score ? candidate.score > best.score
					: candidate.holes !== best.holes ? candidate.holes < best.holes
					: false
				if (better) { best = candidate }
			}
		}
		return best!
	})
</script>

<style lang="scss" scoped>
	// Répartition équitable dans l'espace du panel. Le nombre de colonnes et le
	// sens des cartes sont calculés (voir le script) pour donner le plus gros
	// poireau. Les cases prennent tout l'espace disponible (colonnes et rangées
	// en `1fr`) au lieu de cartes de largeur fixe espacées : la zone cliquable —
	// et donc le rectangle du survol — couvre la part entière de chaque poireau,
	// sans bande morte entre les cartes.
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
	// Carte couchée : le poireau à gauche, ses infos à droite, alignées sur lui.
	// Le contenu est calé à gauche de sa case et non centré : les poireaux d'une
	// même colonne partent alors du même bord, quelle que soit la largeur de leur
	// nom ou de leur talent.
	.leeks-widget.horizontal .leek {
		flex-direction: row;
		justify-content: flex-start;
		gap: 10px;
	}
	.leeks-widget.horizontal .info {
		align-items: flex-start;
	}
	// Largeur plancher commune pour l'image : un poireau large (arme longue) et
	// un poireau étroit ne décalent plus leurs infos l'un par rapport à l'autre.
	// C'est bien un plancher et pas une largeur fixe : le svg se contente de se
	// centrer dans la place réservée, il ne rétrécit pas (le viewBox garde
	// l'échelle donnée par la hauteur).
	.leeks-widget.horizontal .leek > :deep(svg) {
		min-width: var(--image, 100px);
	}
	// `flex-shrink: 0` : sans lui, un manque de place écrase le bloc d'infos et
	// la ligne de talent, qui ne se compresse pas, déborde par-dessus le nom.
	// C'est l'image qui cède, et le script fait en sorte qu'elle n'ait pas à le
	// faire — le calcul de sa taille tient déjà compte des infos.
	.info {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
		min-width: 0;
		max-width: 100%;
	}
	// Taille du poireau calculée par le script : la place qui reste dans la case
	// une fois les infos posées, bornée pour rester lisible sans devenir géante.
	// Enfant direct seulement : ne pas toucher les petites icônes svg des badges.
	.leek > :deep(svg) {
		flex: 0 0 auto;
		width: auto;
		// Jamais plus large que sa case : le svg a un viewBox, il se contente de
		// rétrécir sa boîte sans déformer le poireau.
		max-width: 100%;
		height: var(--image, 100px);
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
	// Le talent et le classement viennent de composants partagés, taillés pour une
	// page : dans une carte de widget ils pèsent plus lourd que le nom du poireau.
	// On les allège ici seulement, jamais dans les composants qui servent partout
	// ailleurs — d'où les `:deep` et le `.leek` qui leur donne la spécificité
	// nécessaire pour passer devant les règles v3 des composants.
	.talent-ranking {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 8px 0;
	}
	// La pastille du talent se cale sur la hauteur du nombre qu'elle précède.
	// v2 seulement : en v3 le talent est UNE boîte, la même partout (Pierre,
	// 2026-09-09 : « le composant de talent a un style overridé, tu peux mettre
	// le même que ailleurs ? ») — ces retouches, taillées pour le disque et la
	// pilule du v2, la déformaient.
	body.v2 .leek .talent-ranking :deep(.talent .icon) {
		width: 24px;
		height: 24px;
		padding: 4px;
		img {
			width: 16px;
			height: 16px;
		}
	}
	body.v2 .leek .talent-ranking :deep(.talent .value) {
		font-size: 14px;
		padding: 3px 8px 3px 12px;
		margin-left: -6px;
	}
	.leek .talent-ranking :deep(.badge) {
		font-size: 13px;
		margin: 0 4px;
		.v-icon {
			font-size: 16px;
		}
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
