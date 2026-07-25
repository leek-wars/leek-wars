<template>
	<div class="item-history">
		<div class="history-header">{{ $t('main.history') }}</div>
		<loader v-if="loading && !entries.length" />
		<div v-else-if="!entries.length" class="empty">{{ $t('main.history_empty') }}</div>
		<div v-else class="entries">
			<div v-for="entry in entries" :key="entry.id" class="entry">
				<!-- Une seule ligne : vignette, nom, contenu de l'action, puis la date a droite (#622). -->
				<div class="line" :class="lineClass(entry)">
					<img v-if="entry.template" class="thumb" :src="thumbUrl(entry.template)" :alt="itemName(entry.template)">
					<span class="name">{{ itemName(entry.template) }}</span>

					<!-- Craft : ce qui a ete fabrique. -->
					<span v-if="entry.action === CRAFT && entry.details" class="detail">
						{{ $t('main.history_crafted', [entry.details.quantity || 1]) }}
					</span>

					<!-- Alteration : issue, recette consommee, gains, dosage, metabolisme, casse. -->
					<template v-else-if="entry.action === ALTER && entry.details">
						<!-- Une seule icone d'issue, en tete de ligne : reussite, echec ou casse.
						     Elle remplace la croix posee au milieu des gains et le coeur brise de
						     la casse, qui se lisaient mal et faisaient deux marqueurs pour une
						     seule information (#622). -->
						<v-icon class="outcome" :class="outcome(entry)" size="17">{{ OUTCOME_ICONS[outcome(entry)] }}</v-icon>
						<!-- Les alterations reellement consommees, en vignettes : c'est la recette
						     que le joueur cherche a retrouver pour la rejouer (#622). -->
						<span v-for="(count, id) in entry.details.recipe" :key="'u' + id" class="rendered-item alteration used" :title="alterationName(Number(id))">
							<img :src="alterationThumb(Number(id))" :alt="alterationName(Number(id))">
							<span v-if="count > 1" class="qty">×{{ count }}</span>
						</span>
						<!-- Les gains ne s'affichent qu'en cas de reussite : un echec ne modifie
						     rien, une carac barree laissait croire le contraire (#622). -->
						<template v-if="outcome(entry) === 'success'">
							<span v-for="r in entry.details.results" :key="r.carac" class="roll ok">
								<img class="ci" :src="'/image/charac/small/' + r.carac + '.png'">
								+{{ r.points }}
							</span>
						</template>
						<span class="dose" :title="$t('main.alteration_dose')">{{ entry.details.dose }}</span>
						<!-- Metabolisme en %, du rouge (0, dosage hors sujet) au vert (100, le pic
						     exact) : c'est la mesure que le joueur suit pour trouver le dosage
						     optimal, un chiffre nu ne disait pas s'il chauffait (#622). -->
						<span v-if="entry.details.metabolism !== undefined" class="metabolism"
							:style="{ color: metabolismColor(entry.details.metabolism) }"
							:title="$t('main.alteration_metabolism')">
							{{ Math.round(entry.details.metabolism) }} %
						</span>
						<!-- Casse : on montre QUELLE carac a saute, l'icone d'issue en tete de
						     ligne portant deja le fait qu'il y a eu casse (#622). -->
						<span v-if="entry.details.broken" class="broken"
							:title="$t('characteristic.' + entry.details.broken.carac)">
							<img class="ci" :src="'/image/charac/small/' + entry.details.broken.carac + '.png'">
							−{{ entry.details.broken.lost }}
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
						<span v-if="!hasRendered(entry)" class="nothing">{{ $t('main.destroy_nothing') }}</span>
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
	import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { t } from '@/model/i18n'
	import { emitter } from '@/model/vue'

	/**
	 * Historique d'atelier (#622), filtre par type d'action. Lit item-history/get-all,
	 * pagine a la demande. Le serveur a depose dans `details` ce qui caracterise chaque
	 * action ; ce composant se contente de le mettre en forme.
	 */
	const CRAFT = 1
	const ALTER = 2
	const DESTROY = 3

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
	 * Issue d'une tentative d'alteration, en trois cas exclusifs : la piece a pris, la
	 * tentative a rate, ou elle a rate ET casse. La casse prime a l'affichage, c'est ce
	 * que le joueur cherche en parcourant son historique (#622).
	 */
	const OUTCOME_ICONS: { [key: string]: string } = {
		success: 'mdi-check',
		fail: 'mdi-close',
		broken: 'mdi-image-broken-variant',
	}
	function outcome(entry: Entry): string {
		if (entry.details?.broken) return 'broken'
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
	 * Couleur du metabolisme, du rouge (0 %) au vert (100 %) en passant par l'orange :
	 * la teinte HSL va de 0 a 120 degres. La clarte suit le theme, sinon le rouge sombre
	 * devient illisible sur fond noir.
	 */
	function metabolismColor(m: number): string {
		const clamped = Math.max(0, Math.min(100, m))
		return 'hsl(' + Math.round(clamped * 1.2) + ', 70%, ' + (LeekWars.darkMode ? 58 : 38) + '%)'
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
	/** Vrai si la destruction a rendu quoi que ce soit (alteration ou ressource). */
	function hasRendered(entry: Entry): boolean {
		const d = entry.details
		return !!d && ((d.count > 0) || (d.resources && Object.keys(d.resources).length > 0))
	}

	function load(reset: boolean) {
		if (loading.value) return
		loading.value = true
		if (reset) {
			entries.value = []
			page.value = 0
		}
		const next = page.value + 1
		LeekWars.get<{ history: Entry[], total: number, page: number }>('item-history/get-all/' + props.action + '/' + next).then(data => {
			entries.value = reset ? data.history : entries.value.concat(data.history)
			total.value = data.total
			page.value = data.page
		}).finally(() => { loading.value = false })
	}
	function loadMore() {
		load(false)
	}

	// Une action d'atelier du meme type vient d'avoir lieu : on recharge pour la
	// montrer tout de suite en tete de liste (#622).
	function onWorkshopAction(action: number) {
		if (action === props.action) load(true)
	}

	onMounted(() => {
		load(true)
		emitter.on('workshop-action', onWorkshopAction)
	})
	onBeforeUnmount(() => emitter.off('workshop-action', onWorkshopAction))
	// Changer d'onglet recharge l'historique du bon type.
	watch(() => props.action, () => load(true))
</script>

<style lang="scss" scoped>
	.item-history {
		height: 100%;
		overflow-y: auto;
	}
	// Petit titre au-dessus de la liste (#622).
	.history-header {
		padding: 6px 8px 4px;
		font-size: 12px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-color-secondary);
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
	// Teinte discrete selon l'issue d'une tentative (#622).
	.line.ok { background: rgba(94, 173, 27, 0.12); }
	.line.fail { background: rgba(198, 40, 40, 0.10); }
	.thumb {
		width: 28px;
		height: 28px;
		flex: 0 0 auto;
		// Les images d'items ne sont pas toujours carrees : contain evite l'ecrasement.
		object-fit: contain;
	}
	// Nom reduit : la ligne doit surtout montrer les vignettes des alterations
	// consommees et le resultat, le nom de la piece n'est qu'un reperage (#622).
	.name { font-weight: bold; white-space: nowrap; font-size: 12px; }
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
	.outcome {
		flex-shrink: 0;
		&.success { color: #2e7d32; }
		&.fail { color: var(--text-color-secondary); }
		&.broken { color: #c62828; }
	}
	.ci { width: 15px; height: 15px; }
	// Dosage : petit jeton discret.
	.dose {
		font-size: 12px;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
		border-radius: 4px;
		padding: 0 5px;
	}
	// Metabolisme mesure a cette tentative : information de reglage, donc discret.
	.metabolism {
		font-size: 12px;
		color: var(--text-color-secondary);
		font-variant-numeric: tabular-nums;
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
	// recyclage, la ligne d'alteration porte deja les gains et la casse (#622).
	.rendered-item.alteration.used img { width: 22px; height: 22px; }
	.rendered-item.resource img { width: 24px; height: 24px; }
	.nothing { font-style: italic; color: var(--text-color-secondary); font-size: 13px; }
	// Nombre de pieces detruites d'un coup (#622).
	.destroyed-count { font-weight: bold; color: var(--text-color-secondary); }
	.more { text-align: center; padding: 6px; }
</style>
