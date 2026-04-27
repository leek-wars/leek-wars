<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
		</div>
		<panel class="first">

			<v-select v-model="LeekWars.currency" :items="Object.keys(LeekWars.currencies)" hide-details density="compact" variant="solo">
				<template #selection>
					<flag :code="LeekWars.currencies[LeekWars.currency].flag" :clickable="false" />&nbsp;
					{{ LeekWars.currency }} &nbsp; <span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>
				</template>
				<template #item="{ props, item }">
					<v-list-item v-bind="props" class="currency">
						<template #prepend>
							<flag :code="LeekWars.currencies[item.value].flag" :clickable="false" />
						</template>
						<template #append>
							<span class="symbol">{{ LeekWars.currencies[item.value].symbol }}</span>
						</template>
					</v-list-item>
				</template>
			</v-select>

			<div v-if="firstPurchase" class="first-purchase-banner">
				<v-icon>mdi-gift</v-icon> {{ $t('first_purchase_banner') }}
			</div>

			<div class="container">
				<bank-product v-if="product" :product="product" :index="pack" :preview="true" :first-purchase="firstPurchase" />

				<!-- <div v-if="data.vendor === 'StarPass'">
					<br>
					<loader v-if="starPassLoading" />
					<div :id="'starpass_' + data.id" @DOMNodeInserted="starPassLoading = false"></div>
					<div ref="starpass"></div>
				</div>
				<div v-else-if="data.vendor === 'PayPal'"> -->
				<div>
					<!-- <br>
					<h4>{{ $t('paypal_message') }}</h4> -->
					<!-- <br> -->
					<div v-if="!loading" id="paypal-button-container"></div>
					<loader v-else />
				</div>
			</div>
			<div class="back">
				<v-btn variant="tonal" to="/bank"><v-icon>mdi-arrow-left</v-icon> {{ $t('back') }}</v-btn>
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { loadScript } from '@paypal/paypal-js'
import { mixins } from '@/model/i18n'
import BankProduct from './bank-product.vue'
import Breadcrumb from '@/component/forum/breadcrumb.vue'
import { store } from '@/model/store'

defineOptions({ name: 'bank', i18n: {}, mixins: [...mixins] })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const pack = ref(0)
const offer = ref(0)
const product = ref<any>(null)
const loading = ref(false)
const firstPurchase = ref(false)

const breadcrumb_items = computed(() => {
	const items: { name: string, link: string }[] = [{ name: t('title'), link: '/bank' }]
	if (product.value) {
		items.push({ name: t('purshase_title_text_simple', [product.value.crystals]), link: '/bank/buy/' + pack.value })
	}
	return items
})

function loadPayPal() {
	loadScript({
		'client-id': (LeekWars.LOCAL || store.state.farmer?.id === 1) ? 'Acg3b4FoxUp3vXX-G4aQ01vc5rkev2DIio8e2_ApB7OVIVHocmuXu7RJcN5zZTHGCOpqf-a-ukdIELDy' : 'AesWr04mqzJrZlvdiR99GWBSnvWya49kuhJm84d3bgg7Afq-Ekh7PbunWFL6UOFXdQFw0TGmwr_vzS74',
		currency: LeekWars.currency
	}).then((paypal) => {
		paypal!.Buttons!({
			style: { layout: 'vertical', color: LeekWars.dark > 0 ? 'black' : 'blue', shape: 'rect', label: 'paypal', tagline: false },
			createOrder: (_data, _actions) => new Promise((resolve) => {
				return LeekWars.post('bank/begin-paypal-payment', { pack_id: pack.value, offer_id: 1, currency: LeekWars.currency }).then(resolve)
			}),
			onApprove: (data, _actions) => {
				return LeekWars.post('bank/execute-paypal-payment', { order_id: data.orderID }).then(d => {
					store.commit('update-crystals', d.crystals)
					router.replace('/bank/validate/success/' + d.crystals)
				}).catch((err: any) => {
					router.replace('/bank/validate/failed/' + err.error)
				})
			}
		}).render('#paypal-button-container')
	}).catch((err) => {
		console.error('failed to load the PayPal JS SDK script', err)
	})
}

pack.value = parseInt(route.params.pack as string, 10)
offer.value = parseInt(route.params.offer as string, 10)
LeekWars.get('bank/get-pack/' + pack.value).then(data => {
	product.value = data.pack
	firstPurchase.value = data.first_purchase
	loadPayPal()
	LeekWars.setTitle(t('title'), t('purshase_title_text_simple', [data.pack.crystals]))
})

watch(() => LeekWars.currency, () => {
	localStorage.setItem('currency', LeekWars.currency)
	loadPayPal()
})
</script>

<style lang="scss" scoped>
.currency {
	display: flex;
	align-items: center;
}
.flag {
	max-width: 28px;
	max-height: 28px;
	margin-right: 8px;
}
.first {
	padding: 25px 0;
}
.v-select {
	display: inline-block;
	:deep(input) {
		border: none;
		width: 10px;
	}
}
.container {
	padding: 10px 0px;
	align-items: flex-start;
	gap: 25px;
}
.container > * {
	flex: 1;
}
#app.app .container {
	flex-direction: column;
	> * {
		width: 100%;
	}
}

	.first-purchase-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		margin: 10px 0;
		font-size: 16px;
		font-weight: 600;
		border-radius: 4px;
		background: #7b1fa2;
		color: white;
	}
	.back {
		padding: 10px;
		text-align: center;
	}
	.paypal-button {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		background: #ffc700;
		color: #00315b;
		padding: 12px 50px;
		border-radius: 2px;
		border: 1px solid #ff9500;
		user-select: none;
		margin: 15px 0;
		img {
			height: 22px;
			margin-left: 4px;
		}
	}
	.panel h3 {
		color: red;
	}
	.panel :deep(.sk-main-content h3:before) {
		width: 0;
	}
	.panel :deep(.sk-main-content h3:after),
	.panel :deep(.sk-kit-header h1:after) {
		border: none;
	}
	#app.dark #paypal-button-container {
		color-scheme: none;
	}
</style>