<template>
	<popup :model-value="modelValue" :width="460" full @update:model-value="$emit('update:modelValue', $event)">
		<template #icon>
			<img class="thanks-mark" src="/image/lwplus/plus_badge.webp" alt="LW+" width="128" height="128">
		</template>
		<template #title><span>{{ $t('title') }}</span></template>

		<!-- Bandeau : le logo 3D sur le lavis d'or de la page de vente. Il fait son
		     tour tout seul au montage, le popup ne crée son contenu qu'à l'ouverture. -->
		<div class="banner">
			<lwplus-logo class="banner-logo" variant="lwplus" alt="LW+" :period="0" />
		</div>

		<div class="thanks">
			<div class="intro">
				{{ monthsLabel ? $t('intro_months', [monthsLabel]) : $t('intro_subscription') }}
			</div>
			<div class="details">
				<div v-if="crystals || price" class="line">
					<span class="label">{{ $t('label_paid') }}</span>
					<span v-if="crystals" class="value">{{ $filters.number(crystals) }}&nbsp;<span class="crystal"></span></span>
					<span v-else class="value">{{ price }}</span>
				</div>
				<div class="line">
					<span class="label">{{ $t('label_until') }}</span>
					<span class="value">{{ formatDate(until) }}</span>
				</div>
			</div>
			<div class="active-now">{{ $t('active_now') }}</div>
		</div>

		<template #actions>
			<div v-ripple class="green" @click="$emit('update:modelValue', false)">{{ $t('close') }}</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { LeekWars } from '@/model/leekwars'
import { mixins } from '@/model/i18n'
import LwplusLogo from '@/component/lwplus/lwplus-logo.vue'

// Remerciement après un achat LW+ (#3303), commun aux trois chemins : mois payés
// en cristaux, mois payés en euros, abonnement récurrent. Purement présentatif —
// c'est l'appelant qui a les chiffres, lui seul sait ce qui vient d'être acheté.
defineOptions({ name: 'LwplusThanks', i18n: {}, mixins: [...mixins] })

defineProps<{
	modelValue?: boolean
	/** Libellé déjà pluralisé (« 3 mois ») ; absent pour l'abonnement récurrent. */
	monthsLabel?: string
	/** Prix payé en cristaux, ou `price` pour un prix déjà formaté en devise. */
	crystals?: number
	price?: string
	/** Fin de la période payée, en secondes. */
	until: number
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const formatDate = LeekWars.formatDate
</script>

<style lang="scss" scoped>
	.thanks-mark {
		width: 26px;
		height: 26px;
	}
	.banner {
		position: relative;
		overflow: hidden;
		display: flex;
		justify-content: center;
		padding: 14px 20px 8px;
		background: linear-gradient(135deg,
			color-mix(in srgb, var(--gold) 26%, var(--background)) 0%,
			color-mix(in srgb, var(--gold) 10%, var(--background)) 100%);
		// Halo doré derrière le logo, pour que le bandeau ne soit pas un aplat mort.
		&::before {
			content: '';
			position: absolute;
			left: 50%;
			top: 50%;
			width: 420px;
			height: 420px;
			transform: translate(-50%, -55%);
			background: radial-gradient(circle,
				color-mix(in srgb, var(--gold-bright) 30%, transparent) 0%,
				transparent 62%);
		}
	}
	.banner-logo {
		position: relative;
		width: 280px;
		max-width: 78%;
	}
	.thanks {
		padding: 16px;
	}
	.intro {
		font-size: 16px;
	}
	.details {
		margin: 14px 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		.line {
			display: flex;
			justify-content: space-between;
			gap: 12px;
			padding: 8px 12px;
			&:not(:last-child) {
				border-bottom: 1px solid var(--border);
			}
		}
		.label {
			color: var(--text-color-secondary);
		}
		.value {
			font-weight: 600;
			white-space: nowrap;
		}
	}
	.active-now {
		color: var(--text-color-secondary);
		font-size: 13px;
	}
</style>
