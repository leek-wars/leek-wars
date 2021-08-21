<template>
	<div>
		<div class="page-bar page-header">
			<h1>Trophée « {{ $t('trophy.' + code) }} »</h1>
		</div>
		<panel v-if="trophy" class="first">
			<div class="flex">
				<img class="image" :src="'/image/trophy/' + code + '.svg'">
				<div class="right">
					<div class="name">{{ $t('trophy.' + code) }}</div>
					<div class="description">{{ trophy.description }}</div>
					<div class="badges">
						<div class="in-fight"><v-icon>{{ LeekWars.trophyCategoriesIcons[trophy.category - 1] }}</v-icon> {{ $t('trophy.category_' + LeekWars.trophyCategoriesById[trophy.category - 1].name) }}</div>
						<div class="difficulty" :class="'difficulty-' + trophy.difficulty"><v-icon v-for="i in trophy.difficulty" :key="i">mdi-star-outline</v-icon> {{ $t('main.difficulty_' + trophy.difficulty) }}</div>
						<div v-if="trophy.in_fight" class="in-fight"><v-icon>mdi-sword-cross</v-icon> {{ $t('trophy.unlockable_fight') }}</div>
					</div>
				</div>
			</div>
			<div class="stats">
				<div>
					<h4><v-icon>mdi-treasure-chest</v-icon> Récompenses</h4>
					<div class="rarity">
						<ul>
							<li><span class="hab"></span> {{ trophy.habs | number }} habs</li>
							<li v-for="item in items" :key="item.id">
								<rich-tooltip-weapon v-if="item.type === ItemType.WEAPON" v-slot="{ on }" :bottom="true" :instant="true" :weapon="LeekWars.weapons[item.params]">
									<div v-on="on">{{ $t('weapon.' + LeekWars.weapons[item.params].name) }}</div>
								</rich-tooltip-weapon>
								<div v-else-if="item.type === ItemType.HAT">
									{{ $t('hat.' + LeekWars.hats[item.id].name) }}
								</div>
								<div v-else-if="item.type === ItemType.POTION">
									{{ $t('potion.' + LeekWars.potions[item.id].name) }}
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line-variant</v-icon> Progression</h4>
					<div v-if="trophy.variable" class="bar-wrapper">
						{{ trophy.progression | number }} / {{ trophy.threshold | number }}
						<div class="trophy-bar" :class="{full: trophy.unlocked}">
							<div :style="{width: Math.floor(100 * Math.min(trophy.threshold, trophy.progression) / trophy.threshold) + '%'}" class="bar striked"></div>
						</div>
					</div>
					<div v-if="trophy.unlocked" class="rarity">Débloqué le {{ trophy.date | datetime }}</div>
					<router-link v-if="trophy.fight" class="rarity" :to="'/fight/' + trophy.fight">Voir le combat</router-link>
					<div v-else class="rarity">Pas encore débloqué</div>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line</v-icon> Statistiques</h4>
					<div class="rarity">{{ Math.floor(trophy.rarity * 10000) / 100 }}% • {{ trophy.total | number }} possesseurs</div>
				</div>
			</div>
		</panel>
		<div v-if="trophy && trophy.total" class="grid container large">
			<panel title="Premiers éleveurs" icon="mdi-sort-descending">
				<router-link v-for="(farmer, f) in trophy.first_farmers" :key="f" v-ripple :to="'/farmer/' + farmer.id" class="farmer">
					<avatar :farmer="farmer" />
					{{ farmer.name }}
					<div class="spacer"></div>
					{{ farmer.time | date }}
				</router-link>
			</panel>
			<panel title="Derniers éleveurs" icon="mdi-sort-ascending">
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
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'trophy', i18n: {}, mixins })
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
	.flex {
		justify-content: flex-start;
		align-items: flex-start;
		margin-top: 5px;
		margin-bottom: 25px;
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
	}
	.description {
		font-size: 17px;
		font-weight: 500;
		padding: 10px 0;
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