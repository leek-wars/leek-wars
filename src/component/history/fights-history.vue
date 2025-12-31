<template lang="html">
	<div class="history">
		<div v-for="fight in fights" :key="fight.id" class="wrapper">
			<fight-history :fight="fight" />
		</div>
	</div>
</template>

<script lang="ts">
	import { Fight } from '@/model/fight'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import FightHistory from '@/component/history/fight-history.vue'

	@Options({ name: 'fights-history', components: { FightHistory } })
	export default class FightsHistory extends Vue {
		@Prop() fights!: Fight[]
	}
</script>

<style lang="scss" scoped>
	.history {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		flex-wrap: wrap;
		padding: 5px;
		.wrapper {
			flex-grow: 1;
		}
	}
</style>