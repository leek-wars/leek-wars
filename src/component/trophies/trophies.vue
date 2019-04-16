<template>
	<div>
		<div class="page-bar page-header">
			<h1>{{ loaded ? title : '...' }}</h1>
			<div class="tabs">
				<div class="tab" @click="hide_unlocked = !hide_unlocked">
					<span>{{ $t('hide_unlocked') }}</span>
					<v-switch :input-value="hide_unlocked" hide-details />
				</div>
			</div>
		</div>
		<panel class="first">
			<span class="global-percent">{{ loaded ? Math.floor(100 * count / total) : 0 }}%</span>
			<span class="global-count">{{ count }} / {{ total }}</span>  
			<br>
			<div class="global-bar">
				<div :style="{width: (loaded ? Math.floor(100 * count / total) : 0) + '%'}" class="bar striked"></div>
			</div>
		</panel>
		<panel v-for="category in categories" :key="category.id">
			<h2 slot="title">{{ $t('category_' + category.name) }}</h2> 

			<template v-if="category.id != 6" slot="actions">
				<div class="category-bar-wrapper">
					<div class="stats">{{ progressions[category.id] }} / {{ totals[category.id] }}</div>
					<div class="category-bar">
						<div :style="{width: (loaded ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0) + '%'}" class="bar striked"></div>
					</div>
					<div class="stats">{{ loaded ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0 }}%</div>
				</div>
			</template>
			<loader v-show="!loaded" slot="content" />
			<div v-if="loaded" slot="content" class="trophies">
				<div v-for="trophy in trophies[category.id]" :key="trophy.id" :class="{unlocked: trophy.unlocked, locked: !trophy.unlocked, card: trophy.unlocked}" class="trophy">
					<img :src="'/image/trophy/big/' + trophy.code + '.png'" class="image">
					<div class="name">{{ trophy.name }}</div>
					<div class="description">{{ trophy.description }}</div>
					<v-tooltip v-if="!trophy.unlocked && trophy.progression != null" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" class="trophy-bar">
							<div :style="{width: Math.floor(100 * trophy.progression / trophy.threshold) + '%'}" class="bar striked"></div>
						</div>
						{{ trophy.progression }} / {{ trophy.threshold }}
					</v-tooltip>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'trophies', i18n: {} })
	export default class Trophies extends Vue {
		raw_trophies: {[key: number]: any} = {}
		progressions: {[key: number]: number} = {}
		totals: {[key: number]: number} = {}
		raw_categories = LeekWars.trophyCategories
		count: number = 0
		total: number = 0
		title: any = null
		loaded: boolean = false
		hide_unlocked: boolean = localStorage.getItem('options/hide-unlocked-trophies') === 'true'

		get id() {
			return this.$route.params.id || (this.$store.state.farmer ? this.$store.state.farmer.id : null)
		}
		get categories() {
			return this.raw_categories.filter(c => (c.id !== 6 || this.progressions[6] !== 0) && (!this.loaded || this.trophies[c.id].length))
		}
		get trophies() {
			const result: {[key: number]: any} = {}
			for (const category in this.raw_trophies) {
				result[category] = this.raw_trophies[category].filter((t: any) => (category !== '6' || t.unlocked) && (!this.hide_unlocked || !t.unlocked))
			}
			return result
		}
		@Watch('id', {immediate: true})
		update() {
			this.loaded = false
			this.count = 0
			this.total = 0
			this.title = null
			if (!this.id) { return }
			LeekWars.trophyCategories.forEach((c) => {
				Vue.set(this.raw_trophies, c.id, [])
				this.progressions[c.id] = 0
				this.totals[c.id] = 0
			})
			LeekWars.get('trophy/get-farmer-trophies/' + this.id + '/' + this.$i18n.locale).then(data => {
				for (const t in data.trophies) {
					const trophy = data.trophies[t]
					this.raw_trophies[trophy.category].push(trophy)
					this.totals[trophy.category]++
					if (trophy.unlocked) {
						this.progressions[trophy.category]++
					}
				}
				for (const category in this.raw_trophies) {
					this.raw_trophies[category].sort((a: any, b: any) => {
						return a.index - b.index
					})
				}
				this.count = data.count
				this.total = data.total
				if (this.id === this.$store.state.farmer.id) {
					this.title = this.$t('title_me')
				} else {
					this.title = this.$t('title', [data.farmer_name])
				}
				const subtitle = this.count + ' / ' + this.total + ' - ' + Math.floor(100 * this.count / this.total) + '%'
				if (this.id === this.$store.state.farmer.id) {
					LeekWars.setTitle(this.$t('title_me'), subtitle)
				} else {
					LeekWars.setTitle(this.$t('title', [data.farmer_name]), subtitle)
				}
				this.$root.$emit('loaded')
				this.loaded = true
			})
		}
		@Watch('hide_unlocked')
		public updateHideUnlocked() {
			localStorage.setItem('options/hide-unlocked-trophies', this.hide_unlocked ? 'true' : 'false')
		}
	}
</script>

<style lang="scss" scoped>
	.panel:last-child {
		margin-bottom: 0px;
	}
	.content:not(.first) {
		padding: 8px;
	}
	.v-input--switch {
		margin-left: 8px;
		margin-right: -12px;
	}
	.global-percent {
		font-size: 40px;
	}
	.global-count {
		font-size: 30px;
		color: #888;
		float: right;
		line-height: 55px;
	}
	.global-bar {
		height: 12px;
		position: relative;
		background: white;
		border-radius: 6px;
		margin: 5px 0;
		border: 1px solid #ddd;
		.bar {
			height: 12px;
			width: 0;
			background: #008fbb;
			position: absolute;
			border-radius: 6px;
		}
	}
	.category-bar-wrapper {
		width: 70%;
		text-align: right;
		white-space: nowrap;
		.stats {
			display: inline-block;
			color: white;
			font-size: 16px;
			margin: 9px 10px;
		}
	}
	.category-bar {
		display: inline-block;
		height: 12px;
		position: relative;
		background: white;
		border-radius: 6px;
		width: calc(80% - 100px);
		max-width: 300px;
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
		grid-gap: 10px;
		padding: 10px;
	}
	#app.app .trophies {
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
	}
	.trophy {
		padding: 5px 8px;
		.image {
			width: 50px;
			height: 50px;
			float: left;
			margin-right: 8px;
			margin-bottom: 2px;
		}
		.name {
			font-size: 16px;
			margin-bottom: 5px;
		}
		.description {
			color: #888;
			font-size: 14px;
		}
		.trophy-bar {
			height: 8px;
			position: relative;
			background: white;
			width: calc(100% - 58px);
			border-radius: 6px;
			margin-left: 58px;
			margin-top: 6px;
			border: 1px solid #ddd;
			.bar {
				height: 8px;
				border-radius: 6px;
				position: absolute;
				background: #30bb00;
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
		opacity: 0.7;
		.image {
			opacity: 0.4;
		}
	}
</style>