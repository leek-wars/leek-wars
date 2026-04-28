<template lang="html">
	<div class="version">
		<img :src="'/image/mail/mail_' + version.version + '.webp'" class="image" loading="lazy" @error="($event.target as HTMLImageElement).style.display = 'none'">
		<div class="wrapper">
			<div v-for="(changes, s) in sections" :key="s" class="section">
				<h4 v-if="sections.length > 1" :class="{first: s === 0}">{{ $t('changelog.title_' + s) }}</h4>
				<div v-for="(change, c) in changes" :key="c" class="change">
					<span v-html="'➤ ' + change.text"></span>
					<v-menu v-for="image in change.images" :key="image" :close-on-content-click="false" offset-overflow :nudge-top="0" transition="none" :open-on-hover="true" :open-delay="200" :close-delay="10" offset-y location="top">
						<template #activator="{ props }">
							<v-icon class="screenshot" v-bind="props">mdi-tooltip-image-outline</v-icon>
						</template>
						<img class="image-menu" :src="'/image/changelog/' + image + '.png'">
					</v-menu>
				</div>
			</div>
			<router-link v-if="version.forum_topic" :to="'/forum/category-' + version.forum_category + '/topic-' + version.forum_topic">
				<v-btn color="primary" class="button">➤ {{ $t('changelog.forum_topic') }}</v-btn>
			</router-link>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mixins } from '@/model/i18n'

defineOptions({ name: 'changelog-version', i18n: {}, mixins: [...mixins] })

const props = defineProps<{
	version: any
}>()

const { t, locale } = useI18n()
const changelog = ref<any>(null)

function update() {
	import(/* webpackChunkName: "changelog-[request]" */ `@/component/changelog/changelog.${locale.value}.yaml`).then((module) => {
		changelog.value = module.default
	})
}

watch(locale, update)
update()

const changes = computed(() => {
	if (!props.version || !changelog.value) return []
	return changelog.value[props.version.version]
})

const sections = computed(() => {
	if (!props.version) return []

	const collected = []
	if (Array.isArray(changes.value)) {
		collected.push(changes.value)
	} else {
		for (const key in changes.value) {
			if (key === 'title') continue
			collected.push(changes.value[key])
		}
	}
	const regex = /#img_(\w+)/g
	const codeRegex = /`([^`]+)`/g
	return collected.map((cat: any) => cat
		.map((c: any) => ({
			text: c.replace('# ', '').replace('#ai', '<span class="ai" title="' + t('changelog.need_ai_change') + '">AI</span>').replace(regex, '').replace(codeRegex, '<code>$1</code>'),
			images: Array.from(c.matchAll(regex), (m: any) => m[1])
		}))
	)
})
</script>

<style lang="scss" scoped>
	.version {
		background: rgba(100,100,100,0.1);
	}
	.change {
		padding: 0 10px;
		line-height: 20px;
		font-size: 15px;
		:deep(.ai) {
			background: #00a3cc;
			padding: 0 4px;
			color: white;
			border-radius: 4px;
			cursor: help;
		}
		:deep(code) {
			display: inline;
			background: var(--background-secondary);
			border: 1px solid var(--border);
			padding: 0 5px;
			border-radius: 3px;
			font-family: monospace;
			font-size: 0.9em;
			color: var(--text-color);
		}
		.screenshot {
			color: #5fad1b;
			cursor: pointer;
			padding: 0 4px;
			border-radius: 4px;
			font-size: 20px;
			vertical-align: top;
			display: inline-block;
			&:hover {
				color: var(--text-color);
				border-color: var(--text-color);
			}
		}
	}
	.image-menu {
		vertical-align: bottom;
		max-width: 700px;
		max-height: 600px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	.image {
		width: 100%;
		vertical-align: bottom;
	}
	.wrapper {
		max-width: 820px;
		margin: 0 auto;
		background: var(--background);
		padding: 15px;
	}
	h4 {
		margin-bottom: 10px;
		text-transform: uppercase;
		color: var(--text-color);
		font-size: 19px;
	}
	h4:not(.first) {
		margin-top: 10px;
	}
	.button {
		margin-top: 10px;
	}
</style>