<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>

		<panel class="first hero-panel">
			<div class="hero">
				<div class="mark">LW<span class="plus-sign">+</span></div>
				<div class="pitch">{{ $t('pitch') }}</div>
				<div class="price">
					<span class="amount">{{ $t('price_per_month', [priceEur]) }}</span>
					<span class="notice">{{ $t('price_notice') }}</span>
				</div>
			</div>

			<div class="benefits">
				<div v-for="benefit in benefits" :key="benefit.key" class="benefit">
					<v-icon class="icon">{{ benefit.icon }}</v-icon>
					<div class="label">{{ $t('benefit_' + benefit.key) }}</div>
					<div class="plus-value">{{ $t('plus_' + benefit.key) }}</div>
					<!-- « Gratuit : - » ne veut rien dire : sur les avantages qui n'existent
					     pas du tout en gratuit, on n'affiche simplement pas la ligne. -->
					<div v-if="$t('free_' + benefit.key) !== '-'" class="free-value">
						{{ $t('column_free') }} : {{ $t('free_' + benefit.key) }}
					</div>
				</div>
			</div>
		</panel>

		<panel v-if="loading">
			<loader />
		</panel>

		<!-- Abonnement en cours : état et gestion -->
		<panel v-else-if="active" :title="$t('your_subscription')">
			<div class="status">
				<v-icon class="ok">mdi-check-decagram</v-icon>
				<span v-if="cancelAtPeriodEnd">{{ $t('active_until', [formatDate(until)]) }}</span>
				<span v-else>{{ $t('renews_on', [formatDate(until)]) }}</span>
			</div>
			<div v-if="cancelAtPeriodEnd" class="canceled-notice">{{ $t('canceled_notice') }}</div>

			<div class="actions">
				<v-btn v-if="cancelAtPeriodEnd" color="primary" :loading="updating" @click="resume">
					<v-icon>mdi-refresh</v-icon> {{ $t('resume') }}
				</v-btn>
				<v-btn v-else variant="tonal" :loading="updating" @click="cancel">
					{{ $t('cancel_subscription') }}
				</v-btn>
			</div>
			<div v-if="error" class="error-message">{{ error }}</div>
		</panel>

		<!-- Pas encore abonné : tunnel de souscription -->
		<panel v-else :title="$t('subscribe_title')">
			<div v-if="!verified" class="not-verified">{{ $t('must_verify') }}</div>
			<template v-else>
				<loader v-if="stripeLoading" />
				<div id="stripe-subscription-element"></div>
				<div v-if="error" class="error-message">{{ error }}</div>
				<v-btn v-if="stripeReady" size="large" :loading="paying" block class="pay-btn" @click="subscribe">
					<template #prepend><v-icon>mdi-lock</v-icon></template>
					{{ $t('subscribe_for', [priceEur]) }}
				</v-btn>
				<div class="cancel-anytime">{{ $t('cancel_anytime') }}</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'

defineOptions({ name: 'lwplus', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('lwplus')

// Ordre d'affichage du comparatif. Les clés servent aussi de suffixe i18n
// (benefit_*, free_*, plus_*), donc une carte = une seule entrée ici.
// Les noms d'icônes sont écrits en toutes lettres pour que
// scripts/generate-mdi-icons.mjs les trouve au scan (sinon icône vide).
const benefits = [
	{ key: 'fights', icon: 'mdi-sword-cross' },
	{ key: 'queue', icon: 'mdi-fast-forward' },
	{ key: 'ratelimit', icon: 'mdi-speedometer' },
	{ key: 'accounts', icon: 'mdi-account-multiple' },
	{ key: 'badge', icon: 'mdi-shield-star' },
	{ key: 'crystals', icon: 'mdi-diamond-stone' },
]

const priceEur = ref(3)
const loading = ref(true)
const active = ref(false)
const until = ref(0)
const cancelAtPeriodEnd = ref(false)
const updating = ref(false)
const paying = ref(false)
const error = ref('')

const stripeLoading = ref(false)
const stripeReady = ref(false)
let stripe: Stripe | null = null
let elements: StripeElements | null = null

const verified = ref(store.state.farmer ? store.state.farmer.verified : false)
const formatDate = LeekWars.formatDate

// Apparence calée sur le thème du site, comme la banque : le Payment Element doit
// coller au panneau en clair comme en sombre (LeekWars.darkMode, PAS LeekWars.dark).
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

function applyStatus(data: { active: boolean, until: number, cancel_at_period_end: boolean, price_eur?: number }) {
	active.value = data.active
	until.value = data.until
	cancelAtPeriodEnd.value = data.cancel_at_period_end
	if (data.price_eur) { priceEur.value = data.price_eur }
	if (store.state.farmer) {
		store.state.farmer.lwplus = data.active
		store.state.farmer.lwplus_until = data.until
	}
}

async function refreshStatus() {
	const data = await LeekWars.get('subscription/get-status')
	applyStatus(data)
	return data
}

onMounted(async () => {
	try {
		const data = await refreshStatus()
		if (!data.active && verified.value) { initStripe() }
	} catch (e) {
		error.value = t('generic_error')
	} finally {
		loading.value = false
	}
})

async function initStripe() {
	stripeReady.value = false
	stripeLoading.value = true
	error.value = ''
	try {
		const r = await LeekWars.post('subscription/subscribe', {})
		stripe = await loadStripe(r.publishable_key)
		if (!stripe) { throw new Error('stripe') }
		elements = stripe.elements({ clientSecret: r.client_secret, appearance: stripeAppearance() })
		const element = elements.create('payment')
		// Bouton révélé seulement sur 'ready' : sinon un clic peut partir avant que
		// l'iframe Stripe soit chargée, et confirmPayment lance une IntegrationError (#4379).
		element.on('ready', () => { stripeReady.value = true })
		element.on('loaderror', (e) => { error.value = e.error?.message || t('generic_error') })
		await nextTick()
		element.mount('#stripe-subscription-element')
	} catch (err) {
		const code = (err as { error?: string } | null)?.error
		error.value = code === 'stripe_not_configured' ? t('unavailable') : t('generic_error')
	} finally {
		stripeLoading.value = false
	}
}

async function subscribe() {
	if (!stripe || !elements) { return }
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
		paying.value = false
		return
	}
	// Le droit est ouvert par le webhook, pas par cette réponse : on laisse à Stripe
	// le temps de nous l'envoyer avant de dire au joueur que ce n'est pas actif.
	for (let i = 0; i < 5; i++) {
		const data = await refreshStatus()
		if (data.active) { paying.value = false; return }
		await new Promise(resolve => setTimeout(resolve, 1500))
	}
	paying.value = false
	error.value = t('activation_pending')
}

async function cancel() {
	updating.value = true
	error.value = ''
	try {
		await LeekWars.post('subscription/cancel', {})
		await refreshStatus()
	} catch (e) {
		error.value = t('generic_error')
	} finally {
		updating.value = false
	}
}

async function resume() {
	updating.value = true
	error.value = ''
	try {
		await LeekWars.post('subscription/resume', {})
		await refreshStatus()
	} catch (e) {
		error.value = t('generic_error')
	} finally {
		updating.value = false
	}
}
</script>

<style lang="scss" scoped>
	// LW+ prend l'or du système (jetons --gold / --gold-text en aplat,
	// --rank-first en encre), pas une couleur en dur : ils s'inversent tout seuls
	// en sombre. L'or plein ne sert QU'aux aplats — en fond de bandeau, seules des
	// encres sombres y passent (mesuré 4,16 sur le stop foncé, sous le seuil), d'où
	// le lavis clair ci-dessous qui garde l'encre normale du site.

	.hero-panel :deep(.content) {
		padding: 0;
	}
	.hero {
		background: linear-gradient(135deg,
			color-mix(in srgb, var(--gold) 22%, var(--background)) 0%,
			color-mix(in srgb, var(--gold) 10%, var(--background)) 100%);
		color: var(--text-color);
		padding: 28px 20px 24px;
		text-align: center;
	}
	.mark {
		font-size: 46px;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -1px;
		// L'or en encre sur le lavis : 3,9 en clair et 7,9 en sombre (mesurés).
		// Sous 4,5, mais la marque fait 46 px en 800 — c'est du gros texte, seuil 3.
		.plus-sign {
			color: var(--rank-first);
		}
	}
	.hero .pitch {
		margin: 12px auto 0;
		max-width: 520px;
		color: var(--text-color-secondary);
	}
	.hero .price {
		margin-top: 18px;
		// Le seul vrai aplat d'or de la page : c'est lui qui porte l'identité.
		.amount {
			display: inline-block;
			background: var(--gold);
			color: var(--gold-text);
			padding: 6px 16px;
			border-radius: var(--radius);
			font-size: 24px;
			font-weight: 700;
		}
		.notice {
			display: block;
			margin-top: 8px;
			font-size: 13px;
			color: var(--text-color-secondary);
		}
	}
	.benefits {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: var(--border);
	}
	.benefit {
		background: var(--panel-background);
		padding: 16px 12px;
		text-align: center;
		transition: background 120ms ease;
		&:hover {
			background: var(--background-secondary);
		}
		.icon {
			color: var(--rank-first);
			font-size: 30px;
			margin-bottom: 6px;
		}
		.label {
			font-size: 13px;
			color: var(--text-color-secondary);
		}
		.plus-value {
			font-size: 19px;
			font-weight: 700;
			color: var(--text-color);
			margin: 2px 0;
		}
		.free-value {
			font-size: 12px;
			color: var(--text-color-secondary);
			opacity: 0.7;
		}
	}
	@media screen and (max-width: 700px) {
		.benefits {
			grid-template-columns: repeat(2, 1fr);
		}
		.mark {
			font-size: 38px;
		}
	}
	@media screen and (max-width: 380px) {
		.benefits {
			grid-template-columns: 1fr;
		}
	}
	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 12px;
		font-size: 16px;
		.ok {
			color: var(--rank-first);
			font-size: 26px;
		}
	}
	.pay-btn {
		background: var(--gold);
		color: var(--gold-text);
		margin-top: 12px;
	}
	.canceled-notice, .not-verified, .cancel-anytime {
		padding: 0 10px 10px;
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.cancel-anytime {
		text-align: center;
		padding-top: 10px;
	}
	.actions {
		padding: 0 10px 10px;
	}
	.error-message {
		padding: 10px;
		color: #c62828;
	}
	body.dark .error-message {
		color: #ef9a9a;
	}
</style>
