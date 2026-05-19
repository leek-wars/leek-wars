<template lang="html">
	<popup v-model="show" :width="500" icon="mdi-party-popper" :title="t('title')">
		<div class="intro">{{ t('intro') }}</div>

		<div class="rewards">
			<div class="reward">
				<div class="reward-icon"><img src="/image/fight-pack/fight_pack_50.png" alt="fights"></div>
				<div class="reward-text"><b>20</b> {{ t('reward_fights') }}</div>
			</div>
			<div class="reward">
				<div class="reward-icon"><img src="/image/resource/box_10k_habs.png" alt="habs"></div>
				<div class="reward-text">{{ t('reward_habs_box') }}</div>
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

		<template #actions>
			<div v-ripple class="action green" @click="close">
				<v-icon>mdi-check</v-icon>
				{{ t('continue') }}
			</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { mixins, useNamespacedT } from '@/model/i18n'
import Popup from '@/component/popup.vue'

defineOptions({ name: 'ActivationWelcome', i18n: {}, mixins: [...mixins] })

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const t = useNamespacedT('activation-welcome')

const show = ref(props.modelValue)

// Le parent applique v-if sur ce composant ; émettre immédiatement à la fermeture
// le démonterait avant que v-dialog ne joue son animation. Différer le emit ~300 ms
// (≈ durée de la dialog-transition Vuetify) laisse l'anim se terminer puis unmount.
watch(show, (v) => {
	if (!v) setTimeout(() => emit('update:modelValue', false), 300)
})

function close() {
	show.value = false
}
</script>

<style lang="scss" scoped>
	.intro {
		text-align: center;
		padding: 4px 0 16px;
		color: var(--text-color-secondary);
	}
	.rewards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 12px;
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
