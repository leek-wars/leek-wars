<template lang="html">
	<div class="loader">
		<div v-if="LeekWars.xpTheme" class="xp-progress" :style="{width: s + 'px'}">
			<div class="xp-progress-bar"></div>
		</div>
		<div v-else :style="{width: s + 'px', height: s + 'px', 'border-width': w + 'px'}" class="sbl-circ-path"></div>
	</div>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import { LeekWars } from '@/model/leekwars'
	@Options({ name: "loader" })
	export default class LWLoader extends Vue {
		@Prop() size!: number
		LeekWars = LeekWars
		get s() { return this.size || 60 }
		get w() { return Math.max(3, this.s / 14) }
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
	color: var(--border);
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
.xp-progress {
	display: inline-block;
	height: 18px;
	border: 1px solid #686868;
	border-radius: 4px;
	background: #fff;
	box-shadow: inset 0 0 1px rgba(104, 104, 104, 1);
	overflow: hidden;
	padding: 1px 2px;
}
.xp-progress-bar {
	height: 100%;
	border-radius: 2px;
	background: repeating-linear-gradient(
		to right,
		#fff 0px, #fff 2px,
		transparent 2px, transparent 10px
	),
	linear-gradient(
		to bottom,
		#acedad 0%, #7be47d 14%, #4cda50 28%, #2ed330 42%,
		#42d845 57%, #76e275 71%, #8fe791 85%, #fff 100%
	);
	animation: xp-loading 2s ease-in-out infinite;
}
@keyframes xp-loading {
	0% { width: 0%; }
	50% { width: 100%; }
	100% { width: 0%; }
}
</style>