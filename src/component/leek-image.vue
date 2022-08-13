<template lang="html">
	<svg :viewBox="'0 0 ' + width + ' ' + height" :width="width * scale" :height="height * scale" v-on="on">
		<g :class="{invert}">
			<image v-if="leekImage" :x="leekX" :y="leekY" :width="leekWidth" :height="leekHeight" :xlink:href="'/image/' + leekImage" />
			<image v-if="hasHat && hatImage" :x="hatX" :y="hatY" :width="hatWidth" :height="hatHeight" :xlink:href="'/image/' + hatImage" />

			<g v-if="weapon || leek.fish" :transform="'translate(' + (leekWidth / 2 + weaponCX) + ',' + (leekY + leekHeight - weaponCY) + ')'">
				<g :transform="'scale(' + weaponScale + ')'">
					<g :transform="'rotate(' + weaponAngle + ')'" transform-box="fill-box">
						<g :transform="'translate(' + weaponX + ',' + weaponY + ')'">
							<image :xlink:href="weaponImage" :width="weaponWidth" :height="weaponHeight" />
							<image :xlink:href="handImage" :width="handSize" :height="handSize" :x="hand1.x - handSize / 2" :y="hand1.y - handSize / 2" />
							<image :xlink:href="handImage" :width="handSize" :height="handSize" :x="hand2.x - handSize / 2" :y="hand2.y - handSize / 2" />
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
	import { FishData, WeaponsData } from '@/model/weapon'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class LeekImage extends Vue {

		@Prop({required: true}) leek!: Leek
		@Prop({required: true}) scale!: number
		@Prop() on!: any
		@Prop() invert!: boolean
		@Prop() ai!: number

		botHats = [ null, 8, 12, 13 ]
		randomAngle: number = 0

		HAT_SIZES: { [key: number]: {width: number, height: number} } = {
			1: {width: 139, height: 84}, // christmas
			2: {width: 110, height: 72}, // panama
			3: {width: 139, height: 84}, // christmas
			4: {width: 139, height: 84}, // christmas
			5: {width: 100, height: 70}, // crown
			6: {width: 140, height: 135}, // harlequin
			7: {width: 130, height: 140}, // topper
			8: {width: 150, height: 80}, // chinese
			9: {width: 200, height: 169}, // wizard
			10: {width: 200, height: 115}, // mugiwara
			11: {width: 139, height: 84}, // christmas
			12: {width: 150, height: 80}, // chinese
			13: {width: 150, height: 80}, // chinese
			14: {width: 140, height: 135}, // harlequin
			15: {width: 140, height: 135}, // harlequin
			16: {width: 200, height: 169}, // wizard
			17: {width: 200, height: 169}, // wizard
			18: {width: 200, height: 169}, // wizard
			19: {width: 200, height: 169}, // wizard
			20: {width: 150, height: 80}, // chinese
			21: {width: 300, height: 199}, // crystal crown
			22: {width: 300, height: 199}, // crystal crown
			23: {width: 300, height: 199}, // crystal crown
			24: {width: 302, height: 209}, // bicorn
			25: {width: 300, height: 201}, // sombrero
			26: {width: 300, height: 302}, // pirate hat
			27: {width: 300, height: 201}, // bicorn
			28: {width: 300, height: 206}, // lareul
			29: {width: 300, height: 206}, // lareul
			30: {width: 130, height: 140}, // topper
		}

		created() {
			// setInterval(() => this.randomAngle = Math.random() * Math.PI / 2 - Math.PI / 4, 500)
		}

		get leekImage(): string {
			return 'leek/leek' + this.appearance + '_front_' + LeekWars.getLeekSkinName(this.leek.skin) + '.png'
		}
		get hat() {
			let hat = this.leek.hat
			if (!hat && (!this.leek.real || this.leek.bot)) {
				return this.botHats[-this.ai! as number - 1]
			}
			if (typeof(hat) === 'number') {
				return hat
			}
			return LeekWars.items[hat!.template].params
		}
		get hatTemplate(): HatTemplate | null {
			return this.hat ? LeekWars.hats[this.hat] : null
		}
		get hatImage(): string {
			if (this.hatTemplate) {
				return 'hat/' + this.hatTemplate.name + '.png'
			}
			return ''
		}
		get hatWidth() { return this.hatTemplate ? this.leekHeight * 0.8 * this.hatTemplate.width : 0 }
		get hatHeight() { return this.hatSize ? this.hatWidth * (this.hatSize.height / this.hatSize.width) : 0 }
		get hasHat(): boolean { return this.hat !== null }
		get leekWidth(): number { return this.leekSize ? this.leekSize.width : 0 }
		get leekHeight(): number { return this.leekSize ? this.leekSize.height : 0 }
		get weaponOffset(): number {
			return this.weaponCX + (this.weaponData && this.weaponData.white ? (
						this.weaponRight
					) : (
						(Math.cos(this.weaponRadianAngle) * (this.weaponX + this.weaponWidth)
						+ Math.sin(this.weaponRadianAngle) * (-this.weaponY)
						- Math.sin(this.weaponRadianAngle) * (this.weaponTop))
					)) * this.weaponScale
		}
		get width(): number {
			let width = this.leekWidth
			if (this.hatWidth > this.leekWidth) {
				width = this.hatWidth
			}
			if (this.weaponOffset > width / 2) {
				width = this.leekWidth / 2 + this.weaponOffset
			}
			return width
		}
		get height(): number {
			let height = this.leekHeight + this.offsetTop
			if (this.hat != null && this.hatTemplate) {
				height += Math.max(0, this.hatHeight - this.hatHeight * this.hatTemplate.height)
			}
			if (this.weaponData && this.weaponData.white) {
				height += this.weaponData.bottom
			} else {
				const weapon_offset = Math.sin(this.weaponRadianAngle) * (this.weaponWidth + this.weaponX)
									+ Math.cos(this.weaponRadianAngle) * (this.weaponHeight + this.weaponY)
									- Math.cos(this.weaponRadianAngle) * (this.weaponHeight - this.weaponBottom)
				if (weapon_offset > this.weaponCY) {
					height += weapon_offset - this.weaponCY
				}
			}
			return height
		}
		get offsetTop() {
			return this.weaponData && this.weaponData.white ? Math.max(0,
				this.weaponData.top - this.leekHeight - (this.hat !== null && this.hatTemplate ? Math.max(0, this.hatHeight - this.leekHeight * this.hatTemplate.height) : 0) + this.weaponData.centerZ +
				Math.abs(Math.sin(this.weaponRadianAngle)) * (this.weaponData.width + this.weaponData.x)
			 ) : 0
		}
		get leekX() { return Math.max(0, this.hatWidth / 2 - this.leekWidth / 2) }
		get leekY() { return this.offsetTop + (this.hat !== null && this.hatTemplate ? Math.max(0, this.hatHeight - this.hatHeight * this.hatTemplate.height) : 0) }
		get hatX() { return this.hat !== null ? Math.max(0, this.leekWidth / 2 - this.hatWidth / 2) : 0 }
		get hatY() { return this.offsetTop }

		get weapon() {
			if (typeof this.leek.weapon === 'number') {
				return this.leek.weapon
			}
			return this.leek.weapon ? ((this.leek.weapon as any).id as number) : 0
		}
		get weaponTemplate() { return this.weapon ? LeekWars.items[this.weapon].params : null }
		get weaponScale() { return 1.0 }
		get weaponData() {
			if (this.leek.fish) {
				return FishData
			}
			return this.weaponTemplate ? WeaponsData[this.weaponTemplate] : null
		}
		get weaponRadianAngle() { return (this.weaponData && this.weaponData.white) ? -Math.PI / 2.7 : Math.PI / 7 + this.randomAngle }
		get weaponAngle() { return this.weaponRadianAngle * (180 / Math.PI) }
		get weaponImage() {
			if (this.leek.fish) {
				return '/image/weapon/fish.png'
			}
			return '/image/' + LeekWars.items[this.weapon].name.replace('_', '/') + '.png' }
		get weaponWidth() { return this.weaponData ? this.weaponData.width : 0 }
		get weaponHeight() { return this.weaponData ? this.weaponData.height : 0 }
		get weaponCX() { return this.weaponData ? this.leekX + this.weaponData.centerX : 0 }
		get weaponCY() { return this.weaponData ? this.weaponData.centerZ : 0 }
		get weaponX() { return this.weaponData ? this.weaponData.x : 0 }
		get weaponY() { return this.weaponData ? this.weaponData.z : 0 }
		get weaponBottom() { return this.weaponData ? this.weaponData.bottom : 0 }
		get weaponTop() { return this.weaponData ? this.weaponData.top : 0 }
		get weaponRight() { return this.weaponData && this.weaponData.right ? this.weaponData.right : 0 }
		get hand1() {
			return this.weaponData ? { x: this.weaponData.hand1x, y: this.weaponData.hand1z } : null
		}
		get hand2() {
			return this.weaponData ? { x: this.weaponData.hand2x, y: this.weaponData.hand2z } : null
		}
		get handSize() { return 20 / this.weaponScale }
		get appearance() { return LeekWars.getLeekAppearance(this.leek.level) }
		get leekSize() { return LeekWars.leekSizes[this.appearance] }
		get hatSize() { return this.hat ? this.HAT_SIZES[this.hat] : null }
		get handImage() {
			return "/image/fight/leek_hand" + (this.leek.skin === 15 ? "_gold" : "") + ".png"
		}
	}
</script>

<style lang="scss" scoped>
	.invert {
		transform: scale(-1, 1);
		transform-origin: center;
	}
</style>