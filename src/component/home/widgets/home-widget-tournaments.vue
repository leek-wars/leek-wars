<template>
	<div ref="rootEl" class="tournaments-widget" :style="rootStyle">
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
				<!-- Les vainqueurs en rangée d'avatars : une édition, c'est une
				     vingtaine de tournois de poireaux, et le panel de l'accueil ne
				     défile pas. Le nom, le niveau et le talent sont dans l'infobulle. -->
				<div class="winners">
					<!-- L'enveloppe porte la mise en page : le composant d'infobulle rend
					     un <span> inline autour de son activateur, qui décalerait la ligne
					     de base (cf. rare-trophies). `|| 0` : une infobulle sans id reste
					     fermée plutôt que d'aller chercher un poireau qui n'existe pas —
					     le serveur part en prod avant le client, mais l'inverse arrive. -->
					<span v-for="e in group.entries" :key="e.tournament" class="portrait-tooltip">
						<component :is="tooltipOf(e.type)" :id="e.winner.id || 0" v-slot="{ props }" :bottom="true">
							<router-link :to="e.winner.link" class="portrait" v-bind="props">
								<emblem v-if="e.winner.team_id" :team="{id: e.winner.team_id, emblem_changed: e.winner.emblem_changed || 0}" class="avatar portrait-image" />
								<!-- Un tournoi de poireaux, c'est un POIREAU qui gagne : sa tête
								     le dit mieux que la photo de son éleveur, qui en aligne
								     parfois trois identiques dans la même rangée. L'éleveur
								     reste, en pastille dans le coin. Repli sur l'avatar seul si
								     le serveur ne sait pas encore dessiner la tête (apparence
								     absente) : le client part en prod avant le serveur.
								     La tête ne porte PAS la classe `avatar` : celle-ci pose le
								     cadre carré des photos (fond + coins coupés), qui enfermait
								     le poireau dans une boîte grise. -->
								<template v-else-if="e.leek">
									<leek-image :leek="e.leek" head class="head" />
									<img :src="LeekWars.getAvatar(e.winner.farmer_id || 0, e.winner.avatar_changed || 0)" class="avatar farmer-badge" loading="lazy">
								</template>
								<img v-else :src="LeekWars.getAvatar(e.winner.farmer_id || 0, e.winner.avatar_changed || 0)" class="avatar portrait-image" loading="lazy">
							</router-link>
						</component>
					</span>
				</div>
			</div>
		</template>
		<div v-else class="none">{{ t('no_tournament') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import type { Leek } from '@/model/leek'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	defineOptions({ name: 'HomeWidgetTournaments' })

	const t = useNamespacedT('home')

	// Types de tournoi, tels que les envoie le serveur.
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
			// Apparence, pour les vainqueurs de tournois de poireaux uniquement.
			// `hat` est l'id d'un modèle de chapeau, tel que le prend `leek-image`.
			skin?: number
			hat?: number | null
			face?: number
			metal?: boolean
		}
	}

	// Un vainqueur prêt à afficher : `leek` n'est rempli que pour les tournois de
	// poireaux, et seulement si le serveur a envoyé de quoi dessiner la tête.
	interface Entry extends Winner {
		leek: Leek | null
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

	// Le poireau à dessiner, quand le vainqueur en est un et que son apparence a
	// suivi. `skin` fait foi : c'est le seul champ que le serveur ne peut pas
	// renvoyer à zéro par accident (le plus petit vaut 1).
	function leekOf(w: Winner): Leek | null {
		if (w.type !== LEEK || !w.winner.skin) return null
		return {
			id: w.winner.id,
			name: w.winner.name,
			level: w.winner.level,
			skin: w.winner.skin,
			hat: w.winner.hat ?? null,
			face: w.winner.face ?? 0,
			metal: w.winner.metal ?? false,
		} as unknown as Leek
	}

	// Les vainqueurs arrivés du serveur, regroupés par type sans en réordonner les
	// sections (poireaux, éleveurs, équipes) ni les lignes (classées par niveau).
	// La date est celle de l'édition, donc du premier tournoi de la section.
	const groups = computed(() => {
		const result: { type: number, title: string, date: number, entries: Entry[] }[] = []
		for (const w of winners.value) {
			let group = result.find(g => g.type === w.type)
			if (!group) {
				group = { type: w.type, title: titleKey(w.type), date: w.date, entries: [] }
				result.push(group)
			}
			group.entries.push({ ...w, leek: leekOf(w) })
		}
		return result
	})

	// Le panel est rempli jusqu'en bas : plutôt que des avatars de taille fixe et du
	// blanc dessous, on cherche le plus gros avatar avec lequel les trois sections
	// tiennent encore entièrement. Tout se calcule à partir de la taille du widget,
	// jamais à partir de la taille rendue des avatars — une mesure qui dépendrait de
	// ce qu'on vient de décider ne convergerait pas (cf. useFitCount).
	const MIN_AVATAR = 28
	// Les avatars sont servis en 200×200 : au-delà de 96 px ils se dépixellisent sur
	// un écran à forte densité.
	const MAX_AVATAR = 96
	// Hauteur de repli de l'intertitre avant la première mesure (police fixe).
	const HEADER_HEIGHT = 25
	// Entre l'intertitre et sa rangée d'avatars.
	const HEADER_GAP = 4

	const rootEl = ref<HTMLElement | null>(null)
	const width = ref(0)
	const height = ref(0)
	const headerHeight = ref(HEADER_HEIGHT)

	function clamp(value: number, min: number, max: number) {
		return Math.max(min, Math.min(max, value))
	}

	// Ce que donne une taille d'avatar : les marges suivent l'avatar (plus gros
	// ET plus aéré), les colonnes s'étalent sur toute la largeur.
	function metrics(avatar: number, w: number, counts: number[]) {
		const gap = clamp(Math.round(avatar * 0.22), 4, 14)
		const padding = clamp(Math.round(avatar * 0.2), 6, 14)
		const groupGap = clamp(Math.round(avatar * 0.3), 8, 20)
		// Un pixel de marge : `clientWidth` est ARRONDI, un widget large de 239,98 px
		// se déclare à 240. La rangée remplissant la largeur au pixel près (`spread`
		// ci-dessous), ce pixel de trop suffisait à faire passer la dernière colonne
		// à la ligne — une rangée de plus par section, et le contenu débordait du
		// panel, qui le coupait par le haut (en pleine largeur sur mobile, où le
		// panel fait toute la page et tombe rarement sur un compte rond).
		const inner = Math.max(avatar, w - 2 * padding - 1)
		const columns = Math.max(1, Math.floor((inner + gap) / (avatar + gap)))
		// Gouttière horizontale élargie pour que la rangée aille jusqu'au bord droit,
		// plafonnée : à deux ou trois colonnes l'étalement disperserait les avatars.
		const spread = columns > 1 ? clamp((inner - columns * avatar) / (columns - 1), gap, gap * 2.5) : gap
		const rows = counts.map(n => Math.ceil(n / columns))
		const total = rows.reduce((acc, r) => acc + headerHeight.value + HEADER_GAP + r * avatar + (r - 1) * gap, 0)
			+ (counts.length - 1) * groupGap
		return { avatar, gap, spread, padding, groupGap, columns, rows, total }
	}

	// Le reste de hauteur après la taille retenue (la suivante aurait fait passer une
	// rangée à la ligne) part dans les interlignes, plafonné : sans plafond, un panel
	// très haut écartait ses deux rangées de poireaux d'une centaine de pixels et la
	// section n'en était plus une. Ce qui reste alors se partage en haut et en bas.
	function fill(m: ReturnType<typeof metrics>, h: number) {
		const rows = m.rows.reduce((acc, r) => acc + r, 0)
		const slots = (rows - m.rows.length) + (m.rows.length - 1)
		const leftover = h - m.total
		const extra = slots > 0 && leftover > 0 ? Math.min(leftover / slots, m.avatar * 0.5) : 0
		return { ...m, gap: m.gap + extra, groupGap: m.groupGap + extra, justify: leftover > 0 ? 'center' : 'flex-start' }
	}

	const layout = computed(() => {
		const counts = groups.value.map(g => g.entries.length)
		if (!counts.length || width.value <= 0 || height.value <= 0) return fill(metrics(MIN_AVATAR, width.value || 240, counts.length ? counts : [1]), 0)
		for (let avatar = MAX_AVATAR; avatar > MIN_AVATAR; avatar--) {
			const m = metrics(avatar, width.value, counts)
			if (m.total <= height.value) return fill(m, height.value)
		}
		// Rien ne tient : on garde la plus petite taille, le clipping fait filet.
		return fill(metrics(MIN_AVATAR, width.value, counts), height.value)
	})

	const rootStyle = computed(() => ({
		'--avatar': layout.value.avatar + 'px',
		'--columns': layout.value.columns,
		'--gap': layout.value.gap + 'px',
		'--spread': layout.value.spread + 'px',
		'--padding': layout.value.padding + 'px',
		'--group-gap': layout.value.groupGap + 'px',
		'--justify': layout.value.justify,
	}))

	function measure() {
		const el = rootEl.value
		if (!el) return
		width.value = el.clientWidth
		height.value = el.clientHeight
		const header = el.querySelector('.group-header') as HTMLElement | null
		if (header && header.offsetHeight > 0) headerHeight.value = header.offsetHeight
	}

	let resizeObserver: ResizeObserver | null = null
	watch(rootEl, el => {
		if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
		if (el) {
			resizeObserver = new ResizeObserver(() => measure())
			resizeObserver.observe(el)
		}
	}, { immediate: true })
	// Le contenu arrive après la requête : l'intertitre n'existe qu'à ce moment-là,
	// et la taille du widget, elle, n'a pas bougé (pas de ResizeObserver déclenché).
	watch(groups, () => nextTick(measure))
	onBeforeUnmount(() => { if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null } })

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
	// Le panel de l'accueil ne défile pas : le contenu est clippé plutôt que de
	// pousser une barre de défilement dans le widget.
	.tournaments-widget {
		display: flex;
		flex-direction: column;
		gap: var(--group-gap);
		height: 100%;
		overflow: hidden;
		// Les interlignes absorbent déjà le reste de hauteur (cf. `fill`) ; le
		// reliquat se partage en haut et en bas plutôt que de tomber sous la
		// dernière rangée. En débordement, on repart du haut : centré, l'intertitre
		// de la première section serait rogné.
		justify-content: var(--justify);
	}
	.group {
		display: flex;
		flex-direction: column;
	}
	.group-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 2px var(--padding);
		border-bottom: 1px solid var(--border);
		margin-bottom: 4px;
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
	// Une grille et pas un `flex-wrap` : le nombre de colonnes est IMPOSÉ, celui
	// que la hauteur a été calculée pour tenir. Un repli au pixel près ne peut
	// plus ajouter une rangée derrière le dos du calcul.
	.winners {
		display: grid;
		grid-template-columns: repeat(var(--columns), var(--avatar));
		justify-content: start;
		gap: var(--gap) var(--spread);
		padding: 0 var(--padding);
	}
	// Le <span> d'activation rendu par le composant d'infobulle est inline : il doit
	// se comporter comme l'avatar qu'il porte, sinon celui-ci retombe sur la ligne de
	// base et la rangée gagne quelques pixels par ligne. La carte de l'infobulle est
	// téléportée hors du widget, ces sélecteurs ne l'atteignent donc jamais.
	.portrait-tooltip, .portrait-tooltip :deep(span), .portrait {
		display: flex;
		flex-shrink: 0;
	}
	// Le survol grossit la vignette ENTIÈRE et pas la seule image : la pastille de
	// l'éleveur est posée dans le coin du poireau, elle doit grandir avec lui.
	// La taille est portée par la vignette et non par ce qu'elle contient : c'est
	// elle qui ancre la pastille, et elle doit rester carrée même pour une tête de
	// poireau, qui ne remplit pas son cadre.
	.portrait {
		position: relative;
		width: var(--avatar);
		height: var(--avatar);
		transition: transform 0.1s;
	}
	.portrait:hover {
		transform: scale(1.12);
		z-index: 1;
	}
	.portrait-image, .head {
		width: var(--avatar);
		height: var(--avatar);
		object-fit: cover;
	}
	// L'éleveur du poireau, en pastille dans le coin. Un tiers de la vignette :
	// assez pour reconnaître un habitué à sa photo, pas assez pour disputer la
	// place à la tête. Elle garde la classe `avatar`, donc le cadre carré de la
	// maison — c'est ce qui la détache du poireau, quelle que soit la photo.
	.farmer-badge {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 36%;
		height: 36%;
		min-width: 11px;
		min-height: 11px;
		object-fit: cover;
		pointer-events: none;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
