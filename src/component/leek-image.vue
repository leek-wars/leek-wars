<template lang="html">
	<svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox" :width="svgWidth" :height="svgHeight">
		<defs>
			<clipPath :id="clipId" clipPathUnits="objectBoundingBox">
				<rect :x="0" :y="hatCrop" :width="leekWidth" :height="clipHeight" />
			</clipPath>
		</defs>
		<g :class="{invert}">
			<image v-if="leekImage" :x="leekX" :y="leekY" :width="leekWidth" :height="leekHeight" :xlink:href="leekImage" :clip-path="'url(#' + clipId + ')'" />
			<image v-if="hasHat && hatImage" :x="hatX" :y="hatY" :width="hatWidth" :height="hatHeight" :xlink:href="'/image/' + hatImage" />

			<g v-if="!head && (weapon || leek.fish)" :transform="'translate(' + (leekWidth / 2 + weaponCX) + ',' + (leekY + leekHeight - weaponCY) + ')'">
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
		<circle v-if="!head && center && (weapon || leek.fish)" :cx="leekWidth / 2 + weaponCX" :cy="leekY + leekHeight - weaponCY" r="5" fill="red" />
	</svg>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HatTemplate } from '@/model/hat'
import { Leek, LEEK_FACES } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { FishData, WeaponsData } from '@/model/weapon'

defineOptions({ name: 'LeekImage' })

const props = defineProps<{
	leek: Leek
	/** Facteur des attributs `width`/`height` du SVG. Sans effet quand l'appelant
	 *  impose une taille en CSS, ce que font les trois usages de `head`. */
	scale?: number
	invert?: boolean
	ai?: number
	center?: boolean
	/** Miniature carrée : seul le haut du poireau (feuilles + chapeau), sans arme. */
	head?: boolean
}>()

// Part de la hauteur du poireau occupée par les feuilles. Mesurée sur les SVG
// (leek_1 à leek_11) : elles s'arrêtent entre 57 et 60 %, le visage est plus
// bas, vers 80 %. On coupe juste sous les pointes.
const HEAD_RATIO = 0.62
// Hors-champ dessiné autour du cadre, où le chapeau déborde puis se fait couper.
// Arbitrage mesuré sur les 561 combinaisons chapeau x niveau, fenêtre centrée sur
// la tête : plus il est grand, plus les chapeaux tiennent en entier, mais plus la
// tête rétrécit. 1,0 : tête à 29 px sur 40, 61 % des chapeaux entiers ; 1,2 :
// 24 px et 70 % ; 1,4 : 21 px et 90 % ; 1,6 : 18 px et 93 %. À 1,4 la tête fait
// la taille d'une icône voisine (20 px) et neuf chapeaux sur dix passent entiers.
const HEAD_BLEED = 1.4
// Bout de tige gardé sous les feuilles, en part de la hauteur du poireau : sans
// lui la tête est tranchée net. Une paire de pixels suffit à lui faire un cou.
const HEAD_NECK = 0.06

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
	42: {width: 327, height: 474},
	43: {width: 358, height: 343},
	44: {width: 262, height: 192},
	45: {width: 370, height: 384},
	46: {width: 364, height: 273},
	47: {width: 328, height: 358},
	48: {width: 188, height: 377},
	49: {width: 526, height: 291},
	50: {width: 509, height: 297},
	51: {width: 470, height: 278},
	52: {width: 300, height: 342},
	53: {width: 300, height: 212},
	54: {width: 300, height: 342},
	55: {width: 300, height: 342},
	56: {width: 300, height: 320},
	57: {width: 300, height: 260},
}

const is_boss = computed(() => {
	const n = props.leek.name
	return n === 'nasu_samurai' || n === 'fennel_king' || n === 'evil_pumpkin'
})

const appearance = computed(() => LeekWars.getLeekAppearance(props.leek.level))
const leekSize = computed(() => LeekWars.leekSizes[appearance.value])

const hat = computed<number | null>(() => {
	const l = props.leek
	let h = l.hat
	if (!h && (!l.real || l.bot)) {
		return botHats[-(props.ai as number) - 1] ?? null
	}
	if (typeof h === 'number') {
		return h
	}
	return h ? LeekWars.items[h.template].params : null
})

const hatTemplate = computed<HatTemplate | null>(() => hat.value ? LeekWars.hats[hat.value] : null)
const hatImage = computed(() => hatTemplate.value ? 'hat/' + hatTemplate.value.name + '.png?2' : '')

const leekWidth = computed<number>(() => {
	const n = props.leek.name
	if (n === 'nasu_samurai') return 165
	if (n === 'fennel_king') return 180
	if (n === 'evil_pumpkin') return 292
	return leekSize.value ? leekSize.value.width : 0
})
const leekHeight = computed<number>(() => {
	const n = props.leek.name
	if (n === 'nasu_samurai') return 288
	if (n === 'fennel_king') return 237
	if (n === 'evil_pumpkin') return 237
	return leekSize.value ? leekSize.value.height : 0
})

const hatWidth = computed(() => {
	const n = props.leek.name
	if (n === 'nasu_samurai') return hatTemplate.value ? leekHeight.value * 0.65 * hatTemplate.value.width : 0
	if (n === 'fennel_king') return hatTemplate.value ? leekHeight.value * 0.7 * hatTemplate.value.width : 0
	if (n === 'evil_pumpkin') return hatTemplate.value ? leekHeight.value * 0.8 * hatTemplate.value.width : 0
	return hatTemplate.value ? leekHeight.value * 0.8 * hatTemplate.value.width : 0
})
const hatSize = computed(() => hat.value ? HAT_SIZES[hat.value] : null)
const hatHeight = computed(() => hatSize.value ? hatWidth.value * (hatSize.value.height / hatSize.value.width) : 0)
const hatCrop = computed(() => {
	if (props.leek.name === 'nasu_samurai') return 0
	return hatTemplate.value ? hatTemplate.value.crop : 0
})
const hasHat = computed(() => hat.value !== null)
// En miniature, le poireau est tranché sous les feuilles : la tige n'a rien à y
// faire, et c'est ce qui permet de centrer la tête sans la faire remonter.
// L'identifiant distingue les deux détourages, sinon deux instances du même
// chapeau — une entière, une en miniature — se partageraient le premier venu.
const clipHeight = computed(() => props.head ? Math.max(0, HEAD_RATIO + HEAD_NECK - hatCrop.value) : leekHeight.value)
const clipId = computed(() => 'cut' + hat.value + (props.head ? 'h' : ''))
const hatOffsetY = computed(() => {
	if (props.leek.name === 'nasu_samurai') return 0.85
	return hatTemplate.value ? hatTemplate.value.height : 0
})

const weapon = computed(() => {
	const w = props.leek.weapon
	if (typeof w === 'number') return w
	return 0
})
const weaponTemplate = computed(() => weapon.value ? LeekWars.items[weapon.value].params : null)
const weaponScale = computed(() => 1.0)
const weaponData = computed(() => {
	if (props.leek.fish) return FishData
	return weaponTemplate.value ? WeaponsData[weaponTemplate.value] : null
})
const weaponRadianAngle = computed(() => {
	if (props.leek.name === 'evil_pumpkin') return -Math.PI / 2
	return (weaponData.value && weaponData.value.white) ? -Math.PI / 2.7 : Math.PI / 7 + randomAngle.value
})
const weaponAngle = computed(() => weaponRadianAngle.value * (180 / Math.PI))
const weaponImage = computed(() => {
	if (props.leek.fish) return '/image/weapon/fish.png'
	return '/image/' + LeekWars.items[weapon.value].name.replace('_', '/') + '.png'
})
const weaponWidth = computed(() => weaponData.value ? weaponData.value.width : 0)
const weaponHeight = computed(() => weaponData.value ? weaponData.value.height : 0)
const weaponCX = computed(() => {
	if (props.leek.name === 'evil_pumpkin') {
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
	// En miniature l'arme n'est pas dessinée : rien ne doit pousser le poireau
	// vers le bas, sinon le cadrage de la tête part avec.
	if (props.head) { return 0 }
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

// Fenêtre carrée centrée sur le haut du poireau. Carrée pour que la miniature
// garde le même encombrement quel que soit le niveau, qui change la taille du
// poireau : sans ça les entrées du menu ne s'alignent plus.
//
// Elle se cale sur le POIREAU et pas sur le chapeau. Un tricorne fait 526x291
// et une couronne solaire dépasse d'une demi-tête : les faire tenir dans le
// cadre rétrécirait la tête d'autant, et deux poireaux voisins n'auraient plus
// la même taille. Ils débordent donc, et le viewBox les coupe.
const headBox = computed(() => {
	// Le cadre ne tient compte QUE de la tête — les feuilles, jamais le chapeau.
	// C'est la tête qui doit faire la même taille d'un poireau à l'autre : la
	// caler sur le chapeau la rétrécissait d'autant que celui-ci est grand, et
	// deux poireaux voisins n'avaient plus la même taille pour la seule raison
	// qu'ils ne portaient pas le même couvre-chef.
	const headHeight = leekHeight.value * HEAD_RATIO
	const size = Math.max(leekWidth.value, headHeight)
	// Le poireau et le chapeau partagent le même axe vertical, quel que soit
	// celui des deux qui est le plus large.
	const centerX = Math.max(leekWidth.value, hatWidth.value) / 2
	// Le chapeau, posé par-dessus, sort de ce cadre : la fenêtre réellement
	// dessinée est plus grande pour lui laisser la place, et le coupe au-delà.
	// Rien n'y grandit — l'appelant rend le SVG dans la même proportion et
	// résorbe le hors-champ (marges négatives), si bien que la tête garde sa
	// taille partout.
	const box = size * HEAD_BLEED
	// La fenêtre est CENTRÉE sur la tête, pour que la vignette s'aligne sur les
	// icônes voisines. Ce qui pend sous les feuilles n'est pas caché par le
	// cadrage mais coupé à la source (clipHeight) : sinon, ou bien la tige
	// réapparaît, ou bien il faut décaler la tête vers le bas de son emplacement,
	// et elle ne s'aligne plus.
	const centerY = leekY.value + leekHeight.value * (HEAD_RATIO + HEAD_NECK) / 2
	return {
		x: centerX - box / 2,
		y: centerY - box / 2,
		size: box
	}
})

const viewBox = computed(() => {
	if (props.head) {
		const box = headBox.value
		return box.x + ' ' + box.y + ' ' + box.size + ' ' + box.size
	}
	return '0 0 ' + width.value + ' ' + height.value
})
const svgWidth = computed(() => (props.head ? headBox.value.size : width.value) * (props.scale ?? 1))
const svgHeight = computed(() => (props.head ? headBox.value.size : height.value) * (props.scale ?? 1))

const leekX = computed(() => Math.max(0, hatWidth.value / 2 - leekWidth.value / 2))
const leekY = computed(() => offsetTop.value + (hat.value !== null && hatTemplate.value ? hatHeight.value - hatHeight.value * hatOffsetY.value : 0))
const hatX = computed(() => hat.value !== null ? Math.max(0, leekWidth.value / 2 - hatWidth.value / 2) : 0)
const hatY = computed(() => offsetTop.value)

const leekImage = computed<string>(() => {
	if (is_boss.value) {
		return '/image/mob/' + props.leek.name + '.png'
	}
	const face = !props.leek.face ? '' : LEEK_FACES[props.leek.face]
	return LeekWars.SERVER + 'image/leek/svg/leek_' + appearance.value + '_' + (props.leek.back ? 'back' : 'front') + '_' + LeekWars.getLeekSkinName(props.leek.skin) + (props.leek.metal ? '_metal' : '') + face + '.svg'
})

const hand1 = computed(() => {
	if (props.leek.name === 'evil_pumpkin') return null
	return weaponData.value ? { x: weaponData.value.hand1x, y: weaponData.value.hand1z } : null
})
const hand2 = computed(() => weaponData.value ? { x: weaponData.value.hand2x, y: weaponData.value.hand2z } : null)
const handSize = computed(() => 20 / weaponScale.value)
const handImage = computed(() => {
	const n = props.leek.name
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
	if (weapon.value || props.leek.fish) {
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