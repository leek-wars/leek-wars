<template lang="html">
	<svg :viewBox="'0 0 ' + width + ' ' + height" :width="width * scale" :height="height * scale">
		<image v-for="(piece, p) of pieces" :key="p" :x="(width - piece.w) / 2" :y="height - piece.z" :xlink:href="'/image/turret/' + piece.t + skinName + '.png'" />
	</svg>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { TURRET_DATA, TURRET_PIECE_SIZE } from '@/model/turret-data'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({})
	export default class TurretImage extends Vue {
		@Prop({required: true}) level!: number
		@Prop({required: true}) skin!: number
		@Prop({required: true}) scale!: number
		get data_() {
			return TURRET_DATA[Math.floor(this.level / 10)]
		}
		get pieces() {
			let z = this.offset
			return this.data_.map(piece => {
				const p = {
					t: piece.t, 
					w: TURRET_PIECE_SIZE[piece.t][0], 
					z: (z += piece.z) / 0.3
				}
				return p
			})
		}
		get height() {
			return (this.data_.reduce((s, p) => s + p.z, 0) + this.offset) / 0.3
		}
		get width() {
			return this.pieces.reduce((w, p) => Math.max(w, p.w), 0)
		}
		get offset() {
			return TURRET_PIECE_SIZE[this.data_[0].t][1] * 0.3 - this.data_[0].z
		}
		get skinName() {
			return this.skin === 1 ? '_blue' : '_red'
		}
	}
</script>
