<template>
	<popup :value="value" :width="800" :full="true" persistent @input="input">
		<v-icon slot="icon">mdi-human-greeting</v-icon>
		<span slot="title">{{ $t("title") }}</span>

		<div ref="content" :style="{height: height + 'px'}" class="content">
			<div ref="page1" :class="getClass(1)" class="page">
				<h2>{{ $t("welcome") }}</h2>
				<table><tr>
					<td>
						<img src="/image/leek/leek2_front_green.png">
					</td>
					<td>
						<div class="text" v-html="$t('hi', [farmerName])"></div>
						<div class="text" v-html="$t('goal')"></div>
						<div class="text" v-html="$t('goal_2')"></div>
					</td>
				</tr></table>
			</div>

			<div ref="page2" :class="getClass(2)" class="page">
				<h2>{{ $t("leeks") }}</h2>

				<div class="text" v-html="$t('first_leek', [farmerFirstLeek])"></div>

				<table class="stats">
					<tr>
						<td><img src="/image/charac/life.png"></td>
						<td><h4>{{ $t("characteristic.life") }}</h4>{{ $t("characteristic.life_desc") }}</td>

						<td><img src="/image/charac/science.png"></td>
						<td><h4>{{ $t("characteristic.science") }}</h4>{{ $t("characteristic.science_desc") }}</td>
					</tr>
					<tr>
						<td><img src="/image/charac/strength.png"></td>
						<td><h4>{{ $t("characteristic.strength") }}</h4>{{ $t("characteristic.strength_desc") }}</td>

						<td><img src="/image/charac/magic.png"></td>
						<td><h4>{{ $t("characteristic.magic") }}</h4>{{ $t("characteristic.magic_desc") }}</td>
					</tr>
					<tr>
						<td><img src="/image/charac/wisdom.png"></td>
						<td><h4>{{ $t("characteristic.wisdom") }}</h4>{{ $t("characteristic.wisdom_desc") }}</td>

						<td><img src="/image/charac/frequency.png"></td>
						<td><h4>{{ $t("characteristic.frequency") }}</h4>{{ $t("characteristic.frequency_desc") }}</td>
					</tr>
					<tr>
						<td><img src="/image/charac/agility.png"></td>
						<td><h4>{{ $t("characteristic.agility") }}</h4>{{ $t("characteristic.agility_desc") }}</td>

						<td><img src="/image/charac/tp.png"></td>
						<td><h4>{{ $t("characteristic.tp") }}</h4>{{ $t("characteristic.tp_desc") }}</td>
					</tr>
					<tr>
						<td><img src="/image/charac/resistance.png"></td>
						<td><h4>{{ $t("characteristic.resistance") }}</h4>{{ $t("characteristic.resistance_desc") }}</td>

						<td><img src="/image/charac/mp.png"></td>
						<td><h4>{{ $t("characteristic.mp") }}</h4>{{ $t("characteristic.mp_desc") }}</td>
					</tr>
				</table>
			</div>

			<div ref="page3" :class="getClass(3)" class="page">
				<h2>{{ $t("ai") }}</h2>
				<img class="bigimage" src="/image/help/exemple_code.png">
				<div class="text" v-html="$t('ai_1')"></div>
				<div class="text" v-html="$t('ai_2')"></div>
				<div class="text" v-html="$t('ai_3')"></div>
				<div class="text" v-html="$t('ai_4')"></div>
			</div>

			<div ref="page4" :class="getClass(4)" class="page">
				<h2>{{ $t("fights") }}</h2>
				<img class="bigimage" src="/image/help/fight_exemple.jpg">
				<div class="text" v-html="$t('fights_1')"></div>
				<div class="text" v-html="$t('fights_2')"></div>
				<div class="text" v-html="$t('fights_3')"></div>
			</div>

			<div ref="page5" :class="getClass(5)" class="page">
				<h2>{{ $t("teams") }}</h2>
				<img class="bigimage" src="/image/help/team_exemple.png">
				<div class="text" v-html="$t('teams_1')"></div>
			</div>

			<div ref="page6" :class="getClass(6)" class="page">
				<h2>{{ $t("weapons_chips") }}</h2>
				<img class="bigimage" src="/image/help/weapon_chips.jpg">
				<div class="text" v-html="$t('weapons_chips_1')"></div>
				<div class="text" v-html="$t('weapons_chips_2')"></div>
			</div>

			<div ref="page7" :class="getClass(7)" class="page">
				<h2>{{ $t("market") }}</h2>
				<img class="bigimage" src="/image/help/potions_exemple.png">
				<div class="text" v-html="$t('market_1')"></div>
				<div class="text" v-html="$t('market_2')"></div>
			</div>

			<div ref="page8" :class="getClass(8)" class="page">
				<h2>{{ $t("end") }}</h2>
				<div class="text" v-html="$t('end_1')"></div>
				<div class="text" v-html="$t('end_2')"></div>
				<div class="text" v-html="$t('end_3')"></div>
			</div>
			<div class="pagination">{{ page }} / 8</div>
		</div>

		<div slot="actions">
			<div class="skip-previous" @click="previous">
				<span v-if="page === 1">❌&nbsp; {{ $t("dismiss") }}</span>
				<span v-else>◄ {{ $t("previous") }}</span>
			</div>
			<div class="next" @click="next">
				<span v-if="page < 8">{{ $t("next") }} &nbsp;▶</span>
				<span v-else>{{ $t("play") }}</span>
			</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'didactitiel', i18n: {}, mixins })
	export default class Didactitiel extends Vue {
		@Prop() value!: boolean
		page: number = 1
		height: number = 280

		get farmerName() {
			return this.$store.state.farmer ? this.$store.state.farmer.name : ''
		}
		get farmerFirstLeek() {
			return this.$store.state.farmer ? LeekWars.first(this.$store.state.farmer.leeks).name : ''
		}

		input(event: any) {
			this.$emit('input', event)
			this.updateHeight()
		}
		created() {
			this.updateHeight()
		}

		next() {
			if (this.page < 8) {
				this.page++
				this.updateHeight()
			} else {
				this.close()
			}
		}
		previous() {
			if (this.page > 1) {
				this.page--
				this.updateHeight()
			} else {
				this.close()
			}
		}
		updateHeight() {
			setTimeout(() => {
				this.height = (this.$refs.content as any).querySelector('.page.active').offsetHeight + 30
			}, 50)
		}
		getClass(page: number) {
			if (page === this.page) { return 'active' }
			else if (page > this.page) { return 'next' }
			return ''
		}
		close() {
			this.$emit('input', false)
			this.page = 1
		}
	}
</script>

<style lang="scss" scoped>
	.content {
		position: relative;
		overflow: hidden !important;
		transition: height 0.5s ease;
	}
	.page {
		position: absolute;
		top: 20px;
		width: calc(100% - 40px);
		left: -780px;
		padding-bottom: 25px;
		transition: left 0.5s ease;
	}
	.page.active {
		left: 20px;
	}
	.page.next {
		left: 820px;
	}
	.page .bigimage {
		margin-left: -20px;
		margin-bottom: 20px;
		width: calc(100% + 40px);
	}
	h2 {
		margin: 0;
		margin-bottom: 20px;
		font-size: 28px;
	}
	.text {
		font-size: 17px;
		text-align: justify;
		margin-bottom: 16px;
	}
	td {
		padding: 5px 10px;
	}
	.pagination {
		position: absolute;
		bottom: 0px;
		left: 0; right: 0;
		font-size: 20px;
		text-align: center;
		color: #aaa;
		padding: 10px;
	}
	.stats {
		margin: 0 auto;
		margin-left: -10px;
		width: calc(100% + 20px);
	}
	.stats td {
		padding: 6px;
		font-size: 16px;
		text-align: left;
		vertical-align: top;
	}
	.stats td img {
		width: 50px;
	}
	#app.app {
		.stats td img {
			width: 30px;
		}
		.stats td {
			font-size: 14px;
			padding: 3px;
		}
	}
	.text ::v-deep a {
		color: #5fad1b;
	}
</style>