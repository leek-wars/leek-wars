<template lang="html">
	<panel v-if="networks.length" icon="mdi-share-variant">
		<template #title>Social posts</template>
		<template #actions>
			<div class="button flat" @click="copyAll">
				<v-icon>mdi-content-copy</v-icon>
				<span>Copy all</span>
			</div>
		</template>
		<template #content>
			<div class="posts">
				<div v-for="network in networks" :key="network.key" class="network">
					<div class="network-header">
						<span class="network-name">{{ network.label }}</span>
						<span class="network-account">{{ network.account }}</span>
						<span v-if="network.thread && network.messages.length > 1" class="chip">
							{{ network.messages.length }} messages
						</span>
						<span v-if="network.manual" class="chip manual">à la main</span>
						<div class="grow"></div>
						<div class="button flat" @click="copyNetwork(network)">
							<v-icon>mdi-content-copy</v-icon>
						</div>
					</div>

					<div v-if="network.title" class="field">
						<span class="field-label">Titre</span>
						<span class="field-value">{{ network.title }}</span>
						<div class="button flat" @click="copy(network.title)">
							<v-icon>mdi-content-copy</v-icon>
						</div>
					</div>
					<div v-if="network.subreddit" class="field">
						<span class="field-label">Subreddit</span>
						<span class="field-value">r/{{ network.subreddit }}</span>
					</div>

					<div v-for="(message, i) in network.messages" :key="i" class="message">
						<div class="message-header">
							<span v-if="network.messages.length > 1" class="rank">{{ i + 1 }}/{{ network.messages.length }}</span>
							<span class="count" :class="{ over: message.length > network.limit }">
								{{ message.length }} / {{ network.limit }}
							</span>
							<span v-if="message.image" class="image-name">
								<v-icon>mdi-image-outline</v-icon> {{ shortImage(message.image, network) }}
							</span>
							<div class="grow"></div>
							<div class="button flat" @click="copy(message.text)">
								<v-icon>mdi-content-copy</v-icon>
							</div>
						</div>
						<div class="message-text">{{ message.text }}</div>
					</div>

					<div v-if="network.firstComment" class="field">
						<span class="field-label">1er commentaire</span>
						<span class="field-value">{{ network.firstComment }}</span>
						<div class="button flat" @click="copy(network.firstComment)">
							<v-icon>mdi-content-copy</v-icon>
						</div>
					</div>
					<div v-if="network.extraImages.length" class="field">
						<span class="field-label">Autres visuels</span>
						<span class="field-value">{{ network.extraImages.map((n: string) => shortImage(n, network)).join(', ') }}</span>
					</div>
					<div class="note">{{ network.note }}</div>
				</div>
			</div>
		</template>
	</panel>
</template>

<script setup lang="ts">

import { ref, computed } from 'vue'
import { LeekWars } from '@/model/leekwars'

const props = defineProps<{
	version: number
}>()

interface PostMessage {
	text: string
	length: number
	image: string | null
}

interface Network {
	key: string
	label: string
	account: string
	limit: number
	thread: boolean
	manual: boolean
	note: string
	imageFormat: string | null
	title: string
	subreddit: string
	firstComment: string
	messages: PostMessage[]
	extraImages: string[]
}

const all = ref<Record<string, { updated: string, networks: Network[] }>>({})

import('@/component/changelog/social-posts.json').then((module: { default: Record<string, { updated: string, networks: Network[] }> }) => {
	all.value = module.default
})

const networks = computed<Network[]>(() => all.value[String(props.version)]?.networks ?? [])

// Les visuels sont ceux du panneau du dessus : on n'affiche que la partie
// distinctive du nom, le reste est du préfixe de version et de format.
function shortImage(name: string, network: Network) {
	const prefix = `${props.version}_${network.imageFormat}_`
	return name.startsWith(prefix) ? name.substring(prefix.length).replace('.png', '') : name
}

function copy(text: string) {
	navigator.clipboard.writeText(text)
	LeekWars.toast("Copié")
}

function copyNetwork(network: Network) {
	copy(network.messages.map(m => m.text).join('\n\n---\n\n'))
}

function copyAll() {
	const parts = networks.value.map(n => {
		const body = n.messages.map(m => m.text).join('\n\n---\n\n')
		return `## ${n.label}\n\n${body}`
	})
	copy(parts.join('\n\n'))
}

</script>

<style lang="scss" scoped>
.posts {
	padding: 10px;
	// La page est large : deux colonnes évitent des blocs de texte étirés sur
	// 1100 px, et divisent presque par deux la hauteur du panneau.
	columns: 440px 2;
	column-gap: 10px;
}
@media (max-width: 920px) {
	.posts {
		columns: 1;
	}
}
.network {
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 8px 10px;
	margin-bottom: 10px;
	break-inside: avoid; // un réseau ne se coupe jamais entre deux colonnes
}
.network-header {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 6px;
}
.network-name {
	font-size: 14px;
	font-weight: 600;
}
.network-account {
	color: var(--text-color-secondary);
	font-size: 12px;
}
.grow {
	flex: 1;
}
.chip {
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	padding: 1px 6px;
	border-radius: 20px;
	background: var(--background-secondary);
	color: var(--text-color-secondary);
}
.chip.manual {
	color: var(--primary);
}
.message {
	margin-bottom: 5px;
	display: flow-root; // contient le flottant de l'en-tête
	background: var(--background-secondary);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 5px 9px;
}
// L'en-tête d'un message se pose SUR son bloc de texte, en haut à droite :
// il ne prend plus de ligne à lui tout seul.
.message-header {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 11px;
	color: var(--text-color-secondary);
	float: right;
	margin-left: 12px;
}
.rank {
	font-weight: 600;
}
.count {
	font-variant-numeric: tabular-nums;
}
.count.over {
	color: #b3261e;
	font-weight: 600;
}
body.dark .count.over {
	color: #f2836b; // le rouge clair vire au illisible sur fond sombre
}
.image-name {
	display: flex;
	align-items: center;
	gap: 2px;
	.v-icon {
		font-size: 13px;
	}
}
.message-text {
	white-space: pre-wrap;
	word-break: break-word;
	font-size: 13px;
	line-height: 1.4;
}
.field {
	display: flex;
	align-items: baseline;
	gap: 6px;
	font-size: 12px;
	margin-bottom: 4px;
}
.field-label {
	color: var(--text-color-secondary);
	text-transform: uppercase;
	font-size: 10px;
	letter-spacing: 0.05em;
	white-space: nowrap;
}
.field-value {
	word-break: break-word;
}
.note {
	font-size: 11px;
	color: var(--text-color-secondary);
	margin-top: 4px;
	line-height: 1.35;
}
.button.flat {
	padding: 0 4px;
	.v-icon {
		font-size: 16px;
	}
}
</style>
