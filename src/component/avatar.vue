<template lang="html">
	<img :src="url" class="avatar">
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "avatar" })
	export default class Avatar extends Vue {
		@Prop() farmer!: Farmer
		get url() {
			if (this.farmer && this.farmer.id && this.farmer.avatar_changed > 0) {
				return LeekWars.avatar + 'avatar/' + this.farmer.id + '.png?' + this.farmer.avatar_changed
			}
			return '/image/no_avatar.png'
		}
	}
</script>

<style lang="scss" scoped>
	img {
		background: white;
		border-radius: 50%;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
</style>