<template lang="html">
	<svg :viewBox="'0 0 ' + width + ' ' + height" :width="width" :height="height" v-on="on">
		<g :class="{invert}">
			<image v-if="leekImage" :x="leekX" :y="leekY" :width="leekWidth" :height="leekHeight" :xlink:href="'/image/' + leekImage" />
			<image v-if="hasHat && hatImage" :x="hatX" :width="hatWidth" :height="hatHeight" :xlink:href="'/image/' + hatImage" y="0" />

			<g v-if="weapon" :transform="'translate(' + (leekWidth / 2 + weaponCX) + ',' + (leekY + leekHeight - weaponCY) + ')'">
				<g :transform="'scale(' + weaponScale + ')'">
					<g :transform="'rotate(' + weaponAngle + ')'" transform-box="fill-box">
						<g :transform="'translate(' + weaponX + ',' + weaponY + ')'">
							<image :xlink:href="weaponImage" :width="weaponWidth" :height="weaponHeight" />
							<image xlink:href="/image/fight/leek_hand.png" :width="handSize" :height="handSize" :x="hand1.x - handSize / 2" :y="hand1.y - handSize / 2" />
							<image xlink:href="/image/fight/leek_hand.png" :width="handSize" :height="handSize" :x="hand2.x - handSize / 2" :y="hand2.y - handSize / 2" />
						</g>
					</g>
				</g>
			</g>
		</g>
		<!-- <circle :cx="leekWidth / 2 + weaponCX" :cy="leekY + leekHeight - weaponCY" r="5" fill="red" /> -->
	</svg>
</template>

<script lang="ts">
	import { HatTemplate } from '@/model/hat'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { WeaponsData } from '@/model/weapon'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({})
	export default class LeekImage extends Vue {
		@Prop({required: true}) leek!: Leek
		@Prop({required: true}) scale!: number
		@Prop() on!: any
		@Prop() invert!: boolean
		leekSize: any = null
		hatSize: any = null
		get leekImage(): string {
			return 'leek/leek' + LeekWars.getLeekAppearance(this.leek.level) + '_front_' + LeekWars.getLeekSkinName(this.leek.skin) + '.png'
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
		get width(): number {
			let width = Math.max(this.leekWidth, this.hatWidth)
			const weapon_offset = this.weaponCX + (this.weaponData && this.weaponData.white ? (
								Math.cos(this.weaponRadianAngle) * (this.weaponX + this.weaponWidth)
								- Math.cos(this.weaponRadianAngle) * (this.weaponHeight + this.weaponY)
								- Math.sin(this.weaponRadianAngle) * (this.weaponHeight - this.weaponBottom)
							) : (
								(Math.cos(this.weaponRadianAngle) * (this.weaponX + this.weaponWidth)
								+ Math.sin(this.weaponRadianAngle) * (-this.weaponY)
								- Math.sin(this.weaponRadianAngle) * (this.weaponTop))
							)) * this.weaponScale
			if (weapon_offset > width / 2) {
				width = width / 2 + weapon_offset
			}
			return width
		}
		get height(): number {
			let height = this.leekHeight
			if (this.leek.hat != null && this.hatTemplate) {
				height += this.hatHeight - this.leekHeight * this.hatTemplate.height
			}
			const weapon_offset = (Math.sin(this.weaponRadianAngle) * (this.weaponWidth + this.weaponX)
								+ Math.cos(this.weaponRadianAngle) * (this.weaponHeight + this.weaponY)
								- Math.cos(this.weaponRadianAngle) * (this.weaponHeight - this.weaponBottom)) * this.weaponScale
			if (weapon_offset > this.weaponCY) {
				height += weapon_offset - this.weaponCY
			}
			return height
		}
		get leekX() { return 0 }
		get leekY() { return this.leek.hat !== null && this.hatTemplate ? this.hatHeight - this.leekHeight * this.hatTemplate.height : 0 }
		get hatX() { return this.leek.hat !== null ? this.leekWidth / 2 - this.hatWidth / 2 - (this.leekWidth / 25) : 0 }

		get weapon() { return this.leek.weapon }
		get weaponTemplate() { return this.weapon ? LeekWars.weapons[this.weapon].template : null }
		get weaponScale() { return 0.9 * this.scale }
		get weaponData() { return this.weaponTemplate ? WeaponsData[this.weaponTemplate] : null }
		get weaponRadianAngle() { return (this.weaponData && this.weaponData.white) ? -Math.PI / 3 : Math.PI / 7 }
		get weaponAngle() { return this.weaponRadianAngle * (180 / Math.PI) }
		get weaponImage() { return '/image/weapon/' + LeekWars.weapons[this.weapon].name + '.png' }
		get weaponWidth() { return this.weaponData ? this.weaponData.w : 0 }
		get weaponHeight() { return this.weaponData ? this.weaponData.h : 0 }
		get weaponCX() { return this.weaponData ? (this.weaponData.cx + 15) * this.scale : 0 }
		get weaponCY() { return this.weaponData ? (this.weaponData.cz - 40) * this.scale : 0 }
		get weaponX() { return this.weaponData ? this.weaponData.x - 2 : 0 }
		get weaponY() { return this.weaponData ? this.weaponData.z : 0 }
		get weaponBottom() { return this.weaponData ? this.weaponData.bottom : 0 }
		get weaponTop() { return this.weaponData ? this.weaponData.top : 0 }
		get hand1() { return this.weaponData ? { x: this.weaponData.mx1, y: this.weaponData.mz1 } : null }
		get hand2() { return this.weaponData ? { x: this.weaponData.mx2, y: this.weaponData.mz2 } : null }
		get handSize() { return 16 * this.scale / this.weaponScale }

		@Watch('leek.level', {immediate: true})
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

<style lang="scss" scoped>
	.invert {
		transform: scale(-1, 1);
		transform-origin: center;
	}
</style>