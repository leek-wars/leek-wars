<template>
	<a :xlink:href="link" @click="click">
		<rect :width="size" :height="size" :x="x" :y="y" :me="item ? item.me : false" :class="{'no-fight': !item}" class="entry" />
		<leek-image v-if="item && item.data" :x="x + 1" :y="y + 1" :width="size - 2" :height="size - 2" :leek="{level: item.data[0], skin: item.data[1], hat: item.data[2], weapon: item.data[3], metal: item.data[5], face: item.data[6]}" :scale="1" :invert="invert" @mouseenter.native="mouseenter" @mouseleave.native="mouseleave" />
		<image v-else :win="item ? item.win : false" :width="size - 2" :height="size - 2" :x="x + 1" :y="y + 1" :xlink:href="image" @mouseenter="mouseenter" @mouseleave="mouseleave" />
	</a>
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

	@Options({ name: 'tournament-block' })
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
		mouseenter(e: Event) {
			if (this.item) {
				const attributes = (e.target as any).attributes
				const x = parseInt(attributes.x.nodeValue, 10) + parseInt(attributes.width.nodeValue, 10) / 2
				const y = parseInt(attributes.y.nodeValue, 10) + parseInt(attributes.height.nodeValue, 10)
				emitter.emit('tooltip', { x, y, content: this.item.name })
			}
		}
		mouseleave(e: Event) {
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
</style>