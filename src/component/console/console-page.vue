<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.console') }}</h1>
			<div class="tabs">
				<v-menu v-if="!LeekWars.mobile" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<div class="tab action" v-bind="props">
							<v-icon>mdi-weather-night</v-icon>
						</div>
					</template>
					<div class="theme-menu">
						<div v-for="t in themes" :key="t.value" class="theme-item" :class="{ active: consoleRef && (consoleRef as any).theme === t.value }" @click="setTheme(t.value)">{{ t.label }}</div>
					</div>
				</v-menu>
			</div>
		</div>
		<v-menu v-if="LeekWars.mobile" v-model="themeMenu" :target="themeMenuTarget" offset-y :close-on-content-click="false">
			<div class="theme-menu">
				<div v-for="t in themes" :key="t.value" class="theme-item" :class="{ active: consoleRef && (consoleRef as any).theme === t.value }" @click="setTheme(t.value)">{{ t.label }}</div>
			</div>
		</v-menu>
		<div>
			<console ref="console" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Console from '../app/console.vue'

defineOptions({ name: 'console-page', components: { Console }, mixins: [...mixins] })

const { t } = useI18n()

const themeMenu = ref(false)
const themeMenuTarget = ref<any>(undefined)
const consoleRef = useTemplateRef<any>('console')

const themes = [
	{ value: 'leek-wars', label: 'Leek Wars' },
	{ value: 'monokai', label: 'Monokai' },
	{ value: 'vs', label: 'VS Code clair' },
	{ value: 'vs-dark', label: 'VS Code sombre' },
	{ value: 'hc-light', label: 'High Contrast clair' },
	{ value: 'hc-black', label: 'High Contrast sombre' },
]

LeekWars.setTitle(t('main.console'))
if (LeekWars.mobile) {
	LeekWars.setActions([
		{ icon: 'mdi-weather-night', click: (e: Event) => {
			themeMenuTarget.value = e.currentTarget
			nextTick(() => { themeMenu.value = !themeMenu.value })
		}}
	])
}

function setTheme(theme: string) {
	if (consoleRef.value) {
		consoleRef.value.theme = theme
		consoleRef.value.saveTheme()
	}
}
</script>

<style lang="scss">
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
