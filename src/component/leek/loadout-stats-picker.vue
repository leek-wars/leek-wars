<template>
	<div class="characteristics">
		<div v-for="c in LeekWars.characteristics" :key="c" class="charac" :class="c">
			<img :src="'/image/charac/' + c + '.png'">
			<div>
				<span :class="'stat color-' + c">{{ bonuses[c] }}</span>
				<span v-if="modelValue[c]" class="sup">&nbsp;({{ modelValue[c] }})</span>
				<div class="add-wrapper">
					<v-tooltip v-for="q in [1, 10, 100]" :key="q">
						<template #activator="{ props }">
							<span :q="q" class="add" :class="{disabled: wouldExceedMax(c, q)}" @click="add(c, q)" v-bind="props"></span>
						</template>
						<div>{{ costs[c + q].cost + ' capital ⇔ ' + costs[c + q].bonus + ' ' + $t('characteristic.' + c) }}</div>
					</v-tooltip>
					<v-tooltip v-if="modelValue[c]">
						<template #activator="{ props }">
							<span q="0" class="add" @click="clear(c)" v-bind="props"></span>
						</template>
						{{ $t('main.clear') }}
					</v-tooltip>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, PropType } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { COSTS } from '@/model/leek'
	import { LoadoutStats } from '@/model/loadout'
	import { capitalToStatBonus } from '@/model/capital'

	export default defineComponent({
		name: 'LoadoutStatsPicker',
		props: {
			modelValue: { type: Object as PropType<LoadoutStats>, required: true },
			max: { type: Number, default: Infinity },
		},
		emits: ['update:modelValue'],
		data() {
			return {
				LeekWars,
				costs: {} as { [key: string]: { cost: number, bonus: number } },
			}
		},
		computed: {
			bonuses(): { [stat: string]: number } {
				const out: { [stat: string]: number } = {}
				for (const c of LeekWars.characteristics) {
					out[c] = capitalToStatBonus(c, this.modelValue[c] || 0)
				}
				return out
			},
		},
		watch: {
			modelValue: { handler() { this.refreshCosts() }, deep: true, immediate: true },
		},
		methods: {
			buttonCost(q: number, charac: string) {
				let tmpBonus = this.bonuses[charac]
				this.costs[charac + q] = { cost: 0, bonus: 0 }
				let remaining = q
				while (remaining > 0) {
					let step = 0
					for (; step < COSTS[charac].length; ++step) {
						if (COSTS[charac][step].step > tmpBonus) break
					}
					if (step > 0) step--
					const cost = COSTS[charac][step].capital
					const bonus = COSTS[charac][step].sup
					remaining -= bonus
					tmpBonus += bonus
					this.costs[charac + q].cost += cost
					this.costs[charac + q].bonus += bonus
				}
			},
			refreshCosts() {
				for (const c of LeekWars.characteristics) {
					for (const q of [1, 10, 100]) this.buttonCost(q, c)
				}
			},
			totalCapital(): number {
				let total = 0
				for (const k in this.modelValue) total += this.modelValue[k] || 0
				return total
			},
			wouldExceedMax(charac: string, q: number): boolean {
				const cost = this.costs[charac + q]
				if (!cost) return false
				return this.totalCapital() + cost.cost > this.max
			},
			add(charac: string, q: number) {
				const cost = this.costs[charac + q]
				if (!cost) return
				if (this.totalCapital() + cost.cost > this.max) return
				const next = { ...this.modelValue }
				next[charac] = (next[charac] || 0) + cost.cost
				this.$emit('update:modelValue', next)
			},
			clear(charac: string) {
				const next = { ...this.modelValue }
				delete next[charac]
				this.$emit('update:modelValue', next)
			},
		},
	})
</script>

<style lang="scss" scoped>
.charac {
	padding: 10px 0;
	width: 187px;
	display: inline-flex;
}
.characteristics {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	padding: 10px 0;
}
.sup {
	color: #555;
}
img {
	width: 40px;
	height: 40px;
	margin-right: 10px;
}
.add {
	vertical-align: top;
	width: 20px;
	height: 27px;
	background-image: url("../../../public/image/add.png");
	cursor: pointer;
	opacity: 0.5;
	user-select: none;
	display: inline-block;
}
.add[q="10"] {
	width: 25px;
	background-image: url("../../../public/image/add10.png");
}
.add[q="100"] {
	width: 30px;
	background-image: url("../../../public/image/add100.png");
}
.add[q="0"] {
	width: 25px;
	background-image: url("../../../public/image/sub.png");
}
.add:hover { opacity: 1; }
.add.disabled { opacity: 0.15; cursor: not-allowed; pointer-events: none; }
.charac span {
	font-size: 19px;
	vertical-align: top;
	display: inline-block;
	font-weight: 500;
}
body.dark .charac.frequency img { filter: invert(1); }
</style>
