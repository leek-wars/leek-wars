<template lang="html">
	<div class="loader">
		<v-progress-circular :size="s" :width="w" indeterminate color="green" />
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "loader" })
	export default class Loader extends Vue {
		@Prop() size!: number
		get s() { return this.size || 70 }
		get w() { return this.s / 10 }
	}
</script>

<style lang="scss" scoped>
	.loader {
		padding: 10px;
		margin: auto;
		text-align: center;
	}
</style>