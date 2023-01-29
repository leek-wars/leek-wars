<template>
	<div class="didactitial">

		<leek-image :leek="{ level: 10, face: 1 }" />

		<div class="bubble">
			Bonjour
		</div>

	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'didactitiel', i18n: {}, mixins: [...mixins] })
	export default class Didactitiel extends Vue {



	}
</script>

<style lang="scss" scoped>
.didactitial {
	position: fixed;
	bottom: 0;
	left: 0;
	display: flex;
	gap: 10px;
	align-items: flex-start;
}
.bubble {
	background: white;
	padding: 50px;
	border-radius: 10px;
}
</style>