<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Chapeaux</h1>
		</div>
		<panel v-for="hat in LeekWars.hats" :key="hat.id">
			<h4>{{ $t('hat.' + hat.name) }} ({{ hat.id }})</h4>
			<div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 100, 200, 301]" :key="level" :leek="{level, hat: hat.id, weapon: random_weapon(), skin: random_skin()}" :scale="0.8" />
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminHats extends Vue {

		created() {
			// console.log("created", LeekWars.weapons, LeekWars.weapons[1 + Math.random() * 20 | 0].item)
		}

		get all_weapons() {
			return Object.values(LeekWars.weapons)
		}
		random_weapon() {
			return this.all_weapons[Math.random() * this.all_weapons.length | 0].item
		}
		random_skin() {
			return 1 + Math.random() * Object.values(LeekWars.skins).length | 0
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		position: relative;
		::v-deep .content {
			padding: 10px;
		}
	}
	h4 {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	.leeks {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: nowrap;
		width: 100%;
	}
</style>