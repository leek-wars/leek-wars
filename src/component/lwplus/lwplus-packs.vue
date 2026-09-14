<template>
	<div class="lwplus-packs">
	<panel :title="compact ? $t('months_title') : $t('title')" icon="mdi-star-four-points">
		<div v-if="!compact" class="pitch">
			<!-- Le « + » seul, signe court de LW+ ; un tour au survol et toutes les 10 s -->
			<lwplus-logo variant="plus" alt="" class="plus-mark" />
			<div>
				{{ $t('pitch') }}
				<router-link to="/lwplus">{{ $t('learn_more') }}</router-link>
			</div>
		</div>

		<!-- Résumé des avantages : la page /lwplus a le comparatif complet, ici
		     on rappelle seulement ce qu'un mois apporte, au moment de payer. -->
		<ul v-if="!compact" class="benefits">
			<li v-for="benefit in benefits" :key="benefit.key">
				<v-icon>{{ benefit.icon }}</v-icon>
				<span>{{ $t('benefit_' + benefit.key) }}</span>
			</li>
		</ul>

		<loader v-if="loading" />
		<div v-else class="packs">
			<div v-for="pack in packs" :key="pack.id" class="pack" :class="{selected: euroPack?.id === pack.id}">
				<!-- La remise est en absolu : les trois cartes gardent la même hauteur
				     et leurs boutons restent alignés, avec ou sans remise. -->
				<div v-if="discount(pack)" class="save">{{ $t('save', [discount(pack)]) }}</div>
				<div class="months">{{ monthsLabel(pack.months) }}</div>

				<!-- Un panier, comme tout achat du site (ICONS.md) : la nature
				     récurrente se dit dans l'infobulle et sous la grille, pas par un
				     glyphe que personne ne décode. -->
				<v-tooltip location="bottom">
					<template #activator="{ props: tprops }">
						<v-btn v-bind="tprops" class="buy-euro" color="primary" variant="flat" prepend-icon="mdi-cart-outline" :disabled="busy || covered || !verified" @click="subscribeTo(pack)">
							<span v-if="LeekWars.currencies[LeekWars.currency].prefix"><span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>{{ price(pack) }}</span>
							<span v-else>{{ price(pack) }}&nbsp;<span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span></span>
						</v-btn>
					</template>
					<span>{{ $t('tooltip_subscribe', [cadence(pack)]) }}</span>
				</v-tooltip>

				<v-tooltip location="bottom">
					<template #activator="{ props: tprops }">
						<v-btn v-bind="tprops" class="buy-crystals" color="primary" variant="tonal" :disabled="busy || !enough(pack)" :loading="buying === pack.id" @click="askCrystals(pack)">
							{{ $filters.number(pack.crystals) }}&nbsp;<span class="crystal"></span>
						</v-btn>
					</template>
					<span>{{ $t('tooltip_crystals', [monthsLabel(pack.months)]) }}</span>
				</v-tooltip>
			</div>
		</div>

		<!-- La différence entre les deux boutons, dite UNE fois pour toute la grille
		     plutôt que six fois sous les boutons. Visible sans survol : sur mobile il
		     n'y a pas d'infobulle, et un prélèvement récurrent ne se devine pas. -->
		<div v-if="!loading" class="plan-notice">{{ $t('payment_note') }}</div>

		<!-- Pourquoi les boutons en euros sont éteints. Deux raisons seulement, et
		     elles se disent, sinon le joueur clique dans le vide. -->
		<div v-if="!loading && !verified" class="plan-notice">{{ $t('must_verify') }}</div>
		<div v-else-if="!loading && covered" class="plan-notice">{{ $t('already_covered') }}</div>

		<!-- Souscription : le Payment Element se déplie sous la grille, sans quitter
		     la page. Une seule formule à la fois, celle sur laquelle on a cliqué. -->
		<div v-if="euroPack" class="euro-payment">
			<loader v-if="stripeLoading" />
			<div id="lwplus-packs-payment-element"></div>
			<v-btn v-if="stripeReady" color="primary" variant="flat" size="large" :loading="paying" block class="pay-btn" @click="confirmSubscription">
				<template #prepend><v-icon>mdi-lock</v-icon></template>
				{{ $t('subscribe_for', [priceWithCadence(euroPack)]) }}
			</v-btn>
			<div v-if="stripeReady" class="cancel-anytime">{{ $t('cancel_anytime') }}</div>
		</div>

		<div v-if="message" class="message">{{ message }}</div>
		<div v-if="error" class="error-message">{{ error }}</div>
	</panel>

	<!-- Abonnement en cours : dans son propre panneau sous l'offre, comme sur
	     /lwplus, plutôt qu'une ligne perdue entre les avantages et les prix. -->
	<panel v-if="until && !compact" :title="$t('your_subscription')" class="active-panel">
		<div class="status">
			<v-icon class="ok">mdi-check-decagram</v-icon>
			<div>
				<div>{{ $t('active_until', [formatDate(until)]) }}</div>
				<div class="remaining">{{ remainingLabel }}</div>
			</div>
		</div>
	</panel>

	<!-- Les cristaux partent sans retour possible : on confirme, comme au marché. -->
	<popup v-model="crystalsDialog" :width="520">
		<template #icon><v-icon>mdi-star-four-points</v-icon></template>
		<template #title><span>{{ $t('confirm_title') }}</span></template>
		<div v-if="confirmPack" class="confirm">
			<div>{{ $t('confirm_question', [monthsLabel(confirmPack.months)]) }}</div>
			<div class="line secondary">{{ $t('confirm_one_time') }}</div>
			<div class="line">
				<b>{{ $t('confirm_cost') }}</b> : {{ $filters.number(confirmPack.crystals) }}&nbsp;<span class="crystal"></span>
			</div>
			<div class="line">
				<b>{{ $t('confirm_after') }}</b> : {{ $filters.number(($store.state.farmer?.crystals ?? 0) - confirmPack.crystals) }}&nbsp;<span class="crystal"></span>
			</div>
		</div>
		<template #actions>
			<div v-ripple @click="crystalsDialog = false">{{ $t('main.cancel') }}</div>
			<div v-ripple class="green" @click="confirmCrystals">{{ $t('confirm_buy') }}</div>
		</template>
	</popup>

	<lwplus-thanks v-model="thanksDialog" :months-label="thanksMonths" :crystals="thanksCrystals" :price="thanksPrice" :until="thanksUntil" />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, defineAsyncComponent } from 'vue'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'
import { LeekWars } from '@/model/leekwars'
import { locale, mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'
import LwplusLogo from '@/component/lwplus/lwplus-logo.vue'

const LwplusThanks = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/lwplus/lwplus-thanks.${locale}.i18n`))

defineOptions({ name: 'LwplusPacks', i18n: {}, mixins: [...mixins] })

// `compact` : sur /lwplus, la page porte déjà le logo, le comparatif et l'état de
// l'abonnement ; le panneau ne montre alors que les trois lots.
defineProps<{ compact?: boolean }>()
// Émis après un achat abouti (cristaux ou euros) pour que la page hôte relise
// l'état de l'abonnement.
const emit = defineEmits<{ bought: [] }>()

const t = useNamespacedT('lwplus-packs')

// Mêmes glyphes que le comparatif de /lwplus (un concept = un glyphe, ICONS.md).
// Noms en toutes lettres pour scripts/generate-mdi-icons.mjs.
const benefits = [
	{ key: 'fights', icon: 'mdi-sword-cross' },
	{ key: 'queue', icon: 'mdi-fast-forward' },
	{ key: 'ratelimit', icon: 'mdi-speedometer' },
	// Potager rapide (lancer plusieurs combats d'un coup) : c'est l'avantage que Pierre
	// veut mettre en avant ici (09/09/2026). Les comptes déclarables ne sont plus un
	// avantage LW+ : leur plafond est le même pour tout le monde.
	{ key: 'fastgarden', icon: 'mdi-lightning-bolt' },
	{ key: 'badge', icon: 'mdi-shield-star' },
	{ key: 'crystals', icon: 'mdi-diamond-stone' },
]

interface MonthPack { id: number, months: number, crystals: number, prices: Record<string, number> }

const packs = ref<MonthPack[]>([])
const loading = ref(true)
const buying = ref(0)
const paying = ref(false)
const message = ref('')
const error = ref('')
const until = ref(store.state.farmer?.lwplus_until ?? 0)

// Confirmation avant de dépenser des cristaux, puis remerciement après l'achat.
const crystalsDialog = ref(false)
const confirmPack = ref<MonthPack | null>(null)
const thanksDialog = ref(false)
const thanksMonths = ref<string | undefined>(undefined)
const thanksCrystals = ref<number | undefined>(undefined)
const thanksPrice = ref<string | undefined>(undefined)
const thanksUntil = ref(0)

function askCrystals(pack: MonthPack) {
	if (busy.value) { return }
	confirmPack.value = pack
	crystalsDialog.value = true
}

function confirmCrystals() {
	crystalsDialog.value = false
	if (confirmPack.value) { payCrystals(confirmPack.value) }
}

function showThanks(months: string | undefined, until: number, crystals?: number, priceText?: string) {
	thanksMonths.value = months
	thanksCrystals.value = crystals
	thanksPrice.value = priceText
	thanksUntil.value = until
	thanksDialog.value = true
}

// Formule dont le tunnel de souscription est déplié, ou null.
const euroPack = ref<MonthPack | null>(null)
const stripeLoading = ref(false)
const stripeReady = ref(false)
let stripe: Stripe | null = null
let elements: StripeElements | null = null

const formatDate = LeekWars.formatDate

// Temps restant en jours entiers (arrondi vers le haut : un abonnement qui
// expire demain matin « a encore 1 jour »), sur l'heure du serveur.
const remainingLabel = computed(() => {
	const seconds = until.value - LeekWars.time
	if (seconds < 86400) { return t('remaining_less_than_day') }
	const days = Math.ceil(seconds / 86400)
	return days === 1 ? t('remaining_days_one', [days]) : t('remaining_days_other', [days])
})

// Pluriel géré à la main plutôt que par $tc : deux formes suffisent ici, et ça
// évite d'imposer une règle de pluriel à 17 fichiers de langue pour un seul mot.
function monthsLabel(n: number) {
	return n === 1 ? t('months_one', [n]) : t('months_other', [n])
}

// Périodicité de la formule, telle qu'elle sera prélevée. 12 mois se dit « tous
// les ans » et pas « tous les 12 mois » : c'est ce que Stripe écrira sur la facture.
function cadence(pack: MonthPack) {
	if (pack.months === 12) { return t('cadence_year') }
	return pack.months === 1 ? t('cadence_month') : t('cadence_months', [pack.months])
}

// « 10,99 € tous les 3 mois » : le prix ne se montre jamais sans sa périodicité.
function priceWithCadence(pack: MonthPack) {
	return `${priceLabel(pack)} ${cadence(pack)}`
}

// Un achat en cours (cristaux ou euros) verrouille toute la grille : sans ça, un
// double clic sur deux lots différents lance deux paiements que le joueur ne voit
// pas arriver.
const busy = ref(false)

// On ne peut pas s'abonner par-dessus un droit en cours : le serveur refuse
// (already_subscribed), parce qu'un second abonnement se prélèverait en parallèle
// du premier. Les cristaux, eux, s'empilent — ils ne se renouvellent pas.
const covered = computed(() => until.value > LeekWars.time)
const verified = computed(() => store.state.farmer?.verified ?? false)

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

// Même composition que le bouton d'achat : symbole avant ou après selon la devise.
function priceLabel(pack: MonthPack) {
	const currency = LeekWars.currencies[LeekWars.currency]
	return currency.prefix ? `${currency.symbol}${price(pack)}` : `${price(pack)} ${currency.symbol}`
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
		// Par la mutation, jamais en posant `crystals` à la main : c'est elle qui
		// fait converger `animated_crystals` de l'en-tête. Sans ça le compteur
		// restait au-dessus du solde et le pictogramme de perte clignotait en boucle.
		store.commit('update-crystals', -pack.crystals)
		applyUntil(data.lwplus_until)
		message.value = t('bought', [formatDate(data.lwplus_until)])
		showThanks(monthsLabel(pack.months), data.lwplus_until, pack.crystals)
		emit('bought')
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

// Souscription à une formule : les trois sont récurrentes, seul l'intervalle
// change (tous les mois, tous les 3 mois, tous les ans). L'achat sans
// renouvellement, c'est le bouton en cristaux.
async function subscribeTo(pack: MonthPack) {
	if (busy.value) return
	euroPack.value = pack
	stripeReady.value = false
	stripeLoading.value = true
	message.value = ''
	error.value = ''
	try {
		const r = await LeekWars.post('subscription/subscribe', { pack_id: pack.id, currency: LeekWars.currency })
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
		error.value = code === 'stripe_not_configured' ? t('unavailable')
			: code === 'already_subscribed' ? t('already_covered')
			: code === 'not_verified' ? t('must_verify')
			: t('generic_error')
		euroPack.value = null
	} finally {
		stripeLoading.value = false
	}
}

async function confirmSubscription() {
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
	// Contrairement à un paiement unique, le droit d'un abonnement n'est ouvert par
	// AUCUNE réponse d'API : seul le webhook `invoice.paid` l'écrit. On relit donc
	// l'état quelques secondes avant de conclure, comme le faisait la page /lwplus.
	const paidPack = euroPack.value
	for (let i = 0; i < 5; i++) {
		try {
			const data = await LeekWars.get('subscription/get-status')
			if (data.active) {
				applyUntil(data.until)
				message.value = t('bought', [formatDate(data.until)])
				showThanks(undefined, data.until, undefined, priceWithCadence(paidPack))
				euroPack.value = null
				busy.value = false
				paying.value = false
				emit('bought')
				return
			}
		} catch (_err) { /* on retente : c'est l'attente du webhook, pas une erreur */ }
		await new Promise(resolve => setTimeout(resolve, 1500))
	}
	// Payé, mais le webhook n'est pas encore arrivé : surtout ne pas parler d'échec.
	busy.value = false
	paying.value = false
	error.value = t('activation_pending')
	emit('bought')
}
</script>

<style lang="scss" scoped>
	// Pas de double marge (retour de Pierre, 11/09/2026) : le contenu du panneau ne
	// garde aucun padding, chaque bloc porte le sien, ramené à 12 px.
	.lwplus-packs > :deep(.panel > .content) {
		padding: 0;
	}
	// Or du système : --gold en aplat (avec --gold-text par-dessus), --rank-first
	// en encre. Aucune couleur en dur, les jetons s'inversent seuls en sombre.

	.pitch {
		padding: 12px 12px 8px;
		color: var(--text-color-secondary);
		display: flex;
		align-items: center;
		gap: 16px;
		.plus-mark {
			flex-shrink: 0;
			width: 64px;
			height: 64px;
			// Le rendu a une marge de cadrage, on la rogne pour que le signe
			// pèse autant qu'une icône.
			margin: -8px;
		}
		a {
			color: var(--rank-first);
			font-weight: 500;
		}
	}
	.benefits {
		list-style: none;
		margin: 0;
		padding: 8px 12px 16px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px 16px;
		font-size: 14px;
		li {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.v-icon {
			flex-shrink: 0;
			font-size: 18px;
			color: var(--rank-first);
		}
	}
	@media screen and (max-width: 420px) {
		.benefits {
			grid-template-columns: 1fr;
		}
	}
	.confirm {
		padding: 16px;
		.line {
			margin-top: 8px;
		}
		.secondary {
			color: var(--text-color-secondary);
			font-size: 14px;
		}
	}
	.active-panel .status {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px;
		font-size: 16px;
		.ok {
			color: var(--rank-first);
			font-size: 26px;
		}
		.remaining {
			color: var(--text-color-secondary);
			font-size: 14px;
			margin-top: 2px;
		}
	}
	.packs {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		padding: 0 12px 12px;
		// En compact (page /lwplus), ni accroche ni avantages au-dessus : c'est le
		// premier bloc du panneau, il porte sa marge du haut.
		&:first-child {
			padding-top: 12px;
		}
	}
	.pack {
		position: relative;
		flex: 1 1 140px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 18px 14px 14px;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-background);
		transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
		&:hover {
			transform: translateY(-2px);
			border-color: color-mix(in srgb, var(--gold-bright) 45%, var(--border));
		}
		&.selected {
			border-color: var(--gold-bright);
		}
	}
	.months {
		font-size: 18px;
		font-weight: 500;
		margin-bottom: 2px;
	}
	// Pastille de remise à cheval sur le bord haut de la carte, hors du flux :
	// elle ne décale ni le titre ni les boutons des cartes voisines.
	.save {
		position: absolute;
		top: -10px;
		right: 8px;
		padding: 1px 8px;
		border-radius: var(--radius-large);
		// `--gold-bright` et pas `--gold` : en thème clair `--gold` est un or
		// assombri calibré comme surface de panneau, il vire au moutarde terne
		// sous une encre noire (retour de Pierre, 10/09).
		background: var(--gold-bright);
		color: var(--gold-text);
		font-size: 12px;
		font-weight: 600;
		line-height: 18px;
	}
	// Même vert que les packs de cristaux (bank-product) : un achat = un bouton
	// vert, l'or reste réservé à l'identité LW+ (logo, pastille de remise).
	.buy-euro, .buy-crystals {
		width: 100%;
		font-size: 16px;
		font-weight: 500;
	}
	.plan-notice {
		padding: 0 12px 12px;
		color: var(--text-color-secondary);
		font-size: 14px;
	}
	// Deux notices d'affilée (la règle de paiement, puis le pourquoi d'un bouton
	// éteint) : la première ne reprend pas le padding du bas.
	.plan-notice + .plan-notice {
		margin-top: -8px;
	}
	.cancel-anytime {
		margin-top: 8px;
		font-size: 13px;
		color: var(--text-color-secondary);
		text-align: center;
	}
	.euro-payment {
		padding: 0 12px 12px;
	}
	// Vert comme les boutons d'achat : c'est la fin du même geste.
	.pay-btn {
		margin-top: 12px;
	}
	.message {
		padding: 0 12px 12px;
		color: var(--rank-first);
		font-weight: 500;
	}
	.error-message {
		padding: 0 12px 12px;
		color: red;
	}
</style>
