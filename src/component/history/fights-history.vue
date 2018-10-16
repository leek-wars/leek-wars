<template lang="html">
	<div class="history">
		<div v-for="fight in fights" :key="fight.id" class="wrapper">
			<fight-history :fight="fight" />
		</div>
	</div>
</template>

<script lang="ts">
	import { Fight } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'fights-history' })
	export default class FightsHistory extends Vue {
		@Prop() fights!: Fight[]
	}
</script>

<style lang="scss" scoped>
	.history {
		display: flex;
		flex-wrap: wrap;
		padding: 5px;
		.wrapper {
			flex-grow: 1;
			min-width: 50%;
		}
	}
</style>