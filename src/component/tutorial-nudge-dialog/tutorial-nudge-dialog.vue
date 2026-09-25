<template lang="html">
	<popup v-model="show" :width="560" icon="mdi-school" :title="t('title')">
		<div class="intro">{{ t('intro') }}</div>
		<div class="chapters">
			<div v-for="(chapter, i) in chapters" :key="i" class="chapter">
				<v-icon>mdi-{{ chapter.icon }}</v-icon>
				<span class="num">{{ i + 1 }}</span>
			</div>
		</div>
		<template #actions>
			<div v-ripple class="action compact" @click="later">{{ t('later') }}</div>
			<div v-ripple class="action green" @click="start">
				<v-icon>mdi-play</v-icon>
				{{ t('start') }}
			</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { mixins, useNamespacedT } from '@/model/i18n'
import router from '@/router'
import Popup from '@/component/popup.vue'
import { tutorial_items, tutorialTrackForLanguage } from '@/component/tutorial/tutorial-items'

defineOptions({ name: 'TutorialNudgeDialog', i18n: {}, mixins: [...mixins] })

const chapters = tutorial_items

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const t = useNamespacedT('tutorial-nudge-dialog')

const show = ref(props.modelValue)
// La croix du header de <popup> ferme via le v-model interne (show) sans passer
// par les boutons : on propage toute fermeture au parent.
watch(show, (v) => { if (!v) emit('update:modelValue', false) })

function later() {
	LeekWars.track('tutorial-nudge-later')
	show.value = false
}

function start() {
	LeekWars.track('tutorial-nudge-start')
	show.value = false
	// On envoie le joueur vers le tutoriel du langage qu'il a choisi (LeekScript, JS/TS ou Python).
	const track = tutorialTrackForLanguage(store.state.farmer ? store.state.farmer.ai_language : null)
	router.push('/help/tutorial/' + track)
}
</script>

<style lang="scss" scoped>
	.intro {
		padding: 4px 0 16px;
		color: var(--text-color);
		line-height: 1.5;
	}
	.chapters {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		padding: 4px 0 4px;
	}
	.chapter {
		position: relative;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: rgba(0, 0, 0, 0.25) 0px 2px 4px;
		.v-icon {
			font-size: 24px;
			color: #222;
		}
		.num {
			position: absolute;
			bottom: -3px;
			right: -3px;
			min-width: 16px;
			height: 16px;
			padding: 0 3px;
			border-radius: 8px;
			background: var(--primary);
			color: #fff;
			font-size: 11px;
			font-weight: bold;
			line-height: 16px;
			text-align: center;
		}
	}
	.action.green .v-icon {
		margin-right: 4px;
	}
</style>
