<template>
	<div>
		<div class="page-bar page-header">
			<h1>{{ $t('trophy') }} « {{ $t('trophy.' + code) }} »</h1>
		</div>
		<panel v-if="trophy" class="first">
			<div class="flex">
				<img class="image" :src="'/image/trophy/' + code + '.svg'">
				<div class="right">
					<div class="name">
						{{ $t('trophy.' + code) }}
						<i18n tag="div" path="n_points" v-if="trophy.points" class="points">
							<template slot="p">{{ trophy.points }}</template>
						</i18n>
					</div>
					<div class="description">{{ trophy.description }}</div>
					<div class="badges">
						<div class="in-fight"><v-icon>{{ LeekWars.trophyCategoriesIcons[trophy.category - 1] }}</v-icon> {{ $t('trophy.category_' + LeekWars.trophyCategoriesById[trophy.category - 1].name) }}</div>
						<div class="difficulty" :class="'difficulty-' + trophy.difficulty"><v-icon v-for="i in trophy.difficulty" :key="i">mdi-star-outline</v-icon> {{ $t('main.difficulty_' + trophy.difficulty) }}</div>
						<div v-if="trophy.in_fight" class="in-fight"><v-icon>mdi-sword-cross</v-icon> {{ $t('trophy.unlockable_fight') }}</div>
						<div v-if="trophy.secret" class="in-fight"><v-icon>mdi-eye-off-outline</v-icon> {{ $t('trophy.secret') }}</div>
						<div v-if="trophy.unique" class="in-fight"><v-icon>mdi-numeric-1-circle-outline</v-icon> {{ $t('trophy.unique') }}</div>
					</div>
				</div>
			</div>
			<div class="stats">
				<div>
					<h4><v-icon>mdi-treasure-chest</v-icon> {{ $t('rewards') }}</h4>
					<div class="rarity">
						<ul>
							<li v-if="trophy.habs"><span class="hab"></span> {{ trophy.habs | number }} habs</li>
							<li v-for="item in items" :key="item.id">
								<rich-tooltip-item v-slot="{ on }" :bottom="true" :instant="true" :item="item">
									<div v-if="item.type === ItemType.WEAPON" v-on="on">{{ $t('weapon.' + LeekWars.weapons[item.params].name) }}</div>
									<div v-else-if="item.type === ItemType.HAT" v-on="on">{{ $t('hat.' + LeekWars.hats[item.params].name) }}</div>
									<div v-else-if="item.type === ItemType.POTION" v-on="on">{{ $t('potion.' + LeekWars.potions[item.id].name) }}</div>
								</rich-tooltip-item>
							</li>
						</ul>
					</div>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line-variant</v-icon> {{ $t('progress') }}</h4>
					<div v-if="trophy.variable" class="bar-wrapper">
						{{ trophy.progression | number }} / {{ trophy.threshold | number }}
						<div class="trophy-bar" :class="{full: trophy.unlocked}">
							<div :style="{width: Math.floor(100 * Math.min(trophy.threshold, trophy.progression) / trophy.threshold) + '%'}" class="bar striked"></div>
						</div>
					</div>
					<i18n v-if="trophy.unlocked" path="unlocked_the_x" tag="div" class="rarity">
						<template slot="date">{{ trophy.date | datetime }}</template>
					</i18n>
					<div v-else class="rarity">{{ $t('not_unlocked') }}</div>
					<router-link v-if="trophy.fight" class="rarity" :to="'/fight/' + trophy.fight">{{ $t('see_fight') }}</router-link>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line</v-icon> {{ $t('stats') }}</h4>
					<div class="rarity">{{ (trophy.rarity * 100).toPrecision(2) }}% • <i18n tag="span" path="n_pocessors">
						<template slot="n">{{ trophy.total | number }}</template>
					</i18n></div>
				</div>
			</div>
		</panel>
		<div v-if="trophy" class="container large">
			<panel v-if="trophy.first_farmers.length" :title="$t('first_farmers')" icon="mdi-sort-descending">
				<router-link v-for="(farmer, f) in trophy.first_farmers" :key="f" v-ripple :to="'/farmer/' + farmer.id" class="farmer">
					<avatar :farmer="farmer" />
					{{ farmer.name }}
					<div class="spacer"></div>
					{{ farmer.time | date }}
				</router-link>
			</panel>
			<panel v-if="trophy.last_farmers.length" :title="$t('last_farmers')" icon="mdi-sort-ascending">
				<router-link v-for="(farmer, f) in trophy.last_farmers" :key="f" v-ripple :to="'/farmer/' + farmer.id" class="farmer">
					<avatar :farmer="farmer" />
					{{ farmer.name }}
					<div class="spacer"></div>
					{{ farmer.time | date }}
				</router-link>
			</panel>
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'trophy', i18n: {}, mixins: [...mixins] })
	export default class Trophy extends Vue {
		code: any = null
		trophy: any = null
		ItemType = ItemType

		get items() {
			return this.trophy ? this.trophy.items.map((i: number) => LeekWars.items[i]) : []
		}

		@Watch('$route.params', { immediate: true })
		update() {
			this.code = this.$route.params.code
			LeekWars.get('trophy-template/get/' + this.code + '/' + this.$i18n.locale).then(trophy => this.trophy = trophy)
		}
	}
</script>

<style lang="scss" scoped>
	.image {
		width: 120px;
		margin: 0 20px;
		margin-right: 30px;
	}
	#app.app .image {
		margin: 0;
		margin-right: 20px;
	}
	.flex {
		justify-content: flex-start;
		align-items: flex-start;
		margin-top: 5px;
		margin-bottom: 25px;
	}
	#app.app .flex {
		margin-bottom: 15px;
	}
	.right {
		flex: 1;
	}
	h4 {
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		i {
			margin-right: 6px;
		}
	}
	.name {
		font-size: 28px;
		font-weight: 500;
		display: flex;
		align-items: center;
	}
	.points {
		border: 1px solid #aaa;
		display: inline-block;
		margin: 0 10px;
		padding: 2px 5px;
		border-radius: 5px;
		font-size: 16px;
		margin-top: 2px;
		color: #555;
	}
	.description {
		font-size: 17px;
		font-weight: 500;
		padding: 12px 0;
	}
	.rarity {
		color: #666;
		padding: 8px 0;
		font-weight: 500;
	}
	a.rarity {
		color: #111;
	}
	.badges {
		display: flex;
		align-items: flex;
	}
	#app.app .badges {
		flex-wrap: wrap;
	}
	.difficulty, .in-fight {
		display: inline-flex;
		align-items: center;
		padding: 3px 9px;
		margin: 10px 0;
		border-radius: 5px;
		margin-right: 10px;
		white-space: nowrap;
		i {
			font-size: 20px;
			&:last-child {
				margin-right: 5px;
			}
		}
	}
	.difficulty {
		color: white;
	}
	.in-fight {
		border: 1px solid #aaa;
		color: #333;
	}
	.bar-wrapper {
		display: flex;
		gap: 10px;
		align-items: center;
		font-weight: 500;
		color: #666;
	}
	.trophy-bar {
		height: 10px;
		position: relative;
		background: white;
		border-radius: 6px;
		margin-top: 6px;
		border: 1px solid #ddd;
		margin: 10px 0;
		flex: 1;
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
	.stats {
		display: flex;
		width: 100%;
		gap: 20px;
		& > * {
			flex: 1;
		}
	}
	#app.app .stats {
		flex-direction: column;
		gap: 10px;
	}
	.farmer {
		display: flex;
		padding: 2px 0;
		align-items: center;
		.avatar {
			margin-right: 8px;
			width: 32px;
		}
	}
	ul {
		margin: 5px 0;
		padding-inline-start: 25px;
		li {
			margin: 5px 0;
		}
	}
	.hab {
		margin-right: 2px;
	}
</style>
