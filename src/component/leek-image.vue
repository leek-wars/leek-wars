<template lang="html">
	<svg xmlns="http://www.w3.org/2000/svg" :viewBox="'0 0 ' + width + ' ' + height" :width="width * scale" :height="height * scale" v-on="on">
		<defs>
			<clipPath :id="'cut' + hat" clipPathUnits="objectBoundingBox">
				<rect :x="0" :y="hatCrop" :width="leekWidth" :height="leekHeight" />
			</clipPath>
		</defs>
		<g :class="{invert}">
			<image v-if="leekImage" :x="leekX" :y="leekY" :width="leekWidth" :height="leekHeight" :xlink:href="leekImage" :clip-path="'url(#cut' + hat + ')'" />
			<image v-if="hasHat && hatImage" :x="hatX" :y="hatY" :width="hatWidth" :height="hatHeight" :xlink:href="'/image/' + hatImage" />

			<g v-if="weapon || leek.fish" :transform="'translate(' + (leekWidth / 2 + weaponCX) + ',' + (leekY + leekHeight - weaponCY) + ')'">
				<g :transform="'scale(' + weaponScale + ')'">
					<g :transform="'rotate(' + weaponAngle + ')'" transform-box="fill-box">
						<g :transform="'translate(' + weaponX + ',' + weaponY + ')'">
							<image :xlink:href="weaponImage" :width="weaponWidth" :height="weaponHeight" />
							<image v-if="hand1" :xlink:href="handImage" :width="handSize" :height="handSize" :x="hand1.x - handSize / 2" :y="hand1.y - handSize / 2" />
							<image v-if="hand2" :xlink:href="handImage" :width="handSize" :height="handSize" :x="hand2.x - handSize / 2" :y="hand2.y - handSize / 2" />
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
	import { Leek, LEEK_FACES } from '@/model/leek'
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
			1: {width: 300, height: 264}, // christmas
			2: {width: 300, height: 194}, // panama
			3: {width: 300, height: 264}, // christmas
			4: {width: 300, height: 264}, // christmas
			5: {width: 300, height: 262}, // crown
			6: {width: 140, height: 135}, // harlequin
			7: {width: 130, height: 140}, // topper
			8: {width: 300, height: 170}, // chinese
			9: {width: 300, height: 286}, // wizard
			10: {width: 300, height: 182}, // mugiwara
			11: {width: 300, height: 264}, // christmas
			12: {width: 300, height: 170}, // chinese
			13: {width: 300, height: 170}, // chinese
			14: {width: 140, height: 135}, // harlequin
			15: {width: 140, height: 135}, // harlequin
			16: {width: 300, height: 286}, // wizard
			17: {width: 300, height: 286}, // wizard
			18: {width: 300, height: 286}, // wizard
			19: {width: 300, height: 286}, // wizard
			20: {width: 300, height: 170}, // chinese
			21: {width: 300, height: 199}, // crystal crown
			22: {width: 300, height: 199}, // crystal crown
			23: {width: 300, height: 199}, // crystal crown
			24: {width: 320, height: 201}, // bicorn
			25: {width: 302, height: 209}, // sombrero
			26: {width: 300, height: 302}, // pirate hat
			27: {width: 300, height: 206}, // laurel
			28: {width: 330, height: 202}, // bicorn napoleon
			29: {width: 300, height: 206}, // lareul
			30: {width: 130, height: 140}, // topper
			31: {width: 300, height: 188}, // motarboard
			32: {width: 300, height: 302}, // saint patrick
			33: {width: 302, height: 209}, // red sombrero
			34: {width: 300, height: 165}, // space hat
			35: {width: 300, height: 194}, // fedora
			36: {width: 300, height: 194}, // fedora
			37: {width: 300, height: 194}, // fedora
			38: {width: 130, height: 140}, // topper
			39: {width: 300, height: 262}, // crown
			40: {width: 300, height: 205}, // cubic
			41: {width: 300, height: 187}, // cap
		}

		created() {
			// setInterval(() => this.randomAngle = Math.random() * Math.PI / 2 - Math.PI / 4, 500)
		}

		get leekImage(): string {
			const face = !this.leek.face ? '' : LEEK_FACES[this.leek.face]
			return LeekWars.SERVER + 'image/leek/svg/leek_' + this.appearance + '_' + (this.leek.back ? 'back' : 'front') + '_' + LeekWars.getLeekSkinName(this.leek.skin) + (this.leek.metal ? '_metal' : '') + face + '.svg'
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
				return 'hat/' + this.hatTemplate.name + '.png?2'
			}
			return ''
		}
		get hatWidth() { return this.hatTemplate ? this.leekHeight * 0.8 * this.hatTemplate.width : 0 }
		get hatHeight() { return this.hatSize ? this.hatWidth * (this.hatSize.height / this.hatSize.width) : 0 }
		get hatCrop() { return this.hatTemplate ? this.hatTemplate.crop : 0 }
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
				this.weaponData.top - this.leekHeight - (this.hat !== null && this.hatTemplate ? this.hatHeight - this.hatHeight * this.hatTemplate.height : 0) + this.weaponData.centerZ +
				Math.abs(Math.sin(this.weaponRadianAngle)) * (this.weaponData.width + this.weaponData.x)
			 ) : 0
		}
		get leekX() { return Math.max(0, this.hatWidth / 2 - this.leekWidth / 2) }
		get leekY() { return this.offsetTop + (this.hat !== null && this.hatTemplate ? this.hatHeight - this.hatHeight * this.hatTemplate.height : 0) }
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
			return '/image/' + LeekWars.items[this.weapon].name.replace('_', '/') + '.png'
		}
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

		drawOnCanvas(): HTMLCanvasElement | null {
			const SCALE = 4
			const canvas = document.createElement('canvas')
			canvas.width = this.width * SCALE
			canvas.height = this.height * SCALE
			const context = canvas.getContext('2d')
			if (!context) { return null }

			const leekImage = new Image()
			leekImage.src = this.leekImage

			context.scale(SCALE, SCALE)
			// <image v-if="leekImage" :x="leekX" :y="leekY" :width="leekWidth" :height="leekHeight" :xlink:href="leekImage" :clip-path="'url(#cut' + hat + ')'" />
			context.drawImage(leekImage, 0, this.leekHeight * this.hatCrop, this.leekWidth, this.leekHeight * (1 - this.hatCrop), this.leekX, this.leekY + this.leekHeight * this.hatCrop, this.leekWidth, this.leekHeight * (1 - this.hatCrop))
			// <image v-if="hasHat && hatImage" :x="hatX" :y="hatY" :width="hatWidth" :height="hatHeight" :xlink:href="'/image/' + hatImage" />
			if (this.hasHat) {
				const hatImage = new Image()
				hatImage.src = '/image/' + this.hatImage
				context.drawImage(hatImage, this.hatX, this.hatY, this.hatWidth, this.hatHeight)
			}
			// <g v-if="weapon || leek.fish" :transform="'translate(' + (leekWidth / 2 + weaponCX) + ',' + (leekY + leekHeight - weaponCY) + ')'">
			if (this.weapon || this.leek.fish) {
				const weaponImage = new Image()
				weaponImage.src = this.weaponImage
				const handImage = new Image()
				handImage.src = this.handImage
				context.translate(this.leekWidth / 2 + this.weaponCX, (this.leekY + this.leekHeight - this.weaponCY))
				// <g :transform="'scale(' + weaponScale + ')'">
				context.scale(this.weaponScale, this.weaponScale)
				// <g :transform="'rotate(' + weaponAngle + ')'" transform-box="fill-box">
				context.rotate(this.weaponRadianAngle)
				// <g :transform="'translate(' + weaponX + ',' + weaponY + ')'">
				context.translate(this.weaponX, this.weaponY)
				// <image :xlink:href="weaponImage" :width="weaponWidth" :height="weaponHeight" />
				context.drawImage(weaponImage, 0, 0, this.weaponWidth, this.weaponHeight)
				// <image v-if="hand1" :xlink:href="handImage" :width="handSize" :height="handSize" :x="hand1.x - handSize / 2" :y="hand1.y - handSize / 2" />
				if (this.hand1) {
					context.drawImage(handImage, this.hand1.x - this.handSize / 2, this.hand1.y - this.handSize / 2, this.handSize, this.handSize)
				}
				// <image v-if="hand2" :xlink:href="handImage" :width="handSize" :height="handSize" :x="hand2.x - handSize / 2" :y="hand2.y - handSize / 2" />
				if (this.hand2) {
					context.drawImage(handImage, this.hand2.x - this.handSize / 2, this.hand2.y - this.handSize / 2, this.handSize, this.handSize)
				}
			}

			return canvas;
		}
	}
</script>

<style lang="scss" scoped>
svg {
	// border: 1px solid #aaa;
	height: auto;
}
	.invert {
		transform: scale(-1, 1);
		transform-origin: center;
	}
</style>