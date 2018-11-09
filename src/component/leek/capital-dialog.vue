<template>
	<v-dialog :value="value" :max-width="800" @input="$emit('input', $event)">
		<div class="title">Ajouter des points de capital</div>

		<div class="content">

			<center><div class="capital rounded4">{{ $t('leek.n_capital', [capital]) }}</div></center>

			<div v-for="c in ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'mp', 'tp']" :key="c" class="charac">
				<v-tooltip :open-delay="0" :close-delay="0" bottom>
					<img slot="activator" :src="'/image/charac/' + c + '.png'">
					<b>{{ $t('leek.' + c) }}</b><br>
					{{ $t('leek.' + c + '_description') }}
				</v-tooltip>
				<div>
					<span :class="'stat color-' + c">{{ leek[c] + bonuses[c] }}</span>
					<span v-if="bonuses[c]" class="sup">&nbsp;(+{{ bonuses[c] }})</span>
					<div class="add-wrapper">
						<v-tooltip v-for="cost in [1, 10, 100]" :key="cost" :open-delay="0" :close-delay="0" bottom>
							<span slot="activator" :q="cost" :class="{locked: costs[c + cost].cost > capital}" class="add" @click="add(c, cost)"></span>
							{{ costs[c + cost].cost + ' capital ⇔ ' + costs[c + cost].bonus + ' ' + $t('leek.' + c) }}
						</v-tooltip>
					</div>
				</div>
			</div>
		</div>
		<div class="actions">
			<div class="action" @click="close">
				<i class="material-icons">clear</i>
				<span>{{ $t('leek.cancel') }}</span>
			</div>
			<div class="action" @click="reset">
				<i class="material-icons">refresh</i>
				<span>{{ $t('leek.reset') }}</span>
			</div>
			<div class="action green" @click="validate">
				<i class="material-icons">check</i>
				<span>{{ $t('leek.validate') }}</span>
			</div>
		</div>
	</v-dialog>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	const COSTS: {[key: string]: any} = {
		life : [
			{step : 0, capital : 1, sup : 4},
			{step : 1000, capital : 1, sup : 3},
			{step : 2000, capital : 1, sup : 2},
		],
		strength : [
			{step : 0, capital : 1, sup : 2},
			{step : 200, capital : 1, sup : 1},
			{step : 400, capital : 2, sup : 1},
			{step : 600, capital : 3, sup : 1},
		],
		wisdom : [
			{step : 0, capital : 1, sup : 2},
			{step : 200, capital : 1, sup : 1},
			{step : 400, capital : 2, sup : 1},
			{step : 600, capital : 3, sup : 1},
		],
		agility : [
			{step : 0, capital : 1, sup : 2},
			{step : 200, capital : 1, sup : 1},
			{step : 400, capital : 2, sup : 1},
			{step : 600, capital : 3, sup : 1},
		],
		resistance : [
			{step : 0, capital : 1, sup : 2},
			{step : 200, capital : 1, sup : 1},
			{step : 400, capital : 2, sup : 1},
			{step : 600, capital : 3, sup : 1},
		],
		science : [
			{step : 0, capital : 1, sup : 2},
			{step : 200, capital : 1, sup : 1},
			{step : 400, capital : 2, sup : 1},
			{step : 600, capital : 3, sup : 1},
		],
		magic : [
			{step : 0, capital : 1, sup : 2},
			{step : 200, capital : 1, sup : 1},
			{step : 400, capital : 2, sup : 1},
			{step : 600, capital : 3, sup : 1},
		],
		frequency : [
			{step : 0, capital : 1, sup : 1}
		],
		tp : [
			{step : 0, capital : 30, sup : 1}, {step : 1, capital : 35, sup : 1},
			{step : 2, capital : 40, sup : 1}, {step : 3, capital : 45, sup : 1},
			{step : 4, capital : 50, sup : 1}, {step : 5, capital : 55, sup : 1},
			{step : 6, capital : 60, sup : 1}, {step : 7, capital : 65, sup : 1},
			{step : 8, capital : 70, sup : 1}, {step : 9, capital : 75, sup : 1},
			{step : 10, capital : 80, sup : 1}, {step : 11, capital : 85, sup : 1},
			{step : 12, capital : 90, sup : 1}, {step : 13, capital : 95, sup : 1},
			{step : 14, capital : 100, sup : 1}
		],
		mp : [
			{step : 0, capital : 20, sup : 1},
			{step : 1, capital : 30, sup : 1},
			{step : 2, capital : 40, sup : 1},
			{step : 3, capital : 50, sup : 1},
			{step : 4, capital : 60, sup : 1},
			{step : 5, capital : 70, sup : 1},
			{step : 6, capital : 80, sup : 1},
			{step : 7, capital : 90, sup : 1},
			{step : 8, capital : 100, sup : 1}
		]
	}

	@Component({ name: 'capital-dialog' })
	export default class CapitalDialog extends Vue {
		@Prop() value!: boolean
		@Prop({required: true}) leek!: Leek
		COSTS = COSTS
		bonuses: {[key: string]: any} = {}
		base: {[key: string]: any} = {}
		costs: {[key: string]: any} = {}
		capital: number = 0

		created() {
			this.reset()
		}
		reset() {
			this.capital = this.leek.capital
			this.base = {
				life: this.leek.life - 100 - (this.leek.level - 1) * 3,
				strength: this.leek.strength,
				wisdom: this.leek.wisdom,
				agility: this.leek.agility,
				resistance: this.leek.resistance,
				science: this.leek.science,
				magic: this.leek.magic,
				frequency: this.leek.frequency - 100,
				tp: this.leek.tp - 10,
				mp: this.leek.mp - 3
			}
			this.bonuses = {
				life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
				frequency: 0, science: 0, magic: 0, tp: 0, mp: 0
			}
			this.update()
		}
		buttonCost(capital: number, charac: string) {
			let tmpCapital = this.capital
			let tmpBonus = this.bonuses[charac]
			Vue.set(this.costs, charac + capital, {cost: 0, bonus: 0})
			let q = capital
			while (q > 0) {
				const total = this.base[charac] + tmpBonus
				let step = 0
				for (; step < COSTS[charac].length; ++step) {
					if (COSTS[charac][step].step > total) { break }
				}
				step--
				const cost = COSTS[charac][step].capital
				const bonus = COSTS[charac][step].sup
				q -= bonus
				tmpBonus += bonus
				tmpCapital -= cost
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
				this.capital -= cost.cost
				this.bonuses[charac] += cost.bonus
			}
			this.update()
		}
		validate() {
			LeekWars.post('leek/spend-capital', {leek: this.leek.id, characteristics: JSON.stringify(this.bonuses)}).then((data) => {
				if (data.success) {
					for (const stat in this.bonuses) {
						(this.leek as any)[stat] += this.bonuses[stat]
					}
					this.leek.capital = this.capital
					this.$store.commit('update-capital', {leek: this.leek.id, capital: this.capital})
					this.close()
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		close() {
			this.reset()
			this.$emit('input', false)
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
	.capital[v="0"] {
		background: #888;
	}
	.sup {
		color: #555;
	}
	.content img {
		width: 40px;
		margin-right: 10px;
	}
	.add {
		vertical-align: top;
		width: 20px;
		height: 27px;
		background-image: url("/image/add.png");
		cursor: pointer;
		opacity: 0.5;
		user-select: none;
	}
	.add[q="10"] {
		width: 25px;
		background-image: url("/image/add10.png");
	}
	.add[q="100"] {
		width: 30px;
		background-image: url("/image/add100.png");
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
		margin-top: 2px;
		font-weight: 500;
	}
</style>