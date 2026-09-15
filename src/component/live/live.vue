<template>
	<div class="live-widget">
		<loader v-if="!loaded" />
		<transition-group v-else-if="events.length" name="event" tag="div" class="events">
			<div v-for="event in events" :key="eventKey(event)" class="event">
				<!-- L'avatar dit QUI, la pastille dit QUOI (toujours une icône générique),
					 et l'image du trophée, en bout de ligne, dit LEQUEL. -->
				<router-link :to="'/farmer/' + event.farmer.id" class="event-avatar">
					<avatar :farmer="(event.farmer as any)" />
					<v-icon class="badge">{{ badgeIcon(event) }}</v-icon>
				</router-link>
				<div class="event-body">
					<div class="text">
						<router-link :to="'/farmer/' + event.farmer.id" class="farmer">{{ event.farmer.name }}</router-link>
						<!-- Espaces explicites : le mode condense de Vue avale l'espace de tête -->
						<template v-if="event.type === 'trophy'">{{ ' ' + t('event_trophy', [$t('trophy.' + event.trophy)]) }}</template>
						<template v-else-if="event.type === 'threshold'">{{ ' ' + t('event_' + event.metric, [$filters.number(event.threshold)]) }}</template>
						<template v-else-if="event.type === 'topic'">{{ ' ' + t('event_topic') + ' ' }}<router-link :to="'/forum/category-' + event.topic.category + '/topic-' + event.topic.id" class="topic">{{ event.topic.title }}</router-link></template>
					</div>
					<div class="date">{{ $filters.duration(event.date) }}</div>
				</div>
				<router-link v-if="event.type === 'trophy' && event.trophy" :to="'/trophy/' + event.trophy" class="event-trophy">
					<trophy-icon :code="event.trophy" />
				</router-link>
			</div>
		</transition-group>
		<div v-else class="none">{{ t('empty') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { onBeforeUnmount, ref, watch } from 'vue'
	import { emitter } from '@/model/emitter'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { socketRef, socketResubscribe } from '@/model/socket-subscription'
	import { store } from '@/model/store'
	import { mixins, useNamespacedT } from '@/model/i18n'

	// Le panneau vit sur l'accueil (widget « En direct ») et sur la page d'équipe
	// (« En direct sur <équipe> ») : il porte donc son propre namespace i18n, que
	// le mixin charge à la demande, plutôt que les clés de l'une des deux pages.
	defineOptions({ name: 'Live', i18n: {}, mixins: [...mixins] })

	const props = withDefaults(defineProps<{
		/**
		 * Le panneau regardé : 0 (par défaut) pour l'accueil, c'est-à-dire tout le
		 * site, ou l'id d'une équipe pour restreindre la timeline à ses membres.
		 * C'est aussi l'identifiant de l'abonnement côté démon.
		 */
		team?: number
	}>(), {
		team: 0,
	})

	const t = useNamespacedT('live')

	const METRIC_ICONS: Record<string, string> = {
		victories: 'mdi-sword-cross',
		bosses: 'mdi-crown',
		tournaments: 'mdi-tournament',
	}

	// La pastille de l'avatar ne dit plus que la NATURE de l'événement : l'image du
	// trophée, qui disait laquelle, est passée en bout de ligne où elle se voit.
	// Trophée plein contre trophée en contour, qui appartient déjà aux tournois.
	function badgeIcon(event: LiveEvent): string {
		if (event.type === 'trophy') return 'mdi-trophy'
		if (event.type === 'topic') return 'mdi-forum-outline'
		return METRIC_ICONS[event.metric ?? ''] || 'mdi-forum-outline'
	}

	interface LiveEvent {
		type: 'trophy' | 'threshold' | 'topic'
		date: number
		farmer: { id: number, name: string, avatar_changed: number }
		trophy?: string
		rarity?: number
		metric?: string
		threshold?: number
		topic?: { id: number, title: string, category: number }
	}

	// Même plafond que LiveController::MAX_EVENTS : la liste poussée ne peut pas
	// grossir indéfiniment dans un onglet laissé ouvert.
	const MAX_EVENTS = 40

	/*
	 * Identité d'un événement, pour ne pas l'afficher deux fois. Les deux sources
	 * se recouvrent forcément : entre le moment où la requête HTTP part et celui
	 * où sa réponse arrive, le websocket a pu pousser les mêmes lignes. Un éleveur
	 * ne débloque un trophée donné qu'une fois, ne franchit un seuil donné qu'une
	 * fois, et un sujet a un id : il n'y a pas besoin de la date dans la clé.
	 */
	function eventKey(event: LiveEvent): string {
		if (event.type === 'trophy') return 'y' + event.farmer.id + ':' + event.trophy
		if (event.type === 'threshold') return 's' + event.farmer.id + ':' + event.metric + ':' + event.threshold
		return 'p' + event.topic!.id
	}

	const loaded = ref(false)
	const events = ref<LiveEvent[]>([])

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
	 * Le panneau est vraiment en direct : le démon pousse chaque nouvel événement
	 * aux onglets qui le regardent (cf. LiveFeed côté serveur), il n'y a plus de
	 * rafraîchissement périodique. Les dates relatives, elles, se réécrivent
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

	// Reconnexion du websocket : le démon a perdu notre abonnement, on le repose
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
	// requête — et c'est une requête sans index (trophy.time, forum_topic.date).
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
		clearInterval(timer)
		emitter.off('live-events', onLiveEvents)
		emitter.off('wsconnected', onWsConnected)
		emitter.off('visible', onVisible)
		panelRef(props.team, false)
	})
</script>

<style lang="scss" scoped>
	.events {
		display: flex;
		flex-direction: column;
	}
	.event {
		display: flex;
		align-items: center;
		gap: 10px;
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
	.date {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
