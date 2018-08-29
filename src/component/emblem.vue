<template lang="html">
	<img :src="url" class="emblem">
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Team } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "emblem" })
	export default class Avatar extends Vue {
		@Prop() team!: Team
		get url() {
			if (this.team.emblem_changed > 0) {
				return LeekWars.avatar + 'emblem/' + this.team.id + '.png?' + this.team.emblem_changed
			}
			return '/image/no_avatar.png'
		}
	}
</script>

<style lang="scss" scoped>
	img {
		border-radius: 7px;
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
</style>