<template>
	<div v-if="LeekWars.battleRoyale.enabled" class="br-wrapper">
		<div class="br popup v-dialog">
			<div class="title">
				{{ $t('garden.category_battle_royale') }}&nbsp;
				<b class="progress">{{ LeekWars.battleRoyale.progress }} / 10</b>
				<div class="options">
					<div class="option minimize" @click="expanded = !expanded">
						<i v-if="expanded" class="material-icons">expand_more</i>
						<i v-else class="material-icons">expand_less</i>
					</div>
					<div class="option dismiss" @click="quit"><i class="material-icons">clear</i></div>
				</div>
			</div>
			<div v-if="expanded" class="content">
				<loader v-if="LeekWars.battleRoyale.progress == 0" />
				<div v-for="leek in LeekWars.battleRoyale.leeks" :key="leek.id" class="leek">
					<leek-image :leek="leek" :scale="0.4" /><br>
					<div>{{ leek.name }}</div>
					<talent :talent="leek.talent" />
					<div class="level">{{ $t('leek.level_n', [leek.level]) }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class BattleRoyalePopup extends Vue {
		expanded: boolean = false
		quit() {
			LeekWars.battleRoyale.leave()
		}
	}
</script>

<style lang="scss" scoped>
	.br-wrapper {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		z-index: 100;
		text-align: center;
	}
	.br {
		width: auto;
		max-width: 600px;
		display: block;
		margin: 0 auto !important;
	}
	.content {
		padding: 10px;
	}
	.leek {
		display: inline-block;
		text-align: center;
		font-size: 15px;
		font-weight: 500;
		margin: 0 3px;
	}
	.talent {
		margin: 2px 0;
	}
</style>