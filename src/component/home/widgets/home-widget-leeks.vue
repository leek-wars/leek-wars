<template>
	<div ref="root" class="leeks-widget" :class="[{ horizontal: layout.horizontal }, 'info-' + layout.mode]" :style="{ '--cols': layout.columns, '--image': layout.image + 'px' }">
		<rich-tooltip-leek v-for="leek in leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
			<router-link v-ripple :to="'/leek/' + leek.id" class="leek" v-bind="props">
				<leek-image :leek="leek" :scale="0.75" />
				<div class="info">
					<div class="name">{{ leek.name }}</div>
					<!-- Carte serrée : le talent puis le niveau sortent, dans cet ordre.
					     Tout reste dans l'infobulle riche, et le panneau garde des cartes
					     entières — avant, le bloc débordait sur la carte du dessous. -->
					<div v-if="layout.mode !== 'minimal'" class="talent-ranking">
						<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
						<ranking-badge v-if="leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
					</div>
					<span v-if="layout.mode === 'full'" class="level">{{ t('main.level_n', [leek.level]) }}</span>
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
	// Largeur qu'il faut au seul nom, qui s'ellipse : c'est la ligne de talent qui
	// impose `infoWidth`, et elle n'est pas là dans le mode le plus serré.
	const MIN_NAME_WIDTH = 60
	const PADDING = 20
	const GAP = 10
	const MIN_IMAGE = 40
	// Plancher de secours, quand le panel est trop petit pour que quoi que ce soit
	// tienne : mieux vaut un poireau plus petit que le minimum qu'un poireau rogné.
	const TINY_IMAGE = 24
	const MAX_IMAGE = 160
	// Marges verticales de la ligne de talent, à garder en phase avec le style :
	// elles ne sont pas dans son `offsetHeight`, mais elles comptent dans la
	// hauteur du bloc d'infos.
	const TALENT_MARGIN = 8
	const TALENT_MARGIN_COMPACT = 2
	// Ce que la carte montre sous le nom, du plus riche au plus pauvre. Le nom ne
	// part jamais : c'est lui qui dit de quel poireau on parle.
	type InfoMode = 'full' | 'compact' | 'minimal'
	const INFO_MODES: InfoMode[] = ['full', 'compact', 'minimal']
	// La carte debout reste la disposition de référence : coucher la carte doit
	// rapporter un gain net (15 %), pas deux pixels. Sans cette préférence, les
	// deux sens se valent souvent et le widget bascule de l'un à l'autre au
	// moindre redimensionnement.
	const UPRIGHT_PREFERENCE = 1.15
	// Ce que vaut chaque mode, en pixels de poireau : garder le talent en vaut
	// 70, garder le niveau 25 de plus. Une disposition ne sacrifie donc pas le
	// talent pour vingt pixels de poireau, mais un poireau deux fois plus gros
	// reste préférable à la ligne du niveau.
	const MODE_BONUS: Record<InfoMode, number> = { full: 95, compact: 70, minimal: 0 }

	const root = ref<HTMLElement | null>(null)
	const width = ref(0)
	const height = ref(0)
	const infoWidth = ref(MIN_INFO_WIDTH)
	// Les trois lignes du bloc d'infos, mesurées séparément : un mode resserré en
	// retire, et il faut pouvoir dire ce que coûterait leur retour. Elles partent
	// de leur taille habituelle plutôt que de zéro — le temps du premier rendu,
	// une ligne à 0 ferait croire que tout tient et le widget s'ouvrirait en
	// débordant avant de se reprendre.
	const nameHeight = ref(19)
	const talentHeight = ref(24)
	const levelHeight = ref(18)
	let observer: ResizeObserver | null = null

	/** Ce que pèse le bloc d'infos dans un mode donné. */
	const infoHeightFor = (mode: InfoMode) => {
		if (mode === 'minimal') { return nameHeight.value }
		if (mode === 'compact') { return nameHeight.value + TALENT_MARGIN_COMPACT * 2 + talentHeight.value }
		return nameHeight.value + TALENT_MARGIN * 2 + talentHeight.value + levelHeight.value
	}

	/** Et ce qu'il lui faut en largeur : la ligne de talent, ou le seul nom. */
	const infoWidthFor = (mode: InfoMode) => mode === 'minimal' ? MIN_NAME_WIDTH : infoWidth.value

	const measure = () => {
		const el = root.value
		if (!el) { return }
		width.value = el.clientWidth
		height.value = el.clientHeight
		let contentWidth = 0
		// La ligne talent + classement donne la largeur (le nom, lui, s'ellipse).
		for (const row of el.querySelectorAll('.talent-ranking')) {
			contentWidth = Math.max(contentWidth, (row as HTMLElement).offsetWidth)
		}
		if (contentWidth > 0) { infoWidth.value = Math.max(MIN_INFO_WIDTH, contentWidth) }
		// Chaque ligne garde sa dernière hauteur connue : en mode resserré elle
		// n'est plus rendue, mais c'est elle qui dit si on peut la remettre quand
		// le panneau grandit.
		const keep = (r: typeof nameHeight, selector: string) => {
			const node = el.querySelector(selector) as HTMLElement | null
			if (node && node.offsetHeight > 0) { r.value = node.offsetHeight }
		}
		keep(nameHeight, '.name')
		keep(talentHeight, '.talent-ranking')
		keep(levelHeight, '.level')
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

	interface Layout { columns: number, rows: number, horizontal: boolean, mode: InfoMode, rank: number, image: number, score: number, room: number, missing: number, cellWidth: number, holes: number, fits: boolean }

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
				// Les trois modes sont essayés pour chaque grille : ce que la carte
				// montre se paie en pixels de poireau (MODE_BONUS), et c'est le score
				// qui tranche — un mode plus pauvre peut gagner s'il rend le poireau
				// franchement plus grand.
				for (const mode of INFO_MODES) {
					const info = infoHeightFor(mode)
					const iw = infoWidthFor(mode)
					// Place restante pour le poireau : les infos sont sous lui quand la
					// carte est debout, à côté de lui quand elle est couchée.
					const room = horizontal
						? Math.min(cellHeight - PADDING, cellWidth - PADDING - GAP - iw)
						: Math.min(cellHeight - PADDING - info, cellWidth - PADDING)
					// Une carte couchée doit loger ses infos en hauteur, une carte
					// debout en largeur — sans quoi le bloc déborde de sa case et
					// vient recouvrir la carte voisine.
					const infoFits = horizontal ? info <= cellHeight - PADDING : iw <= cellWidth - PADDING
					const fits = room >= MIN_IMAGE && infoFits
					// Ce qui manque à ce candidat pour tenir : le poireau qu'on n'a pas
					// la place de dessiner, plus les infos qui dépassent dans l'autre
					// sens. C'est ce total qu'on minimise quand rien ne tient.
					const missing = Math.max(0, MIN_IMAGE - room)
						+ (horizontal ? Math.max(0, info - (cellHeight - PADDING)) : Math.max(0, iw - (cellWidth - PADDING)))
					const image = Math.min(MAX_IMAGE, Math.max(fits ? MIN_IMAGE : TINY_IMAGE, room))
					// Ce que montre la carte entre dans le score, converti en pixels de
					// poireau (MODE_BONUS).
					const rank = INFO_MODES.indexOf(mode)
					const score = (horizontal ? image : image * UPRIGHT_PREFERENCE) + MODE_BONUS[mode]
					const candidate: Layout = { columns, rows, horizontal, mode, rank, image, score, room, missing, cellWidth, holes, fits }
					const better = !best ? true
						: candidate.fits !== best.fits ? candidate.fits
						// Quand rien ne tient (panel minuscule), on prend le moins mauvais
						// — celui à qui il manque le moins de place, et à égalité celui
						// qui laisse le plus grand poireau.
						: !candidate.fits ? (candidate.missing !== best.missing ? candidate.missing < best.missing : candidate.room > best.room)
						: candidate.score !== best.score ? candidate.score > best.score
						: candidate.holes !== best.holes ? candidate.holes < best.holes
						: false
					if (better) { best = candidate }
				}
			}
		}
		return best!
	})

	// Les lignes qui reviennent (ou disparaissent) sont de nouveaux nœuds : sans
	// ça l'observateur garde les anciens et ne voit plus rien bouger.
	watch(() => layout.value.mode, () => nextTick(observeAll))
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
		// Filet : une carte ne déborde jamais sur sa voisine. Le calcul du mode
		// d'infos fait en sorte qu'il n'y ait rien à couper, mais entre deux
		// mesures (chargement des polices, changement de talent) il vaut mieux
		// rogner d'un pixel que recouvrir la carte du dessous.
		overflow: hidden;
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
	// Carte serrée : la ligne de talent respire moins. Les deux valeurs sont
	// partagées avec le script (TALENT_MARGIN, TALENT_MARGIN_COMPACT), qui les
	// ajoute à la hauteur du bloc — la marge n'est pas dans son offsetHeight.
	.leeks-widget.info-compact .talent-ranking {
		margin: 2px 0;
	}
	// Mode le plus serré : il ne reste que le nom, qui lui sait s'ellipser. Le
	// `flex-shrink: 0` ci-dessus protège la ligne de talent, absente ici — sans
	// cette exception le nom pousse le bloc hors de sa carte.
	.leeks-widget.info-minimal .info {
		flex-shrink: 1;
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
