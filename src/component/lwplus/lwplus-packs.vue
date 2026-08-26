<template>
	<panel :title="$t('title')" icon="mdi-star-four-points" class="lwplus-packs">
		<div class="pitch">
			{{ $t('pitch') }}
			<router-link to="/lwplus">{{ $t('learn_more') }}</router-link>
		</div>

		<div v-if="until" class="until">{{ $t('active_until', [formatDate(until)]) }}</div>

		<loader v-if="loading" />
		<div v-else class="packs">
			<div v-for="pack in packs" :key="pack.id" class="pack" :class="{selected: euroPack?.id === pack.id}">
				<div class="months">{{ monthsLabel(pack.months) }}</div>
				<div v-if="discount(pack)" class="save">{{ $t('save', [discount(pack)]) }}</div>

				<v-btn class="buy-euro" :disabled="busy" @click="payEuros(pack)">
					<span v-if="LeekWars.currencies[LeekWars.currency].prefix"><span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>{{ price(pack) }}</span>
					<span v-else>{{ price(pack) }}&nbsp;<span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span></span>
				</v-btn>

				<v-btn class="buy-crystals" variant="tonal" :disabled="busy || !enough(pack)" :loading="buying === pack.id" @click="payCrystals(pack)">
					{{ $filters.number(pack.crystals) }}&nbsp;<span class="crystal"></span>
				</v-btn>
			</div>
		</div>

		<!-- Paiement en euros : le Payment Element se déplie sous la grille, sans
		     quitter la page. Un seul lot à la fois, celui sur lequel on a cliqué. -->
		<div v-if="euroPack" class="euro-payment">
			<loader v-if="stripeLoading" />
			<div id="lwplus-packs-payment-element"></div>
			<v-btn v-if="stripeReady" color="primary" size="large" :loading="paying" block class="pay-btn" @click="confirmEuros">
				<template #prepend><v-icon>mdi-lock</v-icon></template>
				{{ $t('pay_for', [monthsLabel(euroPack.months)]) }}
			</v-btn>
		</div>

		<div v-if="message" class="message">{{ message }}</div>
		<div v-if="error" class="error-message">{{ error }}</div>
	</panel>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'

defineOptions({ name: 'LwplusPacks', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('lwplus-packs')

interface MonthPack { id: number, months: number, crystals: number, prices: Record<string, number> }

const packs = ref<MonthPack[]>([])
const loading = ref(true)
const buying = ref(0)
const paying = ref(false)
const message = ref('')
const error = ref('')
const until = ref(store.state.farmer?.lwplus_until ?? 0)

const euroPack = ref<MonthPack | null>(null)
const stripeLoading = ref(false)
const stripeReady = ref(false)
let stripe: Stripe | null = null
let elements: StripeElements | null = null

const formatDate = LeekWars.formatDate

// Pluriel géré à la main plutôt que par $tc : deux formes suffisent ici, et ça
// évite d'imposer une règle de pluriel à 17 fichiers de langue pour un seul mot.
function monthsLabel(n: number) {
	return n === 1 ? t('months_one', [n]) : t('months_other', [n])
}

// Un achat en cours (cristaux ou euros) verrouille toute la grille : sans ça, un
// double clic sur deux lots différents lance deux paiements que le joueur ne voit
// pas arriver.
const busy = ref(false)

function price(pack: MonthPack) {
	const n = pack.prices[LeekWars.currency]
	return Math.floor(n) !== n ? n.toFixed(2) : n
}

// Remise par rapport au prix du lot d'un mois, arrondie à l'entier. Renvoie 0 pour
// le lot d'un mois, ce qui masque le badge.
function discount(pack: MonthPack) {
	const single = packs.value.find(p => p.months === 1)
	if (!single || pack.months <= 1) return 0
	const full = single.prices.EUR * pack.months
	return Math.round((1 - pack.prices.EUR / full) * 100)
}

function enough(pack: MonthPack) {
	return (store.state.farmer?.crystals ?? 0) >= pack.crystals
}

function applyUntil(newUntil: number) {
	until.value = newUntil
	if (store.state.farmer) {
		store.state.farmer.lwplus_until = newUntil
		store.state.farmer.lwplus = newUntil * 1000 > Date.now()
	}
}

onMounted(async () => {
	try {
		const data = await LeekWars.get('subscription/get-packs')
		packs.value = data.packs
	} catch (_e) {
		error.value = t('generic_error')
	} finally {
		loading.value = false
	}
})

async function payCrystals(pack: MonthPack) {
	if (busy.value) return
	busy.value = true
	buying.value = pack.id
	message.value = ''
	error.value = ''
	try {
		const data = await LeekWars.post('subscription/buy-months-with-crystals', { pack_id: pack.id })
		if (store.state.farmer) { store.state.farmer.crystals = data.crystals }
		applyUntil(data.lwplus_until)
		message.value = t('bought', [formatDate(data.lwplus_until)])
	} catch (err) {
		const code = (err as { error?: string } | null)?.error
		error.value = code === 'not_enough_crystals' ? t('not_enough_crystals') : t('generic_error')
	} finally {
		busy.value = false
		buying.value = 0
	}
}

// Apparence calée sur le thème du site, comme la banque et /lwplus : le Payment
// Element doit coller au panneau en clair comme en sombre.
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

let paymentIntentId = ''

async function payEuros(pack: MonthPack) {
	if (busy.value) return
	euroPack.value = pack
	stripeReady.value = false
	stripeLoading.value = true
	message.value = ''
	error.value = ''
	try {
		const r = await LeekWars.post('subscription/begin-months-payment', { pack_id: pack.id, currency: LeekWars.currency })
		paymentIntentId = r.payment_intent_id
		stripe = await loadStripe(r.publishable_key)
		if (!stripe) { throw new Error('stripe') }
		elements = stripe.elements({ clientSecret: r.client_secret, appearance: stripeAppearance() })
		const element = elements.create('payment')
		// Bouton révélé seulement sur 'ready' : sinon un clic peut partir avant que
		// l'iframe Stripe soit chargée, et confirmPayment lance une IntegrationError (#4379).
		element.on('ready', () => { stripeReady.value = true })
		element.on('loaderror', (e) => { error.value = e.error?.message || t('generic_error') })
		await nextTick()
		element.mount('#lwplus-packs-payment-element')
	} catch (err) {
		const code = (err as { error?: string } | null)?.error
		error.value = code === 'stripe_not_configured' ? t('unavailable') : t('generic_error')
		euroPack.value = null
	} finally {
		stripeLoading.value = false
	}
}

async function confirmEuros() {
	if (!stripe || !elements || !euroPack.value) return
	busy.value = true
	paying.value = true
	error.value = ''
	let stripeError
	try {
		;({ error: stripeError } = await stripe.confirmPayment({
			elements,
			confirmParams: { return_url: window.location.origin + '/lwplus' },
			redirect: 'if_required'
		}))
	} catch (err) {
		stripeError = { message: (err as { message?: string } | null)?.message || t('generic_error') }
	}
	if (stripeError) {
		error.value = stripeError.message || t('generic_error')
		busy.value = false
		paying.value = false
		return
	}
	// Le paiement est passé chez Stripe ; c'est execute-stripe-payment (ou le webhook,
	// en filet) qui accorde les mois. On confirme tout de suite pour ne pas faire
	// attendre le joueur, l'octroi est idempotent des deux côtés.
	try {
		const data = await LeekWars.post('bank/execute-stripe-payment', { payment_intent_id: paymentIntentId })
		applyUntil(data.lwplus_until)
		message.value = t('bought', [formatDate(data.lwplus_until)])
		euroPack.value = null
	} catch (_err) {
		error.value = t('activation_pending')
	} finally {
		busy.value = false
		paying.value = false
	}
}
</script>

<style lang="scss" scoped>
	// Violet identitaire de LW+, le même que le badge du profil et la page /lwplus,
	// qui le définissent aussi en local : couleur de marque, pas une neutre du thème.
	$lwplus: #8e44ad;

	.pitch {
		padding: 12px;
		color: var(--text-color-secondary);
		a {
			color: $lwplus;
			font-weight: 500;
		}
	}
	.until {
		padding: 0 12px 12px;
		font-weight: 500;
	}
	.packs {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		padding: 0 12px 12px;
	}
	.pack {
		flex: 1 1 140px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		&.selected {
			border-color: $lwplus;
		}
	}
	.months {
		font-size: 17px;
		font-weight: 500;
	}
	.save {
		font-size: 12px;
		font-weight: 500;
		color: $lwplus;
	}
	.buy-euro, .buy-crystals {
		width: 100%;
	}
	.buy-euro {
		background: $lwplus;
		color: white;
	}
	.euro-payment {
		padding: 0 12px 12px;
	}
	.pay-btn {
		margin-top: 12px;
		background: $lwplus;
		color: white;
	}
	.message {
		padding: 0 12px 12px;
		color: $lwplus;
		font-weight: 500;
	}
	.error-message {
		padding: 0 12px 12px;
		color: red;
	}
</style>
