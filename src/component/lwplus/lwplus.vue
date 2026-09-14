<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>

		<panel class="first hero-panel">
			<div class="hero">
				<!-- Le « + » fait un tour au survol et toutes les 10 s, cf. lwplus-logo.vue -->
				<lwplus-logo class="mark" />
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

		<!-- Les trois formules d'abord, l'abonnement en cours ensuite (ordre voulu par
		     Pierre, 09/09/2026), côte à côte quand la largeur le permet. -->
		<div v-else class="offers">
		<!-- Le panneau des formules porte AUSSI le tunnel de souscription depuis que
		     les euros sont récurrents (14/09/2026) : il n'y a plus qu'une seule façon
		     de s'abonner, et elle se choisit dans la grille. `compact` : la page porte
		     déjà le logo, le comparatif et l'état. -->
		<lwplus-packs compact @bought="refreshStatus" />

		<!-- Abonnement en cours : état et gestion -->
		<panel v-if="active" :title="$t('your_subscription')">
			<div class="status">
				<v-icon class="ok">mdi-check-decagram</v-icon>
				<!-- « Renouvellement le … » seulement si quelque chose se renouvelle :
				     des mois payés en cristaux, eux, s'arrêtent à leur terme. -->
				<span v-if="recurring">{{ $t('renews_on', [formatDate(until)]) }}</span>
				<span v-else>{{ $t('active_until', [formatDate(until)]) }}</span>
			</div>
			<div v-if="recurring && months > 0" class="plan">{{ $t('plan_cadence', [cadence]) }}</div>
			<div v-if="cancelAtPeriodEnd" class="canceled-notice">{{ $t('canceled_notice') }}</div>

			<div class="actions">
				<v-btn v-if="cancelAtPeriodEnd && manageable" color="primary" :loading="updating" @click="resume">
					<v-icon>mdi-refresh</v-icon> {{ $t('resume') }}
				</v-btn>
				<v-btn v-else-if="manageable" variant="tonal" :loading="updating" @click="cancel">
					{{ $t('cancel_subscription') }}
				</v-btn>
			</div>
			<div v-if="error" class="error-message">{{ error }}</div>
		</panel>
		</div>

		<!-- Chronologie de fidélité : ce que le temps cumulé d'abonnement débloque.
		     Sous l'offre, pas au-dessus — c'est un argument de durée, il se lit après
		     le prix. Affichée aussi aux non-abonnés, entièrement verrouillée. -->
		<lwplus-timeline v-if="!loading" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, defineAsyncComponent } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { locale, mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'
import LwplusLogo from '@/component/lwplus/lwplus-logo.vue'

const LwplusPacks = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/lwplus/lwplus-packs.${locale}.i18n`))
const LwplusTimeline = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/lwplus/lwplus-timeline.${locale}.i18n`))

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
	// Potager rapide (Pierre, 09/09/2026), comme dans la banque. Les comptes déclarables
	// ne sont plus un avantage LW+ : leur plafond est le même pour tout le monde.
	{ key: 'fastgarden', icon: 'mdi-lightning-bolt' },
	{ key: 'badge', icon: 'mdi-shield-star' },
	{ key: 'crystals', icon: 'mdi-diamond-stone' },
]

const priceEur = ref(3.99)
const loading = ref(true)
const active = ref(false)
const until = ref(0)
const cancelAtPeriodEnd = ref(false)
// Durée d'une échéance de l'abonnement en cours : 1, 3 ou 12 mois. 0 quand le
// droit ne vient pas d'un abonnement (mois achetés en cristaux) — il n'y a alors
// rien à résilier, et rien qui se renouvelle.
const months = ref(0)
const recurring = ref(false)
const status = ref<string | null>(null)

// Un abonnement qu'on peut encore piloter chez Stripe. `canceled`, `unpaid` et les
// `incomplete*` n'ont plus rien à résilier : le bouton disparaît plutôt que de
// rendre une erreur. `past_due` en fait partie — il se prélève encore.
const manageable = computed(() => ['active', 'trialing', 'past_due'].includes(status.value ?? ''))
const updating = ref(false)
const error = ref('')

const formatDate = LeekWars.formatDate

// Périodicité en toutes lettres, comme sur les boutons de la grille.
const cadence = computed(() => {
	if (months.value === 12) { return t('cadence_year') }
	return months.value === 1 ? t('cadence_month') : t('cadence_months', [months.value])
})

function applyStatus(data: { active: boolean, until: number, cancel_at_period_end: boolean, status?: string | null, months?: number, recurring?: boolean, price_eur?: number }) {
	active.value = data.active
	until.value = data.until
	cancelAtPeriodEnd.value = data.cancel_at_period_end
	months.value = data.months ?? 0
	recurring.value = data.recurring ?? false
	status.value = data.status ?? null
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
		// Le tunnel de souscription vit dans <lwplus-packs> : la page ne fait plus
		// que lire l'état.
		await refreshStatus()
	} catch (e) {
		error.value = t('generic_error')
	} finally {
		loading.value = false
	}
})

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

	// Deux colonnes dès qu'il y a la place (demande de Pierre, 09/09/2026) : le
	// hero à gauche, le comparatif à droite ; l'un sous l'autre sinon.
	.hero-panel :deep(.content) {
		padding: 0;
		display: flex;
		flex-wrap: wrap;
	}
	.hero {
		flex: 2 1 380px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
		overflow: hidden;
		background: var(--panel-background);
		color: var(--text-color);
		padding: 34px 24px 30px;
		text-align: center;
		// Halo doré plutôt qu'un aplat jaune (retour de Pierre, 10/09) : même
		// recette que la lumière de rareté d'une fiche d'item — une ellipse
		// accrochée en haut, qui s'étire vers le bas et s'éteint sur les côtés.
		// C'est le débordement qui se lit comme un halo, pas un fond teinté.
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 300px;
			background: radial-gradient(ellipse 60% 100% at 50% 0%,
				color-mix(in srgb, var(--gold-bright) 30%, transparent),
				color-mix(in srgb, var(--gold-bright) 9%, transparent) 45%,
				transparent 75%);
			pointer-events: none;
		}
		// Le contenu passe DEVANT la lumière, il n'est pas teinté par elle.
		& > * {
			position: relative;
		}
	}
	.mark {
		margin: -10px auto 0;
		width: 460px;
		max-width: 100%;
	}
	// `stretch` : côte à côte, le panneau d'abonnement descend à la hauteur des
	// lots au lieu de s'arrêter à son contenu et de laisser un blanc dessous
	// (Pierre, 2026-09-11 : « agrandir le panel de l'abonnement courant pour
	// combler le vide »). Empilés, chacun est seul sur sa ligne : sans effet.
	.offers {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: 0 12px;
		& > :deep(.lwplus-packs) {
			flex: 1 1 460px;
			min-width: 0;
		}
		& > .panel {
			flex: 1 1 360px;
			min-width: 0;
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
		// L'or en ENCRE (`--rank-first`), pas en aplat : la pastille pleine faisait
		// trop de masse jaune pour un prix (retour de Pierre, 10/09).
		.amount {
			display: inline-block;
			color: var(--rank-first);
			font-size: 30px;
			font-weight: 700;
			letter-spacing: 0.01em;
		}
		.notice {
			display: block;
			margin-top: 10px;
			font-size: 12px;
			letter-spacing: 0.04em;
			color: var(--text-color-secondary);
		}
	}
	.benefits {
		flex: 3 1 480px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: var(--border);
	}
	.benefit {
		background: var(--panel-background);
		padding: 20px 12px;
		text-align: center;
		// En deux colonnes, les cases sont plus hautes que leur contenu : centré.
		display: flex;
		flex-direction: column;
		justify-content: center;
		// L'icône est un flex item : sans ça elle se cale à gauche, hors du texte centré.
		align-items: center;
		transition: background 120ms ease;
		&:hover {
			background: var(--background-secondary);
			// Le disque s'allume au survol : la case entière répond, pas juste le fond.
			.icon {
				background: color-mix(in srgb, var(--gold-bright) 22%, transparent);
				border-color: color-mix(in srgb, var(--gold-bright) 45%, transparent);
			}
		}
		// L'icône posée sur un aplat d'or translucide : décoratif, l'information
		// reste portée par le texte en dessous. La boîte est large devant le
		// glyphe (26 px dans 60 px) pour qu'il respire au lieu de toucher le
		// trait — le cadre serré ne plaisait pas (Pierre, 10/09).
		.icon {
			color: var(--rank-first);
			font-size: 26px;
			width: 60px;
			height: 60px;
			margin-bottom: 12px;
			// Vuetify étire le <svg> à 100 % de la boîte : `font-size` n'agit pas
			// sur lui, et le glyphe touchait le trait quelle que soit la taille du
			// cadre. C'est le SVG qu'il faut borner.
			:deep(svg) {
				width: 28px;
				height: 28px;
			}
			// Jeton et pas `50%` : le v3 ne veut aucun arrondi (il vaut 0), le v2
			// garde ses 20 px, soit un galet sur 60 px de côté.
			border-radius: var(--radius-pill);
			background: color-mix(in srgb, var(--gold-bright) 12%, transparent);
			border: 1px solid color-mix(in srgb, var(--gold-bright) 26%, transparent);
			transition: background 120ms ease, border-color 120ms ease;
		}
		.label {
			font-size: 13px;
			color: var(--text-color-secondary);
		}
		.plus-value {
			font-size: 20px;
			font-weight: 700;
			color: var(--text-color);
			margin: 3px 0 1px;
		}
		.free-value {
			font-size: 12px;
			color: var(--text-color-secondary);
			opacity: 0.85;
		}
	}
	@media screen and (max-width: 700px) {
		.benefits {
			grid-template-columns: repeat(2, 1fr);
		}
		.mark {
			width: 300px;
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
	// Le tunnel de souscription (et son bouton) vit désormais dans <lwplus-packs>.
	.canceled-notice, .plan {
		padding: 0 10px 10px;
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.plan {
		margin-top: -6px;
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
