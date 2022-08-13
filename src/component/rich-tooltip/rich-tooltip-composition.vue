<template>
	<v-menu ref="menu" v-model="value" :close-on-content-click="false" offset-overflow :disabled="disabled || id <= 0" :nudge-width="expand_leeks ? 500 : 200" :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" :transition="instant ? 'none' : 'my-transition'" :open-on-hover="!locked" offset-y @input="open($event)">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<loader v-if="!composition" :size="30" />
			<template v-else>
				<div class="flex">
					<router-link :to="'/team/' + composition.team.id">
						<emblem :team="composition.team" />
					</router-link>
					<div class="info">
						<span class="name">
							<router-link :to="'/team/' + composition.team.id" class="text">{{ composition.team.name }} • {{ composition.name }}</router-link>
							<!-- <router-link v-if="farmer.team" :to="'/team/' + farmer.team.id">
								<emblem :team="farmer.team" :title="farmer.team.name" />
							</router-link> -->
						</span>
						<talent :id="composition.id" :talent="composition.talent" category="team" />
						<ranking-badge v-if="composition && composition.ranking <= 1000 && composition.in_garden" :id="composition.id" :ranking="composition.ranking" category="team" />
						<span class="level">
							• {{ composition.leeks.length }} <img src="/image/icon/black/leek.png">
							• {{ $t('main.level_n', [composition.total_level]) }}
						</span>
						<v-btn class="expand" icon small @click="expand_leeks = !expand_leeks">
							<v-icon v-if="expand_leeks">mdi-chevron-up</v-icon>
							<v-icon v-else>mdi-chevron-down</v-icon>
						</v-btn>
					</div>
				</div>

				<table v-if="expand_leeks" class="leeks">
					<tr>
						<th>{{ $t('main.name') }}</th>
						<th>{{ $t('main.level') }}</th>
						<th><img src="/image/talent.png"></th>
						<th v-for="c in LeekWars.characteristics" :key="c" class="c"><img :src="'/image/charac/small/' + c + '.png'" :class="{zero: sums[c] === 0}"></th>
					</tr>
					<tr v-for="leek in composition.leeks" :key="leek.id">
						<td class="leek-name">
							<rich-tooltip-leek :id="leek.id" v-slot="{ on }" :bottom="true" @input="setParent">
								<router-link :to="'/leek/' + leek.id">
									<span v-on="on">{{ leek.name }}</span>
								</router-link>
							</rich-tooltip-leek>
						</td>
						<td>{{ leek.level }}</td>
						<td><b>{{ leek.talent }}</b></td>
						<td v-for="c in LeekWars.characteristics" :key="c" :class="['color-' + c, leek[c] === 0 ? 'zero' : '']" class="c">{{ leek[c] }}</td>
					</tr>
				</table>
			</template>
		</div>
	</v-menu>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Composition } from '@/model/team'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	@Component({ components: { RichTooltipLeek } })
	export default class RichTooltipComposition extends Vue {
		@Prop({required: true}) id!: number
		@Prop() disabled!: boolean
		@Prop() bottom!: boolean
		@Prop() instant!: boolean
		content_created: boolean = false
		composition: Composition | null = null
		expand_leeks: boolean = false
		sums: {[key: string]: number} = {}
		locked: boolean = false
		mouse: boolean = false
		value: boolean = false

		get _open_delay() {
			return this.instant ? 0 : 500
		}
		get _close_delay() {
			return this.instant ? 0 : 0
		}
		@Watch('id')
		update() {
			this.composition = null
			this.content_created = false
		}
		open(v: boolean) {
			this.expand_leeks = localStorage.getItem('rich-tooltip-composition/expanded') === 'true'
			if (this.content_created) { return }
			this.content_created = true
			if (this.id > 0 && !this.composition) {
				LeekWars.get<Composition>('team/composition-rich-tooltip/' + this.id).then(composition => {
					this.composition = composition
					for (const c of LeekWars.characteristics) {
						Vue.set(this.sums, c, Object.values(this.composition.leeks).reduce((sum: number, leek: any) => sum + leek[c], 0))
					}
					if (this.expand_leeks) {
						(this.$refs.menu as any).onResize()
					}
				})
			}
		}
		@Watch('expand_leeks')
		updateExpand() {
			localStorage.setItem('rich-tooltip-composition/expanded', this.expand_leeks ? 'true' : 'false')
		}

		setParent(event: boolean) {
			this.locked = event
			if (!event && !this.mouse) {
				this.value = false
				this.$emit('input', false)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.card {
		padding: 8px;
	}
	.emblem {
		width: 60px;
		height: 60px;
		flex-grow: 0;
		flex-basis: 60px;
		vertical-align: bottom;
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
	}
	.name {
		display: flex;
		align-items: center;
		font-size: 16px;
		height: 25px;
		img {
			width: 17px;
			margin-right: 3px;
		}
		i {
			font-size: 18px;
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
	.badge {
		margin-bottom: 2px;
		vertical-align: bottom;
		margin-right: 0;
	}
	.level {
		display: inline-block;
		font-size: 15px;
		font-weight: 500;
		margin-left: 5px;
		vertical-align: top;
		margin-top: 10px;
		color: #555;
		img {
			width: 16px;
			opacity: 0.5;
			margin: 0 3px;
			vertical-align: top;
		}
	}
	.expand {
		vertical-align: top;
		margin-top: 5px;
		margin-left: 10px;
	}
	.leeks {
		text-align: left;
		width: calc(100% + 16px);
		margin: 0 -8px;
		tr {
			border-bottom: 1px solid #ddd;
		}
		tr:nth-child(2n) {
			background: #f7f7f7;
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
</style>