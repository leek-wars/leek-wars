<template>
	<div>
		<div class="page-bar page-header">
			<h1>{{ loaded ? title : '...' }}</h1>
		</div>
		<div class="panel">
			<div class="content first">
				<span class="global-percent">{{ loaded ? Math.floor(100 * count / total) : 0 }}%</span>
				<span class="global-count">{{ count }} / {{ total }}</span>  
				<br>
				<div class="global-bar">
					<div :style="{width: (loaded ? Math.floor(100 * count / total) : 0) + '%'}" class="bar striked"></div>
				</div>
			</div>
		</div>
		<div v-for="category in categories" v-if="category.id != 6 || progressions[6] != 0" :key="category.id" class="panel">
			<div class="header">
				<h2>{{ $t('category_' + category.name) }}</h2> 
				<div class="right category-bar-wrapper">
					<template v-if="category.id != 6">
						<div class="stats">{{ progressions[category.id] }} / {{ totals[category.id] }}</div>
						<div class="category-bar">
							<div :style="{width: (loaded ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0) + '%'}" class="bar striked"></div>
						</div>
						<div class="stats">{{ loaded ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0 }}%</div>
					</template>
				</div>
			</div>
			<loader v-show="!loaded" />
			<div v-if="loaded" class="trophies">
				<div v-for="trophy in trophies[category.id]" v-if="category.id != 6 || trophy.unlocked" :key="trophy.id" :class="{unlocked: trophy.unlocked, locked: !trophy.unlocked, card: trophy.unlocked}" class="trophy">
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
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'trophies', i18n: {} })
	export default class Trophies extends Vue {
		trophies: {[key: number]: any} = {}
		progressions: {[key: number]: number} = {}
		totals: {[key: number]: number} = {}
		categories = LeekWars.trophyCategories
		count: number = 0
		total: number = 0
		title: any = null
		loaded: boolean = false

		@Watch('$route.params', {immediate: true})
		update() {
			this.loaded = false
			this.count = 0
			this.total = 0
			this.title = null
			const farmerID = this.$route.params.id || this.$store.state.farmer.id
			LeekWars.trophyCategories.forEach((c) => {
				this.trophies[c.id] = []
				this.progressions[c.id] = 0
				this.totals[c.id] = 0
			})
			LeekWars.get<any>('trophy/get-farmer-trophies/' + farmerID + '/' + this.$i18n.locale + '/' + this.$store.state.token).then((data) => {
				for (const t in data.data.trophies) {
					const trophy = data.data.trophies[t]
					this.trophies[trophy.category].push(trophy)
					this.totals[trophy.category]++
					if (trophy.unlocked) {
						this.progressions[trophy.category]++
					}
				}
				for (const category in this.trophies) {
					this.trophies[category].sort((a: any, b: any) => {
						return a.index - b.index
					})
				}
				this.count = data.data.count
				this.total = data.data.total
				if (farmerID === this.$store.state.farmer.id) {
					this.title = this.$t('title_me')
				} else {
					this.title = this.$t('title', [data.data.farmer_name])
				}
				const subtitle = this.count + ' / ' + this.total + ' - ' + Math.floor(100 * this.count / this.total) + '%'
				if (farmerID === this.$store.state.farmer.id) {
					LeekWars.setTitle(this.$t('title_me'), subtitle)
				} else {
					LeekWars.setTitle(this.$t('title', [data.data.farmer_name]), subtitle)
				}
				this.$root.$emit('loaded')
				this.loaded = true
			})
		}
	}
</script>

<style lang="scss" scoped>
	.panel .loader {
		padding: 20px;
	}
	.panel:last-child {
		margin-bottom: 0px;
	}
	.content:not(.first) {
		padding: 8px;
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