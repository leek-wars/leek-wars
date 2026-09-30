<template>
	<div class="item-history">
		<div class="history-header">
			<span class="title">{{ $t('main.history') }}</span>
			<!-- Portée de la liste (#12146) : la pièce posée dans la forge, ou tout l'atelier.
			     Une tentative se juge sur la SUITE des essais d'une même pièce (« j'étais à
			     94 % »), et dix pièces plus tard cette suite est noyée dans l'historique
			     complet. Le choix est retenu d'une visite à l'autre, comme l'onglet et le lot
			     de l'atelier : qui travaille pièce par pièce le règle une fois. -->
			<div class="scopes">
				<span class="scope" :class="{ active: scope === 'item' }" @click="setScope('item')">{{ $t('main.history_this_component') }}</span>
				<span class="scope" :class="{ active: scope === 'all' }" @click="setScope('all')">{{ $t('main.all') }}</span>
			</div>
		</div>
		<!-- Portée « cette pièce » sans pièce posée : on le dit, plutôt que de montrer un
		     historique vide qui se lirait comme « cette pièce n'a rien vécu ». -->
		<div v-if="scope === 'item' && item === null" class="empty">{{ $t('main.alteration_needs_component') }}</div>
		<loader v-else-if="loading && !entries.length" />
		<div v-else-if="!entries.length" class="empty">{{ $t('main.history_empty') }}</div>
		<div v-else class="entries">
			<div v-for="entry in entries" :key="entry.id" class="entry">
				<!-- Une seule ligne : issue, vignette (le nom de la piece est dans son
				     title), dosage et metabolisme, recette, resultat, la date a droite. -->
				<!-- Un clic repose la recette de la tentative dans la forge : l'historique est
				     ce qu'on relit pour retrouver un dosage. -->
				<div class="line" :class="[lineClass(entry), { replayable: canReplay(entry) }]"
					:title="canReplay(entry) ? $t('main.alteration_repeat') : undefined"
					@click="replay(entry)">
					<!-- Une seule icone d'issue, EN TOUT PREMIER : reussite, echec ou casse.
					     Un seul marqueur pour une seule information. -->
					<v-icon v-if="entry.action === ALTER && entry.details" class="outcome" :class="outcome(entry)" size="17">{{ OUTCOME_ICONS[outcome(entry)] }}</v-icon>
					<v-icon v-else-if="entry.action === RESCALE && entry.details" class="outcome rescale" size="17">mdi-scale-balance</v-icon>
					<img v-if="entry.template" class="thumb" :src="thumbUrl(entry.template)" :alt="itemName(entry.template)" :title="itemName(entry.template)">

					<!-- Craft : ce qui a ete fabrique. -->
					<span v-if="entry.action === CRAFT && entry.details" class="detail">
						{{ $t('main.history_crafted', [entry.details.quantity || 1]) }}
					</span>

					<!-- Alteration : dosage, metabolisme, recette consommee, gains, casse. -->
					<template v-else-if="entry.action === ALTER && entry.details">
						<span class="dose" :title="$t('main.alteration_dose')">{{ entry.details.dose }}</span>
						<!-- Metabolisme en %, du rouge (0, dosage hors sujet) au vert (100, le pic
						     exact) : c'est la mesure que le joueur suit pour trouver le dosage
						     optimal, un chiffre nu ne disait pas s'il chauffait. -->
						<span v-if="entry.details.metabolism !== undefined" class="metabolism"
							:style="{ color: metabolismColor(entry.details.metabolism) }"
							:title="$t('main.alteration_metabolism')">
							{{ Math.round(entry.details.metabolism) }} %
						</span>
						<!-- Chance de reussite qu'affichait la forge au moment du clic : c'est elle
						     qui dit si un echec etait un coup de malchance ou un pari a 3 %, et le
						     dosage seul ne le raconte pas. -->
						<span v-if="entry.details.probability !== undefined && entry.details.probability !== null" class="probability"
							:title="$t('main.alteration_success_chance')">
							{{ percent(entry.details.probability) }}
						</span>
						<!-- Les alterations reellement consommees, en vignettes : c'est la recette
						     que le joueur cherche a retrouver pour la rejouer. -->
						<span v-for="(count, id) in entry.details.recipe" :key="'u' + id" class="rendered-item alteration used" :title="alterationName(Number(id))">
							<img :src="alterationThumb(Number(id))" :alt="alterationName(Number(id))">
							<span v-if="count > 1" class="qty">×{{ count }}</span>
						</span>
						<!-- Les gains ne s'affichent qu'en cas de reussite : un echec ne modifie
						     rien. -->
						<template v-if="outcome(entry) === 'success'">
							<span v-for="r in entry.details.results" :key="r.carac" class="roll ok">
								<img class="ci" :src="'/image/charac/small/' + r.carac + '.png'">
								+{{ r.points }}
							</span>
						</template>
						<!-- Casse : elle se repartit unite par unite sur plusieurs caracs, on les
						     liste donc toutes. L'icone d'issue en tete de ligne porte deja le fait
						     qu'il y a eu casse. -->
						<span v-for="(lost, carac) in entry.details.broken" :key="'b' + carac" class="broken"
							:title="$t('characteristic.' + carac)">
							<img class="ci" :src="'/image/charac/small/' + carac + '.png'">
							−{{ lost }}
						</span>
					</template>

					<!-- Destruction : nombre de pieces detruites, alterations puis ressources rendues. -->
					<template v-else-if="entry.action === DESTROY && entry.details">
						<span v-if="entry.details.destroyed > 1" class="destroyed-count">×{{ entry.details.destroyed }}</span>
						<span v-for="(count, id) in entry.details.alterations" :key="'a' + id" class="rendered-item alteration" :title="alterationName(Number(id))">
							<img :src="alterationThumb(Number(id))" :alt="alterationName(Number(id))">
							<span v-if="count > 1" class="qty">×{{ count }}</span>
						</span>
						<span v-for="(count, id) in entry.details.resources" :key="'r' + id" class="rendered-item resource" :title="resourceName(Number(id))">
							<img :src="resourceThumb(Number(id))" :alt="resourceName(Number(id))">
							<span v-if="count > 1" class="qty">×{{ count }}</span>
						</span>
						<!-- Les Habs de la recette vont sur le compte, pas dans l'inventaire. -->
						<span v-if="entry.details.habs" class="rendered-item habs">
							<b>+{{ $filters.number(entry.details.habs) }}</b>
							<span class="hab"></span>
						</span>
						<span v-if="!hasRendered(entry)" class="nothing">{{ $t('main.destroy_nothing') }}</span>
					</template>

					<!-- Rééquilibrage d'une version (3.01) : trop chargée au nouveau barème, la pièce a
					     perdu des stats ajoutées, charge et remboursement à l'appui ; ou, en surnombre
					     sur son poireau, elle est revenue dans l'inventaire. -->
					<template v-else-if="entry.action === RESCALE && entry.details">
						<span class="detail">{{ $t('main.history_rescale', [entry.details.version]) }}</span>
						<span v-if="entry.details.reason === 'exception'" class="detail"
							:title="$t('main.loadout_skipped_reason_duplicate_exception_stat')">
							{{ $t('main.history_rescale_returned') }}
						</span>
						<template v-else>
							<span v-if="entry.details.charge" class="charge">{{ entry.details.charge.new }} % → {{ entry.details.charge.final }} %</span>
							<span v-for="(lost, carac) in entry.details.removed" :key="'rm' + carac" class="broken"
								:title="$t('characteristic.' + carac)">
								<img class="ci" :src="'/image/charac/small/' + carac + '.png'">
								−{{ lost }}
							</span>
							<span v-for="(count, id) in entry.details.refund?.alterations" :key="'ra' + id" class="rendered-item alteration" :title="alterationName(Number(id))">
								<img :src="alterationThumb(Number(id))" :alt="alterationName(Number(id))">
								<span v-if="count > 1" class="qty">×{{ count }}</span>
							</span>
							<span v-if="entry.details.refund?.habs" class="rendered-item habs">
								<b>+{{ $filters.number(entry.details.refund.habs) }}</b>
								<span class="hab"></span>
							</span>
						</template>
					</template>

					<span class="date">{{ formatDate(entry.date) }}</span>
				</div>
			</div>
			<div v-if="entries.length < total" class="more">
				<v-btn variant="text" size="small" :loading="loading" @click="loadMore">{{ $t('main.load_more') }}</v-btn>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { t } from '@/model/i18n'
	import { emitter } from '@/model/emitter'
	import { forgeComponent } from '@/model/forge-state'

	/**
	 * Historique d'atelier, pagine a la demande. Le serveur a depose dans `details`
	 * ce qui caracterise chaque action ; ce composant se contente de le mettre en forme.
	 *
	 * Deux portees, au choix du joueur (#12146) : tout l'atelier filtre par type d'action
	 * (item-history/get-all), ou la seule piece posee dans la forge, toutes actions
	 * confondues (item-history/get-item).
	 */
	const CRAFT = 1
	const ALTER = 2
	const DESTROY = 3
	const RESCALE = 5

	const props = defineProps<{
		/** 1 craft, 2 alteration, 3 destruction. */
		action: number
	}>()

	interface Entry {
		id: number
		action: number
		template: number | null
		item: number | null
		details: any
		date: number
	}

	const entries = ref<Entry[]>([])
	const total = ref(0)
	const page = ref(0)
	const loading = ref(false)

	/**
	 * Portée de la liste (#12146) : `item` = la seule pièce posée dans la forge, `all` =
	 * tout l'atelier, filtré par type d'action comme avant.
	 *
	 * Retenue d'une visite à l'autre, comme l'onglet et le lot de l'atelier : le joueur qui
	 * travaille pièce par pièce ne la règle qu'une fois.
	 */
	const scope = ref(localStorage.getItem('workshop/history-scope') === 'item' ? 'item' : 'all')
	/** Id de l'instance posée dans la forge, `null` si elle est vide (ou tient un craft). */
	const item = computed(() => forgeComponent.value?.id ?? null)

	function setScope(value: string) {
		if (scope.value === value) return
		scope.value = value
		localStorage.setItem('workshop/history-scope', value)
	}

	/**
	 * Issue d'une tentative d'alteration, en trois cas exclusifs : la piece a pris, la
	 * tentative a rate, ou elle a rate ET casse. La casse prime a l'affichage, c'est ce
	 * que le joueur cherche en parcourant son historique.
	 */
	const OUTCOME_ICONS: { [key: string]: string } = {
		success: 'mdi-check',
		fail: 'mdi-close',
		broken: 'mdi-image-broken-variant',
	}
	function outcome(entry: Entry): string {
		if (entry.details?.broken && Object.keys(entry.details.broken).length) return 'broken'
		const results = entry.details?.results
		return results && results.some((r: { success: boolean }) => r.success) ? 'success' : 'fail'
	}

	/**
	 * Teinte de fond d'une tentative d'alteration : vert si au moins un jet a reussi,
	 * rouge si tous ont echoue. Neutre pour les crafts et les destructions.
	 */
	function lineClass(entry: Entry): string {
		if (entry.action !== ALTER || !entry.details?.results) return ''
		return entry.details.results.some((r: { success: boolean }) => r.success) ? 'ok' : 'fail'
	}

	/**
	 * Une tentative dont on peut rejouer la recette : elle en porte une, non vide. Les
	 * crafts et les destructions n'en ont pas.
	 */
	function canReplay(entry: Entry): boolean {
		return entry.action === ALTER && !!entry.details?.recipe && Object.keys(entry.details.recipe).length > 0
	}

	/**
	 * Rejoue cette tentative dans la forge : sa recette, et la piece
	 * sur laquelle elle avait eu lieu si la forge est vide. La forge s'occupe du reste,
	 * elle seule sait ce qui y est pose et ce qui reste en stock.
	 */
	function replay(entry: Entry) {
		if (!canReplay(entry)) return
		emitter.emit('replay-recipe', { recipe: entry.details.recipe, item: entry.item })
	}

	/**
	 * Couleur du metabolisme, du rouge (0 %) au vert (100 %) en passant par l'orange :
	 * la teinte HSL va de 0 a 120 degres. La clarte suit le theme, sinon le rouge sombre
	 * devient illisible sur fond noir.
	 */
	function metabolismColor(m: number): string {
		const clamped = Math.max(0, Math.min(100, m))
		return 'hsl(' + Math.round(clamped * 1.2) + ', 70%, ' + (LeekWars.darkMode ? 58 : 38) + '%)'
	}

	/**
	 * Chance de reussite de la tentative, en pourcentage (#12146).
	 *
	 * Meme regle que la forge (cf. forge-stats) : deux chiffres significatifs sous 10 %.
	 * Une tentative se joue parfois a moins de 0,01 %, et l'arrondir a « 0 % » la ferait passer pour
	 * impossible — or c'est justement ce genre de ligne qu'on relit dans l'historique.
	 */
	function percent(p: number): string {
		const v = Math.max(0, p) * 100
		if (v <= 0) return '0 %'
		if (v >= 9.95) return Math.round(v) + ' %'
		const digits = Math.min(10, Math.max(0, Math.ceil(-Math.log10(v))) + 1)
		return v.toFixed(digits) + ' %'
	}

	function formatDate(ts: number): string {
		return LeekWars.formatDateTime(ts)
	}
	function itemName(template: number | null): string {
		if (!template) return ''
		const item = LeekWars.items[template]
		return item ? t('component.' + item.name) : '#' + template
	}
	function thumbUrl(template: number): string {
		const item = LeekWars.items[template]
		return item ? '/image/component/' + item.name + '.png' : ''
	}
	function alteration(id: number) {
		return LeekWars.alterations ? LeekWars.alterations.alterations[id] : null
	}
	function alterationThumb(id: number): string {
		const a = alteration(id)
		return a ? '/image/alteration/' + a.name + '.png' : ''
	}
	function alterationName(id: number): string {
		const a = alteration(id)
		return a ? t('alteration.' + a.name) : ''
	}
	function resourceThumb(template: number): string {
		const item = LeekWars.items[template]
		return item ? '/image/resource/' + item.name + '.png' : ''
	}
	function resourceName(template: number): string {
		const item = LeekWars.items[template]
		return item ? t('resource.' + item.name) : ''
	}
	/** Vrai si la destruction a rendu quoi que ce soit (alteration, ressource ou Habs). */
	function hasRendered(entry: Entry): boolean {
		const d = entry.details
		return !!d && ((d.count > 0) || (d.resources && Object.keys(d.resources).length > 0) || d.habs > 0)
	}

	/**
	 * Charge une page.
	 *
	 * Un JETON plutot qu'un verrou sur `loading` : changer de portee pendant qu'une requete
	 * est en vol doit REMPLACER la liste demandee, la ou un verrou laissait tomber la
	 * seconde demande et affichait donc l'historique de l'onglet qu'on venait de quitter.
	 * Seule la reponse du dernier appel est retenue.
	 */
	let token = 0
	function load(reset: boolean) {
		// Portee « cette piece » sans piece posee : rien a demander, et surtout pas
		// l'historique complet, que le joueur lirait comme celui de sa piece.
		if (scope.value === 'item' && item.value === null) {
			++token
			entries.value = []
			total.value = 0
			page.value = 0
			loading.value = false
			return
		}
		const current = ++token
		loading.value = true
		if (reset) {
			entries.value = []
			page.value = 0
		}
		const next = page.value + 1
		const url = scope.value === 'item'
			? 'item-history/get-item/' + item.value + '/' + next
			: 'item-history/get-all/' + props.action + '/' + next
		LeekWars.get<{ history: Entry[], total: number, page: number }>(url).then(data => {
			if (current !== token) return
			entries.value = reset ? data.history : entries.value.concat(data.history)
			total.value = data.total
			page.value = data.page
		}).finally(() => { if (current === token) loading.value = false })
	}
	function loadMore() {
		if (loading.value) return
		load(false)
	}

	// Une action d'atelier vient d'avoir lieu : on recharge pour la montrer tout de suite en
	// tete de liste. Sur une piece, TOUTE action compte : sa liste ne filtre pas par
	// type, et c'est souvent l'action qu'on vient de faire qu'on y cherche.
	function onWorkshopAction(action: number) {
		if (scope.value === 'item' || action === props.action) load(true)
	}

	onMounted(() => {
		load(true)
		emitter.on('workshop-action', onWorkshopAction)
	})
	onBeforeUnmount(() => emitter.off('workshop-action', onWorkshopAction))
	// Changer d'onglet, de portee ou de piece posee recharge la bonne liste. La piece posee
	// peut aussi changer d'id sous nos pieds : c'est bien la nouvelle ligne qu'il faut suivre.
	watch([() => props.action, scope, item], () => load(true))
</script>

<style lang="scss" scoped>
	.item-history {
		height: 100%;
		overflow-y: auto;
	}
	// Petit titre au-dessus de la liste, et la portee a l'autre bout (#12146).
	.history-header {
		display: flex;
		// `stretch` et non `center` : les portees occupent toute la hauteur de la barre,
		// pour que leur trait tombe AU BAS de celle-ci et non sous leur texte — un trait a
		// mi-hauteur ne se lit pas comme un onglet.
		align-items: stretch;
		// La colonne de l'historique retrecit avec la fenetre (flex: 1 1 340px cote page) :
		// passe une certaine etroitesse, les portees passent sous le titre plutot que de
		// deborder du panneau.
		flex-wrap: wrap;
		gap: 6px;
		// Aucun interieur en bas : c'est la portee active qui va y poser son trait.
		padding: 6px 8px 0;
		font-size: 12px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-color-secondary);
	}
	// Le titre garde son centrage vertical : l'etirement ne vaut que pour les onglets.
	.title {
		display: flex;
		align-items: center;
		padding-bottom: 4px;
	}
	// Les deux portees, en jetons discrets a droite du titre : c'est un reglage de lecture,
	// pas la navigation de l'atelier, qui a deja ses onglets juste au-dessus. Elles se
	// replient sous le titre quand la colonne est etroite.
	.scopes {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-left: auto;
		// Sans lui, la boite garde la largeur de ses deux jetons cote a cote et deborde du
		// panneau avant de se replier.
		min-width: 0;
	}
	.scope {
		display: flex;
		align-items: center;
		// Le bas de la boite touche le bas de la barre, ou se pose le trait ; les 4 px
		// separent le texte du trait, comme sur les onglets de l'atelier.
		padding: 0 6px 4px;
		border-radius: var(--radius) var(--radius) 0 0;
		cursor: pointer;
		white-space: nowrap;
		// Casse normale, comme les onglets de l'atelier : les capitales et leur
		// interlettrage sont le traitement du TITRE a cote, pas celui d'un onglet.
		text-transform: none;
		letter-spacing: normal;
		&:hover { background: var(--background-secondary); }
		// Encre de marque ET trait du dessous, exactement comme les onglets de l'atelier
		// juste au-dessus : un aplat de marque ferait un deuxieme niveau de navigation la
		// ou il n'y a qu'un reglage de lecture.
		&.active {
			color: var(--primary);
			box-shadow: inset 0 -2px 0 var(--primary);
		}
	}
	.empty {
		padding: 20px;
		text-align: center;
		color: var(--text-color-secondary);
	}
	.entry {
		border-bottom: 1px solid var(--border);
	}
	// Une seule ligne compacte par entree : tout aligne horizontalement, la date
	// poussee a droite. flex-wrap n'est qu'un filet pour les entrees tres chargees.
	.line {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px 6px;
		padding: 3px 8px;
	}
	// Teinte discrete selon l'issue d'une tentative.
	.line.ok { background: rgba(94, 173, 27, 0.12); }
	.line.fail { background: rgba(198, 40, 40, 0.10); }
	// Ligne rejouable : le survol l'annonce par un simple assombrissement, sans liseré —
	// la teinte d'issue de la ligne (verte ou rouge) doit rester lisible dessous.
	.line.replayable {
		cursor: pointer;
		&:hover { box-shadow: inset 0 0 0 999px rgba(0, 0, 0, 0.04); }
	}
	body.dark .line.replayable:hover { box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0.06); }
	.thumb {
		width: 28px;
		height: 28px;
		flex: 0 0 auto;
		// Les images d'items ne sont pas toujours carrees : contain evite l'ecrasement.
		object-fit: contain;
	}
	// Le nom de la piece vit dans le title de la vignette : la ligne montre la recette
	// et le resultat.
	.date {
		margin-left: auto;
		padding-left: 6px;
		font-size: 11px;
		color: var(--text-color-secondary);
		white-space: nowrap;
	}
	.detail {
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.roll {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.roll.ok { color: #2e7d32; font-weight: bold; }
	// Icone d'issue, en tete de ligne : le seul marqueur de reussite / echec / casse.
	// L'echec passe au rouge ; la casse garde son icone propre.
	.outcome {
		flex-shrink: 0;
		&.success { color: #2e7d32; }
		&.fail { color: #c62828; }
		&.broken { color: #c62828; }
		&.rescale { color: var(--text-color-secondary); }
	}
	.ci { width: 15px; height: 15px; }
	// Dosage : petit jeton discret. Largeur fixe et chiffres tabulaires : sur une
	// colonne d'historique, "5" et "127" n'ont pas la meme largeur naturelle, et le
	// jeton comme le pourcentage juste a cote sautilleraient d'une ligne a l'autre.
	//
	// En PIXELS et non en `ch` : le site est en `box-sizing: border-box`, donc un
	// `min-width` en ch compte le padding DANS ces caracteres — a 3ch (~20px) moins
	// les 10px de padding, il ne reste la place que pour UN chiffre. 32px mesure
	// exactement (police Inter) la largeur du jeton au dosage max du jeu (3 chiffres),
	// sans marge inutile pour les dosages courts.
	.dose {
		flex: 0 0 auto;
		min-width: 32px;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		text-align: center;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
		border-radius: var(--radius);
		padding: 0 5px;
	}
	// Metabolisme mesure a cette tentative : information de reglage, donc discret.
	// Meme largeur fixe que le dosage (en px, meme raison), alignee a droite : c'est
	// le % qui doit tomber au meme endroit d'une ligne a l'autre, pas le chiffre qui
	// le precede. 36px mesure (meme rendu hors-ligne) la largeur de "100 %", la
	// valeur la plus large possible.
	.metabolism {
		flex: 0 0 auto;
		min-width: 36px;
		font-size: 12px;
		color: var(--text-color-secondary);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	// Chance de reussite de la tentative, juste apres le metabolisme (#12146). Encre
	// secondaire et pas de couleur : le metabolisme a deja la sienne, et c'est l'icone
	// d'issue en tete de ligne qui dit si le pari est passe. Largeur fixe comme ses
	// voisins, pour que les colonnes ne sautillent pas d'une ligne a l'autre ; 44px
	// mesure la valeur la plus large que la forge sache produire.
	.charge {
		flex: 0 0 auto;
		font-size: 12px;
		color: var(--text-color-secondary);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.probability {
		flex: 0 0 auto;
		min-width: 44px;
		font-size: 12px;
		color: var(--text-color-secondary);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.broken { color: #c62828; display: inline-flex; align-items: center; gap: 1px; font-size: 12px; }
	.rendered-item {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		.qty { font-size: 12px; color: var(--text-color-secondary); }
	}
	// contain : garder les proportions des vignettes rendues.
	.rendered-item img { object-fit: contain; }
	.rendered-item.alteration img { width: 30px; height: 30px; }
	// Alterations CONSOMMEES par une tentative : plus petites que celles rendues par un
	// recyclage, la ligne d'alteration porte deja les gains et la casse.
	.rendered-item.alteration.used img { width: 22px; height: 22px; }
	.rendered-item.resource img { width: 24px; height: 24px; }
	// Habs rendus : le chiffre porte le gain, la piece le nomme.
	.rendered-item.habs { gap: 3px; color: var(--text-color); }
	.rendered-item.habs .hab { width: 16px; height: 16px; background-size: 16px; }
	.nothing { font-style: italic; color: var(--text-color-secondary); font-size: 13px; }
	// Nombre de pieces detruites d'un coup.
	.destroyed-count { font-weight: bold; color: var(--text-color-secondary); }
	.more { text-align: center; padding: 6px; }
</style>
