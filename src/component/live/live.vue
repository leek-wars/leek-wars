<template>
	<div class="live-widget">
		<loader v-if="!loaded" />
		<div v-else-if="events.length" class="events">
			<div v-for="(event, e) in events" :key="e" class="event">
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
		</div>
		<div v-else class="none">{{ t('empty') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { onBeforeUnmount, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { mixins, useNamespacedT } from '@/model/i18n'

	// Le panneau vit sur l'accueil (widget « En direct ») et sur la page d'équipe
	// (« En direct sur <équipe> ») : il porte donc son propre namespace i18n, que
	// le mixin charge à la demande, plutôt que les clés de l'une des deux pages.
	defineOptions({ name: 'Live', i18n: {}, mixins: [...mixins] })

	const props = withDefaults(defineProps<{
		/** Restreint la timeline aux membres de cette équipe. Sinon, tout le site. */
		team?: number
	}>(), {
		team: undefined,
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

	const loaded = ref(false)
	const events = ref<LiveEvent[]>([])

	function load() {
		const url = props.team === undefined ? 'live/get-events' : 'live/get-team-events/' + props.team
		LeekWars.get<{ events: LiveEvent[] }>(url).then(data => {
			events.value = data.events
			loaded.value = true
		}).error(() => { loaded.value = true })
	}
	load()
	// L'équipe n'est connue qu'une fois la page chargée : le premier rendu passe
	// un id indéfini, il faut donc recharger quand il arrive.
	watch(() => props.team, () => { loaded.value = false; load() })
	// Le rate limit dynamique est côté serveur (sélection par score selon
	// l'activité) ; ici on rafraîchit simplement à intervalle fixe.
	const timer = setInterval(load, 60 * 1000)
	onBeforeUnmount(() => clearInterval(timer))
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
