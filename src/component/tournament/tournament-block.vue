<template>
	<rect :width="size" :height="size" :x="x" :y="y" :me="item ? item.me : false" :class="{'no-fight': !item}" class="entry" />
	<leek-image v-if="item && item.data" :x="x + 1" :y="y + 1" :width="size - 2" :height="size - 2" :leek="{level: item.data[0], skin: item.data[1], hat: item.data[2], weapon: item.data[3], metal: item.data[5], face: item.data[6]}" :scale="1" :invert="invert" />
	<image v-else-if="item" :win="item.win" :width="size - 2" :height="size - 2" :x="x + 1" :y="y + 1" :xlink:href="image" />
	<foreignObject v-if="item" :x="x" :y="y" :width="size" :height="size" style="overflow: visible">
		<rich-tooltip-leek v-if="entityType === 'leek'" :id="entityId" :disabled="!isActive" :bottom="true" v-slot="{ props }">
			<div v-bind="props" class="tooltip-target" @mouseenter="activate" @click="click" />
		</rich-tooltip-leek>
		<rich-tooltip-farmer v-else-if="entityType === 'farmer'" :id="entityId" :disabled="!isActive" :bottom="true" v-slot="{ props }">
			<div v-bind="props" class="tooltip-target" @mouseenter="activate" @click="click" />
		</rich-tooltip-farmer>
		<rich-tooltip-composition v-else-if="entityType === 'team'" :id="item.id" :disabled="!isActive" :bottom="true" v-slot="{ props }">
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
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { emitter } from '@/model/vue'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
	import { ref } from 'vue'

	// Shared across all tournament-block instances: only one tooltip at a time
	const activeBlock = ref('')

	@Options({ name: 'tournament-block', components: { RichTooltipLeek, RichTooltipFarmer, RichTooltipComposition } })
	export default class TournamentBlock extends Vue {
		@Prop({ required: true }) item: any
		@Prop({ required: true }) x!: number
		@Prop({ required: true }) y!: number
		@Prop({ required: true }) size!: number
		@Prop() invert!: boolean
		get link() { return this.item && this.item.link ? this.item.link : undefined }
		get image() { return (this.item && this.item.image) ? (this.item.image.indexOf('/') === 0 ? 'https://leekwars.com' + this.item.image : this.item.image) : '' }
		get avatarSize() { return Math.round(this.size * 0.4) }
		get farmerAvatar() {
			if (this.item && this.item.farmer_avatar_changed > 0) {
				return LeekWars.AVATAR + 'avatar/' + this.item.farmer_id + '.png?' + this.item.farmer_avatar_changed
			}
			return '/image/no_avatar.png'
		}
		get avatarCx() { return this.invert ? this.x + this.size - this.avatarSize / 3 : this.x + this.avatarSize / 3 }
		get clipId() { return 'avatar-clip-' + this.x + '-' + this.y }
		get blockKey() { return this.x + ',' + this.y }
		get isActive() { return activeBlock.value === this.blockKey }
		get entityType() {
			if (!this.item?.link) return null
			const match = this.item.link.match(/^\/(leek|farmer|team)\/(\d+)$/)
			return match ? match[1] : null
		}
		get entityId() {
			if (!this.item?.link) return 0
			const match = this.item.link.match(/^\/(leek|farmer|team)\/(\d+)$/)
			return match ? parseInt(match[2]) : 0
		}

		activate() {
			activeBlock.value = this.blockKey
		}
		click(e: Event) {
			if (this.item) {
				this.$router.push(this.item.link)
			}
			e.preventDefault()
		}
		clickFarmer(e: Event) {
			if (this.item) {
				this.$router.push('/farmer/' + this.item.farmer_id)
			}
			e.preventDefault()
		}
		mouseenter() {
			if (this.item) {
				emitter.emit('tooltip', { x: this.x + this.size / 2, y: this.y + this.size, content: this.item.name })
			}
		}
		mouseleave() {
			if (this.item) {
				emitter.emit('tooltip-close')
			}
		}
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
</style>