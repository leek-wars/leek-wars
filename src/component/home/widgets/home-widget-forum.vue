<template>
	<div class="forum-widget">
		<loader v-if="!loaded" />
		<template v-else-if="topics.length">
			<div ref="topicsEl" class="topics">
				<router-link v-for="topic in visibleTopics" :key="topic.id" v-ripple :to="'/forum/category-' + topic.category + '/topic-' + topic.id" class="topic" :class="{ unread: !topic.seen }">
					<img :src="topic.seen ? '/image/forum_seen.png' : '/image/forum_unseen.png'" class="seen-icon">
					<div class="topic-main">
						<div class="title-line">
							<v-icon v-if="topic.status === ForumTopicStatus.RESOLVED" class="attr resolved">mdi-check-circle</v-icon>
							<v-icon v-else-if="topic.status === ForumTopicStatus.NOT_REPRODUCED" class="attr not-reproduced">mdi-help-circle</v-icon>
							<v-icon v-else-if="topic.status === ForumTopicStatus.NOT_PLANNED" class="attr not-planned">mdi-minus-circle</v-icon>
							<v-icon v-else-if="topic.status === ForumTopicStatus.NOT_A_BUG" class="attr not-a-bug">mdi-close-circle</v-icon>
							<v-icon v-else-if="topic.status === ForumTopicStatus.OBSOLETE" class="attr obsolete">mdi-archive</v-icon>
							<v-icon v-if="topic.closed" class="attr">mdi-lock</v-icon>
							<v-icon v-if="topic.pinned" class="attr">mdi-pin</v-icon>
							<span class="title">{{ topic.title }}</span>
						</div>
						<div class="meta">
							<span class="opening">
								<span class="category">{{ categoryName(topic) }}</span>
								<span class="author">{{ topic.author.name }}</span>
								<span class="date">{{ shortDate(topic.date) }}</span>
							</span>
							<span v-if="topic.last_message_owner_name" class="last-answer">
								<v-icon>mdi-reply</v-icon>
								<span class="author">{{ topic.last_message_owner_name }}</span>
								<span class="date">{{ $filters.duration(topic.last_message) }}</span>
							</span>
						</div>
					</div>
					<span class="stats">
						<span><v-icon>mdi-comment-outline</v-icon> {{ topic.message_count }}</span>
						<span><v-icon>mdi-eye-outline</v-icon> {{ topic.views }}</span>
					</span>
				</router-link>
			</div>
		</template>
		<div v-else class="none">{{ t('no_topic') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'
	import { ForumTopicStatus } from '@/model/forum'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'

	defineOptions({ name: 'HomeWidgetForum' })

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	// Date d'ouverture en numérique : la forme longue du site (« 7 novembre 2024 »)
	// prend une centaine de pixels et, sur cette ligne partagée avec la catégorie et
	// la dernière réponse, c'est le nom de l'auteur qui payait la place manquante.
	function shortDate(timestamp: number): string {
		if (!timestamp) return ''
		return new Date(timestamp * 1000).toLocaleDateString(locale.value)
	}

	interface Topic {
		id: number, title: string, category: number, category_name: string, category_team: number,
		date: number, last_message: number, message_count: number,
		views: number, seen: boolean, pinned: boolean, closed: boolean, status: number,
		author: { id: number, name: string }, last_message_owner_name: string | null
	}
	const loaded = ref(false)
	const topics = ref<Topic[]>([])

	// Autant de sujets que la hauteur du panel le permet, jamais coupés.
	const topicsEl = ref<HTMLElement | null>(null)
	const topicCount = useFitCount(topicsEl, '.topic', 20)
	const visibleTopics = computed(() => topics.value.slice(0, topicCount.value))

	// Le nom d'une catégorie d'équipe est déjà celui de l'équipe ; les autres sont
	// des clés de traduction. Même règle que le fil de discussion (forum-topic).
	function categoryName(topic: Topic): string {
		if (!topic.category_name) return ''
		return topic.category_team > 0 ? topic.category_name : t('forum-category.' + topic.category_name)
	}

	LeekWars.get<{ topics: Topic[] }>('forum/get-last-topics').then((data) => {
		topics.value = data.topics ?? []
		loaded.value = true
	}).error(() => { loaded.value = true })
</script>

<style lang="scss" scoped>
	.forum-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	// La liste occupe la hauteur restante ; overflow hidden en filet de sécurité,
	// le nombre de sujets affichés est calculé pour tenir sans couper.
	.topics {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.topic {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 8px;
		text-decoration: none;
		color: var(--text-color);
		border-bottom: 1px solid var(--border);
	}
	.topic:last-child {
		border-bottom: none;
	}
	.topic:hover {
		background: var(--background-secondary);
	}
	.seen-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.topic-main {
		min-width: 0;
		flex: 1;
	}
	.title-line {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.topic.unread .title {
		font-weight: bold;
	}
	.title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.attr {
		font-size: 15px;
		flex-shrink: 0;
	}
	.attr.resolved { color: var(--primary); }
	.attr.not-reproduced { color: #e67e22; }
	.attr.not-planned { color: var(--text-color-secondary); }
	.attr.not-a-bug { color: #c0392b; }
	.attr.obsolete { color: var(--text-color-secondary); }
	// Écarts serrés : à la largeur d'un widget de six colonnes, les deux blocs
	// remplissent la ligne au pixel près, et 2 px de trop coupaient le nom de
	// l'auteur (une ellipse mange deux caractères pour un pixel manquant).
	.meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	// Ouverture du sujet à gauche, dernière réponse à droite : c'est le contraste
	// entre les deux qui se lit, pas chaque date prise isolément.
	.opening, .last-answer {
		display: flex;
		align-items: center;
		gap: 5px;
		min-width: 0;
		white-space: nowrap;
	}
	.opening {
		flex: 1 1 auto;
		overflow: hidden;
	}
	.last-answer {
		flex-shrink: 0;
	}
	.last-answer .v-icon {
		font-size: 13px;
	}
	.category {
		flex-shrink: 0;
		color: var(--text-color);
		background: var(--background-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-tiny);
		padding: 0 5px;
	}
	// Seul élément de la ligne qui accepte de rétrécir (la catégorie et les dates
	// ne se coupent pas) : sans plancher, il absorbait tout le manque et tombait
	// à quelques pixels. Il se coupe, il ne disparaît pas.
	.author {
		min-width: 3em;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.date {
		flex-shrink: 0;
	}
	.stats {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.stats span {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.stats .v-icon {
		font-size: 14px;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
