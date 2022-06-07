<template>
	<div>
		<div class="page-bar page-header">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
			<div class="tabs">
				<v-menu bottom offset-y :max-width="600">
					<template v-slot:activator="{ on, attrs }">
						<div class="tab" v-bind="attrs" v-on="on">
							<v-icon>{{ sort_icon }}</v-icon> {{ $t('sort_by', [$t('sort_' + sort_by).toLowerCase()]) }}
						</div>
					</template>
					<v-list :dense="true" class="version-menu">
						<v-list-item v-ripple @click="sort_by = 'index'">
							<v-icon class="list-icon">mdi-sort-variant</v-icon>
							<v-list-item-content>{{ $t('sort_index') }}</v-list-item-content>
						</v-list-item>
						<v-list-item v-ripple @click="sort_by = 'rarity'">
							<v-icon class="list-icon">mdi-star-outline</v-icon>
							<v-list-item-content>{{ $t('sort_rarity') }}</v-list-item-content>
						</v-list-item>
						<v-list-item v-ripple @click="sort_by = 'points'">
							<v-icon class="list-icon">mdi-trophy-outline</v-icon>
							<v-list-item-content>{{ $t('sort_points') }}</v-list-item-content>
						</v-list-item>
						<v-list-item v-ripple @click="sort_by = 'date'">
							<v-icon class="list-icon">mdi-calendar</v-icon>
							<v-list-item-content>{{ $t('sort_date') }}</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
				<div class="tab" @click="group_by_categories = !group_by_categories">
					<span>{{ $t('group_by_categories') }}</span>
					<v-switch :input-value="group_by_categories" hide-details />
				</div>
				<div class="tab" @click="hide_unlocked = !hide_unlocked">
					<span>{{ $t('hide_unlocked') }}</span>
					<v-switch :input-value="hide_unlocked" hide-details />
				</div>
			</div>
		</div>
		<panel class="first global">
			<loader v-show="!loaded" />
			<div v-if="loaded" slot="content" class="content">
				<div class="stats">
					<router-link :to="'/farmer/' + farmer.id">
						<avatar :farmer="farmer" />
					</router-link>
					<div class="right">
						<div class="header">
							<div>
								<span class="points">{{ point | number }}</span> <span class="total">/ {{ totalPoint | number }} — {{ Math.floor(100 * point / totalPoint) }}%</span>
							</div>
							<div class="counters">
								<div class="counter">
									<img :src="'/image/icon/trophy/' + 0 + '.svg'">
									{{ count }} / {{ total }}
								</div>
								<div v-if="!LeekWars.mobile"> — </div>
								<div class="difficulties">
									<tooltip v-for="(c, i) in count_by_difficulty_filter" :key="i">
										<template v-slot:activator="{ on }">
											<span class="counter" v-on="on">
												<img :src="'/image/icon/trophy/' + i + '.svg'">
												<span>{{ c }}</span>
											</span>
										</template>
										{{ $t('main.difficulty_' + i) }}
									</tooltip>
								</div>
							</div>
						</div>
						<div class="global-bar">
							<div :class="{ blue: blue_bar }" :style="{width: (loaded ? Math.floor(100 * point / totalPoint) : 0) + '%'}" class="bar striked"></div>
						</div>
					</div>
				</div>
				<div class="closet">
					<div>
						<h4><v-icon>mdi-trophy-outline</v-icon> {{ $t('best_trophies') }}</h4>
						<div class="trophies">
							<rich-tooltip-trophy v-for="(trophy, t) in best_trophies" :key="t" v-slot="{ on }" :trophy="trophy" :bottom="true" :instant="true" @input="$emit('input', $event)">
								<router-link :to="'/trophy/' + trophy.code">
									<img :src="'/image/trophy/' + trophy.code + '.svg'" class="trophy" v-on="on">
								</router-link>
							</rich-tooltip-trophy>
						</div>
					</div>
					<div>
						<h4><v-icon>mdi-star-outline</v-icon> {{ $t('rarest_trophies') }}</h4>
						<div class="trophies">
							<rich-tooltip-trophy v-for="(trophy, t) in rarest_trophies" :key="t" v-slot="{ on }" :trophy="trophy" :bottom="true" :instant="true" @input="$emit('input', $event)">
								<router-link :to="'/trophy/' + trophy.code">
									<img :src="'/image/trophy/' + trophy.code + '.svg'" class="trophy" v-on="on">
								</router-link>
							</rich-tooltip-trophy>
						</div>
					</div>
					<div>
						<h4><v-icon>mdi-history</v-icon> {{ $t('latest_trophies') }}</h4>
						<div class="trophies">
							<rich-tooltip-trophy v-for="(trophy, t) in latest_trophies" :key="t" v-slot="{ on }" :trophy="trophy" :bottom="true" :instant="true" @input="$emit('input', $event)">
								<router-link :to="'/trophy/' + trophy.code">
									<img :src="'/image/trophy/' + trophy.code + '.svg'" class="trophy" v-on="on">
								</router-link>
							</rich-tooltip-trophy>
						</div>
					</div>
				</div>
			</div>
		</panel>
		<panel v-if="!group_by_categories" :icon="LeekWars.trophyCategoriesIcons[0]">
			<template slot="title">{{ $t('trophies') }}</template>
			<loader v-show="!loaded" slot="content" />
			<div v-if="loaded" slot="content" class="trophies">
				<trophy v-for="trophy in sorted_trophies" :key="trophy.id" :trophy="trophy" />
			</div>
		</panel>
		<div v-else>
			<panel v-for="category in categories" :key="category.id" :icon="LeekWars.trophyCategoriesIcons[category.id - 1]">
				<template slot="title">{{ $t('trophy.category_' + category.name) }}</template>
				<template slot="actions">
					<div class="category-bar-wrapper">
						<div v-if="category.id !== 6" class="stats">{{ points[category.id] | number }} / {{ totalPoints[category.id] | number }}</div>
						<div class="category-bar">
							<div :style="{width: (loaded ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0) + '%'}" class="bar striked"></div>
						</div>
						<div class="stats">{{ loaded ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0 }}%</div>
					</div>
				</template>
				<loader v-show="!loaded" slot="content" />
				<div v-if="loaded" slot="content" class="trophies">
					<trophy v-for="trophy in trophies[category.id]" :key="trophy.id" :trophy="trophy" />
				</div>
			</panel>
		</div>
		<panel icon="mdi-chart-line">
			<template slot="title">{{ $t('stats') }}</template>
			<loader v-show="!loaded" slot="content" />
			<div v-if="loaded" slot="content" class="statistics">
				<div v-for="(variable, v) in variables" :key="v" class="stat">
					<i class="key">{{ v.split('.')[1] }}</i>
					<span class="value">{{ variable | number }}</span>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import Trophy from './trophy.vue'

	@Component({ name: 'trophies', i18n: {}, mixins: [...mixins], components: { Breadcrumb, Trophy } })
	export default class Trophies extends Vue {
		all_trophies: any[] = []
		raw_trophies: {[key: number]: any} = {}
		progressions: {[key: number]: number} = {}
		point: number = 0
		totalPoint: number = 0
		points: {[key: number]: number} = {}
		totals: {[key: number]: number} = {}
		totalPoints: {[key: number]: number} = {}
		raw_categories = LeekWars.trophyCategories
		count: number = 0
		total: number = 0
		title: any = null
		loaded: boolean = false
		hide_unlocked: boolean = false
		group_by_categories: boolean = true
		sort_by: string = localStorage.getItem('options/trophies/sort') || 'index'
		count_by_difficulty: number[] = [0, 0, 0, 0, 0, 0]
		farmer: any = null
		variables: any = []

		created() {
			this.hide_unlocked = localStorage.getItem('options/trophies/hide-unlocked') === 'true'
			if (localStorage.getItem('options/trophies/group-by-category') !== null) {
				this.group_by_categories = localStorage.getItem('options/trophies/group-by-category') === 'true'
			}
		}

		get id() {
			return this.$route.params.id || (this.$store.state.farmer ? this.$store.state.farmer.id : null)
		}
		get categories() {
			return this.raw_categories.filter(c => (c.id !== 6 || this.progressions[6] !== 0) && (!this.loaded || !this.trophies[c.id] || this.trophies[c.id].length))
		}
		get trophies() {
			const result: {[key: number]: any} = {}
			for (const category in this.raw_trophies) {
				result[category] = this.raw_trophies[category].filter((t: any) => (category !== '6' || t.unlocked) && (!this.hide_unlocked || !t.unlocked))
				if (this.sort_by === 'rarity') {
					result[category].sort((a: any, b: any) => a.rarity - b.rarity)
				} else if (this.sort_by === 'points') {
					result[category].sort((a: any, b: any) => b.points - a.points)
				} else if (this.sort_by === 'date') {
					result[category].sort((a: any, b: any) => b.date - a.date)
				}
			}
			return result
		}
		get sorted_trophies() {
			const result = this.all_trophies.filter((t: any) => (t.category !== 6 || t.unlocked) && (!this.hide_unlocked || !t.unlocked))
			if (this.sort_by === 'rarity') {
				result.sort((a: any, b: any) => a.rarity - b.rarity)
			} else if (this.sort_by === 'points') {
				result.sort((a: any, b: any) => b.points - a.points)
			} else if (this.sort_by === 'date') {
				result.sort((a: any, b: any) => b.date - a.date)
			}
			return result
		}
		get best_trophies() {
			return this.all_trophies
				.filter(t => t.unlocked)
				.sort((a: any, b: any) => b.points - a.points)
				.slice(0, 7)
		}
		get rarest_trophies() {
			return this.all_trophies
				.filter(t => t.unlocked)
				.sort((a: any, b: any) => a.rarity - b.rarity)
				.slice(0, 7)
		}
		get latest_trophies() {
			return this.all_trophies
				.filter(t => t.unlocked)
				.sort((a: any, b: any) => b.date - a.date)
				.slice(0, 7)
		}
		get breadcrumb_items() {
			return [
				{name: this.farmer ? this.farmer.name : '...', link: '/farmer/' + this.id},
				{name: this.$t('trophies'), link: '/trophies/' + this.id},
			]
		}
		get count_by_difficulty_filter() {
			return this.count_by_difficulty.filter(d => d > 0)
		}
		get blue_bar() {
			return this.count === this.total
		}
		get sort_icon() {
			return ({
				index: 'mdi-sort-variant',
				points: 'mdi-trophy-outline',
				rarity: 'mdi-star-outline',
				date: 'mdi-calendar',
			} as {[key: string]: string})[this.sort_by]
		}

		@Watch('id', {immediate: true})
		update() {
			this.loaded = false
			this.count = 0
			this.total = 0
			this.point = 0
			this.totalPoint = 0
			this.title = null
			if (!this.id) { return }
			LeekWars.trophyCategories.forEach((c) => {
				Vue.set(this.raw_trophies, c.id, [])
				this.progressions[c.id] = 0
				this.points[c.id] = 0
				this.totals[c.id] = 0
				this.totalPoints[c.id] = 0
			})
			LeekWars.get('trophy/get-farmer-trophies/' + this.id + '/' + this.$i18n.locale).then(data => {
				for (const t in data.trophies) {
					this.farmer = data.farmer
					this.variables = data.variables
					Vue.delete(this.variables, 'trophy.farmer')
					const trophy = data.trophies[t]
					this.all_trophies = data.trophies
					this.raw_trophies[trophy.category].push(trophy)
					this.totals[trophy.category]++
					this.totalPoints[trophy.category] += trophy.points
					this.totalPoint += trophy.points
					if (trophy.unlocked) {
						this.progressions[trophy.category]++
						this.points[trophy.category] += trophy.points
						this.point += trophy.points
						this.count_by_difficulty[trophy.difficulty]++
					}
				}
				for (const category in this.raw_trophies) {
					this.raw_trophies[category].sort((a: any, b: any) => {
						return a.index - b.index
					})
				}
				this.count = data.count
				this.total = data.total
				if (this.$store.state.farmer && this.id === this.$store.state.farmer.id) {
					this.title = this.$t('title_me')
				} else {
					this.title = this.$t('title', [data.farmer.name])
				}
				const subtitle = this.count + ' / ' + this.total + ' - ' + Math.floor(100 * this.count / this.total) + '%'
				if (this.$store.state.farmer && this.id === this.$store.state.farmer.id) {
					LeekWars.setTitle(this.$t('title_me'), subtitle)
				} else {
					LeekWars.setTitle(this.$t('title', [data.farmer.name]), subtitle)
				}
				this.$root.$emit('loaded')
				this.loaded = true
			})
		}
		@Watch('hide_unlocked')
		public updateHideUnlocked() {
			localStorage.setItem('options/trophies/hide-unlocked', this.hide_unlocked ? 'true' : 'false')
		}
		@Watch('group_by_categories')
		public updateGroup() {
			localStorage.setItem('options/trophies/group-by-category', this.group_by_categories ? 'true' : 'false')
		}
		@Watch('sort_by')
		public updateSort() {
			localStorage.setItem('options/trophies/sort', this.sort_by)
		}
	}
</script>

<style lang="scss" scoped>
	.content:not(.first) {
		padding: 8px;
	}
	.v-input--switch {
		margin-left: 8px;
		margin-right: -12px;
	}
	.global {
		h4 {
			margin-left: 15px;
			margin-right: 15px;
			margin-top: 5px;
			font-size: 17px;
			display: flex;
			align-items: center;
			i {
				margin-right: 4px;
			}
		}
		::v-deep .content {
			padding: 0;
		}
		.stats {
			padding: 15px;
			font-weight: 500;
			display: flex;
			align-items: center;
			.right {
				flex: 1;
			}
			.avatar {
				margin-right: 15px;
				width: 100px;
			}
			.header {
				display: flex;
				justify-content: space-between;
			}
			.total {
				font-size: 18px;
				color: #888;
			}
			.points {
				font-size: 36px;
				font-weight: bold;
				color: #444;
			}
			.percent {
				font-size: 18px;
				color: #888;
				float: right;
				margin-left: 10px;
			}
		}
		.counters {
			display: flex;
			align-items: center;
			.counter {
				display: flex;
				align-items: center;
				font-weight: 500;
				padding: 8px;
				font-size: 19px;
				img {
					width: 20px;
					margin-right: 6px;
				}
			}
			.difficulties {
				display: flex;
				align-items: center;
			}
		}
		.closet {
			display: flex;
			justify-content: space-between;
		}
		.trophies {
			display: flex;
			gap: 0px;
			padding: 10px;
			.trophy {
				width: 43px;
			}
		}
	}
	#app.app .stats {
		flex-direction: column;
		.avatar {
			margin-right: 0;
			margin-bottom: 5px;
		}
		.right {
			align-self: stretch;
			.header {
				flex-direction: column;
				text-align: center;
			}
		}
		.counters {
			flex-direction: column;
		}
	}
	#app.app .closet {
		flex-direction: column;
	}
	.global-bar {
		height: 14px;
		position: relative;
		background: white;
		border-radius: 6px;
		margin: 5px 0;
		border: 1px solid #ddd;
		.bar {
			height: 12px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: 6px;
		}
		.bar.blue {
			background: #008fbb;
		}
	}
	.panel ::v-deep .actions {
		flex: 1;
	}
	.category-bar-wrapper {
		text-align: right;
		white-space: nowrap;
		display: flex;
		width: 100%;
		.stats {
			display: inline-block;
			color: white;
			font-size: 16px;
			margin: 9px 10px;
		}
	}
	.category-bar {
		height: 12px;
		position: relative;
		background: white;
		border-radius: 6px;
		flex: 1;
		margin-top: 12px;
		.bar {
			height: 12px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: 6px;
		}
	}
	.bar {
		transition: all ease 0.3s;
	}
	.trophies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-gap: 8px;
		padding: 8px;
	}
	#app.app .trophies {
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
	}
	.trophy {
		padding: 6px;
		.image {
			width: 50px;
			height: 50px;
			float: left;
			margin-right: 7px;
			margin-bottom: 2px;
		}
		.info {
			flex: 1;
		}
		.header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 5px;
		}
		.points {
			border: 1px solid #aaa;
			padding: 1px 4px;
			border-radius: 4px;
			margin-left: 5px;
			font-weight: 500;
		}
		.name {
			font-size: 16px;
		}
		.description {
			color: #555;
			font-size: 13px;
		}
		.fight-icon {
			width: 16px;
			height: 16px;
			opacity: 0.7;
			margin-right: 2px;
		}
		.trophy-bar {
			height: 10px;
			position: relative;
			background: white;
			border-radius: 6px;
			margin-top: 6px;
			border: 1px solid #ddd;
			.bar {
				height: 8px;
				border-radius: 6px;
				position: absolute;
				background: #30bb00;
			}
			&.full .bar {
				background: #ddd;
			}
		}
		.unlock {
			display: flex-wrap;
			align-items: center;
			margin-top: 4px;
		}
		.date, .rarity {
			color: #888;
			font-size: 13px;
			font-style: italic;
			.fight {
				color: black;
			}
		}
	}
	#app.app .trophy {
		.image {
			width: 38px;
			height: 38px;
		}
		.trophy-bar {
			margin-left: 0;
			width: 100%;
		}
	}
	.trophy.locked {
		.image {
			opacity: 0.8;
		}
	}
	.list-icon {
		margin-right: 10px;
	}
	.statistics {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		grid-gap: 6px 20px;
		padding: 15px;
		.stat {
			display: flex;
			justify-content: space-between;
			.value {
				font-weight: 500;
			}
		}
	}
</style>