<template>
	<div class="live-widget">
		<loader v-if="!loaded || !translated" />
		<div v-else-if="shownEvents.length" ref="eventsEl" class="events">
			<!-- Témoin de mesure : la liste entière rendue hors du flux, chaque ligne à
				 sa hauteur NATURELLE (les vraies s'étirent pour remplir le panneau, on
				 ne peut donc rien mesurer sur elles sans que la mesure dépende de ce
				 qu'on vient de décider). C'est lui qui dit combien il en tient, ligne
				 par ligne : une seule ligne de texte long ne doit pas coûter une
				 deuxième ligne à toutes les autres. Hors du flux, ses hauteurs ne
				 dépendent que de la largeur, jamais du nombre de lignes affichées —
				 sans quoi la mesure se mordrait la queue. Les images n'y sont pas
				 rendues (des cadres vides de même encombrement), seul le texte décide
				 du retour à la ligne. -->
			<div class="probe-list" aria-hidden="true">
				<!-- L'observateur est sur les rangées et non sur le cadre, qui est de
					 hauteur nulle : c'est leur somme qui bouge quand le texte change (les
					 traductions arrivent après le premier rendu, et la ligne qui tenait
					 sur une ligne en prend alors deux). -->
				<div ref="probeEl" class="probe-rows">
					<div v-for="event in shownEvents" :key="eventKey(event)" class="event probe">
						<div class="event-avatar"></div>
						<div class="event-body">
							<div class="text"><span v-if="event.farmer" class="farmer">{{ event.farmer.name }}</span>{{ probeText(event) }}<span v-if="eventLink(event)" class="topic">{{ eventLink(event)!.label }}</span></div>
							<div class="date">&nbsp;</div>
						</div>
						<div v-if="eventImage(event)" class="event-trophy"></div>
					</div>
				</div>
			</div>
			<!-- `transition-group` sans `tag` ne pose aucun élément : les lignes sont
				 les enfants directs de `.events`, que useFitCount mesure. -->
			<transition-group name="event">
				<!-- Hauteur naturelle pas encore mesurée : on ne pose pas la variable et
					 la rangée garde sa hauteur de contenu — la poser à zéro les
					 écraserait toutes, `flex-basis` valant zéro lui aussi. -->
				<div v-for="(event, index) in visibleEvents" :key="eventKey(event)" class="event" :style="rowHeights[index] ? { '--row-height': rowHeights[index] + 'px' } : undefined">
					<!-- L'avatar dit QUI, la pastille dit QUOI (toujours une icône générique),
						 et l'image en bout de ligne dit LEQUEL (le trophée, l'emblème).
						 Les événements du jeu — le trèfle, les tournois, les arènes — n'ont
						 pas d'auteur : leur glyphe prend toute la place de l'avatar. -->
					<router-link v-if="event.farmer" :to="'/farmer/' + event.farmer.id" class="event-avatar">
						<avatar :farmer="(event.farmer as any)" />
						<v-icon class="badge">{{ badgeIcon(event) }}</v-icon>
					</router-link>
					<div v-else class="event-avatar game">
						<v-icon>{{ badgeIcon(event) }}</v-icon>
					</div>
					<div class="event-body">
						<!-- Deux lignes au plus, et l'infobulle native pour le reste. -->
						<div class="text" :title="eventText(event)">
							<!-- L'aperçu de l'éleveur au survol de son nom, comme partout ailleurs
								 sur le site. Le rich-tooltip pose un <span> en ligne
								 autour du lien : rien qui change la hauteur de la rangée, que le
								 témoin ci-dessus mesure sans lui. -->
							<rich-tooltip-farmer v-if="event.farmer" :id="event.farmer.id" v-slot="{ props }" :bottom="true">
								<router-link v-bind="props" :to="'/farmer/' + event.farmer.id" class="farmer">{{ event.farmer.name }}</router-link>
							</rich-tooltip-farmer>
							<!-- Espaces explicites : le mode condense de Vue avale l'espace de tête -->
							{{ eventSentence(event) }}
							<router-link v-if="eventLink(event)" :to="eventLink(event)!.to" class="topic">{{ eventLink(event)!.label }}</router-link>
						</div>
						<div class="date">{{ $filters.duration(event.date) }}</div>
					</div>
					<router-link v-if="event.type === 'trophy' && event.trophy" :to="'/trophy/' + event.trophy" class="event-trophy">
						<trophy-icon :code="event.trophy" />
					</router-link>
					<router-link v-else-if="event.type === 'emblem' && event.team" :to="'/team/' + event.team.id" class="event-trophy">
						<emblem :team="(event.team as any)" />
					</router-link>
				</div>
			</transition-group>
		</div>
		<!-- Vide parce qu'il ne s'est rien passé, ou vide parce qu'on a tout
			décoché : ce n'est pas la même chose à lire. -->
		<div v-else class="none">{{ events.length && hiddenList.length ? t('empty_filtered') : t('empty') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
	import { emitter } from '@/model/emitter'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { socketRef, socketResubscribe } from '@/model/socket-subscription'
	import { type LiveCategory, hiddenCategories, isEventVisible } from '@/component/live/live-filters'
	import { store } from '@/model/store'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { mixins, t as globalT, useNamespacedT } from '@/model/i18n'

	// Le panneau vit sur l'accueil (widget « En direct ») et sur la page d'équipe
	// (« En direct sur <équipe> ») : il porte donc son propre namespace i18n, que
	// le mixin charge à la demande, plutôt que les clés de l'une des deux pages.
	defineOptions({ name: 'Live', i18n: {}, mixins: [...mixins] })

	const props = withDefaults(defineProps<{
		/**
		 * Le panneau regardé : 0 (par défaut) pour l'accueil, c'est-à-dire tout le
		 * site, ou l'id d'une équipe pour restreindre la timeline à ses membres.
		 * C'est aussi l'identifiant de l'abonnement sur le websocket.
		 */
		team?: number
		/** Les catégories masquées de CE panneau ; à défaut, le filtre commun. */
		hidden?: LiveCategory[]
	}>(), {
		team: 0,
		hidden: undefined,
	})

	const hiddenList = computed(() => props.hidden ?? hiddenCategories.value)

	const t = useNamespacedT('live')

	/*
	 * Les paramètres interpolés sont échappés en HTML par défaut (escapeParameter,
	 * défense XSS des messages rendus en `v-html`). Le panneau, lui, rend du
	 * TEXTE : sans cette option, « Chérie, j'ai rétréci le poireau » sort en
	 * « Chérie, j&apos;ai rétréci le poireau » — et de même pour tout nom de trophée
	 * ou de classement à apostrophe (« Nombre d'alliés tués »). Rien d'utilisateur
	 * n'entre ici : les paramètres sont des traductions et des nombres, le nom de
	 * l'éleveur est posé par le gabarit, jamais par un message.
	 */
	const TEXT = { escapeParameter: false }

	const METRIC_ICONS: Record<string, string> = {
		victories: 'mdi-sword-cross',
		bosses: 'mdi-crown',
		tournaments: 'mdi-tournament',
	}

	// Un type d'événement = un glyphe, et le même partout. L'avatar et
	// l'emblème partagent le leur : ce qui vient de changer est une IMAGE, que ce
	// soit celle d'un éleveur ou celle d'une équipe.
	const TYPE_ICONS: Record<string, string> = {
		trophy: 'mdi-trophy',
		rank: 'mdi-podium',
		topic: 'mdi-forum',
		leek: 'mdi-leek',
		team: 'mdi-shield',
		anniversary: 'mdi-cake-variant',
		avatar: 'mdi-image-edit',
		emblem: 'mdi-image-edit',
		clover: 'mdi-clover',
		tournaments: 'mdi-tournament',
		tournaments_start: 'mdi-tournament',
		tournaments_round: 'mdi-tournament',
		// Une victoire en tournoi est une RÉCOMPENSE, et prend la coupe : c'est
		// l'exception à la règle « un concept, un glyphe », et elle vaut aussi ici.
		tournament_winners: 'mdi-trophy',
		arena: 'mdi-stadium',
	}

	// La pastille de l'avatar ne dit plus que la NATURE de l'événement : l'image du
	// trophée, qui disait laquelle, est passée en bout de ligne où elle se voit.
	// Trophée plein contre trophée en contour, qui appartient déjà aux tournois.
	function badgeIcon(event: LiveEvent): string {
		if (event.type === 'threshold') return METRIC_ICONS[event.metric ?? ''] || 'mdi-podium'
		return TYPE_ICONS[event.type] || 'mdi-star'
	}

	/*
	 * La phrase d'une ligne, SANS le nom de l'éleveur (que le gabarit pose en lien)
	 * et sans l'entité de fin de phrase (idem) : un seul endroit décide de ce que
	 * dit chaque type, pour la vraie ligne, pour le témoin de mesure et pour
	 * l'infobulle.
	 *
	 * Les espaces sont explicites : le mode condense de Vue avale celui de tête, et
	 * la phrase se colle au nom qui la précède.
	 */
	function eventSentence(event: LiveEvent): string {
		const sentence = (() => {
			switch (event.type) {
				case 'trophy': return t('event_trophy', [globalT('trophy.' + event.trophy)], TEXT)
				case 'threshold': return t('event_' + event.metric, [LeekWars.formatNumber(event.threshold!)], TEXT)
				case 'rank': return t('event_rank', [String(event.rank), t('rank_' + event.metric)], TEXT)
				case 'topic': return t('event_topic')
				case 'leek': return t('event_leek')
				case 'team': return t('event_team')
				case 'emblem': return t('event_emblem')
				case 'avatar': return t('event_avatar')
				case 'anniversary': return t('event_anniversary', [String(event.years)], TEXT)
				// Les événements du jeu n'ont pas d'auteur : leur phrase se suffit, et
				// le compte y décide de la formule (zéro, un, plusieurs).
				case 'clover': return cloverSentence(event.count ?? 0)
				// `tournaments` : l'ancienne annonce, faite au LANCEMENT d'une vague. Le
				// rendu reste tant que le serveur peut encore en servir.
				case 'tournaments': return t('event_tournaments_' + (event.tournament_type ?? 'solo'), [LeekWars.formatNumber(event.count ?? 0)], TEXT)
				case 'tournaments_start': return t('event_tournaments_start_' + (event.tournament_type ?? 'solo'), [
					LeekWars.formatNumber(event.count ?? 0), LeekWars.formatNumber(event.contestants ?? 0)], TEXT)
				// La finale ne dit pas « combien restent » — il reste les vainqueurs, et
				// ce sont EUX qu'on nomme, dans une ligne à part (type tournament_winners).
				case 'tournaments_round': return t('event_tournaments_round_' + (event.tournament_type ?? 'solo'), [
					t('round_' + (event.round ?? 'finals')), LeekWars.formatNumber(event.remaining ?? 0)], TEXT)
				case 'tournament_winners': return t('event_tournament_winners_' + (event.tournament_type ?? 'solo'), [
					(event.winners ?? []).join(', ')], TEXT)
				case 'arena': return t(event.count === 1 ? 'event_arena_one' : 'event_arena', [
					LeekWars.formatNumber(event.count ?? 0), LeekWars.formatNumber(event.participants ?? 0)], TEXT)
			}
			// Type inconnu (serveur plus récent que ce client) : la ligne existe, mais
			// on ne sait pas la dire. Mieux vaut l'avaler que d'afficher une clé brute.
			return ''
		})()
		// Pas d'auteur devant : la phrase commence la ligne.
		return event.farmer ? ' ' + sentence : sentence
	}

	function cloverSentence(count: number): string {
		if (count === 0) return t('event_clover_none')
		if (count === 1) return t('event_clover_one')
		return t('event_clover', [LeekWars.formatNumber(count)], TEXT)
	}

	/*
	 * L'entité nommée qui termine la phrase, quand il y en a une : elle est en gras
	 * et cliquable, et c'est elle que l'ellipse coupe en premier — d'où l'infobulle.
	 */
	function eventLink(event: LiveEvent): { to: string, label: string } | null {
		if (event.type === 'topic' && event.topic) {
			return { to: '/forum/category-' + event.topic.category + '/topic-' + event.topic.id, label: event.topic.title }
		}
		if (event.type === 'leek' && event.leek) {
			return { to: '/leek/' + event.leek.id, label: event.leek.name }
		}
		if ((event.type === 'team' || event.type === 'emblem') && event.team) {
			return { to: '/team/' + event.team.id, label: event.team.name }
		}
		return null
	}

	// Une image en bout de ligne : le trophée décerné, l'emblème qui vient de
	// changer. Le témoin doit lui réserver la même place, c'est autant de largeur
	// en moins pour le texte.
	function eventImage(event: LiveEvent): boolean {
		return (event.type === 'trophy' && !!event.trophy) || (event.type === 'emblem' && !!event.team)
	}

	// La phrase entière, pour l'infobulle native de la ligne : ce que l'ellipse
	// coupe est justement ce qui compte (le nom du trophée, le titre du sujet),
	// et il est toujours en bout de phrase.
	function eventText(event: LiveEvent): string {
		const link = eventLink(event)
		return (event.farmer ? event.farmer.name : '') + eventSentence(event) + (link ? ' ' + link.label : '')
	}

	// Le texte du témoin : le même que la vraie ligne, aux mêmes endroits en gras,
	// donc les mêmes retours à la ligne. L'entité de fin est posée par le gabarit,
	// comme dans la vraie ligne — ici on ne rend que l'espace qui la précède.
	function probeText(event: LiveEvent): string {
		return eventSentence(event) + (eventLink(event) ? ' ' : '')
	}

	interface LiveEvent {
		type: string
		// Id de la ligne du journal, pour les types qui y vivent : c'est
		// l'identité que le direct et le rechargement HTTP partagent.
		id?: number
		date: number
		farmer?: { id: number, name: string, avatar_changed: number }
		trophy?: string
		rarity?: number
		metric?: string
		threshold?: number
		rank?: number
		years?: number
		count?: number
		participants?: number
		contestants?: number
		remaining?: number
		round?: string
		winners?: string[]
		tournament_type?: string
		leek?: { id: number, name: string }
		team?: { id: number, name: string, emblem_changed: number }
		topic?: { id: number, title: string, category: number }
	}

	// Même plafond que le chargement HTTP : la liste poussée ne peut pas
	// grossir indéfiniment dans un onglet laissé ouvert. Large devant la douzaine
	// de lignes affichées, parce que le filtre par catégorie puise dedans : coupée
	// à quarante, une soirée à gros débit de trophées ne laisserait rien à voir à
	// qui les a décochés.
	const MAX_EVENTS = 80

	/*
	 * Identité d'un événement, pour ne pas l'afficher deux fois. Les deux sources
	 * se recouvrent forcément : entre le moment où la requête HTTP part et celui
	 * où sa réponse arrive, le websocket a pu pousser les mêmes lignes.
	 *
	 * Tout ce qui vient du journal porte son id de ligne, et c'est la clé la plus
	 * sûre qui soit. Les deux sources qui n'y sont pas — les trophées et les
	 * sujets — se reconnaissent à ce
	 * qu'elles ont d'unique : un éleveur ne débloque un trophée donné qu'une fois,
	 * et un sujet a un id.
	 */
	function eventKey(event: LiveEvent): string {
		if (event.id) return 'e' + event.id
		if (event.type === 'trophy') return 'y' + event.farmer!.id + ':' + event.trophy
		if (event.type === 'topic') return 'p' + event.topic!.id
		return event.type + ':' + event.date + ':' + (event.farmer ? event.farmer.id : 0)
	}

	const loaded = ref(false)
	const events = ref<LiveEvent[]>([])

	/*
	 * Les traductions du panneau arrivent par import dynamique : il n'est pas une
	 * page, personne n'attache ses messages avant son montage, et `t` rend la clé
	 * brute le temps que le module arrive. Or `event_trophy` est bien plus court
	 * que la phrase qu'il remplace : le témoin mesurerait une ligne là où il en
	 * faut deux, on afficherait une ligne de trop, et on la verrait disparaître
	 * une fraction de seconde plus tard — le clignotement au chargement.
	 * On attend donc la phrase. Garde-fou : si elle ne venait jamais (locale sans
	 * fichier), le panneau resterait sur son chargeur, on le débloque.
	 */
	const translationTimeout = ref(false)
	const translationTimer = setTimeout(() => { translationTimeout.value = true }, 3000)
	const translated = computed(() => translationTimeout.value || t('event_trophy', ['']) !== 'event_trophy')

	// Hauteur naturelle de chaque ligne chargée, dans l'ordre : les lignes
	// s'étirent ensuite pour remplir le panneau, mais ce sont celles-ci qui
	// décident combien il en tient (cf. les autres widgets de l'accueil). Elles ne
	// sont ni constantes ni égales entre elles — 42 px avec le texte sur une
	// ligne, 59 sur deux, selon la longueur du texte ET la largeur du panneau —,
	// d'où le témoin. Vide tant qu'il n'a pas été mesuré.
	const rowHeights = ref<number[]>([])
	const probeEl = ref<HTMLElement | null>(null)

	// Le panneau ne défile pas : on montre les N plus récents que la hauteur
	// permet, jamais une ligne coupée. Sur la page d'équipe, où le panneau prend la
	// hauteur de son contenu tant qu'il n'a pas atteint son maximum, le compte se
	// pose de lui-même sur « tout ce qui est chargé ».
	const eventsEl = ref<HTMLElement | null>(null)
	const eventCount = useFitCount(eventsEl, '.event', MAX_EVENTS, 0, rowHeights)

	/*
	 * Ce que le panneau montre, avant même de savoir combien il en tient : le
	 * filtre par catégorie retire des lignes, et c'est la liste FILTRÉE que le
	 * témoin mesure. Mesurer la liste entière donnerait des hauteurs pour des
	 * lignes qu'on n'affiche pas, et `rowHeights[index]` ne correspondrait plus à
	 * la rangée du même index.
	 */
	const shownEvents = computed(() => events.value.filter(event => isEventVisible(event.type, hiddenList.value)))

	// Le témoin est remesuré quand le panneau change de largeur (son texte passe
	// alors d'une ligne à deux) comme quand la liste change.
	function measureRows() {
		const el = probeEl.value
		if (!el) return
		const heights = Array.from(el.children).map(row => Math.ceil(row.getBoundingClientRect().height))
		// Panneau masqué (onglet replié, widget pas encore posé) : tout est à zéro,
		// on garde la mesure précédente plutôt que de vider la liste.
		if (heights.some(height => height <= 0)) return
		if (heights.length === rowHeights.value.length && heights.every((height, index) => height === rowHeights.value[index])) return
		rowHeights.value = heights
	}
	let probeObserver: ResizeObserver | null = null
	watch(probeEl, el => {
		if (probeObserver) { probeObserver.disconnect(); probeObserver = null }
		if (!el) return
		probeObserver = new ResizeObserver(measureRows)
		probeObserver.observe(el)
	}, { immediate: true })
	// Le témoin change de contenu sans forcément changer de taille (un événement
	// poussé en tête, une ligne haute qui remplace une basse, une catégorie qu'on
	// décoche) : l'observateur ne dirait rien, on remesure après le rendu.
	watch(shownEvents, () => nextTick(measureRows))

	// Rien tant que le témoin n'a pas parlé : afficher d'abord les 40 lignes pour
	// en retirer trente au premier calcul ferait clignoter le panneau au chargement.
	const visibleEvents = computed(() => rowHeights.value.length ? shownEvents.value.slice(0, eventCount.value) : [])

	function load() {
		const panel = props.team
		const url = panel === 0 ? 'live/get-events' : 'live/get-team-events/' + panel
		LeekWars.get<{ events: LiveEvent[] }>(url).then(data => {
			// Le panneau a changé pendant le vol (navigation d'une équipe à l'autre) :
			// cette réponse ne le concerne plus.
			if (panel !== props.team) return
			// Fusion et non remplacement : la réponse a été calculée avant l'arrivée
			// des événements poussés pendant son vol, les écraser les ferait
			// disparaître puis réapparaître.
			merge(data.events)
			loaded.value = true
		}).error(() => { if (panel === props.team) loaded.value = true })
	}

	function merge(incoming: LiveEvent[]) {
		if (!incoming || !incoming.length) return
		const known = new Set(events.value.map(eventKey))
		const fresh = incoming.filter(event => !known.has(eventKey(event)))
		if (!fresh.length) return
		events.value = [...fresh, ...events.value]
			.sort((a, b) => b.date - a.date)
			.slice(0, MAX_EVENTS)
	}

	/*
	 * Le panneau est vraiment en direct : chaque nouvel événement arrive par le
	 * websocket, il n'y a pas de rafraîchissement périodique. Les dates relatives, elles, se réécrivent
	 * seules : `$filters.duration` lit `LeekWars.time`, qui est réactif et avance
	 * d'une minute à l'autre.
	 */
	function onLiveEvents([panel, incoming]: [number, unknown[]]) {
		// Pendant une navigation, Vue monte la nouvelle page avant de démonter
		// l'ancienne : deux panneaux peuvent écouter en même temps, chacun ne garde
		// que ce qui vient du sien.
		if (panel !== props.team) return
		merge(incoming as LiveEvent[])
		loaded.value = true
	}

	// Reconnexion du websocket : l'abonnement est perdu, on le repose
	// et on rattrape ce qui s'est passé pendant la coupure. Pas de rattrapage à la
	// connexion initiale, `load()` est déjà en vol — d'où l'état de départ lu dans
	// le store : si la socket était DÉJÀ debout au montage, le premier événement
	// reçu est forcément une reconnexion.
	let wasConnected = store.state.wsconnected
	function onWsConnected() {
		socketResubscribe([SocketMessage.LIVE_REGISTER, props.team])
		if (wasConnected) load()
		wasConnected = true
	}

	// Retour sur l'onglet : on ne recharge que si la socket a pu rater des
	// messages (mise en veille d'un téléphone). Un onglet d'ordinateur simplement
	// passé au second plan a continué de recevoir, il n'y a rien à rattraper.
	function onVisible() {
		if (LeekWars.socket.maybeStale()) load()
	}

	// Filet de secours : si le websocket ne s'établit pas du tout (proxy
	// d'entreprise, réseau qui filtre), le panneau retombe sur l'ancien
	// rafraîchissement périodique. Tant que la socket vit, il ne tire aucune
	// requête.
	const timer = setInterval(() => {
		if (!document.hidden && !LeekWars.socket.connected()) load()
	}, 60 * 1000)

	function panelRef(panel: number, on: boolean) {
		socketRef([SocketMessage.LIVE_REGISTER, panel], [SocketMessage.LIVE_UNREGISTER, panel], on)
	}

	// L'abonnement part AVANT la requête HTTP : dans l'autre ordre, un événement
	// tombé entre la réponse et l'abonnement serait perdu jusqu'au prochain
	// chargement de la page.
	panelRef(props.team, true)
	load()
	// Navigation d'une équipe à l'autre : la page d'équipe garde le panneau monté
	// et lui passe la nouvelle équipe. On s'abonne au nouveau panneau avant de
	// quitter l'ancien : dans l'autre ordre, on laisserait un trou.
	watch(() => props.team, (team, previous) => {
		panelRef(team, true)
		panelRef(previous, false)
		loaded.value = false
		events.value = []
		load()
	})

	emitter.on('live-events', onLiveEvents)
	emitter.on('wsconnected', onWsConnected)
	emitter.on('visible', onVisible)

	onBeforeUnmount(() => {
		if (probeObserver) { probeObserver.disconnect(); probeObserver = null }
		clearTimeout(translationTimer)
		clearInterval(timer)
		emitter.off('live-events', onLiveEvents)
		emitter.off('wsconnected', onWsConnected)
		emitter.off('visible', onVisible)
		panelRef(props.team, false)
	})
</script>

<style lang="scss" scoped>
	// Le panneau occupe toute la hauteur qu'on lui donne et la liste prend ce qui
	// reste ; `overflow: hidden` n'est qu'un filet, le nombre de lignes affichées
	// est calculé pour tenir sans en couper aucune (useFitCount).
	.live-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.events {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	// Le témoin de mesure : hors du flux (il ne prend aucune place et ne se fait
	// pas étirer — il mesurerait sinon ce qu'on vient de décider), à la largeur des
	// vraies lignes, et invisible.
	.probe-list {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		// Les lignes du témoin se mettent bien en page (on lit leur hauteur), mais
		// elles ne comptent pour rien : sans ça, la liste entière déborderait du
		// panneau et `scrollHeight` cesserait de dire si le contenu tient — c'est
		// justement le contrôle des widgets sans défilement.
		height: 0;
		overflow: hidden;
		visibility: hidden;
		pointer-events: none;
	}
	// Les rangées du témoin, elles, ont leur hauteur : c'est celle-ci qu'on observe.
	.probe-rows {
		height: auto;
	}
	.event.probe {
		flex: none;
		min-height: 0;
	}
	// L'image du trophée n'est pas rendue dans le témoin (elle n'apprendrait rien
	// et doublerait les téléchargements), mais elle prend sa place : c'est autant
	// de largeur en moins pour le texte, donc un retour à la ligne plus tôt.
	.event.probe .event-trophy {
		width: 28px;
		height: 28px;
	}
	// Les lignes retenues se partagent TOUTE la hauteur du panneau : plus de blanc
	// résiduel sous la dernière, et jamais de ligne coupée — c'est `--row-height`,
	// la hauteur naturelle de CHAQUE ligne (posée en style en ligne), qui décide
	// combien il en tient. Sur la page d'équipe, où la liste a la hauteur de son
	// contenu, il n'y a rien à se partager et elles gardent leur hauteur naturelle.
	.event {
		display: flex;
		align-items: center;
		gap: 10px;
		// `flex-basis: 0` et non `auto` : toutes les lignes se partagent la hauteur à
		// parts ÉGALES. Avec `auto`, une ligne qui porte l'image d'un trophée part
		// d'une base plus haute qu'une ligne de seuil et reste plus grande — on
		// voyait des rangées de deux tailles dans le même panneau. Le compte garantit
		// que la part de chacune vaut au moins sa hauteur naturelle.
		flex: 1 1 0;
		min-height: var(--row-height, auto);
		padding: 5px 6px;
		border-radius: var(--radius);
	}
	.event:hover {
		background: var(--background-secondary);
	}
	// Arrivée d'un événement poussé : il descend du haut et les autres glissent
	// pour lui faire place, sinon la liste sauterait d'un cran sans qu'on
	// comprenne que quelque chose vient d'arriver. `transition-group` n'anime pas
	// le premier rendu (pas de `appear`) : les 40 lignes du chargement initial
	// s'affichent d'un coup, comme avant.
	.event-enter-from {
		opacity: 0;
		transform: translateY(-8px);
	}
	.event-enter-active {
		transition: opacity 0.25s ease, transform 0.25s ease;
	}
	.event-move {
		transition: transform 0.25s ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.event-enter-active, .event-move {
			transition: none;
		}
	}
	// L'avatar porte son icône d'événement en pastille, coin bas droit : une seule
	// colonne à gauche du texte, comme avant, mais qui dit aussi qui a fait quoi.
	.event-avatar {
		position: relative;
		flex-shrink: 0;
		// Même encombrement que l'icône seule d'avant : le panneau est étroit
		// (deux lignes de texte à droite), l'avatar ne doit pas manger la place.
		width: 28px;
		height: 28px;
		:deep(.avatar) {
			width: 28px;
			height: 28px;
		}
	}
	// Événement du jeu : pas d'avatar à porter, le glyphe prend toute la case et
	// la ligne garde exactement la même gouttière que les autres.
	.event-avatar.game {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--background-secondary);
		border-radius: var(--radius);
		color: var(--text-color-secondary);
		font-size: 20px;
	}
	.event-avatar .badge {
		position: absolute;
		right: -5px;
		bottom: -5px;
		width: 16px;
		height: 16px;
		font-size: 12px;
		color: var(--text-color-secondary);
		// La pastille se détache de l'avatar : fond de panel et liseré, sinon
		// l'icône se perd dans l'image quand les deux sont sombres.
		background: var(--background-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
	}
	.event-body {
		flex: 1;
		min-width: 0;
	}
	// L'image du trophée en bout de ligne : c'est elle qui dit LEQUEL, elle a donc
	// la taille de l'avatar et non celle d'une pastille. Elle ne rétrécit jamais,
	// c'est le texte (déjà tronqué à deux lignes) qui cède la place.
	.event-trophy {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		img {
			width: 28px;
			height: 28px;
		}
	}
	// Deux lignes au plus. C'est la hauteur du témoin, donc celle que toutes les
	// rangées ont le droit de prendre : aucune n'est rognée, même quand une seule
	// des lignes affichées a besoin de ses deux lignes de texte.
	.text {
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.farmer, .topic {
		font-weight: bold;
		color: var(--text-color);
		text-decoration: none;
	}
	.farmer:hover, .topic:hover {
		text-decoration: underline;
	}
	// Toujours sur une ligne : « il y a un jour » qui se casse en deux dans un
	// panneau étroit ferait une rangée plus haute que le témoin, qui n'en porte
	// qu'une — et c'est le témoin qui décide combien de rangées tiennent.
	.date {
		font-size: 12px;
		color: var(--text-color-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
