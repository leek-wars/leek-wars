<template>
	<defs>
		<clipPath :id="boxClipId">
			<polygon :points="innerShape" />
		</clipPath>
	</defs>
	<polygon :points="shape" :me="item ? item.me : false" :champion="isChampion" :class="{'no-fight': !item}" class="entry" />
	<!-- Le contenu est découpé par un groupe et non par lui-même : sur un <svg>
	     imbriqué (leek-image), le clip s'appliquerait dans SON repère, et tout
	     disparaîtrait. Un <g> n'a pas de repère à lui. -->
	<g :clip-path="'url(#' + boxClipId + ')'">
		<leek-image v-if="item && item.data" :x="x + 1" :y="y + 1" :width="size - 2" :height="size - 2" :leek="{level: item.data[0], skin: item.data[1], hat: item.data[2], weapon: item.data[3], metal: item.data[5], face: item.data[6]}" :scale="1" :invert="invert" />
		<image v-else-if="item" :win="item.win" :width="size - 2" :height="size - 2" :x="x + 1" :y="y + 1" :xlink:href="image" />
	</g>
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
		<circle :cx="avatarCx" :cy="y + size - avatarSize / 3" :r="avatarSize / 2" fill="none" stroke="var(--bracket-line)" :stroke-width="1.5" />
	</a>
	<foreignObject v-if="displayName" :x="x" :y="nameAbove ? y - nameFontSize * 1.6 - 1 : y + size + 1" :width="size" :height="nameFontSize * 1.6" style="overflow: visible; pointer-events: none">
		<div class="block-name-wrap" :class="{ above: nameAbove }"><span class="block-name" :style="nameStyle">{{ displayName }}</span></div>
	</foreignObject>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { emitter } from '@/model/emitter'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
import { CHAMPION, cutSquare, sameEntry } from '@/component/tournament/bracket'

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
	// Nullable : la case du vainqueur est vide tant que le tournoi n'est pas fini.
	item: TournamentItem | null
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
const boxClipId = computed(() => 'box-clip-' + props.x + '-' + props.y)
// Le vainqueur se reconnaît à tous les tours qu'il a traversés, sa case y prend
// le bord doré du chemin.
const champion = inject(CHAMPION, null)
const isChampion = computed(() => sameEntry(champion?.value, props.item))
const shape = computed(() => cutSquare(props.x, props.y, props.size))
// Le contenu est découpé un poil à l'intérieur du trait, comme l'avatar dont le
// fond dépasse de 1 px tout autour.
const innerShape = computed(() => cutSquare(props.x + 1, props.y + 1, props.size - 2))
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
// Taille FIXE, et volontairement petite : elle suivait la case, ce qui coupait
// les noms des petits tours (les plus nombreux) très tôt, et donnait au passage
// deux tailles de texte par colonne. Le SVG étant mis à l'échelle pour tenir
// dans l'écran, ces unités valent à peu près autant de pixels.
const nameFontSize = 8
const nameStyle = {
	fontSize: nameFontSize + 'px',
	lineHeight: (nameFontSize * 1.3) + 'px',
	// Marge intérieure resserrée (0,35 → 0,22) : sur une case de 40, elle mangeait
	// à elle seule 14 % de la place du nom.
	padding: (nameFontSize * 0.08) + 'px ' + (nameFontSize * 0.22) + 'px',
	borderRadius: (nameFontSize * 0.35) + 'px',
}

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
// Position à l'écran plutôt que dans le repère du SVG : celui-ci est mis à
// l'échelle et étiré selon la place disponible, la page ne peut pas la refaire.
function mouseenter(e: MouseEvent) {
	if (props.item && props.item.name) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		emitter.emit('tooltip', { x: rect.left + rect.width / 2, y: rect.bottom, content: props.item.name })
	}
}
function mouseleave() {
	if (props.item) emitter.emit('tooltip-close')
}
</script>

<style lang="scss" scoped>
	.entry {
		fill: var(--pure-white);
		stroke: var(--bracket-line);
		stroke-width: 2;
	}
	.entry[me="true"] {
		stroke: var(--primary);
		fill: #78ff0355;
	}
	// Après la règle « moi » et à spécificité égale : si notre participant gagne
	// le tournoi, sa case garde le fond vert et prend le bord doré.
	.entry[champion="true"] {
		stroke: var(--gold);
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
		color: var(--white);
		background: rgba(0, 0, 0, 0.55);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}
</style>