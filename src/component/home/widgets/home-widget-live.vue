<template>
	<div class="live-widget">
		<loader v-if="!loaded" />
		<div v-else-if="events.length" class="events">
			<div v-for="(event, e) in events" :key="e" class="event">
				<!-- L'avatar dit QUI, l'icône dit QUOI : les deux, l'un devant l'autre.
					 Le trophée débloqué garde sa propre icône, en pastille sur l'avatar. -->
				<router-link :to="'/farmer/' + event.farmer.id" class="event-avatar">
					<avatar :farmer="(event.farmer as any)" />
					<trophy-icon v-if="event.type === 'trophy'" :code="event.trophy" class="badge" />
					<v-icon v-else class="badge">{{ METRIC_ICONS[event.metric] || 'mdi-forum-outline' }}</v-icon>
				</router-link>
				<div class="event-body">
					<div class="text">
						<router-link :to="'/farmer/' + event.farmer.id" class="farmer">{{ event.farmer.name }}</router-link>
						<!-- Espaces explicites : le mode condense de Vue avale l'espace de tête -->
						<template v-if="event.type === 'trophy'">{{ ' ' + t('live_trophy', [$t('trophy.' + event.trophy)]) }}</template>
						<template v-else-if="event.type === 'threshold'">{{ ' ' + t('live_' + event.metric, [$filters.number(event.threshold)]) }}</template>
						<template v-else-if="event.type === 'topic'">{{ ' ' + t('live_topic') + ' ' }}<router-link :to="'/forum/category-' + event.topic.category + '/topic-' + event.topic.id" class="topic">{{ event.topic.title }}</router-link></template>
					</div>
					<div class="date">{{ $filters.duration(event.date) }}</div>
				</div>
			</div>
		</div>
		<div v-else class="none">{{ t('live_empty') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { onBeforeUnmount, ref } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetLive' })

	const t = useNamespacedT('home')

	const METRIC_ICONS: Record<string, string> = {
		victories: 'mdi-sword-cross',
		bosses: 'mdi-skull-outline',
		tournaments: 'mdi-trophy-outline',
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
		LeekWars.get<{ events: LiveEvent[] }>('live/get-events').then(data => {
			events.value = data.events
			loaded.value = true
		}).error(() => { loaded.value = true })
	}
	load()
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
		min-width: 0;
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
