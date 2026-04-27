<template>
	<popup :width="800" @update:modelValue="updateValue">
		<template #icon>
			<v-icon>mdi-star-outline</v-icon>
		</template>
		<template #title>
			{{ $t('main.add_capital_title') }} ({{ totalCapital }})
		</template>

		<div class="center"><div v-if="totalCapital" :class="{zero: capital == 0}" class="capital rounded4">{{ $t('main.n_capital', [capital]) }}</div></div>

		<div class="characteristics">
			<div v-for="c in LeekWars.characteristics" :key="c" class="charac" :class="c">
				<characteristic-tooltip  :characteristic="c" :value="leek[c]" :total="leek[c]" :leek="leek" :test="false">
					<img :src="'/image/charac/' + c + '.png'">
				</characteristic-tooltip>
				<div>
					<span v-if="restat" :class="'stat color-' + c">{{ base[c] + bonuses[c] }}</span>
					<span v-else :class="'stat color-' + c">{{ leek[c] + bonuses[c] }}</span>
					<span v-if="bonuses[c]" class="sup">&nbsp;(+{{ bonuses[c] }})</span>
					<div class="add-wrapper">
						<v-tooltip v-for="cost in [1, 10, 100]" :key="cost">
							<template #activator="{ props }">
								<span :q="cost" :class="{locked: costs[c + cost].cost > capital}" class="add" @click="add(c, cost)" v-bind="props"></span>
							</template>
							<div>{{ costs[c + cost].cost + ' capital ⇔ ' + costs[c + cost].bonus + ' ' + $t('characteristic.' + c) }}</div>
							<b v-if="useful_level[c] > leek.level">{{ $t('characteristic.too_high', [useful_level[c]]) }}</b>
						</v-tooltip>
						<v-tooltip v-if="bonuses[c]">
							<template #activator="{ props }">
								<span q="0" class="add" @click="clear(c)" v-bind="props"></span>
							</template>
							{{ $t('main.clear') }}
						</v-tooltip>
					</div>
				</div>
			</div>
		</div>
		<template v-if="totalCapital" #actions>
			<div v-ripple class="action" @click="reset">
				<v-icon>mdi-refresh</v-icon>
				<span>{{ $t('main.reset') }}</span>
			</div>
			<div v-ripple class="action green" @click="validate">
				<v-icon>mdi-check</v-icon>
				<span>{{ $t('main.validate') }}</span>
			</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { COSTS, Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { computed, reactive, ref, watch } from 'vue'
import CharacteristicTooltip from './characteristic-tooltip.vue'

defineOptions({ name: 'capital-dialog', components: { "characteristic-tooltip": CharacteristicTooltip } })

const props = defineProps<{
	leek: Leek
	totalCapital: number
	restat?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const bonuses = reactive<{[key: string]: any}>({})
const base = reactive<{[key: string]: any}>({})
const added = reactive<{[key: string]: any}>({})
const costs = reactive<{[key: string]: any}>({})
const usedCapital = ref(0)
const validating = ref(false)

const useful_level = {
	life : 1,
	strength : 1,
	wisdom : 1,
	agility : 1,
	resistance : 10,
	science : 53,
	magic : 42,
	frequency : 1,
	cores: 1,
	ram: 1,
	tp : 1,
	mp : 1,
}

watch(() => props.leek.level, () => {
	reset()
})

reset()

function reset() {
	if (!props.leek) { return }
	usedCapital.value = 0
	const newBase = {
		life: 100 + (props.leek.level - 1) * 3,
		strength: 0,
		wisdom: 0,
		agility: 0,
		resistance: 0,
		science: 0,
		magic: 0,
		frequency: 100,
		cores: 1,
		ram: 6,
		tp: 10,
		mp: 3
	}
	for (const k in newBase) (base as any)[k] = (newBase as any)[k]
	if (props.restat) {
		const newAdded = {
			life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
			frequency: 0, science: 0, magic: 0, cores: 0, ram: 0, tp: 0, mp: 0
		}
		for (const k in newAdded) (added as any)[k] = (newAdded as any)[k]
		for (const charac in added) {
			let characLeft = (props.leek as any)[charac] - base[charac]
			let characAdded = 0
			let step = 0
			while (characAdded < characLeft) {
				if (step < (COSTS as any)[charac].length - 1 && characAdded >= (COSTS as any)[charac][step + 1].step) {
					step++
				}
				const cost = (COSTS as any)[charac][step]
				characAdded += cost.sup
				usedCapital.value += cost.capital
			}
			bonuses[charac] = characLeft
		}
	} else {
		const newAdded = {
			life: props.leek.life - base.life,
			strength: props.leek.strength,
			wisdom: props.leek.wisdom,
			agility: props.leek.agility,
			resistance: props.leek.resistance,
			science: props.leek.science,
			magic: props.leek.magic,
			frequency: props.leek.frequency - base.frequency,
			cores: props.leek.cores - base.cores,
			ram: props.leek.ram - base.ram,
			tp: props.leek.tp - base.tp,
			mp: props.leek.mp - base.mp
		}
		for (const k in newAdded) (added as any)[k] = (newAdded as any)[k]
		const newBonuses = {
			life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
			frequency: 0, science: 0, magic: 0, cores: 0, ram: 0, tp: 0, mp: 0
		}
		for (const k in newBonuses) (bonuses as any)[k] = (newBonuses as any)[k]
	}
	update()
}

function buttonCost(capital: number, charac: string) {
	let tmpBonus = bonuses[charac]
	costs[charac + capital] = {cost: 0, bonus: 0}
	let q = capital
	while (q > 0) {
		const total = added[charac] + tmpBonus
		let step = 0
		for (; step < (COSTS as any)[charac].length; ++step) {
			if ((COSTS as any)[charac][step].step > total) { break }
		}
		if (step > 0) { step-- }
		const cost = (COSTS as any)[charac][step].capital
		const bonus = (COSTS as any)[charac][step].sup
		q -= bonus
		tmpBonus += bonus
		costs[charac + capital].cost += cost
		costs[charac + capital].bonus += bonus
	}
}

function update() {
	for (const charac in bonuses) {
		for (const q of [1, 10, 100]) {
			buttonCost(q, charac)
		}
	}
}

function add(charac: string, q: number) {
	const cost = costs[charac + q]
	if (capital.value >= cost.cost) {
		usedCapital.value += cost.cost
		bonuses[charac] += cost.bonus
	}
	update()
}

function clear(charac: string) {
	const charAdded = added[charac]
	const invested = bonuses[charac]
	let current = 0
	let capitalUsed = 0
	while (current < invested) {
		let step = (COSTS as any)[charac].length - 1
		for (; step >= 0; --step) {
			if ((COSTS as any)[charac][step].step <= charAdded + current) { break }
		}
		const cost = (COSTS as any)[charac][step]
		capitalUsed += cost.capital
		current += cost.sup
	}
	usedCapital.value -= capitalUsed
	bonuses[charac] = 0
	update()
}

function validate() {
	if (validating.value) return
	validating.value = true
	if (props.restat) {
		for (const stat in bonuses) {
			(props.leek as any)[stat] = base[stat] + bonuses[stat]
		}
		close()
		return
	}
	;(LeekWars.post('leek/spend-capital', {leek_id: props.leek.id, characteristics: JSON.stringify(bonuses)}).then(_data => {
		for (const stat in bonuses) {
			;(props.leek as any)[stat] += bonuses[stat]
			;(props.leek as any)['total_' + stat] += bonuses[stat]
		}
		props.leek.capital = capital.value
		store.commit('update-capital', {leek: props.leek.id, capital: capital.value})
		close()
	}) as any).error((error: any) => {
		LeekWars.toast(error)
	})
}

function updateValue(value: boolean) {
	if (!value) {
		close()
		if (LeekWars.didactitial_step === 1) {
			LeekWars.didactitial_next()
		}
	}
}

function close() {
	validating.value = false
	reset()
	emit('update:modelValue', false)
}

const capital = computed(() => props.totalCapital - usedCapital.value)
</script>

<style lang="scss" scoped>
	.content .charac {
		padding: 10px 0;
		width: 187px;
		display: inline-flex;
	}
	.capital {
		color: white;
		font-size: 18px;
		background: #5fad1b;
		display: inline-block;
		padding: 5px 10px;
	}
	.capital.zero {
		background: #888;
	}
	.characteristics {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		padding: 20px 0;
	}
	.sup {
		color: #555;
	}
	.content img {
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
	.add.locked {
		cursor: auto;
		opacity: 0.2;
	}
	.add:hover {
		opacity: 1;
	}
	.add.locked:hover {
		opacity: 0.2;
	}
	.content .charac span {
		font-size: 19px;
		vertical-align: top;
		display: inline-block;
		font-weight: 500;
	}
body.dark .charac.frequency img {
	filter: invert(1);
}
</style>