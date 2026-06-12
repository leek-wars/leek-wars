<template lang="html">
	<div v-if="!minimized" class="verify-banner" :class="{visible}">
		<img class="chest" src="/image/resource/box_10k_habs.png" alt="Récompense">
		<div class="text">
			<div class="title">{{ t('title') }}</div>
			<div class="pitch">{{ t('pitch') }}</div>
			<div class="rewards">
				<div class="reward" :title="t('reward_fights')"><img src="/image/fight-pack/fight_pack_50.png"><b>+20</b></div>
				<div class="reward" :title="t('reward_habs')"><img src="/image/resource/box_10k_habs.png"><b>10k</b></div>
				<div class="reward" :title="t('reward_crystals')"><img src="/image/crystal.png"><b>+50</b></div>
				<div class="reward" :title="t('reward_hat')"><img src="/image/hat/cap.png"></div>
			</div>
		</div>
		<button v-ripple class="cta" @click="emit('verify')">{{ t('cta') }}</button>
		<v-icon class="close" :title="t('minimize')" @click="minimize">mdi-chevron-down</v-icon>
	</div>
	<div v-else v-ripple class="verify-bubble" :title="t('title')" @click="reopen">
		<img src="/image/resource/box_10k_habs.png" alt="Récompense">
		<div class="bubble-text">{{ t('bubble') }}</div>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { mixins, useNamespacedT } from '@/model/i18n'

defineOptions({ name: 'VerifyBanner', i18n: {}, mixins: [...mixins] })

const emit = defineEmits<{ verify: [] }>()
const t = useNamespacedT('verify-banner')

const MINIMIZED_KEY = 'verify-banner-minimized'

const visible = ref(false)
// Jamais vraiment fermé : le chevron replie le bandeau en bulle dans le coin,
// et l'état survit à la navigation.
const minimized = ref(localStorage.getItem(MINIMIZED_KEY) === '1')

// Courte temporisation pour laisser la page s'afficher d'abord.
const timer = window.setTimeout(() => { visible.value = true }, 1500)
onBeforeUnmount(() => clearTimeout(timer))

function minimize() {
	minimized.value = true
	localStorage.setItem(MINIMIZED_KEY, '1')
}
function reopen() {
	minimized.value = false
	visible.value = true
	localStorage.setItem(MINIMIZED_KEY, '0')
}
</script>

<style lang="scss" scoped>
	.verify-banner {
		position: fixed;
		left: 50%;
		bottom: 28px;
		z-index: 500;
		display: flex;
		align-items: center;
		gap: 18px;
		width: min(740px, calc(100vw - 24px));
		padding: 16px 18px 16px 22px;
		border-radius: 14px;
		color: white;
		background: linear-gradient(115deg, #b06000, #e89318, #ffc14d, #e89318, #b06000);
		background-size: 300% 300%;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
		transform: translateX(-50%) translateY(calc(100% + 34px));
		transition: transform 0.55s cubic-bezier(0.22, 1.4, 0.36, 1);
		animation: verify-banner-gradient 9s ease-in-out infinite;
		&.visible {
			transform: translateX(-50%) translateY(0);
		}
	}
	@keyframes verify-banner-gradient {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
	.chest {
		flex-shrink: 0;
		height: 64px;
		margin: -30px 0 -8px -4px;
		filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3));
		animation: verify-banner-chest 3.5s ease-in-out infinite;
	}
	@keyframes verify-banner-chest {
		0%, 100% { transform: translateY(0) rotate(-2deg); }
		50% { transform: translateY(-5px) rotate(3deg); }
	}
	.text {
		flex: 1;
		min-width: 0;
	}
	.title {
		font-weight: bold;
		font-size: 18px;
		margin-bottom: 5px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	}
	.pitch {
		font-size: 14px;
		opacity: 0.95;
	}
	.rewards {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 10px;
	}
	.reward {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.22);
		border-radius: 8px;
		padding: 5px 10px;
		font-size: 14px;
		img {
			height: 24px;
			max-width: 32px;
			object-fit: contain;
		}
	}
	.cta {
		flex-shrink: 0;
		background: white;
		color: #b06000;
		font-weight: bold;
		font-size: 16px;
		padding: 12px 22px;
		border-radius: 9px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		transition: transform 0.15s ease;
		cursor: pointer;
		border: none;
		&:hover {
			transform: scale(1.05);
		}
	}
	.close {
		flex-shrink: 0;
		align-self: flex-start;
		opacity: 0.75;
		cursor: pointer;
		&:hover {
			opacity: 1;
		}
	}
	.verify-bubble {
		position: fixed;
		right: 18px;
		bottom: 24px;
		z-index: 500;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px 10px 12px;
		border-radius: 16px;
		cursor: pointer;
		color: white;
		background: linear-gradient(135deg, #b06000, #e89318);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
		animation: verify-bubble-pop 0.4s cubic-bezier(0.22, 1.6, 0.36, 1);
		transition: transform 0.15s ease;
		img {
			height: 38px;
			filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
		}
		&:hover {
			transform: scale(1.05);
		}
	}
	@keyframes verify-bubble-pop {
		from { transform: scale(0); }
		to { transform: scale(1); }
	}
	.bubble-text {
		font-weight: bold;
		font-size: 13px;
		max-width: 160px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	}
	@media screen and (max-width: 700px) {
		.verify-banner {
			flex-wrap: wrap;
			gap: 6px 10px;
			padding: 10px 12px;
			bottom: 12px;
		}
		.chest {
			height: 48px;
			margin-top: -20px;
		}
		.title {
			font-size: 16px;
		}
		.pitch {
			font-size: 13px;
		}
		.cta {
			order: 10;
			flex-basis: 100%;
			text-align: center;
			font-size: 15px;
			padding: 11px 12px;
		}
		.verify-bubble {
			right: 10px;
			bottom: 12px;
			padding: 8px 12px 8px 10px;
			img {
				height: 32px;
				margin-top: -12px;
			}
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.verify-banner, .chest, .verify-bubble {
			animation: none;
			transition: none;
		}
	}
</style>
