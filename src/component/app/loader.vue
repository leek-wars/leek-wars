<template lang="html">
	<div class="loader">
		<div :style="{width: s + 'px', height: s + 'px', 'border-width': w + 'px'}" class="sbl-circ-path"></div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "loader" })
	export default class LWLoader extends Vue {
		@Prop() size!: number
		get s() { return this.size || 50 }
		get w() { return this.s / 10 }
	}
</script>

<style lang="scss" scoped>
.loader {
	padding: 30px;
	margin: auto;
	text-align: center;
}
.sbl-circ-path {
	display: inline-block;
	color: rgba(90, 90, 90, 0.1);
	position: relative;
	border-style: solid;
	border-radius: 50%;
	border-right-color: #5fad1b;
	animation: rotate 0.8s linear infinite;
	vertical-align: bottom;
}
@keyframes rotate {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>