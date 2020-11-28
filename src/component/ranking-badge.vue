<template lang="html">
	<span v-ripple class="badge" :class="{first: ranking === 1, second: ranking === 2, third: ranking === 3, ten: ranking <= 10, cent: ranking <= 100}" v-on="on" @click.stop="LeekWars.goToRanking(category, 'talent', id)">
		<v-icon>mdi-chevron-triple-up</v-icon>
		<span class="value">{{ ranking }}</span>
	</span>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "ranking-badge" })
	export default class RankingBadge extends Vue {
		@Prop() ranking!: number
		@Prop() id!: number
		@Prop() category!: string
		@Prop() on!: any
	}
</script>

<style lang="scss" scoped>
	.badge {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		margin: 0 7px;
		font-size: 16px;
		padding: 3px 4px;
		font-weight: 500;
		border-radius: 2px;
		border: 1px solid #ccc;
		.v-icon {
			font-size: 21px;
		}
		.value {
			flex: 1;
			text-align: center;
			padding-left: 2px;
			padding-right: 5px;
		}
		&.cent {
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
			background: white;
			font-size: 18px;
			border: none;
		}
		&.ten {
			background: linear-gradient(0deg, #000000, #aaa);
			color: white;
			padding: 1px 2px;
		}
		&.first {
			background: linear-gradient(0deg, #ffb029, #ffdc3a);
			border: 1px solid #ffb430;
			color: white;
			font-weight: bold;
			text-shadow: 1.5px 0 0 #ff9b29, -1.5px 0 0 #ffb029, 0 1.5px 0 #ffb029, 0 -1.5px 0 #ffb029;
		}
		&.second {
			background: linear-gradient(0deg, #b1b1b1, #dddddd);
			border: 1px solid #a0a0a0;
			color: white;
			font-weight: bold;
			text-shadow: 1.5px 0 0 #909090, -1.5px 0 0 #909090, 0 1.5px 0 #909090, 0 -1.5px 0 #909090;
		}
		&.third {
			background: linear-gradient(0deg, #ae4e00, #ff7300);
			border: 1px solid #ae4e00;
			color: white;
			font-weight: bold;
			text-shadow: 1.5px 0 0 #ae4e00, -1.5px 0 0 #ae4e00, 0 1.5px 0 #ae4e00, 0 -1.5px 0 #ae4e00;
		}
	}
</style>