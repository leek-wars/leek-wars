<template>
	<rich-tooltip-farmer v-if="farmer" :id="farmer.id" v-slot="{ on }">
		<router-link :to="'/farmer/' + farmer.id">
			<span class="pseudo" :class="{me: $store.state.farmer.id === farmer.id}" v-on="on">{{ farmer.name }}</span>
		</router-link>
	</rich-tooltip-farmer>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Component({ name: 'lw-pseudo', components: { RichTooltipFarmer } })
	export default class Pseudo extends Vue {

		@Prop({required: true}) farmer!: Farmer
	}
</script>

<style lang="scss" scoped>
	.pseudo {
		color: var(--text-color);
		font-weight: 500;
		cursor: pointer;
		border-radius: 5px;
		padding: 0 2px;
		background: var(--background);
		&:before {
			content: "@";
		}
		&:hover {
			background: var(--pure-white);
		}
		&.me {
			color: rgb(0, 121, 243);
		}
	}
</style>