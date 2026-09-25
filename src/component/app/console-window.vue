<template lang="html">
	<popup :model-value="modelValue" class="draggable" :content-props="{ style: 'left: ' + consoleX + 'px; top: ' + consoleY + 'px' }" content-class="console-window" :full="true" :width="700" :persistent="true" :scrim="false" :no-click-animation="true" @update:modelValue="$emit('update:modelValue', $event)">
		<template #title>
			<div @mousedown="consoleMouseDown">
				{{ $t('main.console') }}
				<v-menu v-if="consoleRef" offset-y>
					<template #activator="{ props }">
						<v-chip v-bind="props" size="small"><img class="lang-logo" :src="currentLanguage.logo"> {{ currentLanguage.label }} <v-icon>mdi-chevron-down</v-icon></v-chip>
					</template>
					<div class="lang-menu">
						<div v-for="l in languages" :key="l.id" class="lang-item" :class="{ active: consoleRef.language === l.id }" @click="consoleRef.language = l.id"><img class="lang-logo" :src="l.logo"> {{ l.label }}</div>
					</div>
				</v-menu>
				<v-menu v-if="consoleRef && consoleRef.language === 'leekscript'" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<v-chip v-bind="props" size="small">LS {{ consoleRef.leekscript.version }} {{ consoleRef.leekscript.strict ? 'strict' : '' }} <v-icon>mdi-chevron-down</v-icon></v-chip>
					</template>
					<leekscript-versions v-model:version="consoleRef.leekscript.version" v-model:strict="consoleRef.leekscript.strict" />
				</v-menu>
				<v-menu v-else-if="consoleRef && currentVersionShort" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<v-chip v-bind="props" size="small">{{ currentVersionShort }} <v-icon>mdi-chevron-down</v-icon></v-chip>
					</template>
					<polyglot-versions :language="consoleRef.language" v-model:version="consoleRef.languageVersion" />
				</v-menu>
				<v-chip v-if="consoleRef && !consoleRef.isEmpty()" size="small" @click="consoleRef.clear()"><v-icon>mdi-cancel</v-icon></v-chip>
			</div>
		</template>
		<template #options>
			<v-menu offset-y :close-on-content-click="false">
				<template #activator="{ props }">
					<div class="option" v-bind="props"><v-icon>mdi-weather-night</v-icon></div>
				</template>
				<div class="theme-menu">
					<div v-for="t in themes" :key="t.value" class="theme-item" :class="{ active: consoleRef && consoleRef.theme === t.value }" @click="setTheme(t.value)">{{ t.label }}</div>
				</div>
			</v-menu>
			<!-- <div class="option" @click="consoleRandom"><img src="/image/icon/dice.png"></div> -->
			<div class="option" @click="consolePopup"><v-icon>mdi-open-in-new</v-icon></div>
			<div class="option" @click="$emit('close')"><v-icon>mdi-close</v-icon></div>
		</template>
		<console ref="console" class="window" />
	</popup>
</template>

<script setup lang="ts">
import { LeekWars } from '@/model/leekwars'
import { emitter } from '@/model/vue'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import Console from './console.vue'
import LeekscriptVersions from './leekscript-versions.vue'
import PolyglotVersions from './polyglot-versions.vue'
import { AI_LANGUAGES, getLanguageVersions } from '../editor/file-types'

defineOptions({ name: 'ConsoleWindow', components: { 'console': Console, LeekscriptVersions, PolyglotVersions } })

const languages = AI_LANGUAGES

defineProps<{
	modelValue: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
	'close': []
}>()

const consoleRef = useTemplateRef<InstanceType<typeof Console>>('console')
const currentLanguage = computed(() => {
	const lang = (consoleRef.value as unknown as { language?: string })?.language
	return languages.find(l => l.id === lang) ?? languages[0]
})
const currentVersionShort = computed(() => {
	const c = consoleRef.value as unknown as { language?: string, languageVersion?: string } | null
	if (!c?.language) return ''
	return getLanguageVersions(c.language).find(v => v.pragma === c.languageVersion)?.short ?? ''
})
const consoleX = ref(0)
const consoleY = ref(0)
const consoleDown = ref(false)
const consoleStartx = ref(0)
const consoleStarty = ref(0)
const consoleDragx = ref(0)
const consoleDragy = ref(0)
const themes = [
	{ value: 'leek-wars', label: 'Leek Wars' },
	{ value: 'monokai', label: 'Monokai' },
	{ value: 'vs', label: 'VS Code clair' },
	{ value: 'vs-dark', label: 'VS Code sombre' },
	{ value: 'hc-light', label: 'High Contrast clair' },
	{ value: 'hc-black', label: 'High Contrast sombre' },
]

onMounted(() => {
	consoleX.value = window.innerWidth / 2 - 300
	consoleY.value = window.innerHeight / 2 - 200
	setTimeout(() => {
		consoleRef.value?.focus()
	}, 100)

	emitter.on('mousemove', consoleMouseMove)
	emitter.on('mouseup', consoleMouseUp)
})

onBeforeUnmount(() => {
	emitter.off('mousemove', consoleMouseMove)
	emitter.off('mouseup', consoleMouseUp)
})

function consoleMouseDown(e: MouseEvent) {
	if (e.button === 2) { return false }
	consoleDragx.value = e.pageX
	consoleDragy.value = e.pageY
	consoleStartx.value = consoleX.value
	consoleStarty.value = consoleY.value
	consoleDown.value = true
	e.preventDefault()
	return false
}

function consoleMouseMove(e: MouseEvent) {
	if (!consoleDown.value) { return null }
	consoleX.value = consoleStartx.value + (e.pageX - consoleDragx.value)
	if (consoleX.value < -15) { consoleX.value = -15 }
	consoleY.value = consoleStarty.value + (e.pageY - consoleDragy.value)
	if (consoleY.value < -15) { consoleY.value = -15 }
}

function consoleMouseUp(_e: MouseEvent) {
	consoleDown.value = false
}

function setTheme(theme: string) {
	const console = consoleRef.value
	if (console) {
		console.theme = theme
		console.saveTheme()
	}
}

function consolePopup() {
	LeekWars.popupWindow("/full-console", "title", 600, 320)
	emit('close')
}
</script>

<style lang="scss">

.console-window.v-overlay__content {
	z-index: 10000;
	overflow: visible;
	margin: 0;
	box-shadow: 0 11px 15px -7px #0003, 0 24px 38px 3px #00000024, 0 9px 46px 8px #0000001f;
}
body.dark .theme-menu {
	background: #2a2a2a;
	.theme-item {
		color: #eee;
		&:hover {
			background: #3a3a3a;
		}
	}
}
body.dark .lang-menu {
	background: #2a2a2a;
	.lang-item {
		color: #eee;
		&:hover {
			background: #3a3a3a;
		}
	}
}

</style>

<style lang="scss" scoped>

.v-chip {
	margin-left: 8px;
}

.theme-menu {
	background: white;
	padding: 4px 0;
	.theme-item {
		padding: 6px 16px;
		cursor: pointer;
		font-size: 14px;
		white-space: nowrap;
		&:hover {
			background: #eee;
		}
		&.active {
			font-weight: bold;
			color: #5fad1b;
		}
	}
}

.lang-menu {
	background: white;
	padding: 4px 0;
	.lang-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		cursor: pointer;
		font-size: 14px;
		white-space: nowrap;
		&:hover {
			background: #eee;
		}
		&.active {
			font-weight: bold;
			color: #5fad1b;
		}
	}
}

.lang-logo {
	width: 16px;
	height: 16px;
	vertical-align: middle;
	object-fit: contain;
}

</style>