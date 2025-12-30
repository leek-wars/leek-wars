<template>
	<popup :value="value" :width="700" @input="$emit('input', $event)">
		<v-icon slot="icon">mdi-new-box</v-icon>
		<span v-if="levelData && leek" slot="title" v-html="$t('title', [leek.name, levelData.level])"></span>

		<div v-if="levelData && leek" class="level-popup">
			<div v-if="leek.level == 301">
				<h2>{{ $t('301_title') }}</h2>
				<br>
				<div v-html="$t('301_message')"></div>
				<br>
				<div class="center">
					<v-tooltip>
						<template v-slot:activator="{ props }">
							<img width="100" src="/image/potion/skin_gold.png" v-bind="props">
						</template>
						<b>{{ $t('potion.skin_gold') }}</b>
					</v-tooltip>
					&nbsp;&nbsp;&nbsp;&nbsp;
					<v-tooltip>
						<template v-slot:activator="{ props }">
							<img width="100" src="/image/hat/crown.png" v-bind="props">
						</template>
						<b>{{ $t('hat.crown') }}</b>
					</v-tooltip>
				</div>
			</div>

			<table class="gains-table">
				<tr>
					<td class="leek-image">
						<leek-image :leek="leek" :scale="0.8" />
					</td>
					<td>
						<div class="gains">
							<div class="life">
								<img src="/image/charac/small/life.png"><span class="name">{{ $t('characteristic.life') }}</span> &nbsp;<b>+ {{ levelData.gains.life }}</b>
							</div>
							<div class="capital">
								<img src="/image/add.png"><span class="name">{{ $t('main.capital') }}</span> &nbsp;<b>+ {{ levelData.gains.capital }}</b>
							</div>
						</div>
					</td>
				</tr>
			</table>

			<div v-if="levelData.weapons.length == 0 && levelData.chips.length == 0 && !levelData.new_chip && !levelData.new_weapon">
				<div class="center">{{ $t('no_news') }}</div>
			</div>
			<div v-else>
				<div v-if="levelData.weapons.length > 0" class="new">
					<h4><v-icon>mdi-pistol</v-icon> {{ $t('new_weapons') }}</h4>
					<div class="available-market">{{ $t('available_on_market') }}</div>
					<div v-for="weapon of levelData.weapons" :key="weapon" class="weapon">
						<img :src="'/image/weapon/' + weapon + '.png'"><br>
						<div class="name">{{ $t('weapon.' + weapon) }}</div>
					</div>
				</div>
				<div v-if="levelData.chips.length > 0" class="new">
					<h4><v-icon>mdi-chip</v-icon> {{ $t('new_chips') }}</h4>
					<div class="available-market">{{ $t('available_on_market') }}</div>
					<div v-for="chip of levelData.chips" :key="chip" class="chip">
						<img :src="'/image/chip/' + chip + '.png'"><br>
						<div class="name">{{ $t('chip.' + chip) }}</div>
					</div>
				</div>
				<div v-if="levelData.new_weapon" class="new">
					<h4><v-icon>mdi-shape-square-plus</v-icon> {{ $t('new_weapon') }}</h4>
					<div class="available-market">{{ $t('total_weapons', [leek.max_weapons]) }}</div>
				</div>
				<div v-if="levelData.new_chip" class="new">
					<h4><v-icon>mdi-shape-square-plus</v-icon> {{ $t('new_chip') }}</h4>
					<div class="available-market">{{ $t('total_chips', [leek.max_chips]) }}</div>
				</div>
			</div>

			<div v-if="leek.level == 20">
				<h4><v-icon>mdi-sword-cross</v-icon> {{ $t('main.battle_royale') }}</h4>
				<div>{{ $t('br_desc') }}</div>
				<img class="screenshot" height=200 src="/image/feature/fight_battle_royale.webp" />
			</div>
			<div v-if="leek.level == 50 && Object.values($store.state.farmer.leeks).length === 4">
				<h4><v-icon>mdi-leek</v-icon> {{ $t('main.new_leek') }}</h4>
				<div>{{ $t('newleek_desc') }}</div>
				<leek-image class="screenshot" :leek="{level: 1}" :scale="0.7" />
			</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'level-dialog', i18n: {}, mixins: [...mixins] })
	export default class LevelDialog extends Vue {
		@Prop({required: true}) value!: boolean
		@Prop({required: true}) leek!: Leek
		@Prop({required: true}) levelData!: any

		@Watch('value')
		close() {
			LeekWars.post('leek/set-popup-level-seen', {leek_id: this.leek.id})
		}
	}
</script>

<style lang="scss" scoped>
	h1 {
		margin: 0;
	}
	h4 {
		display: flex;
		align-items: center;
		// color: #333;
		margin: 10px 0;
		.v-icon {
			margin-right: 5px;
			font-size: 26px;
		}
	}
	.weapon, .chip {
		display: inline-block;
		text-align: center;
		padding: 8px;
	}
	.chip img {
		width: 90px;
	}
	.weapon img {
		max-width: 200px;
		max-height: 60px;
	}
	.available-market {
		color: var(--text-color-secondary);
		font-size: 15px;
	}
	.function, .weapon .name, .chip .name {
		font-size: 18px;
	}
	.gains {
		font-size: 18px;
	}
	.gains-table td {
		padding: 5px;
	}
	.gains div {
		padding: 4px;
	}
	.gains div img {
		vertical-align: middle;
	}
	.capital .name, .life .name {
		color: red;
		margin-left: 6px;
	}
	.new {
		padding: 5px 0;
	}
	.screenshot {
		margin-top: 10px;
	}
</style>
