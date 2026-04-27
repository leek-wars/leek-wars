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

<script setup lang="ts">
import { capitalToStatBonus } from '@/model/capital'
import { COSTS } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { LoadoutStats } from '@/model/loadout'
import { computed, reactive, watch } from 'vue'

defineOptions({ name: 'LoadoutStatsPicker' })

const props = withDefaults(defineProps<{
	modelValue: LoadoutStats
	max?: number
}>(), {
	max: Infinity,
})

const emit = defineEmits<{
	'update:modelValue': [value: LoadoutStats]
}>()

const costs = reactive<{ [key: string]: { cost: number, bonus: number } }>({})

const bonuses = computed<{ [stat: string]: number }>(() => {
	const out: { [stat: string]: number } = {}
	for (const c of LeekWars.characteristics) {
		out[c] = capitalToStatBonus(c, (props.modelValue as any)[c] || 0)
	}
	return out
})

watch(() => props.modelValue, () => { refreshCosts() }, { deep: true, immediate: true })

function buttonCost(q: number, charac: string) {
	let tmpBonus = bonuses.value[charac]
	costs[charac + q] = { cost: 0, bonus: 0 }
	let remaining = q
	while (remaining > 0) {
		let step = 0
		for (; step < (COSTS as any)[charac].length; ++step) {
			if ((COSTS as any)[charac][step].step > tmpBonus) break
		}
		if (step > 0) step--
		const cost = (COSTS as any)[charac][step].capital
		const bonus = (COSTS as any)[charac][step].sup
		remaining -= bonus
		tmpBonus += bonus
		costs[charac + q].cost += cost
		costs[charac + q].bonus += bonus
	}
}

function refreshCosts() {
	for (const c of LeekWars.characteristics) {
		for (const q of [1, 10, 100]) buttonCost(q, c)
	}
}

function totalCapital(): number {
	let total = 0
	for (const k in props.modelValue) total += (props.modelValue as any)[k] || 0
	return total
}

function wouldExceedMax(charac: string, q: number): boolean {
	const cost = costs[charac + q]
	if (!cost) return false
	return totalCapital() + cost.cost > props.max
}

function add(charac: string, q: number) {
	const cost = costs[charac + q]
	if (!cost) return
	if (totalCapital() + cost.cost > props.max) return
	const next = { ...props.modelValue } as any
	next[charac] = (next[charac] || 0) + cost.cost
	emit('update:modelValue', next)
}

function clear(charac: string) {
	const next = { ...props.modelValue } as any
	delete next[charac]
	emit('update:modelValue', next)
}
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
