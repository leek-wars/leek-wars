<template lang="html">
	<div class="summon">
		<h4>{{ $t('market.summon_characteristics') }}</h4>
		<div class="characteristics">
			<div class="summon-image">
				<img :src="'/image/bulb/' + summon.name + '_front.png'" width="width">
			</div>
			<div>
				<tooltip v-for="c in ['life', 'science', 'wisdom', 'magic', 'strength', 'frequency', 'agility', 'mp', 'resistance', 'tp']" :key="c">
					<template v-slot:activator="{ on }">
						<div class="characteristic" v-on="on">
							<img :src="'/image/charac/' + c + '.png'" v-on="on">
							<span :class="'color-' + c">
								<span v-if="c == 'frequency'">0</span>
								<span v-else-if="summon.characteristics[c][0] == summon.characteristics[c][1]">
									{{ summon.characteristics[c][0] }}
								</span>
								<span v-else>
									{{ summon.characteristics[c][0] + " à " + summon.characteristics[c][1] }}
								</span>
							</span>
						</div>
					</template>
					<b>{{ $t('leek.' + c) }}</b>
				</tooltip>
			</div>
		</div>
		<h4>{{ $t('market.summon_available_chips') }}</h4>
		<div class="chips">
			<rich-tooltip-chip v-for="chip of summon.chips" :key="chip.id" v-slot="{ on }" :chip="LeekWars.chips[chip]" :bottom="true" :instant="true">
				<img :src="'/image/chip/small/' + LeekWars.chips[chip].name + '.png'" class="chip" v-on="on">
			</rich-tooltip-chip>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'summon-view' })
	export default class SummonView extends Vue {
		@Prop() summon!: any
	}
</script>

<style lang="scss" scoped>
	.characteristics {
		display: flex;
		align-items: center;
	}
	.characteristic {
		display: inline-block;
		width: 50%;
	}
	.summon h4 {
		margin: 8px;
		text-align: left;
		font-size: 15px;
	}
	.summon-image {
		flex: 1 0 90px;
		margin-right: 20px;
		margin-left: 10px;
		text-align: center;
		max-height: 120px;
	}
	.summon-image img {
		max-height: 110px;
	}
	.summon .characteristics {
		text-align: left;
	}
	.summon .characteristic span {
		display: inline-block;
		margin-top: 2px;
		vertical-align: top;
		margin-left: 3px;
	}
	.summon .characteristic img {
		width: 20px;
	}
	.summon .chips .chip {
		width: 50px;
		margin: 3px;
	}
</style>