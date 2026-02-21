<template lang="html">
	<img :src="url" class="avatar" v-bind="$attrs">
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ name: "avatar" })
	export default class Avatar extends Vue {
		@Prop() farmer!: Farmer
		get url() {
			if (this.farmer) {
				if (this.farmer.id > 0) {
					if (this.farmer.avatar_changed > 0) {
						return LeekWars.AVATAR + 'avatar/' + this.farmer.id + '.png?' + this.farmer.avatar_changed
					}
				} else if (this.farmer.id === 0) {
					return '/image/lw_avatar.png'
				}
			}
			return '/image/no_avatar.png'
		}
	}
</script>

<style lang="scss" scoped>
	img {
		background: var(--pure-white);
		border-radius: 50%;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		object-fit: cover;
	}
</style>