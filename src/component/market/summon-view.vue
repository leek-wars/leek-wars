<template lang="html">
	<div class="summon">
		<h4>{{ $t('characteristic.characteristics') }}</h4>
		<div class="characteristics">
			<div class="summon-image">
				<img :src="'/image/bulb/' + summon.name + '_front.png'" width="width">
			</div>
			<div>
				<characteristic-tooltip v-for="c of LeekWars.characteristics_table" :key="c" v-slot="{ props }" :characteristic="c" :value="c === 'frequency' || c === 'ram' || c === 'cores' ? 0 : summon.characteristics[c][1]" :total="c === 'frequency' || c === 'ram' || c === 'cores' ? 0 : summon.characteristics[c][1]" :leek="{ level: summon.level ?? 1 }" :test="true">
					<div class="characteristic" v-bind="props">
						<img :src="'/image/charac/' + c + '.png'" v-bind="props">
						<span :class="'color-' + c">
							<span v-if="c == 'frequency' || c === 'ram' || c === 'cores'">0</span>
							<span v-else-if="summon.characteristics[c][0] == summon.characteristics[c][1]">
								{{ summon.characteristics[c][0] }}
							</span>
							<span v-else>
								{{ $t('main.x_to_y', [summon.characteristics[c][0], summon.characteristics[c][1]]) }}
							</span>
						</span>
					</div>
				</characteristic-tooltip>
			</div>
		</div>
		<h4>{{ $t('main.chips') }}</h4>
		<div class="chips">
			<rich-tooltip-item v-for="chip of summon.chips" :key="chip" v-slot="{ props }" :item="LeekWars.items[chip]" :bottom="true" @update:model-value="$emit('update:modelValue', $event)">
				<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" class="chip" v-bind="props">
			</rich-tooltip-item>
		</div>
	</div>
</template>

<script setup lang="ts">
import { CHIPS as CHIPSImport } from '@/model/chips'
import { LeekWars } from '@/model/leekwars'
import { defineAsyncComponent } from 'vue'
import CharacteristicTooltip from '../leek/characteristic-tooltip.vue'

const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

defineOptions({ name: 'SummonView' })

interface Summon {
	name: string
	characteristics: Record<string, [number, number]>
	chips: number[]
	level?: number
	[key: string]: unknown
}

defineProps<{
	summon: Summon
}>()

defineEmits(['update:modelValue'])

const CHIPS = CHIPSImport
</script>

<style lang="scss" scoped>
	.summon {
		background: var(--background-secondary);
		display: block;
	}
	.characteristics {
		display: flex;
		align-items: center;
	}
	.characteristic {
		display: inline-block;
		width: 50%;
		padding: 2px 0;
	}
	.summon h4 {
		padding: 8px;
		text-align: left;
		font-size: 15px;
	}
	.summon-image {
		flex: 1 0 90px;
		text-align: center;
		max-height: 120px;
	}
	.summon-image img {
		max-height: 110px;
	}
	.summon .characteristics {
		text-align: left;
	}
	// Enfant direct seulement : la valeur est un span DANS un span, la marge
	// s'additionnait sur les deux niveaux.
	.summon .characteristic > span {
		display: inline-block;
		margin-top: 2px;
		vertical-align: top;
		// 7 px comme le panneau de la page poireau : à 2 px la valeur collait
		// à son icône.
		margin-left: 7px;
		font-weight: bold;
	}
	.summon .characteristic img {
		width: 20px;
		vertical-align: bottom;
	}
	// L'activateur de l'infobulle est un <span> inline : sur une image de 50 px il
	// ne mesurait que la hauteur de ligne (19 px) et son bas tombait 7 px SOUS
	// l'image. L'infobulle s'ancrait donc à ce bas fantôme, et le trou entre
	// l'icône et la carte la refermait dès qu'on y passait la souris. En flex,
	// le span épouse l'image.
	.summon .chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 3px;
	}
	// display:block, et l'écart par `gap` plutôt que par une marge : l'image
	// reste inline sinon, et le <span> activateur garde sous elle l'espace du
	// jambage de la ligne. C'est à ce bas fantôme que l'infobulle s'ancrait.
	.summon .chips .chip {
		display: block;
		width: 50px;
		height: 50px;
	}
</style>