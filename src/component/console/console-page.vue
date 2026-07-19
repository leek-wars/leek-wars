<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.console') }}</h1>
			<div class="tabs">
				<v-menu v-if="consoleRef" offset-y>
					<template #activator="{ props }">
						<div class="tab action lang-tab" v-bind="props"><img class="lang-logo" :src="currentLanguage.logo"> {{ currentLanguage.label }} <v-icon>mdi-chevron-down</v-icon></div>
					</template>
					<div class="lang-menu">
						<div v-for="l in languages" :key="l.id" class="lang-item" :class="{ active: consoleRef.language === l.id }" @click="consoleRef.language = l.id"><img class="lang-logo" :src="l.logo"> {{ l.label }}</div>
					</div>
				</v-menu>
				<v-menu v-if="consoleRef && consoleRef.language === 'leekscript'" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<div class="tab action lang-tab" v-bind="props">LS {{ consoleRef.leekscript.version }} {{ consoleRef.leekscript.strict ? 'strict' : '' }} <v-icon>mdi-chevron-down</v-icon></div>
					</template>
					<leekscript-versions v-model:version="consoleRef.leekscript.version" v-model:strict="consoleRef.leekscript.strict" />
				</v-menu>
				<v-menu v-else-if="consoleRef && currentVersionShort" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<div class="tab action lang-tab" v-bind="props">{{ currentVersionShort }} <v-icon>mdi-chevron-down</v-icon></div>
					</template>
					<polyglot-versions :language="consoleRef.language" v-model:version="consoleRef.languageVersion" />
				</v-menu>
				<v-menu v-if="!LeekWars.mobile" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<div class="tab action" v-bind="props">
							<v-icon>mdi-weather-night</v-icon>
						</div>
					</template>
					<div class="theme-menu">
						<div v-for="t in themes" :key="t.value" class="theme-item" :class="{ active: consoleTheme === t.value }" @click="setTheme(t.value)">{{ t.label }}</div>
					</div>
				</v-menu>
			</div>
		</div>
		<!-- Sur mobile, les sélecteurs sont des actions de l'app-bar (cf setActions) ; ces menus s'ancrent
		     à l'action cliquée via leur target. -->
		<template v-if="LeekWars.mobile && consoleRef">
			<v-menu v-model="langMenu" :target="langMenuTarget" offset-y>
				<div class="lang-menu">
					<div v-for="l in languages" :key="l.id" class="lang-item" :class="{ active: consoleRef.language === l.id }" @click="consoleRef.language = l.id; langMenu = false"><img class="lang-logo" :src="l.logo"> {{ l.label }}</div>
				</div>
			</v-menu>
			<v-menu v-model="versionMenu" :target="versionMenuTarget" offset-y :close-on-content-click="false">
				<leekscript-versions v-if="consoleRef.language === 'leekscript'" v-model:version="consoleRef.leekscript.version" v-model:strict="consoleRef.leekscript.strict" />
				<polyglot-versions v-else :language="consoleRef.language" v-model:version="consoleRef.languageVersion" />
			</v-menu>
			<v-menu v-model="themeMenu" :target="themeMenuTarget" offset-y :close-on-content-click="false">
				<div class="theme-menu">
					<div v-for="t in themes" :key="t.value" class="theme-item" :class="{ active: consoleTheme === t.value }" @click="setTheme(t.value)">{{ t.label }}</div>
				</div>
			</v-menu>
		</template>
		<div>
			<console ref="console" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef, nextTick, onMounted, watch } from 'vue'
import { mixins, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Console from '../app/console.vue'
import LeekscriptVersions from '../app/leekscript-versions.vue'
import PolyglotVersions from '../app/polyglot-versions.vue'
import { AI_LANGUAGES, getLanguageVersions } from '../editor/file-types'

defineOptions({ name: 'ConsolePage', components: { Console, LeekscriptVersions, PolyglotVersions }, mixins: [...mixins] })

const t = useNamespacedT('console-page')

const themeMenu = ref(false)
const themeMenuTarget = ref<HTMLElement | undefined>(undefined)
const langMenu = ref(false)
const langMenuTarget = ref<HTMLElement | undefined>(undefined)
const versionMenu = ref(false)
const versionMenuTarget = ref<HTMLElement | undefined>(undefined)
const consoleRef = useTemplateRef<InstanceType<typeof Console>>('console')
const consoleTheme = computed(() => (consoleRef.value as unknown as { theme?: string })?.theme)
const languages = AI_LANGUAGES
const currentLanguage = computed(() => {
	const lang = (consoleRef.value as unknown as { language?: string })?.language
	return languages.find(l => l.id === lang) ?? languages[0]
})
const currentVersionShort = computed(() => {
	const c = consoleRef.value as unknown as { language?: string, languageVersion?: string } | null
	if (!c?.language) return ''
	return getLanguageVersions(c.language).find(v => v.pragma === c.languageVersion)?.short ?? ''
})

const themes = [
	{ value: 'leek-wars', label: 'Leek Wars' },
	{ value: 'monokai', label: 'Monokai' },
	{ value: 'vs', label: 'VS Code clair' },
	{ value: 'vs-dark', label: 'VS Code sombre' },
	{ value: 'hc-light', label: 'High Contrast clair' },
	{ value: 'hc-black', label: 'High Contrast sombre' },
]

LeekWars.setTitle(t('main.console'))

// Sur mobile, les sélecteurs langage / version / thème sont exposés comme actions de l'app-bar :
// le langage par son logo, la version par son étiquette courte (ES2026, 5.8, LS 4…), le thème par
// la lune. On reconstruit les actions quand le langage ou la version change (logo + texte à jour).
function buildActions() {
	const c = consoleRef.value as unknown as { language?: string, languageVersion?: string, leekscript?: { version: number } } | null
	const versionText = c?.language === 'leekscript' ? 'LS ' + (c.leekscript?.version ?? '') : currentVersionShort.value
	LeekWars.setActions([
		{ image: currentLanguage.value.logo.replace(/^\/image\//, ''), click: (e?: MouseEvent) => {
			langMenuTarget.value = e?.currentTarget as HTMLElement | undefined
			nextTick(() => { langMenu.value = !langMenu.value })
		}},
		{ text: versionText, click: (e?: MouseEvent) => {
			versionMenuTarget.value = e?.currentTarget as HTMLElement | undefined
			nextTick(() => { versionMenu.value = !versionMenu.value })
		}},
		{ icon: 'mdi-weather-night', click: (e?: MouseEvent) => {
			themeMenuTarget.value = e?.currentTarget as HTMLElement | undefined
			nextTick(() => { themeMenu.value = !themeMenu.value })
		}},
	])
}
if (LeekWars.mobile) {
	onMounted(() => {
		buildActions()
		const c = () => consoleRef.value as unknown as { language?: string, languageVersion?: string, leekscript?: { version: number } } | null
		watch(() => [c()?.language, c()?.languageVersion, c()?.leekscript?.version], buildActions)
	})
}

function setTheme(theme: string) {
	if (consoleRef.value) {
		consoleRef.value.theme = theme
		consoleRef.value.saveTheme()
	}
}
</script>

<style lang="scss">
.lang-tab {
	display: flex;
	align-items: center;
	gap: 6px;
}
.lang-logo {
	width: 16px;
	height: 16px;
	vertical-align: middle;
	object-fit: contain;
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
body.dark .lang-menu {
	background: #2a2a2a;
	.lang-item {
		color: #eee;
		&:hover {
			background: #3a3a3a;
		}
	}
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
body.dark .theme-menu {
	background: #2a2a2a;
	.theme-item {
		color: #eee;
		&:hover {
			background: #3a3a3a;
		}
	}
}
</style>
