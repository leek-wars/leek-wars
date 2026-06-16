<template>
	<span class="views-counter"><v-icon>mdi-eye</v-icon> {{ t('main.n_views', topic.views) }}</span>
	<template v-if="store.state.connected && category && category.moderator">
		<span class="action lock" @click="$emit('lock')"><v-icon>mdi-lock</v-icon> {{ topic.locked ? t('unlock') : t('lock') }}</span>
		<span class="action pin" @click="$emit('pin')"><v-icon>mdi-pin</v-icon> {{ topic.pinned ? t('unpin') : t('pin') }}</span>
	</template>
	<template v-if="canEditStatus">
		<v-select :model-value="topic.status" :items="statusItems" hide-details dense variant="outlined" class="status-select" @update:model-value="$emit('set-status', $event)">
			<template #selection="{ item }">
				<v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
			</template>
			<template #item="{ props: itemProps, item }">
				<v-list-item v-bind="itemProps">
					<template #prepend>
						<v-icon :color="item.raw.color" class="status-icon">{{ item.raw.icon }}</v-icon>
					</template>
				</v-list-item>
			</template>
		</v-select>
	</template>
	<span v-else-if="topic.status !== ForumTopicStatus.OPEN && currentStatusInfo" class="status-text">
		<v-icon :color="currentStatusInfo.color">{{ currentStatusInfo.icon }}</v-icon> {{ currentStatusInfo.title }}
	</span>
	<template v-if="store.state.farmer && store.state.farmer.admin">
		<span v-if="topic.release" class="action" @click="$emit('open-release')">
			<v-icon>mdi-tag</v-icon> {{ 'v' + String(topic.release).charAt(0) + '.' + String(topic.release).slice(1) }}
		</span>
		<v-select v-if="hasPriority" :model-value="topic.priority" :items="priorityItems" hide-details dense variant="outlined" class="priority-select" @update:model-value="$emit('set-priority', $event)">
			<template #selection="{ item }">
				<v-icon :color="item.raw.color" size="small">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
			</template>
			<template #item="{ props: itemProps, item }">
				<v-list-item v-bind="itemProps">
					<template #prepend>
						<v-icon :color="item.raw.color" size="small">{{ item.raw.icon }}</v-icon>
					</template>
				</v-list-item>
			</template>
		</v-select>
	</template>
	<span v-if="hasPriority && topic.priority && !(store.state.farmer && store.state.farmer.admin)" class="priority-label" :class="'priority-' + topic.priority">
		<v-icon :color="topic.priority === 1 ? '#e53935' : topic.priority === 2 ? '#fb8c00' : '#757575'" size="small">mdi-flag</v-icon>
		{{ topic.priority === 1 ? t('priority_high') : topic.priority === 2 ? t('priority_medium') : t('priority_low') }}
	</span>
	<span v-if="topic.acknowledged && !topic.private_issue && !(store.state.farmer && store.state.farmer.admin)" class="status-text"><v-icon color="#6f42c1">mdi-eye</v-icon> {{ t('status_acknowledged') }}</span>
	<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars/issues/' + topic.issue" class="issue-badge" target="_blank" rel="noopener">
		<img src="/image/github_white.png"><span>#{{ topic.issue }}</span>
	</a>
	<a v-if="topic.private_issue && store.state.farmer && store.state.farmer.admin" :href="'https://github.com/5pilow/leek-wars/issues/' + topic.private_issue" class="issue-badge private-issue" target="_blank" rel="noopener">
		<img src="/image/github_white.png"><span>#{{ topic.private_issue }}</span>
	</a>
	<span v-if="store.state.farmer && store.state.farmer.admin && !topic.private_issue && topic.status === ForumTopicStatus.OPEN" class="action create-issue" @click="$emit('create-issue')"><v-icon :class="{ 'mdi-spin': creatingIssue }">{{ creatingIssue ? 'mdi-loading' : 'mdi-source-branch' }}</v-icon> {{ t('create_issue') }}</span>
</template>

<script setup lang="ts">
import { ForumCategory, ForumTopic, ForumTopicStatus } from '@/model/forum'
import { store } from '@/model/store'
import { useNamespacedT } from '@/model/i18n'

// Ligne d'actions/infos d'un topic (vues, verrouiller, accrocher, status, priorité,
// issue). Factorisée pour être rendue à la fois en bas du 1er post et répétée en haut
// quand le topic est long (#4154). Réutilise les traductions du namespace forum-topic
// (i18n enregistré globalement), donc pas de fichiers .i18n propres.
defineOptions({ name: 'ForumTopicActions' })
const t = useNamespacedT('forum-topic')

interface StatusItem { value: number, title: string, icon: string, color: string }
defineProps<{
	topic: ForumTopic
	category: ForumCategory | null
	canEditStatus: boolean
	hasPriority: boolean
	statusItems: StatusItem[]
	priorityItems: StatusItem[]
	currentStatusInfo: { title: string, icon: string, color: string } | null
	creatingIssue: boolean
}>()
defineEmits<{
	(e: 'lock'): void
	(e: 'pin'): void
	(e: 'set-status', value: number): void
	(e: 'set-priority', value: number): void
	(e: 'create-issue'): void
	(e: 'open-release'): void
}>()
</script>

<style lang="scss" scoped>
// Styles des éléments de la barre : les styles scopés du parent ne traversent pas le
// composant, on embarque donc ici ceux dont la barre a besoin (#4154).
.views-counter {
	display: flex;
	align-items: center;
	gap: 5px;
	color: var(--text-color-secondary);
	font-size: 14px;
	padding: 5px 10px;
	i { font-size: 18px; }
}
.action {
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 6px;
	border-radius: 6px;
	.v-icon {
		font-size: 17px;
	}
}
.action:hover {
	color: var(--text-color);
	background: var(--background);
	.v-icon {
		opacity: 1 !important;
	}
}
.status-text {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 14px;
}
.status-select, .priority-select {
	display: inline-flex;
	vertical-align: middle;
	flex-grow: 0;
	:deep(.v-field) {
		font-size: 13px;
		min-height: 28px;
		padding: 4px 8px;
	}
	:deep(.v-field__input) {
		padding: 0;
		min-height: unset;
		align-items: center;
	}
	:deep(.v-icon) {
		opacity: 1 !important;
	}
	:deep(.v-select__selection) {
		color: var(--text-color);
	}
}
.priority-label {
	font-size: 13px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 2px;
	&.priority-1 { color: #e53935; }
	&.priority-2 { color: #fb8c00; }
	&.priority-3 { color: #757575; }
}
.issue-badge {
	background: #0366d6;
	color: white;
	border-radius: 5px;
	font-size: 13px;
	font-weight: 500;
	padding: 0 6px;
	display: inline-flex;
	align-items: center;
	height: 22px;
	img {
		height: 16px;
		margin-right: 4px;
	}
	&.private-issue {
		background: #6f42c1;
	}
}
:global(.v-list-item__prepend .v-icon.status-icon) {
	opacity: 1 !important;
}
</style>
