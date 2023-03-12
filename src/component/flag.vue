<template lang="html">
	<router-link v-if="_clickable" class="flag" :title="$t('country.' + code)" :to="'/ranking?country=' + code">
		<img :src="url" loading="lazy">
	</router-link>
	<span v-else class="flag" :title="$t('country.' + code)">
		<img :src="url" loading="lazy">
	</span>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "flag" })
	export default class Flag extends Vue {
		@Prop() code!: string
		@Prop() clickable!: boolean

		get _clickable() {
			if (this.clickable === false) return false
			return true
		}

		get url() {
			if (this.code) {
				return '/image/flag/' + this.code + '.png?2'
			}
			return '/image/flag/_.png?2'
		}
	}
</script>

<style lang="scss" scoped>
	.flag {
		display: inline-flex;
		position: relative;
		img {
			width: 100%;
			height: 100%;
			border-radius: calc(1px + 6%);
			box-shadow: 0 1px 2px 0 #0003;
		}
		&:before {
			content: "";
			top: 0;
			left: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			position: absolute;
			display: block;
			mix-blend-mode: multiply;
			box-sizing: border-box;
			border: 1px solid rgba(0,0,0,.1);
			border-radius: calc(1px + 6%);
		}
	}
</style>