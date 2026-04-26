<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ _title }}</h1>
		</div>
		<panel class="first center">
			<img src="/image/notgood.png">
			<br><br>
			<slot name="message">{{ _message }}</slot>
			<br><br>
			<slot name="button">
				<router-link to="/">
					<v-btn size="large" color="primary">{{ $t('main.back_to_home') }}</v-btn>
				</router-link>
			</slot>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineOptions({ name: 'error' })

const props = defineProps<{
	title?: string
	message?: string
}>()

const { t, te } = useI18n()
const route = useRoute()

const _title = computed(() => {
	const k = 'main.' + route.params.title
	if (te(k)) return t(k)
	return props.title || t('main.error')
})

const _message = computed(() => {
	if (route.params.message) return t('main.' + route.params.message)
	return props.message || t('main.page_not_found')
})
</script>