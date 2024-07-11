<template>
	<div class="page">
		<div class="page-bar page-header">
			<h1>{{ $t('trophy') }} « {{ $t('trophy.' + code) }} »</h1>
		</div>
		<panel v-if="trophy" class="first">
			<div class="flex">
				<img class="image" :src="'/image/trophy/' + code + '.svg'" @click="trophy.code === 'joker' && LeekWars.lucky(true)" :class="{clickable: trophy.code === 'joker'}">
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
					<router-link v-if="trophy.fight" class="rarity" :to="'/fight/' + trophy.fight + (trophy.action ? '?action=' + (trophy.action - 15) : '')">{{ $t('see_fight') }}</router-link>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line</v-icon> {{ $t('stats') }}</h4>
					<div class="rarity">{{ $t('created_the', [ LeekWars.formatDate(trophy.created_time) ]) }}</div>
					<div class="rarity">{{ (trophy.rarity * 100).toPrecision(2) }}% • <i18n tag="span" path="n_pocessors">
						<template slot="n">{{ trophy.total | number }}</template>
					</i18n></div>
				</div>
			</div>
		</panel>
		<div v-if="trophy" class="grid">
			<panel v-if="trophy.first_farmers.length" :title="$t('first_farmers')" icon="mdi-sort-descending" class="last">
				<div v-for="(farmer, f) in trophy.first_farmers" :key="f" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="duration">
						{{ LeekWars.formatLongDuration(farmer.duration) }}
					</div>
					<router-link v-if="farmer.fight" :to="'/fight/' + farmer.fight + (farmer.action ? '?action=' + (farmer.action - 15) : '')" class="fight" v-ripple>
						<v-icon>mdi-sword-cross</v-icon> {{ farmer.time | date }}
					</router-link>
					<span v-else class="fight">{{ farmer.time | date }}</span>
				</div>
			</panel>
			<panel v-if="trophy.last_farmers.length" :title="$t('last_farmers')" icon="mdi-sort-ascending" class="last">
				<div v-for="(farmer, f) in trophy.last_farmers" :key="f" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="duration">
						{{ LeekWars.formatLongDuration(farmer.duration) }}
					</div>
					<router-link v-if="farmer.fight" :to="'/fight/' + farmer.fight + (farmer.action ? '?action=' + (farmer.action - 15) : '')" class="fight" v-ripple>
						<v-icon>mdi-sword-cross</v-icon> {{ farmer.time | date }}
					</router-link>
					<span v-else class="fight">{{ farmer.time | date }}</span>
				</div>
			</panel>
			<panel v-if="trophy.fastest_farmers?.length" :title="$t('fastest_farmers')" icon="mdi-flash" class="last">
				<div v-for="(farmer, f) in trophy.fastest_farmers" :key="f" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="duration">
						{{ LeekWars.formatLongDuration(farmer.duration) }}
					</div>
					<router-link v-if="farmer.fight" :to="'/fight/' + farmer.fight + (farmer.action ? '?action=' + (farmer.action - 15) : '')" class="fight" v-ripple>
						<v-icon>mdi-sword-cross</v-icon> {{ farmer.time | date }}
					</router-link>
					<span v-else class="fight">{{ farmer.time | date }}</span>
				</div>
			</panel>
			<panel v-if="trophy.slowest_farmers?.length" :title="$t('slowest_farmers')" icon="mdi-sleep" class="last">
				<div v-for="(farmer, f) in trophy.slowest_farmers" :key="f" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="duration">
						{{ LeekWars.formatLongDuration(farmer.duration) }}
					</div>
					<router-link v-if="farmer.fight" :to="'/fight/' + farmer.fight + (farmer.action ? '?action=' + (farmer.action - 15) : '')" class="fight" v-ripple>
						<v-icon>mdi-sword-cross</v-icon> {{ farmer.time | date }}
					</router-link>
					<span v-else class="fight">{{ farmer.time | date }}</span>
				</div>
			</panel>
			<panel v-if="trophy.title_farmers?.length" :title="$t('title_farmers')" icon="mdi-format-letter-case" class="last">
				<div v-for="(farmer, f) in trophy.title_farmers" :key="f" v-ripple :to="'/farmer/' + farmer.id" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="spacer"></div>
					<lw-title :title="farmer.title" />
				</div>
			</panel>
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import LWTitle from '@/component/title/title.vue'

	@Component({ name: 'trophy', i18n: {}, mixins: [...mixins], components: { 'lw-title': LWTitle, RichTooltipItem } })
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
		&.clickable {
			cursor: pointer;
		}
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
		.name {
			font-size: 28px;
			font-weight: 500;
			display: flex;
			align-items: center;
		}
	}
	h4 {
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		i {
			margin-right: 6px;
		}
	}
	.points {
		border: 1px solid var(--text-color-secondary);
		display: inline-block;
		margin: 0 10px;
		padding: 2px 5px;
		border-radius: 5px;
		font-size: 16px;
		margin-top: 2px;
		color: var(--text-color-secondary);
	}
	.description {
		font-size: 17px;
		font-weight: 500;
		padding: 12px 0;
	}
	.rarity {
		color: var(--text-color-secondary);
		padding: 8px 0;
		font-weight: 500;
	}
	a.rarity {
		color: var(--text-color);
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
		border: 1px solid var(--text-color-secondary);
		color: var(--text-color-secondary);
	}
	.bar-wrapper {
		display: flex;
		gap: 10px;
		align-items: center;
		font-weight: 500;
		color: var(--text-color-secondary);
	}
	.trophy-bar {
		height: 10px;
		position: relative;
		background: var(--pure-white);
		border-radius: 6px;
		margin-top: 6px;
		border: 1px solid var(--border);
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
		padding: 1px 0;
		align-items: stretch;
		gap: 8px;
		& > * {
			min-width: 0;
		}
		.name {
			flex: 1.3;
			display: flex;
			align-items: center;
			gap: 8px;
			span {
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
		.avatar {
			width: 30px;
			vertical-align: bottom;
		}
		.v-icon {
			font-size: 18px;
		}
		.fight {
			flex: 1.2;
			display: flex;
			align-items: center;
			gap: 4px;
			justify-content: flex-end;
		}
		a.fight {
			font-weight: 500;
		}
		.duration {
			flex: 1;
			display: flex;
			align-items: center;
			white-space: nowrap;
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
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
		gap: 12px;
	}
</style>
