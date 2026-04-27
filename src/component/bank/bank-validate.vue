<template lang="html">
	<div class="page">
		<loader v-if="loading" />
		<template v-else-if="success">
			<div class="page-header page-bar">
				<h1><breadcrumb :items="[{name: $t('title'), link: '/bank'}, {name: $t('payment_success_simple'), link: ''}]" :raw="true" /></h1>
			</div>
			<panel class="first center">
				<br>
				<div class="thank-you">{{ $t('thank_you') }}</div>
				<div class="thank-you-2">{{ $t('for_your_support') }}</div>
				<br><br>
				<h4>
					<i18n-t keypath="you_earn_n_crystals">
						<template #crystals>
							<div class="crystals card">
								{{ crystals }}
								<span class="crystal"></span>
							</div>
						</template>
					</i18n-t>
				</h4>
				<br><br><br>
				<router-link to="/bank">
					<v-btn color="primary"><v-icon>mdi-undo</v-icon> {{ $t('back_to_bank') }}</v-btn>
				</router-link>
				<br><br>
			</panel>
		</template>
		<div v-else-if="error">
			<div class="page-header page-bar">
				<h1><breadcrumb :items="[{name: $t('title'), link: '/bank'}, {name: $t('payment_fail', [vendor]), link: ''}]" :raw="true" /></h1>
			</div>
			<panel class="first center">
				<br>
				<img src="/image/notgood.png"><br><br>
				<h4>{{ $t('payment_fail_reason', [$t(reason || '')]) }}</h4>
				<br>
				<router-link to="/bank"><v-btn>{{ $t('back_to_bank') }}</v-btn></router-link>
			</panel>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { mixins } from '@/model/i18n'
import Breadcrumb from '@/component/forum/breadcrumb.vue'

defineOptions({ name: 'bank', i18n: {}, mixins: [...mixins] })

const props = defineProps<{
	success?: boolean
}>()

const { t } = useI18n()
const route = useRoute()

const loading = ref(false)
const error = ref(false)
const reason = ref<string | null>(null)
const crystals = ref(0)
const vendor = ref<string | null>(null)

function update() {
	loading.value = false
	reason.value = 'reason' in route.params ? (route.params.reason as string) : ''
	crystals.value = 'crystals' in route.params ? parseInt(route.params.crystals as string, 10) : 0
	vendor.value = 'vendor' in route.params ? (route.params.vendor as string) : ''
	if (props.success !== undefined) {
		error.value = true
	}
}
update()

watch(() => route.fullPath, update)

onMounted(() => {
	setTimeout(() => LeekWars.setTitle(t('title')), 100)
})
</script>

<style lang="scss" scoped>
	.content h3 {
		color: red;
	}
	.crystals {
		display: inline-block;
		padding: 4px 8px;
		margin: 0 2px;
		// color: black;
	}
	.thank-you {
		font-size: 30px;
		font-weight: 300;
		margin-bottom: 10px;
	}
	.thank-you-2 {
		font-size: 20px;
		color: #777;
	}
	i {
		padding-right: 5px;
	}
</style>