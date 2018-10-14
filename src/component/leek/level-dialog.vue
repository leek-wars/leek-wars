<template>
	<v-dialog :max-width="900">
		<div class="title">{#level_popup_title, leek.name, popup.level}</div>

		<div class="content level-popup">

			<div v-if="leek.level == 301">
				<h2>{{ $t('popup_level_301_title') }}</h2>
				<br>
				<div>{{ $t('popup_level_301_message') }}</div>
				<br>
				<center>
					<img id="popup-potion" width="100" src="/image/potion/skin_gold.png">
					&nbsp;&nbsp;&nbsp;&nbsp;
					<img id="popup-crown" src="/image/hat/crown.png">

					<div id="tt_popup-crown" class="tooltip"><b>{#hat.crown}</b></div>
					<div id="tt_popup-potion" class="tooltip"><b>{#potion.skin_gold}</b></div>
				</center>
			</div>

			<table class="gains-table">
				<tr>
					<td class="leek-image"></td>
					<td>
						<div class="gains">
							<div class="life">
								<img src="/image/icon_life.png"><span class="name">{{ $t('life') }}</span> <b>+ {popup.gains.life}</b>
							</div>
							<div class="capital">
								<img src="/image/add.png"><span class="name">{{ $t('capital') }}</span> <b>+ {popup.gains.capital}</b>
							</div>
						</div>
					</td>
				</tr>
			</table>
			<br><br>

			<div v-if="popup.weapons.length + popup.chips.length + popup.functions.length == 0">
				<center>{{ $t('level_popup_no_news') }}</center>
			</div>
			<div v-else>
				<template v-if="popup.weapons.length > 0">
					<h2>{{ $t('new_weapons') }}</h2>
					<div class="available-market">{{ $t('available_on_market') }}</div>
					@foreach (weapon in popup.weapons)
					<div class="weapon">
						<img src="/image/weapon/{weapon}.png"><br>
						<div class="name">{_.lang.get('weapon', weapon)}</div>
					</div>
					@end
				</template>
				<template v-if="popup.chips.length > 0">
					<h2>{{ $t('new_chips') }}</h2>
					<div class="available-market">{{ $t('available_on_market') }}</div>
					@foreach (chip in popup.chips)
					<div class="weapon">
						<img src="/image/chip/small/{chip}.png"><br>
						<div class="name">{_.lang.get('chip', chip)}</div>
					</div>
					@end
				</template>
				<template v-if="popup.functions.length > 0">
					<h2>{{ $t('new_functions') }}</h2>
					<br>
					<div v-for="fun in data.functions" :key="fun.name" class="function">{{ fun.name }}</div>
				</template>
			</div>
		</div>
		<div class="actions">
			<div class="action dismiss">{{ $t('ok') }}</div>
		</div>
	</v-dialog>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'level-dialog' })
	export default class CapitalDialog extends Vue {
		@Prop() leek!: Leek
		@Prop() data!: any

		// popup.setOnDismiss(function() {
			// _.post('leek/set-popup-level-seen', {leek_id: leek.id})
		// })
	}
</script>

<style lang="scss" scoped>
	h1 {
		margin: 0;
	}
	.weapon, #level-popup .chip {
		display: inline-block;
		text-align: center;
		padding: 8px;
	}
	.chip img {
		width: 80px;
	}
	.function {
		padding: 4px;
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
