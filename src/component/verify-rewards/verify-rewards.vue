<template lang="html">
	<div class="rewards">
		<div class="reward">
			<div class="reward-icon"><img src="/image/fight-pack/fight_pack_50.png" alt="fights"></div>
			<div class="reward-text"><b>20</b> {{ t('reward_fights') }}</div>
		</div>
		<div class="reward">
			<div class="reward-icon"><img src="/image/resource/box_10k_habs.png" alt="habs"></div>
			<div class="reward-text"><b>10 000</b> {{ t('reward_habs') }}</div>
		</div>
		<div class="reward">
			<div class="reward-icon"><img src="/image/crystal.png" alt="crystal"></div>
			<div class="reward-text"><b>50</b> {{ t('reward_crystals') }}</div>
		</div>
		<div class="reward">
			<div class="reward-icon"><img src="/image/hat/cap.png" alt="cap"></div>
			<div class="reward-text">{{ t('reward_hat') }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { mixins, useNamespacedT } from '@/model/i18n'

defineOptions({ name: 'VerifyRewards', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('verify-rewards')
</script>

<style lang="scss" scoped>
	.rewards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
	.reward {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--background-secondary);
		padding: 10px 12px;
		border-radius: 6px;
	}
	.reward-icon {
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
	}
	.reward-text {
		font-size: 14px;
		b { font-size: 16px; }
	}
</style>
