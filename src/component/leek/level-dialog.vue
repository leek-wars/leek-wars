<template>
	<popup :value="value" :width="700" @input="$emit('input', $event)">
		<v-icon slot="icon">mdi-new-box</v-icon>
		<span slot="title" v-html="$t('leek.level_popup_title', [leek.name, data.level])"></span>

		<div class="level-popup">
			<div v-if="leek.level == 301">
				<h2>{{ $t('leek.popup_level_301_title') }}</h2>
				<br>
				<div v-html="$t('leek.popup_level_301_message')"></div>
				<br>
				<center>
					<tooltip>
						<template v-slot:activator="{ on }">
							<img width="100" src="/image/potion/skin_gold.png" v-on="on">
						</template>
						<b>{{ $t('potion.skin_gold') }}</b>
					</tooltip>
					&nbsp;&nbsp;&nbsp;&nbsp;
					<tooltip>
						<template v-slot:activator="{ on }">
							<img width="100" src="/image/hat/crown.png" v-on="on">
						</template>
						<b>{{ $t('hat.crown') }}</b>
					</tooltip>
				</center>
			</div>

			<table class="gains-table">
				<tr>
					<td class="leek-image">
						<leek-image :leek="leek" :scale="0.8" />
					</td>
					<td>
						<div class="gains">
							<div class="life">
								<img src="/image/charac/small/life.png"><span class="name">{{ $t('leek.life') }}</span> &nbsp;<b>+ {{ data.gains.life }}</b>
							</div>
							<div class="capital">
								<img src="/image/add.png"><span class="name">{{ $t('leek.capital') }}</span> &nbsp;<b>+ {{ data.gains.capital }}</b>
							</div>
						</div>
					</td>
				</tr>
			</table>
			<br>

			<div v-if="data.weapons.length + data.chips.length == 0">
				<center>{{ $t('leek.level_popup_no_news') }}</center>
			</div>
			<div v-else>
				<template v-if="data.weapons.length > 0">
					<h2>{{ $t('leek.new_weapons') }}</h2>
					<div class="available-market">{{ $t('leek.available_on_market') }}</div>
					<div v-for="weapon of data.weapons" :key="weapon" class="weapon">
						<img :src="'/image/weapon/' + weapon + '.png'"><br>
						<div class="name">{{ $t('weapon.' + weapon) }}</div>
					</div>
				</template>
				<template v-if="data.chips.length > 0">
					<h2>{{ $t('leek.new_chips') }}</h2>
					<div class="available-market">{{ $t('leek.available_on_market') }}</div>
					<div v-for="chip of data.chips" :key="chip" class="weapon">
						<img :src="'/image/chip/small/' + chip + '.png'"><br>
						<div class="name">{{ $t('chip.' + chip) }}</div>
					</div>
				</template>
			</div>
		</div>
		<div slot="actions">
			<div class="action" @click="$emit('input', false)">{{ $t('leek.ok') }}</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'level-dialog' })
	export default class CapitalDialog extends Vue {
		@Prop() value!: boolean
		@Prop() leek!: Leek
		@Prop() data!: any

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
	.weapon, .chip {
		display: inline-block;
		text-align: center;
		padding: 8px;
	}
	.chip img {
		width: 80px;
	}
	.available-market {
		color: #777;
		font-size: 13px;
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
</style>
