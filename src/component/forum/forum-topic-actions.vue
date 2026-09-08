<template>
	<span class="views-counter"><v-icon>mdi-eye</v-icon> {{ t('main.n_views', topic.views) }}</span>
	<template v-if="store.state.connected && category && category.moderator">
		<span class="action lock" @click="$emit('lock')"><v-icon>mdi-lock</v-icon> {{ topic.locked ? t('unlock') : t('lock') }}</span>
		<span class="action pin" @click="$emit('pin')"><v-icon>mdi-pin</v-icon> {{ topic.pinned ? t('unpin') : t('pin') }}</span>
	</template>
	<template v-if="canEditStatus">
		<lw-select :model-value="topic.status" :items="statusItems" class="status-select" @update:model-value="$emit('set-status', $event)">
			<template #selection="{ item }">
				<v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
			</template>
			<!-- La ligne redevient un élément ordinaire : l'icône et le libellé s'écrivent,
			     là où v-list-item les tirait de son #prepend et de sa prop `title`. -->
			<template #item="{ props: itemProps, item }">
				<div v-bind="itemProps">
					<v-icon :color="item.raw.color" class="status-icon">{{ item.raw.icon }}</v-icon>
					<span>{{ item.title }}</span>
				</div>
			</template>
		</lw-select>
	</template>
	<span v-else-if="topic.status !== ForumTopicStatus.OPEN && currentStatusInfo" class="status-text">
		<v-icon :color="currentStatusInfo.color">{{ currentStatusInfo.icon }}</v-icon> {{ currentStatusInfo.title }}
	</span>
	<template v-if="store.state.farmer && store.state.farmer.admin">
		<span v-if="topic.release" class="action" @click="$emit('open-release')">
			<v-icon>mdi-tag</v-icon> {{ 'v' + String(topic.release).charAt(0) + '.' + String(topic.release).slice(1) }}
		</span>
		<lw-select v-if="hasPriority" :model-value="topic.priority" :items="priorityItems" class="priority-select" @update:model-value="$emit('set-priority', $event)">
			<template #selection="{ item }">
				<v-icon :color="item.raw.color" size="small">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
			</template>
			<template #item="{ props: itemProps, item }">
				<div v-bind="itemProps">
					<v-icon :color="item.raw.color" size="small">{{ item.raw.icon }}</v-icon>
					<span>{{ item.title }}</span>
				</div>
			</template>
		</lw-select>
	</template>
	<span v-if="hasPriority && topic.priority && !(store.state.farmer && store.state.farmer.admin)" class="priority-label" :class="'priority-' + topic.priority">
		<v-icon :color="topic.priority === 1 ? '#e53935' : topic.priority === 2 ? '#fb8c00' : '#757575'" size="small">mdi-flag</v-icon>
		{{ topic.priority === 1 ? t('priority_high') : topic.priority === 2 ? t('priority_medium') : t('priority_low') }}
	</span>
	<span v-if="topic.acknowledged && !topic.private_issue && !(store.state.farmer && store.state.farmer.admin)" class="status-text"><v-icon color="#6f42c1">mdi-eye</v-icon> {{ t('status_acknowledged') }}</span>
	<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars/issues/' + topic.issue" class="issue-badge" target="_blank" rel="noopener">
		<v-icon>mdi-github</v-icon><span>#{{ topic.issue }}</span>
	</a>
	<a v-if="topic.private_issue && store.state.farmer && store.state.farmer.admin" :href="'https://github.com/5pilow/leek-wars/issues/' + topic.private_issue" class="issue-badge private-issue" target="_blank" rel="noopener">
		<v-icon>mdi-github</v-icon><span>#{{ topic.private_issue }}</span>
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
	border-radius: var(--radius-medium);
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
// Idem : la classe arrive sur le champ de lw-select, pas l'attribut de portée.
// Les règles qui suivaient visaient les rouages de v-select (.v-field,
// .v-select__selection) et n'ont plus d'objet depuis la migration.
:deep(.status-select), :deep(.priority-select) {
	display: inline-flex;
	vertical-align: middle;
	flex-grow: 0;
	font-size: 13px;
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
	color: var(--white);
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
