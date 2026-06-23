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

				<div class="payment">
					<div class="card-payment">
						<loader v-if="stripeLoading" />
						<div id="stripe-payment-element"></div>
						<div v-if="stripeError" class="stripe-error">{{ stripeError }}</div>
						<v-btn v-if="stripeReady" color="primary" :loading="stripePaying" block class="pay-btn" @click="payWithStripe">
							<v-icon>mdi-lock</v-icon> {{ $t('pay') }}
						</v-btn>
					</div>

					<div class="pay-separator"><span>{{ $t('or') }}</span></div>

					<div class="paypal-payment">
						<div v-if="!loading" id="paypal-button-container"></div>
						<loader v-else />
					</div>
				</div>
			</div>
			<div class="back">
				<v-btn variant="tonal" to="/bank"><v-icon>mdi-arrow-left</v-icon> {{ $t('back') }}</v-btn>
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { env } from '@/env'
import { loadScript } from '@paypal/paypal-js'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'
import { mixins, useNamespacedT } from '@/model/i18n'
import { cspNonce } from '@/component/editor/monaco-csp'
import BankProduct from './bank-product.vue'
import Breadcrumb from '@/component/forum/breadcrumb.vue'
import { store } from '@/model/store'

defineOptions({ name: 'Bank', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('bank')
const route = useRoute()
const router = useRouter()

interface Pack { id: number; crystals: number; bonus: number; prices: Record<string, number> }

const pack = ref(0)
const offer = ref(0)
const product = ref<Pack | null>(null)
const loading = ref(false)
const firstPurchase = ref(false)

let stripe: Stripe | null = null
let elements: StripeElements | null = null
const stripeLoading = ref(false)
const stripeReady = ref(false)
const stripePaying = ref(false)
const stripeError = ref('')
const stripePaymentIntentId = ref('')
let stripeInitToken = 0

// Apparence Stripe calée sur le thème Leek Wars : on part du thème night/stripe
// puis on injecte les vraies couleurs du site (variables CSS) pour que le Payment
// Element colle au panneau, en clair comme en sombre.
function stripeAppearance() {
	const s = getComputedStyle(document.body)
	const v = (name: string) => s.getPropertyValue(name).trim() || undefined
	return {
		theme: (LeekWars.darkMode ? 'night' : 'stripe') as 'night' | 'stripe',
		variables: {
			colorPrimary: v('--primary'),
			colorBackground: v('--background'),
			colorText: v('--text-color'),
			colorTextSecondary: v('--text-color-secondary'),
			borderRadius: '4px',
		},
	}
}

async function initStripe() {
	if (!product.value) return
	// Jeton anti-course : un changement de devise pendant un init en cours
	// ne doit pas monter un Payment Element périmé.
	const token = ++stripeInitToken
	stripeReady.value = false
	stripeError.value = ''
	stripeLoading.value = true
	if (elements) { elements = null }
	try {
		const r = await LeekWars.post('bank/begin-stripe-payment', { pack_id: pack.value, offer_id: 1, currency: LeekWars.currency })
		if (token !== stripeInitToken) return
		stripePaymentIntentId.value = r.payment_intent_id
		stripe = await loadStripe(r.publishable_key)
		if (token !== stripeInitToken || !stripe) return
		elements = stripe.elements({ clientSecret: r.client_secret, appearance: stripeAppearance() })
		const paymentElement = elements.create('payment')
		await nextTick()
		if (token !== stripeInitToken) return
		paymentElement.mount('#stripe-payment-element')
		stripeReady.value = true
	} catch (err) {
		if (token === stripeInitToken) stripeError.value = (err as { error?: string } | null)?.error === 'stripe_not_configured' ? t('payment_unavailable') : t('card_error_generic')
	} finally {
		if (token === stripeInitToken) stripeLoading.value = false
	}
}

async function payWithStripe() {
	if (!stripe || !elements) return
	stripePaying.value = true
	stripeError.value = ''
	const { error } = await stripe.confirmPayment({
		elements,
		// redirect 'if_required' : les cartes se valident sans quitter la page ;
		// les moyens à redirection (wallets) reviennent sur return_url.
		confirmParams: { return_url: window.location.origin + '/bank/buy/' + pack.value },
		redirect: 'if_required'
	})
	if (error) {
		stripeError.value = error.message || t('card_error_generic')
		stripePaying.value = false
		LeekWars.post('bank/track-payment-abort', { order_id: stripePaymentIntentId.value, reason: 'error' })
		return
	}
	confirmStripePayment(stripePaymentIntentId.value)
}

function confirmStripePayment(paymentIntentId: string) {
	LeekWars.post('bank/execute-stripe-payment', { payment_intent_id: paymentIntentId }).then(d => {
		store.commit('update-crystals', d.crystals)
		router.replace('/bank/validate/success/' + d.crystals)
	}).catch((err: unknown) => {
		stripePaying.value = false
		router.replace('/bank/validate/failed/' + ((err as { error?: string } | null)?.error ?? 'unknown'))
	})
}

const breadcrumb_items = computed(() => {
	const items: { name: string, link: string }[] = [{ name: t('title'), link: '/bank' }]
	if (product.value) {
		items.push({ name: t('purshase_title_text_simple', [product.value.crystals]), link: '/bank/buy/' + pack.value })
	}
	return items
})

function loadPayPal() {
	loadScript({
		// Sandbox PayPal aussi sur beta : sinon le bouton PayPal de la beta de test
		// déclencherait de vrais paiements (Stripe, lui, est déjà en test sur beta).
		'client-id': (LeekWars.LOCAL || env.BETA || store.state.farmer?.id === 1) ? 'Acg3b4FoxUp3vXX-G4aQ01vc5rkev2DIio8e2_ApB7OVIVHocmuXu7RJcN5zZTHGCOpqf-a-ukdIELDy' : 'AesWr04mqzJrZlvdiR99GWBSnvWya49kuhJm84d3bgg7Afq-Ekh7PbunWFL6UOFXdQFw0TGmwr_vzS74',
		currency: LeekWars.currency,
		// La carte est gérée par Stripe : on retire le bouton "Carte bancaire" du SDK
		// PayPal pour ne pas avoir deux chemins carte redondants.
		'disable-funding': 'card',
		'data-csp-nonce': cspNonce
	}).then((paypal) => {
		paypal!.Buttons!({
			style: { layout: 'vertical', color: LeekWars.darkMode ? 'black' : 'blue', shape: 'rect', label: 'paypal', tagline: false },
			createOrder: (_data, _actions) => new Promise((resolve) => {
				return LeekWars.post('bank/begin-paypal-payment', { pack_id: pack.value, offer_id: 1, currency: LeekWars.currency }).then(resolve)
			}),
			onApprove: (data, _actions) => {
				return LeekWars.post('bank/execute-paypal-payment', { order_id: data.orderID }).then(d => {
					store.commit('update-crystals', d.crystals)
					router.replace('/bank/validate/success/' + d.crystals)
				}).catch((err: unknown) => {
					router.replace('/bank/validate/failed/' + ((err as { error?: string } | null)?.error ?? 'unknown'))
				})
			},
			// Abandon a l'etape d'approbation PayPal (begin 200 sans execute qui suit) : on trace
			// pour distinguer une annulation volontaire (onCancel) d'un plantage du SDK (onError).
			onCancel: (data) => {
				LeekWars.post('bank/track-payment-abort', { order_id: (data as { orderID?: string }).orderID || '', reason: 'cancel' })
			},
			onError: (err) => {
				LeekWars.post('bank/track-payment-abort', { order_id: '', reason: 'error' })
				console.error('PayPal button error', err)
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
	// Retour de redirection Stripe (wallets) : on finalise côté serveur.
	const returnedPI = route.query.payment_intent as string | undefined
	if (returnedPI && route.query.redirect_status === 'succeeded') {
		confirmStripePayment(returnedPI)
	} else {
		initStripe()
	}
	LeekWars.setTitle(t('title'), t('purshase_title_text_simple', [data.pack.crystals]))
})

watch(() => LeekWars.currency, () => {
	localStorage.setItem('currency', LeekWars.currency)
	loadPayPal()
	initStripe()
})

// Le Payment Element suit le dark mode en direct (toggle sans rechargement).
watch(() => LeekWars.darkMode, () => {
	elements?.update({ appearance: stripeAppearance() })
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
	.payment {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.card-payment {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	#stripe-payment-element {
		min-height: 40px;
	}
	.stripe-error {
		color: #c62828;
		font-size: 14px;
	}
	#app.dark .stripe-error {
		color: #ef9a9a;
	}
	.pay-btn {
		margin-top: 4px;
	}
	.pay-separator {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--text-color-secondary);
		font-size: 13px;
		text-transform: uppercase;
	}
	.pay-separator::before,
	.pay-separator::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}
</style>
