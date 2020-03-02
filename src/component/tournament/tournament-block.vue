<template>
	<a :xlink:href="link" @click="click">
		<rect :width="size" :height="size" :x="x" :y="y" :me="item ? item.me : false" :class="{'no-fight': !item}" class="entry" />
		<leek-image v-if="item && item.data" :x="x + 1" :y="y + 1" :width="size - 2" :height="size - 2" :leek="{level: item.data[0], skin: item.data[1], hat: item.data[2], weapon: item.data[3]}" :scale="1" :invert="invert" @mouseenter.native="mouseenter" @mouseleave.native="mouseleave" />
		<image v-else :win="item ? item.win : false" :width="size - 2" :height="size - 2" :x="x + 1" :y="y + 1" :xlink:href="image" @mouseenter="mouseenter" @mouseleave="mouseleave" />
	</a>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'tournament-block' })
	export default class TournamentBlock extends Vue {
		@Prop({ required: true }) item: any
		@Prop({ required: true }) x!: number
		@Prop({ required: true }) y!: number
		@Prop({ required: true }) size!: number
		@Prop() invert!: boolean
		get link() { return this.item && this.item.link ? this.item.link : undefined }
		get image() { return (this.item && this.item.image) ? (this.item.image.indexOf('/') === 0 ? 'https://leekwars.com' + this.item.image : this.item.image) : '' }

		click(e: Event) {
			if (this.item) {
				this.$router.push(this.item.link)
			}
			e.preventDefault()
		}
		mouseenter(e: Event) {
			if (this.item) {
				const attributes = (e.target as any).attributes
				const x = parseInt(attributes.x.nodeValue, 10) + parseInt(attributes.width.nodeValue, 10) / 2
				const y = parseInt(attributes.y.nodeValue, 10) + parseInt(attributes.height.nodeValue, 10)
				this.$root.$emit('tooltip', x, y, this.item.name)
			}
		}
		mouseleave(e: Event) {
			if (this.item) {
				this.$root.$emit('tooltip-close')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.entry {
		fill: white;
		stroke: #bbb;
		stroke-width: 2;
	}
	.entry[me="true"] {
		stroke: #5fad1b;
		fill: #c8ffc7;
	}
	image[win="false"] {
		opacity: 0.4;
		fill: #f5f5f5;
	}
	.no-fight {
		fill: rgb(242, 242, 242);
		stroke-dasharray: 5.5;
	}
</style>