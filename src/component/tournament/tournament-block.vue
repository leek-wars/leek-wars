<template>
	<rect :width="size" :height="size" :x="x" :y="y" :me="item ? item.me : false" :class="{'no-fight': !item}" class="entry" />
	<leek-image v-if="item && item.data" :x="x + 1" :y="y + 1" :width="size - 2" :height="size - 2" :leek="{level: item.data[0], skin: item.data[1], hat: item.data[2], weapon: item.data[3], metal: item.data[5], face: item.data[6]}" :scale="1" :invert="invert" />
	<image v-else-if="item" :win="item.win" :width="size - 2" :height="size - 2" :x="x + 1" :y="y + 1" :xlink:href="image" />
	<foreignObject v-if="item" :x="x" :y="y" :width="size" :height="size" style="overflow: visible">
		<rich-tooltip-leek v-if="entityType === 'leek'" :id="entityId" v-slot="{ props }" :disabled="!isActive" :bottom="true">
			<div v-bind="props" class="tooltip-target" @mouseenter="activate" @click="click" />
		</rich-tooltip-leek>
		<rich-tooltip-farmer v-else-if="entityType === 'farmer'" :id="entityId" v-slot="{ props }" :disabled="!isActive" :bottom="true">
			<div v-bind="props" class="tooltip-target" @mouseenter="activate" @click="click" />
		</rich-tooltip-farmer>
		<rich-tooltip-composition v-else-if="entityType === 'team' && item.id" :id="item.id" v-slot="{ props }" :disabled="!isActive" :bottom="true">
			<div v-bind="props" class="tooltip-target" @mouseenter="activate" @click="click" />
		</rich-tooltip-composition>
		<div v-else class="tooltip-target" @click="click" @mouseenter="mouseenter" @mouseleave="mouseleave" />
	</foreignObject>
	<a v-if="item && item.data && item.farmer_id" :xlink:href="'/farmer/' + item.farmer_id" @click="clickFarmer">
		<defs>
			<clipPath :id="clipId">
				<circle :cx="avatarCx" :cy="y + size - avatarSize / 3" :r="avatarSize / 2" />
			</clipPath>
		</defs>
		<image :x="avatarCx - avatarSize / 2" :y="y + size - avatarSize / 3 - avatarSize / 2" :width="avatarSize" :height="avatarSize" :xlink:href="farmerAvatar" :clip-path="'url(#' + clipId + ')'" />
		<circle :cx="avatarCx" :cy="y + size - avatarSize / 3" :r="avatarSize / 2" fill="none" stroke="var(--background-disabled)" :stroke-width="1.5" />
	</a>
	<foreignObject v-if="displayName" :x="x" :y="nameAbove ? y - nameFontSize * 1.6 - 1 : y + size + 1" :width="size" :height="nameFontSize * 1.6" style="overflow: visible; pointer-events: none">
		<div class="block-name-wrap" :class="{ above: nameAbove }"><span class="block-name" :style="nameStyle">{{ displayName }}</span></div>
	</foreignObject>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { emitter } from '@/model/vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'

defineOptions({ name: 'TournamentBlock' })

// Shared across all tournament-block instances: only one tooltip at a time
const activeBlock = ref('')

interface TournamentItem {
	me?: boolean
	data?: number[]
	win?: boolean
	image?: string
	id?: number
	farmer_id?: number
	farmer_avatar_changed?: number
	link?: string
	name?: string
	[key: string]: unknown
}

const props = defineProps<{
	item: TournamentItem
	x: number
	y: number
	size: number
	invert?: boolean
	nameAbove?: boolean
}>()

const router = useRouter()

const image = computed(() => (props.item && props.item.image) ? (props.item.image.indexOf('/') === 0 ? 'https://leekwars.com' + props.item.image : props.item.image) : '')
const avatarSize = computed(() => Math.round(props.size * 0.4))
const farmerAvatar = computed(() => {
	if (props.item && props.item.farmer_avatar_changed && props.item.farmer_avatar_changed > 0) {
		return LeekWars.AVATAR + 'avatar/' + props.item.farmer_id + '.png?' + props.item.farmer_avatar_changed
	}
	return '/image/no_avatar.png'
})
const avatarCx = computed(() => props.invert ? props.x + props.size - avatarSize.value / 3 : props.x + avatarSize.value / 3)
const clipId = computed(() => 'avatar-clip-' + props.x + '-' + props.y)
const blockKey = computed(() => props.x + ',' + props.y)
const isActive = computed(() => activeBlock.value === blockKey.value)
const entityType = computed(() => {
	if (!props.item?.link) return null
	const match = props.item.link.match(/^\/(leek|farmer|team)\/(\d+)$/)
	return match ? match[1] : null
})
const entityId = computed(() => {
	if (!props.item?.link) return 0
	const match = props.item.link.match(/^\/(leek|farmer|team)\/(\d+)$/)
	return match ? parseInt(match[2]) : 0
})
// Nom affiché sous la case du bracket (#4212) : confiné à la largeur de la case,
// tronqué par CSS (ellipsis) seulement s'il déborde réellement. Le serveur suffixe
// le nom par " (niveau)", retiré ici pour l'affichage.
const displayName = computed(() => (props.item?.name ?? '').replace(/ \(\d+\)$/, ''))
// Taille de texte proportionnelle à la case, progression adoucie sur les grosses
// cases (base fixe + pente réduite) : ≈ 9px pour size 50, ≈ 14px pour size 120.
const nameFontSize = computed(() => 5.5 + props.size * 0.07)
const nameStyle = computed(() => {
	const fs = nameFontSize.value
	return {
		fontSize: fs + 'px',
		lineHeight: (fs * 1.3) + 'px',
		padding: (fs * 0.08) + 'px ' + (fs * 0.35) + 'px',
		borderRadius: (fs * 0.35) + 'px',
	}
})

function activate() {
	activeBlock.value = blockKey.value
}
function click(e: Event) {
	if (props.item && props.item.link) router.push(props.item.link)
	e.preventDefault()
}
function clickFarmer(e: Event) {
	if (props.item) router.push('/farmer/' + props.item.farmer_id)
	e.preventDefault()
}
function mouseenter() {
	if (props.item && props.item.name) {
		emitter.emit('tooltip', { x: props.x + props.size / 2, y: props.y + props.size, content: props.item.name })
	}
}
function mouseleave() {
	if (props.item) emitter.emit('tooltip-close')
}
</script>

<style lang="scss" scoped>
	.entry {
		fill: var(--pure-white);
		stroke: var(--background-disabled);
		stroke-width: 2;
	}
	.entry[me="true"] {
		stroke: #5fad1b;
		fill: #78ff0355;
	}
	.no-fight {
		fill: var(--background);
		stroke-dasharray: 5.5;
	}
	.tooltip-target {
		width: 100%;
		height: 100%;
		cursor: pointer;
	}
	.block-name-wrap {
		display: flex;
		justify-content: center;
		// Collé au bord haut de la boîte (juste sous le carré) quand le nom est
		// en dessous ; collé au bord bas (juste au-dessus du carré) quand au-dessus.
		align-items: flex-start;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.block-name-wrap.above {
		align-items: flex-end;
	}
	.block-name {
		max-width: 100%;
		box-sizing: border-box;
		font-weight: 500;
		color: #fff;
		background: rgba(0, 0, 0, 0.55);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}
</style>