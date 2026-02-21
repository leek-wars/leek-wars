<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Skins</h1>
			<div class="tabs">
				<div class="tab action" @click="front = !front">
					<span>{{ front ? 'Face' : 'Dos' }}</span>
				</div>
			</div>
		</div>
		<panel v-for="(skin, s) in LeekWars.skins" :key="s">
			<h4>{{ skin }} ({{ s }})</h4>
			<div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 80, 100, 150, 200, 250, 300, 301]" :key="level" :leek="{level, skin: s, back: !front, face: Math.random() * 3 | 0, metal: Math.random() > 0.5}" :scale="1.2" />
			</div>
			<!-- <div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 80, 100, 150, 200, 250, 300, 301]" :key="level" :leek="{level, skin: s, back: s == 1 && !front, face: 'happy'}" :scale="1.2" />
			</div>
			<div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 80, 100, 150, 200, 250, 300, 301]" :key="level" :leek="{level, skin: s, back: s == 1 && !front, face: 'angry', metal: true}" :scale="1.2" />
			</div> -->
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Options, Vue } from 'vue-property-decorator'

	@Options({})
	export default class AdminHats extends Vue {

		front: boolean = true

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			// console.log("created", LeekWars.weapons, LeekWars.weapons[1 + Math.random() * 20 | 0].item)
		}

		mounted() {
			LeekWars.large = true
		}
		beforeUnmount() {
			LeekWars.large = false
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
		:deep(.content) {
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