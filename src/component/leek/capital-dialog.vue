<template>
	<popup :value="value" :width="800" @input="$emit('input', $event)">
		<v-icon slot="icon">mdi-star-outline</v-icon>
		<span slot="title">{{ $t('main.add_capital_title') }} ({{ totalCapital }})</span>

		<center><div v-if="totalCapital" :class="{zero: capital == 0}" class="capital rounded4">{{ $t('main.n_capital', [capital]) }}</div></center>

		<div class="characteristics">
			<div v-for="c in LeekWars.characteristics" :key="c" class="charac" :class="c">
				<characteristic-tooltip v-slot="{ on }" :characteristic="c" :value="leek[c]" :total="leek[c]" :leek="leek" :test="false">
					<template v-on="on">
						<img :src="'/image/charac/' + c + '.png'" v-on="on">
					</template>
				</characteristic-tooltip>
				<div>
					<span v-if="restat" :class="'stat color-' + c">{{ base[c] + bonuses[c] }}</span>
					<span v-else :class="'stat color-' + c">{{ leek[c] + bonuses[c] }}</span>
					<span v-if="bonuses[c]" class="sup">&nbsp;(+{{ bonuses[c] }})</span>
					<div class="add-wrapper">
						<tooltip v-for="cost in [1, 10, 100]" :key="cost">
							<template v-slot:activator="{ on }">
								<span :q="cost" :class="{locked: costs[c + cost].cost > capital}" class="add" @click="add(c, cost)" v-on="on"></span>
							</template>
							<div>{{ costs[c + cost].cost + ' capital ⇔ ' + costs[c + cost].bonus + ' ' + $t('characteristic.' + c) }}</div>
							<b v-if="useful_level[c] > leek.level">{{ $t('characteristic.too_high', [useful_level[c]]) }}</b>
						</tooltip>
						<tooltip v-if="bonuses[c]">
							<template v-slot:activator="{ on }">
								<span q="0" class="add" @click="clear(c)" v-on="on"></span>
							</template>
							{{ $t('main.clear') }}
						</tooltip>
					</div>
				</div>
			</div>
		</div>
		<div v-if="totalCapital" slot="actions">
			<div v-ripple class="action" @click="reset">
				<v-icon>mdi-refresh</v-icon>
				<span>{{ $t('main.reset') }}</span>
			</div>
			<div v-ripple class="action green" @click="validate">
				<v-icon>mdi-check</v-icon>
				<span>{{ $t('main.validate') }}</span>
			</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { COSTS, Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import CharacteristicTooltip from './characteristic-tooltip.vue'

	@Component({ name: 'capital-dialog', components: { "characteristic-tooltip": CharacteristicTooltip } })
	export default class CapitalDialog extends Vue {
		@Prop() value!: boolean
		@Prop({required: true}) leek!: Leek
		@Prop({required: true}) totalCapital!: number
		@Prop() restat!: boolean
		bonuses: {[key: string]: any} = {}
		base: {[key: string]: any} = {}
		added: {[key: string]: any} = {}
		costs: {[key: string]: any} = {}
		usedCapital: number = 0

		useful_level = {
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

		@Watch('leek.level')
		updateLevel() {
			this.reset()
		}

		created() {
			this.reset()
		}

		reset() {
			if (!this.leek) { return }
			this.usedCapital = 0
			this.base = {
				life: 100 + (this.leek.level - 1) * 3,
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
			if (this.restat) {
				this.added = {
					life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
					frequency: 0, science: 0, magic: 0, cores: 0, ram: 0, tp: 0, mp: 0
				}
				for (const charac in this.added) {
					let characLeft = (this.leek as any)[charac] - this.base[charac]
					// console.log(charac, characLeft)
					let characAdded = 0
					let step = 0
					while (characAdded < characLeft) {
						if (step < COSTS[charac].length - 1 && characAdded >= COSTS[charac][step + 1].step) {
							step++
						}
						const cost = COSTS[charac][step]
						characAdded += cost.sup
						// characLeft -= cost.sup
						this.usedCapital += cost.capital
					}
					// this.bonuses[charac] = capitalUsed
					this.bonuses[charac] = characLeft
				}
			} else {
				this.added = {
					life: this.leek.life - this.base.life,
					strength: this.leek.strength,
					wisdom: this.leek.wisdom,
					agility: this.leek.agility,
					resistance: this.leek.resistance,
					science: this.leek.science,
					magic: this.leek.magic,
					frequency: this.leek.frequency - this.base.frequency,
					cores: this.leek.cores - this.base.cores,
					ram: this.leek.ram - this.base.ram,
					tp: this.leek.tp - this.base.tp,
					mp: this.leek.mp - this.base.mp
				}
				this.bonuses = {
					life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
					frequency: 0, science: 0, magic: 0, cores: 0, ram: 0, tp: 0, mp: 0
				}
			}
			this.update()
		}

		buttonCost(capital: number, charac: string) {
			let tmpBonus = this.bonuses[charac]
			Vue.set(this.costs, charac + capital, {cost: 0, bonus: 0})
			let q = capital
			while (q > 0) {
				const total = this.added[charac] + tmpBonus
				let step = 0
				for (; step < COSTS[charac].length; ++step) {
					if (COSTS[charac][step].step > total) { break }
				}
				if (step > 0) { step-- }
				const cost = COSTS[charac][step].capital
				const bonus = COSTS[charac][step].sup
				q -= bonus
				tmpBonus += bonus
				this.costs[charac + capital].cost += cost
				this.costs[charac + capital].bonus += bonus
			}
		}

		update() {
			for (const charac in this.bonuses) {
				for (const q of [1, 10, 100]) {
					this.buttonCost(q, charac)
				}
			}
		}

		add(charac: string, q: number) {
			const cost = this.costs[charac + q]
			if (this.capital >= cost.cost) {
				this.usedCapital += cost.cost
				this.bonuses[charac] += cost.bonus
			}
			this.update()
		}

		clear(charac: string) {
			const added = this.added[charac]
			const invested = this.bonuses[charac]
			let current = 0
			let capital = 0
			while (current < invested) {
				let step = COSTS[charac].length - 1
				for (; step >= 0; --step) {
					if (COSTS[charac][step].step <= added + current) { break }
				}
				const cost = COSTS[charac][step]
				capital += cost.capital
				current += cost.sup
			}
			this.usedCapital -= capital
			this.bonuses[charac] = 0
			this.update()
		}

		validate() {
			if (this.restat) {
				for (const stat in this.bonuses) {
					(this.leek as any)[stat] = this.base[stat] + this.bonuses[stat]
				}
				this.close()
				return
			}
			LeekWars.post('leek/spend-capital', {leek_id: this.leek.id, characteristics: JSON.stringify(this.bonuses)}).then(data => {
				for (const stat in this.bonuses) {
					;(this.leek as any)[stat] += this.bonuses[stat]
					;(this.leek as any)['total_' + stat] += this.bonuses[stat]
				}
				this.leek.capital = this.capital
				this.$store.commit('update-capital', {leek: this.leek.id, capital: this.capital})
			}).error((error) => {
				LeekWars.toast(error)
			})
			this.close()
		}

		@Watch('value')
		updateValue() {
			if (!this.value) {
				this.close()
				if (LeekWars.didactitial_step === 1) {
					LeekWars.didactitial_next()
				}
			}
		}

		close() {
			this.reset()
			this.$emit('input', false)
		}

		get capital() {
			return this.totalCapital - this.usedCapital
		}
	}
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