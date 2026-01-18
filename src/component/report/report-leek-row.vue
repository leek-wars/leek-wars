<template>
	<tr>
		<td class="name">
			<span v-if="leek.dead" class="dead"></span>
			<span v-else class="alive"></span>
			<router-link v-if="leek.id != -1" :to="'/leek/' + leek.id">
				<rich-tooltip-leek :id="leek.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ leek.name }}</span>
				</rich-tooltip-leek>
			</router-link>
			<span v-else-if="leek.mob">{{ $t('entity.' + leek.name) }}</span>
			<span v-else>{{ leek.name }}</span>
		</td>
		<td class="level">{{ leek.level }}</td>
		<!-- <td v-if="$store.getters.admin" class="power">{{ $filters.number(Math.round(Math.pow(leek.level, 4.2))) }}</td> -->
		<td class="xp">
			<div class="xp-wrapper">
				<v-tooltip>
					<template #activator="{ props }">
						<div class="bar" v-bind="props">
							<span :style="{width: currentBar + '%'}" class="current_xp"></span>
							<span :style="{width: newBar + '%'}" class="new_xp"></span>
						</div>
					</template>
					{{ $filters.number(leek.cur_xp) }} / {{ $filters.number(leek.next_xp) }}
				</v-tooltip>
				<span>{{ $filters.number(leek.xp || 0) }}</span>
				<span v-if="fight.report.bonus > 1" class="bonus">x{{ fight.report.bonus }}</span>
				<v-tooltip v-if="leek.xp_locked">
					<template #activator="{ props }">
						<v-icon v-bind="props" class="xp-blocked">mdi-lock</v-icon>
					</template>
					{{ $t('main.xp_blocked') }}
				</v-tooltip>
			</div>
		</td>
		<td class="money">
			<span>{{ $filters.number(leek.money || 0) }} <span class="hab"></span></span>
		</td>
		<td v-if="fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="resources">
			<v-tooltip v-for="resource of sorted_resources" :key="resource[0]" content-class="fluid">
				<template #activator="{ props }">
					<span class="resource" v-bind="props">
						<scheme-image v-if="LeekWars.items[resource[0]].type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[LeekWars.items[resource[0]].params]" />
						<img v-else :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[resource[0]].type] + '/' + LeekWars.items[resource[0]].name.replace('potion_', '') + '.png'">
						<span v-if="resource[1] > 1" class="quantity">{{ resource[1] }}</span>
					</span>
				</template>
				{{ resource[1] }}x <b v-if="LeekWars.items[resource[0]].type === ItemType.SCHEME">{{ $t('main.scheme_x', [$t(ITEM_CATEGORY_NAME[LeekWars.items[LeekWars.schemes[LeekWars.items[resource[0]].params].result].type] + '.' + LeekWars.items[LeekWars.schemes[LeekWars.items[resource[0]].params].result].name.replace('potion_', ''))]) }}</b><b v-else>{{ $t(ITEM_CATEGORY_NAME[LeekWars.items[resource[0]].type] + '.' + LeekWars.items[resource[0]].name.replace('potion_', '')) }}</b>
			</v-tooltip>
		</td>
		<td v-if="fight.context !== FightContext.CHALLENGE && leek.talent !== undefined" class="talent">
			<img src="/image/talent.png">
			{{ leek.talent }}
			<span v-if="leek.talent_gain >= 0">+{{ leek.talent_gain }}</span>
			<span v-else>-{{ -leek.talent_gain }}</span>
		</td>
		<!-- <td class="gain">
			{{ $filters.number(leek.opes) }}
		</td> -->
		<!-- <td v-if="$store.getters.admin" class="gain">
			{{ $filters.number(leek.time / 1000) }}&nbsp;s
		</td> -->
	</tr>
</template>

<script lang="ts">
	import { Fight, FightContext, ReportLeek } from '@/model/fight'
	import { ItemTemplate, ItemType, ITEM_CATEGORY_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import SchemeImage from '../market/scheme-image.vue'

	@Options({ components: { RichTooltipLeek, SchemeImage } })
	export default class ReportLeekRow extends Vue {
		@Prop({required: true}) leek!: ReportLeek
		@Prop({required: true}) fight!: Fight
		FightContext = FightContext
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		ItemType = ItemType

		get currentBar() {
			const totalXP = this.leek.next_xp - this.leek.prev_xp
			const newLevel = this.leek.cur_xp - this.leek.xp < this.leek.prev_xp
			const oldXP = newLevel ? 0 : this.leek.cur_xp - (this.leek.xp || 0) - this.leek.prev_xp
			return Math.floor(100 * oldXP / totalXP)
		}
		get newBar() {
			const totalXP = this.leek.next_xp - this.leek.prev_xp
			const newLevel = this.leek.cur_xp - this.leek.xp < this.leek.prev_xp
			const newXPInCurrentLevel = newLevel ? this.leek.cur_xp - this.leek.prev_xp : this.leek.xp
			return Math.floor(100 * newXPInCurrentLevel / totalXP)
		}

		get sorted_resources() {
			if (this.leek.resources) {
				return Object.entries(this.leek.resources)
					.filter(r => !!LeekWars.items[r[0]])
					.sort((a, b) => LeekWars.items[b[0]].price! - LeekWars.items[a[0]].price!)
			}
			return {}
		}
	}
</script>

<style lang="scss" scoped>
	td {
		border: 1px solid var(--border);
		text-align: center;
		padding: 4px 8px;
		white-space: nowrap;
	}
	.name {
		text-align: left;
		width: 180px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.level {
		width: 80px;
	}
	.power {
		width: 40px;
		text-align: right;
	}
	.talent img {
		width: 18px;
		vertical-align: top;
	}
	.bar {
		flex: 1;
		display: flex;
		height: 14px;
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 7px;
	}
	.bar span {
		height: 12px;
		vertical-align: top;
		&:first-child {
			border-top-left-radius: 7px;
			border-bottom-left-radius: 7px;
		}
		&:last-child {
			border-top-right-radius: 7px;
			border-bottom-right-radius: 7px;
		}
	}
	.gain {
		width: 110px;
	}
	.alive {
		margin-left: 27px;
	}
	.dead {
		background-image: url("/image/cross.png");
		width: 15px;
		height: 20px;
		display: inline-block;
		margin-right: 12px;
		vertical-align: bottom;
	}
	body.dark .dead {
		filter: invert(1);
	}
	.xp {
		min-width: 180px;
		.xp-wrapper {
			display: flex;
			align-items: center;
			gap: 10px;
		}
	}
	.money {
		min-width: 100px;
	}
	.current_xp {
		background: var(--background-disabled);
	}
	.new_xp {
		background-color: #5fad1b;
	}
	.bonus {
		background-color: #0075df;
		color: white;
		font-weight: bold;
		padding: 0 4px;
		border-radius: 3px;
	}
	.talent-bonus {
		background-color: #888;
		color: white;
		font-weight: bold;
		padding: 0 4px;
		margin-left: 10px;
		border-radius: 3px;
	}
	.resources {
		padding: 0 5px;
		text-align: left;
		height: 29px;
	}
	.resource {
		position: relative;
		padding: 1px;
		display: inline-block;
		vertical-align: bottom;
		img, svg {
			width: 27px;
			height: 27px;
			object-fit: contain;
			vertical-align: bottom;
		}
		.quantity {
			position: absolute;
			bottom: -5px;
			right: -5px;
			padding: 0px 3px;
			font-size: 12px;
			content: attr(quantity);
			text-align: center;
			color: #eee;
			border-radius: 4px;
			font-weight: bold;
			background: rgba(0, 0, 0, 0.75);
		}
	}
	.xp-blocked {
		font-size: 16px;
		color: #666;
	}
</style>