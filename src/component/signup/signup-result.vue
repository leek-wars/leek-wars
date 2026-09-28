<template lang="html">
	<div>
		<div class="page-header page-bar">
			<div v-if="success" class="page-title">
				<page-icon name="signup" fallback="mdi-account-plus" />
				<div class="page-title-text">
					<h1>{{ $t('validated') }}</h1>
				</div>
			</div>
		</div>
		<panel class="first center">
			<img src="/image/map/nexus_block_small.png">
			<br><br>
			<i18n-t tag="h2" class="signup-message" keypath="validated_message">
				<template #farmer>
					<b>{{ farmer }}</b>
				</template>
			</i18n-t>
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
import { mixins } from '@/model/i18n'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'SignupResult', i18n: {}, mixins: [...mixins] })

const props = defineProps<{
	result?: string
}>()

const route = useRoute()
const success = computed(() => props.result === 'success')
const farmer = computed(() => route.params.farmer)
</script>

<style lang="scss" scoped>
	h2 {
		font-size: 18px;
		color: var(--grey-2);
	}
</style>