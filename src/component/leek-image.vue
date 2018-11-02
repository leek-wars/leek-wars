<template lang="html">
	<svg :viewBox="'0 0 ' + width + ' ' + height" :width="width" :height="height">
		<image v-if="leekImage" :x="leekX" :y="leekY" :width="leekWidth" :height="leekHeight" :xlink:href="'/image/' + leekImage" />
		<image v-if="hasHat && hatImage" :x="hatX" :width="hatWidth" :height="hatHeight" :xlink:href="'/image/' + hatImage" y="0" />
	</svg>
</template>

<script lang="ts">
	import { HatTemplate } from '@/model/hat'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({})
	export default class LeekImage extends Vue {
		@Prop({required: true}) leek!: Leek
		@Prop({required: true}) scale!: number
		leekSize: any = null
		hatSize: any = null
		get leekImage(): string {
			return 'leek/leek' + LeekWars.getLeekAppearence(this.leek.level) + '_front_' + LeekWars.getLeekSkinName(this.leek.skin) + '.png'
		}
		get hatImage(): string {
			if (!this.leek.hat) { return '' }
			const hatName = LeekWars.hats[LeekWars.hatTemplates[this.leek.hat].item].name
			return 'hat/' + hatName + '.png'
		}
		get hatTemplate(): HatTemplate | null {
			return this.leek.hat ? LeekWars.hats[LeekWars.hatTemplates[this.leek.hat].item] : null
		}
		get hatWidth() { return this.hatTemplate ? this.leekWidth * this.hatTemplate.width : 0 }
		get hatHeight() { return this.hatSize ? this.hatWidth * (this.hatSize.height / this.hatSize.width) : 0 }
		get hasHat(): boolean { return this.leek.hat !== null }
		get leekWidth(): number { return this.leekSize ? this.leekSize.width * this.scale : 0 }
		get leekHeight(): number { return this.leekSize ? this.leekSize.height * this.scale : 0 }
		get width(): number { return Math.max(this.leekWidth, this.hatWidth) + (this.leekWidth / 25) }
		get height(): number {
			let height = this.leekHeight
			if (this.leek.hat != null && this.hatTemplate) {
				height += this.hatHeight - this.leekHeight * this.hatTemplate.height
			}
			return height
		}
		get leekX() { return this.width / 2 - this.leekWidth / 2 }
		get leekY() { return this.height - this.leekHeight }
		get hatX() { return this.leek.hat !== null ? this.width / 2 - this.hatWidth / 2 - (this.leekWidth / 25) : 0 }

		@Watch('leek', {immediate: true})
		update() {
			LeekWars.getImageSize(this.leekImage, (leekSize: any) => this.leekSize = leekSize)
		}
		@Watch('leek.hat', {immediate: true})
		updateHat() {
			if (this.leek.hat != null) {
				LeekWars.getImageSize(this.hatImage, (hatSize: any) => this.hatSize = hatSize)
			}
		}
	}
</script>
