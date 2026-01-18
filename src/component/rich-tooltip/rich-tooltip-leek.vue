<template>
	<v-menu ref="menu" v-model="value" :close-on-content-click="false" offset-overflow :disabled="disabled" :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :location="bottom ? 'bottom' : 'top'" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" offset-y @update:modelValue="open($event)">
		<template #activator="{ props }">
			<span v-bind="props">
				<slot></slot>
			</span>
		</template>
		<div :class="{expanded: expand_items}" class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<loader v-if="!leek" :size="30" />
			<template v-else>
				<div class="flex">
					<router-link :to="'/leek/' + leek.id">
						<div class="leek-image">
							<leek-image :leek="leek" :scale="0.3" />
						</div>
					</router-link>
					<div class="info">
						<span class="name">
							<router-link :to="'/leek/' + leek.id" class="text">{{ leek.name }}</router-link>
							<router-link :to="'/farmer/' + leek.farmer.id">
								<avatar :farmer="leek.farmer" :title="leek.farmer.name" />
							</router-link>
							<router-link v-if="leek.team" :to="'/team/' + leek.team.id">
								<emblem :team="leek.team" :title="leek.team.name" />
							</router-link>
							<lw-title v-if="leek.title.length" :title="leek.title" />
						</span>
						<talent :id="leek.id" :talent="leek.talent" category="leek" />
						<span class="talent-more">({{ leek.talent_more >= 0 ? '+' + leek.talent_more : leek.talent_more }})</span>
						<ranking-badge v-if="leek && leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
						<span class="level">• {{ $t('main.level_n', [leek.level]) }}</span>
						<v-btn class="expand" variant="text" size="x-small" @click="expand_items = !expand_items" :icon="expand_items ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
					</div>
				</div>
				<div v-if="expand_items">
					<table class="leeks">
						<tr>
							<th>{{ $t('main.name') }}</th>
							<th>{{ $t('main.level') }}</th>
							<th><img src="/image/talent.png"></th>
							<th v-for="c in LeekWars.characteristics" :key="c" class="c"><img :src="'/image/charac/small/' + c + '.png'" :class="{zero: leek['total_' + c] === 0}"></th>
						</tr>
						<tr>
							<td class="leek-name"><router-link :to="'/leek/' + leek.id">{{ leek.name }}</router-link></td>
							<td>{{ leek.level }}</td>
							<td><b>{{ leek.talent }}</b></td>
							<td v-for="c in LeekWars.characteristics" :key="c" :class="['color-' + c, leek['total_' + c] === 0 ? 'zero' : '']" class="c">{{ leek['total_' + c] }}</td>
						</tr>
					</table>
					<div class="items">
						<div class="weapons">
							<rich-tooltip-item v-for="weapon in leek.weapons" :key="weapon.id" v-slot="{ props }" :item="LeekWars.items[weapon.template]" :bottom="true" :leek="leek" @update:modelValue="setParent">
								<img :src="'/image/' + LeekWars.items[weapon.template].name.replace('_', '/') + '.png'" class="weapon" v-bind="props">
							</rich-tooltip-item>
						</div>
						<div class="chips">
							<rich-tooltip-item v-for="chip in leek.chips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[chip.template]" :bottom="true" :leek="leek" @update:modelValue="setParent">
								<img :src="'/image/chip/' + CHIPS[chip.template].name + '.png'" class="chip" v-bind="props">
							</rich-tooltip-item>
						</div>
						<div class="components">
							<rich-tooltip-item v-for="component in leek.components.filter(c => c)" :key="component.id" v-slot="{ props }" :item="LeekWars.items[component.template]" :bottom="true" @update:modelValue="setParent">
								<img :src="'/image/component/' + LeekWars.items[component.template].name + '.png'" class="component" v-bind="props">
							</rich-tooltip-item>
						</div>
					</div>
				</div>
			</template>
		</div>
	</v-menu>
</template>

<script lang="ts">

import { Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
const LWTitle = defineAsyncComponent(() => import('@/component/title/title.vue'))
import { CHIPS } from '@/model/chips'
import { defineAsyncComponent } from 'vue'

@Options({ components: { RichTooltipItem, 'lw-title': LWTitle } })
export default class RichTooltipLeek extends Vue {

	@Prop({required: true}) id!: number
	@Prop() disabled!: boolean
	@Prop() bottom!: boolean
	@Prop() instant!: boolean

	CHIPS = CHIPS
	content_created: boolean = false
	leek: Leek | null = null
	expand_items: boolean = false
	locked: boolean = false
	mouse: boolean = false
	value: boolean = false

	get _open_delay() {
		return this.instant ? 0 : 500
	}
	get _close_delay() {
		return this.instant ? 0 : 1
	}
	@Watch('id')
	update() {
		this.leek = null
		this.content_created = false
	}
	open(v: boolean) {
		this.$emit('update:modelValue', v)
		this.expand_items = localStorage.getItem('richtooltipleek/expanded') === 'true'
		if (this.content_created) { return }
		this.content_created = true
		if (this.id > 0 && !this.leek) {
			LeekWars.get<Leek>('leek/rich-tooltip/' + this.id).then(leek => {
				this.leek = new Leek(leek)
				if (this.expand_items) {
					(this.$refs.menu as any).updateLocation()
				}
			})
		}
	}
	@Watch('expand_items')
	updateExpand() {
		localStorage.setItem('richtooltipleek/expanded', this.expand_items ? 'true' : 'false')
	}

	setParent(event: boolean) {
		this.locked = event
		if (!event && !this.mouse) {
			this.value = false
			this.$emit('update:modelValue', false)
		}
	}

	// get orderedWeapons() {
	// 	if (!this.leek) return []
	// 	return [...this.leek.weapons].sort((weaponA, weaponB) => {
	// 		return LeekWars.items[weaponA.template].level - LeekWars.items[weaponB.template].level
	// 	})
	// }
	// get orderedChips() {
	// 	if (!this.leek) return []
	// 	return [...this.leek.chips].sort((chipA, chipB) => {
	// 		return ORDERED_CHIPS[chipA.template] - ORDERED_CHIPS[chipB.template]
	// 	})
	// }
}
</script>

<style lang="scss" scoped>
	.card {
		padding: 8px;
		height: 81px;
	}
	.card.expanded {
		height: auto;
	}
	.leek-image {
		display: flex;
		align-items: flex-end;
		max-height: 65px;
		svg {
			min-width: 45px;
			min-height: 65px;
		}
	}
	.spacer {
		flex: 1;
	}
	.info {
		flex: 1;
		padding-left: 10px;
		.icon {
			width: 15px;
			margin-right: 4px;
			vertical-align: middle;
			padding-bottom: 2px;
		}
		.stat {
			padding-right: 4px;
			font-size: 13px;
			img {
				opacity: 0.5;
			}
		}
		.title {
			font-size: 14px;
		}
		.badge {
			margin-bottom: 2px;
			vertical-align: bottom;
			margin-right: 3px;
		}
	}
	.name {
		display: flex;
		align-items: center;
		font-size: 16px;
		height: 25px;
		margin-right: -4px;
		margin-bottom: 6px;
		img {
			width: 17px;
			height: 17px;
			margin-right: 3px;
		}
		i {
			font-size: 18px;
		}
		.avatar {
			margin-left: 5px;
			margin-top: 3px;
		}
		.emblem {
			margin-left: 5px;
			margin-top: 3px;
		}
		.country {
			margin-left: 5px;
			margin-top: 1px;
		}
	}
	.talent-more {
		font-size: 15px;
		margin-left: 5px;
		color: #888;
		display: inline-block;
		vertical-align: top;
		margin-top: 10px;
	}
	.level {
		display: inline-block;
		font-size: 15px;
		font-weight: 500;
		margin-left: 3px;
		vertical-align: top;
		margin-top: 10px;
		color: var(--text-color-secondary);
	}
	.expand {
		vertical-align: top;
		margin-top: 5px;
		margin-left: 10px;
	}
	.leeks {
		text-align: left;
		width: 620px;
		margin: 0 -8px;
		tr {
			border-bottom: 1px solid var(--border);
		}
		tr:nth-child(2n) {
			background: var(--background);
		}
		td, th {
			padding: 3px 4px;
		}
		td:first-child, th:first-child {
			padding-left: 10px;
			padding-right: 10px;
		}
		img {
			width: 18px;
		}
		.c {
			width: 30px;
			font-weight: 500;
		}
		.zero {
			filter: saturate(0);
			opacity: 0.3;
		}
		.leek-name {
			max-width: 120px;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
	.items {
		display: flex;
		margin: 0 -8px;
		margin-bottom: -8px;
		align-items: center;
		width: 620px;
	}
	.weapons {
		flex: 0.8;
		padding: 4px;
		.weapon {
			width: 100px;
			max-height: 35px;
			margin: 8px;
			vertical-align: middle;
			object-fit: contain;
		}
	}
	.chips {
		flex: 0.75;
		padding: 4px;
		.chip {
			width: 32px;
			height: 32px;
			margin: 2px;
			vertical-align: top;
		}
	}
	.components {
		flex: 0.5;
		padding: 4px;
		.component {
			width: 32px;
			height: 32px;
			margin: 2px;
			vertical-align: top;
			object-fit: contain;
		}
	}
</style>