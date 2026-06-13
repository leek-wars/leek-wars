<template lang="html">
	<popup :model-value="modelValue" :width="560" icon="mdi-hat-fedora" :title="t('title')" @update:model-value="$emit('update:modelValue', $event)">

		<div class="intro">{{ t('description') }}</div>

		<div ref="linkElement" class="invite-url" @click="selectLink">{{ link }}</div>

		<div class="share-buttons">
			<a class="share x" :href="shareUrls.x" target="_blank" rel="noopener">
				<v-icon :icon="X_LOGO" />
				<span>X</span>
			</a>
			<a class="share whatsapp" :href="shareUrls.whatsapp" target="_blank" rel="noopener">
				<v-icon>mdi-whatsapp</v-icon>
				<span>WhatsApp</span>
			</a>
			<a class="share telegram" :href="shareUrls.telegram" target="_blank" rel="noopener">
				<v-icon>mdi-send</v-icon>
				<span>Telegram</span>
			</a>
			<div v-if="canNativeShare" class="share native" @click="nativeShare">
				<v-icon>mdi-share-variant</v-icon>
				<span>{{ t('share') }}</span>
			</div>
			<div v-ripple class="share copy" @click="copyLink">
				<v-icon>{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
				<span>{{ copied ? t('copied') : t('copy') }}</span>
			</div>
		</div>
	</popup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'
import Popup from '@/component/popup.vue'

defineOptions({ name: 'InviteDialog', i18n: {}, mixins: [...mixins] })
// login optionnel : par défaut le farmer courant (nudge, équipe), mais un parent
// peut passer un autre login (page groupe/profil) pour partager son lien de parrainage.
const props = defineProps<{ modelValue: boolean, login?: string }>()
defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
const t = useNamespacedT('invite-dialog')

// Logo X officiel (absent de @mdi/js) : le set d'icônes Vuetify rend directement
// un path SVG brut commençant par "M".
const X_LOGO = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'

const linkElement = ref<HTMLElement | null>(null)
const copied = ref(false)

const login = computed(() => props.login ?? store.state.farmer?.login ?? '')
const link = computed(() => `leekwars.com/godfather/${login.value}`)
const fullLink = computed(() => `https://${link.value}`)
const message = computed(() => t('share_message'))

const shareUrls = computed(() => {
	const url = encodeURIComponent(fullLink.value)
	const text = encodeURIComponent(message.value)
	return {
		x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
		whatsapp: `https://wa.me/?text=${encodeURIComponent(message.value + ' ' + fullLink.value)}`,
		telegram: `https://t.me/share/url?url=${url}&text=${text}`,
	}
})

const canNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)

function selectLink() {
	if (linkElement.value) LeekWars.selectText(linkElement.value)
}
function copyLink() {
	navigator.clipboard?.writeText(fullLink.value).catch(() => {})
	selectLink()
	copied.value = true
	setTimeout(() => { copied.value = false }, 2000)
}
function nativeShare() {
	navigator.share?.({ text: message.value, url: fullLink.value }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.intro {
	margin-bottom: 16px;
}
.invite-url {
	background: var(--background-secondary);
	border: 1px solid var(--border);
	border-radius: 4px;
	padding: 10px 14px;
	font-family: monospace;
	font-size: 16px;
	text-align: center;
	cursor: pointer;
	user-select: all;
	word-break: break-all;
}
.share-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 16px;
}
.share {
	flex: 1 1 0;
	min-width: 110px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px;
	border-radius: 4px;
	color: white;
	text-decoration: none;
	cursor: pointer;
	font-weight: 500;
	.v-icon {
		color: white;
	}
	&.x { background: #000; }
	&.whatsapp { background: #25d366; }
	&.telegram { background: #29a9eb; }
	&.native { background: var(--primary); }
	&.copy { background: #607d8b; }
}
</style>
