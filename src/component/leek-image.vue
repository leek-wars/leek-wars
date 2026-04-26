<template lang="html">
	<svg xmlns="http://www.w3.org/2000/svg" :viewBox="'0 0 ' + width + ' ' + height" :width="width * scale" :height="height * scale">
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HatTemplate } from '@/model/hat'
import { Leek, LEEK_FACES } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { FishData, WeaponsData } from '@/model/weapon'

defineOptions({ name: 'leek-image' })

const props = defineProps<{
	leek: Leek
	scale: number
	invert?: boolean
	ai?: number
}>()

const botHats = [ null, 8, 12, 13 ]
const randomAngle = ref(0)

const HAT_SIZES: { [key: number]: {width: number, height: number} } = {
	1: {width: 300, height: 264},
	2: {width: 300, height: 194},
	3: {width: 300, height: 264},
	4: {width: 300, height: 264},
	5: {width: 300, height: 262},
	6: {width: 140, height: 135},
	7: {width: 130, height: 140},
	8: {width: 300, height: 170},
	9: {width: 300, height: 286},
	10: {width: 300, height: 182},
	11: {width: 300, height: 264},
	12: {width: 300, height: 170},
	13: {width: 300, height: 170},
	14: {width: 140, height: 135},
	15: {width: 140, height: 135},
	16: {width: 300, height: 286},
	17: {width: 300, height: 286},
	18: {width: 300, height: 286},
	19: {width: 300, height: 286},
	20: {width: 300, height: 170},
	21: {width: 300, height: 199},
	22: {width: 300, height: 199},
	23: {width: 300, height: 199},
	24: {width: 320, height: 201},
	25: {width: 302, height: 209},
	26: {width: 300, height: 302},
	27: {width: 300, height: 206},
	28: {width: 330, height: 202},
	29: {width: 300, height: 206},
	30: {width: 130, height: 140},
	31: {width: 300, height: 188},
	32: {width: 300, height: 302},
	33: {width: 302, height: 209},
	34: {width: 300, height: 165},
	35: {width: 300, height: 194},
	36: {width: 300, height: 194},
	37: {width: 300, height: 194},
	38: {width: 130, height: 140},
	39: {width: 300, height: 262},
	40: {width: 300, height: 205},
	41: {width: 300, height: 187},
}

const is_boss = computed(() => {
	const n = (props.leek as any).name
	return n === 'nasu_samurai' || n === 'fennel_king' || n === 'evil_pumpkin'
})

const appearance = computed(() => LeekWars.getLeekAppearance(props.leek.level))
const leekSize = computed(() => LeekWars.leekSizes[appearance.value])

const hat = computed<any>(() => {
	const l: any = props.leek
	let h = l.hat
	if (!h && (!l.real || l.bot)) {
		return botHats[-(props.ai as any) as number - 1]
	}
	if (typeof h === 'number') {
		return h
	}
	return LeekWars.items[h!.template].params
})

const hatTemplate = computed<HatTemplate | null>(() => hat.value ? LeekWars.hats[hat.value] : null)
const hatImage = computed(() => hatTemplate.value ? 'hat/' + hatTemplate.value.name + '.png?2' : '')

const leekWidth = computed<number>(() => {
	const n = (props.leek as any).name
	if (n === 'nasu_samurai') return 165
	if (n === 'fennel_king') return 180
	if (n === 'evil_pumpkin') return 292
	return leekSize.value ? leekSize.value.width : 0
})
const leekHeight = computed<number>(() => {
	const n = (props.leek as any).name
	if (n === 'nasu_samurai') return 288
	if (n === 'fennel_king') return 237
	if (n === 'evil_pumpkin') return 237
	return leekSize.value ? leekSize.value.height : 0
})

const hatWidth = computed(() => {
	const n = (props.leek as any).name
	if (n === 'nasu_samurai') return hatTemplate.value ? leekHeight.value * 0.65 * hatTemplate.value.width : 0
	if (n === 'fennel_king') return hatTemplate.value ? leekHeight.value * 0.7 * hatTemplate.value.width : 0
	if (n === 'evil_pumpkin') return hatTemplate.value ? leekHeight.value * 0.8 * hatTemplate.value.width : 0
	return hatTemplate.value ? leekHeight.value * 0.8 * hatTemplate.value.width : 0
})
const hatSize = computed(() => hat.value ? HAT_SIZES[hat.value] : null)
const hatHeight = computed(() => hatSize.value ? hatWidth.value * (hatSize.value.height / hatSize.value.width) : 0)
const hatCrop = computed(() => {
	if ((props.leek as any).name === 'nasu_samurai') return 0
	return hatTemplate.value ? hatTemplate.value.crop : 0
})
const hasHat = computed(() => hat.value !== null)
const hatOffsetY = computed(() => {
	if ((props.leek as any).name === 'nasu_samurai') return 0.85
	return hatTemplate.value ? hatTemplate.value.height : 0
})

const weapon = computed(() => {
	const w: any = (props.leek as any).weapon
	if (typeof w === 'number') return w
	return w ? (w.id as number) : 0
})
const weaponTemplate = computed(() => weapon.value ? LeekWars.items[weapon.value].params : null)
const weaponScale = computed(() => 1.0)
const weaponData = computed(() => {
	if ((props.leek as any).fish) return FishData
	return weaponTemplate.value ? (WeaponsData as any)[weaponTemplate.value] : null
})
const weaponRadianAngle = computed(() => {
	if ((props.leek as any).name === 'evil_pumpkin') return -Math.PI / 2
	return (weaponData.value && weaponData.value.white) ? -Math.PI / 2.7 : Math.PI / 7 + randomAngle.value
})
const weaponAngle = computed(() => weaponRadianAngle.value * (180 / Math.PI))
const weaponImage = computed(() => {
	if ((props.leek as any).fish) return '/image/weapon/fish.png'
	return '/image/' + LeekWars.items[weapon.value].name.replace('_', '/') + '.png'
})
const weaponWidth = computed(() => weaponData.value ? weaponData.value.width : 0)
const weaponHeight = computed(() => weaponData.value ? weaponData.value.height : 0)
const weaponCX = computed(() => {
	if ((props.leek as any).name === 'evil_pumpkin') {
		return weaponData.value ? leekX.value + weaponData.value.centerX - 100 : 0
	}
	return weaponData.value ? leekX.value + weaponData.value.centerX : 0
})
const weaponCY = computed(() => weaponData.value ? weaponData.value.centerZ : 0)
const weaponX = computed(() => weaponData.value ? weaponData.value.x : 0)
const weaponY = computed(() => weaponData.value ? weaponData.value.z : 0)
const weaponBottom = computed(() => weaponData.value ? weaponData.value.bottom : 0)
const weaponTop = computed(() => weaponData.value ? weaponData.value.top : 0)
const weaponRight = computed(() => weaponData.value && weaponData.value.right ? weaponData.value.right : 0)

const weaponOffset = computed(() => {
	return weaponCX.value + (weaponData.value && weaponData.value.white ? (
				weaponRight.value
			) : (
				(Math.cos(weaponRadianAngle.value) * (weaponX.value + weaponWidth.value)
				+ Math.sin(weaponRadianAngle.value) * (-weaponY.value)
				- Math.sin(weaponRadianAngle.value) * (weaponTop.value))
			)) * weaponScale.value
})

const offsetTop = computed(() => {
	return weaponData.value && weaponData.value.white ? Math.max(0,
		weaponData.value.top - leekHeight.value - (hat.value !== null && hatTemplate.value ? hatHeight.value - hatHeight.value * hatOffsetY.value : 0) + weaponData.value.centerZ +
		Math.abs(Math.sin(weaponRadianAngle.value)) * (weaponData.value.width + weaponData.value.x)
	 ) : 0
})

const width = computed(() => {
	let w = leekWidth.value
	if (hatWidth.value > leekWidth.value) w = hatWidth.value
	if (weaponOffset.value > w / 2) w = leekWidth.value / 2 + weaponOffset.value
	return w
})

const height = computed(() => {
	let h = leekHeight.value + offsetTop.value
	if (hat.value != null && hatTemplate.value) {
		h += Math.max(0, hatHeight.value - hatHeight.value * hatOffsetY.value)
	}
	if (weaponData.value && weaponData.value.white) {
		h += weaponData.value.bottom
	} else {
		const weapon_offset = Math.sin(weaponRadianAngle.value) * (weaponWidth.value + weaponX.value)
							+ Math.cos(weaponRadianAngle.value) * (weaponHeight.value + weaponY.value)
							- Math.cos(weaponRadianAngle.value) * (weaponHeight.value - weaponBottom.value)
		if (weapon_offset > weaponCY.value) {
			h += weapon_offset - weaponCY.value
		}
	}
	return h
})

const leekX = computed(() => Math.max(0, hatWidth.value / 2 - leekWidth.value / 2))
const leekY = computed(() => offsetTop.value + (hat.value !== null && hatTemplate.value ? hatHeight.value - hatHeight.value * hatOffsetY.value : 0))
const hatX = computed(() => hat.value !== null ? Math.max(0, leekWidth.value / 2 - hatWidth.value / 2) : 0)
const hatY = computed(() => offsetTop.value)

const leekImage = computed<string>(() => {
	if (is_boss.value) {
		return '/image/mob/' + (props.leek as any).name + '.png'
	}
	const face = !props.leek.face ? '' : LEEK_FACES[props.leek.face]
	return LeekWars.SERVER + 'image/leek/svg/leek_' + appearance.value + '_' + ((props.leek as any).back ? 'back' : 'front') + '_' + LeekWars.getLeekSkinName(props.leek.skin) + ((props.leek as any).metal ? '_metal' : '') + face + '.svg'
})

const hand1 = computed(() => {
	if ((props.leek as any).name === 'evil_pumpkin') return null
	return weaponData.value ? { x: weaponData.value.hand1x, y: weaponData.value.hand1z } : null
})
const hand2 = computed(() => weaponData.value ? { x: weaponData.value.hand2x, y: weaponData.value.hand2z } : null)
const handSize = computed(() => 20 / weaponScale.value)
const handImage = computed(() => {
	const n = (props.leek as any).name
	if (n === 'nasu_samurai') return '/image/fight/nasu_hand.png'
	if (n === 'evil_pumpkin') return '/image/fight/pumpkin_hand.png'
	return '/image/fight/leek_hand' + (props.leek.skin === 15 ? '_gold' : '') + '.png'
})

function drawOnCanvas(): HTMLCanvasElement | null {
	const SCALE = 4
	const canvas = document.createElement('canvas')
	canvas.width = width.value * SCALE
	canvas.height = height.value * SCALE
	const context = canvas.getContext('2d')
	if (!context) return null

	const leekImg = new Image()
	leekImg.src = leekImage.value

	context.scale(SCALE, SCALE)
	context.drawImage(leekImg, 0, leekHeight.value * hatCrop.value, leekWidth.value, leekHeight.value * (1 - hatCrop.value), leekX.value, leekY.value + leekHeight.value * hatCrop.value, leekWidth.value, leekHeight.value * (1 - hatCrop.value))
	if (hasHat.value) {
		const hatImg = new Image()
		hatImg.src = '/image/' + hatImage.value
		context.drawImage(hatImg, hatX.value, hatY.value, hatWidth.value, hatHeight.value)
	}
	if (weapon.value || (props.leek as any).fish) {
		const weaponImg = new Image()
		weaponImg.src = weaponImage.value
		const handImg = new Image()
		handImg.src = handImage.value
		context.translate(leekWidth.value / 2 + weaponCX.value, (leekY.value + leekHeight.value - weaponCY.value))
		context.scale(weaponScale.value, weaponScale.value)
		context.rotate(weaponRadianAngle.value)
		context.translate(weaponX.value, weaponY.value)
		context.drawImage(weaponImg, 0, 0, weaponWidth.value, weaponHeight.value)
		if (hand1.value) {
			context.drawImage(handImg, hand1.value.x - handSize.value / 2, hand1.value.y - handSize.value / 2, handSize.value, handSize.value)
		}
		if (hand2.value) {
			context.drawImage(handImg, hand2.value.x - handSize.value / 2, hand2.value.y - handSize.value / 2, handSize.value, handSize.value)
		}
	}

	return canvas
}

defineExpose({ drawOnCanvas, width, height })
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