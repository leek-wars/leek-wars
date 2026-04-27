<template>
	<error v-if="error" :title="$t('trophy')" :message="$t('main.page_not_found')" />
	<div v-else class="page">
		<div class="page-bar page-header">
			<h1>
				<breadcrumb :items="[{name: $t('trophies'), link: '/trophies'}, {name: $t('trophy.' + code), link: ''}]" :raw="true" />
			</h1>
		</div>
		<panel v-if="!trophy" class="first">
			<loader />
		</panel>
		<panel v-if="trophy" class="first">
			<div class="flex">
				<img class="image" :src="'/image/trophy/' + code + '.svg'" @click="trophy.code === 'joker' && LeekWars.lucky(true)" :class="{clickable: trophy.code === 'joker'}">
				<div class="right">
					<div class="name">
						{{ $t('trophy.' + code) }}
						<i18n-t tag="div" keypath="n_points" v-if="trophy.points" class="points">
							<template #p>{{ trophy.points }}</template>
						</i18n-t>
					</div>
					<div class="description">{{ trophy.description }}</div>
					<div class="badges">
						<div v-if="LeekWars.trophyCategoriesById[trophy.category - 1]" class="in-fight"><v-icon>{{ LeekWars.trophyCategoriesIcons[trophy.category - 1] }}</v-icon> {{ $t('trophy.category_' + LeekWars.trophyCategoriesById[trophy.category - 1].name) }}</div>
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
							<li v-if="trophy.habs"><span class="hab"></span> {{ $filters.number(trophy.habs) }} habs</li>
							<li v-for="item in items" :key="item.id">
								<rich-tooltip-item v-slot="{ props }" :bottom="true" :instant="true" :item="item">
									<div v-if="item.type === ItemType.WEAPON" v-bind="props">{{ $t('weapon.' + LeekWars.weapons[item.params].name) }}</div>
									<div v-else-if="item.type === ItemType.HAT" v-bind="props">{{ $t('hat.' + LeekWars.hats[item.params].name) }}</div>
									<div v-else-if="item.type === ItemType.POTION" v-bind="props">{{ $t('potion.' + LeekWars.potions[item.id].name) }}</div>
									<div v-else-if="item.type === ItemType.SCHEME" v-bind="props">{{ schemeLabel(item) }}</div>
								</rich-tooltip-item>
							</li>
						</ul>
					</div>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line-variant</v-icon> {{ $t('progress') }}</h4>
					<div v-if="trophy.variable" class="bar-wrapper">
						{{ $filters.number(trophy.progression) }} / {{ $filters.number(trophy.threshold) }}
						<div class="trophy-bar" :class="{full: trophy.unlocked}">
							<div :style="{width: Math.floor(100 * Math.min(trophy.threshold, trophy.progression) / trophy.threshold) + '%'}" class="bar striked"></div>
						</div>
					</div>
					<i18n-t v-if="trophy.unlocked" keypath="unlocked_the_x" tag="div" class="rarity">
						<template #date>{{ $filters.datetime(trophy.date) }}</template>
					</i18n-t>
					<div v-else class="rarity">{{ $t('not_unlocked') }}</div>
					<router-link v-if="trophy.fight" class="rarity" :to="'/fight/' + trophy.fight + (trophy.action ? '?action=' + (trophy.action - 15) : '')">{{ $t('see_fight') }}</router-link>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line</v-icon> {{ $t('stats') }}</h4>
					<div class="rarity">{{ $t('created_the', [ LeekWars.formatDate(trophy.created_time) ]) }}</div>
					<div class="rarity">{{ (trophy.rarity * 100).toPrecision(2) }}% • {{ $tc('n_pocessors', trophy.total, [$filters.number(trophy.total)]) }}</div>
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
						{{ LeekWars.formatLongDuration(farmer.time - trophy.created_time) }}
					</div>
					<router-link v-if="farmer.fight" :to="'/fight/' + farmer.fight + (farmer.action ? '?action=' + (farmer.action - 15) : '')" class="fight" v-ripple>
						<v-icon>mdi-sword-cross</v-icon> {{ $filters.date(farmer.time) }}
					</router-link>
					<span v-else class="fight">{{ $filters.date(farmer.time) }}</span>
					<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
				</div>
			</panel>
			<panel v-if="trophy.last_farmers.length" :title="$t('last_farmers')" icon="mdi-sort-ascending" class="last">
				<div v-for="(farmer, f) in trophy.last_farmers" :key="f" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="duration">
						{{ LeekWars.formatLongDuration(farmer.time - trophy.created_time) }}
					</div>
					<router-link v-if="farmer.fight" :to="'/fight/' + farmer.fight + (farmer.action ? '?action=' + (farmer.action - 15) : '')" class="fight" v-ripple>
						<v-icon>mdi-sword-cross</v-icon> {{ $filters.date(farmer.time) }}
					</router-link>
					<span v-else class="fight">{{ $filters.date(farmer.time) }}</span>
					<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
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
						<v-icon>mdi-sword-cross</v-icon> {{ $filters.date(farmer.time) }}
					</router-link>
					<span v-else class="fight">{{ $filters.date(farmer.time) }}</span>
					<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
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
						<v-icon>mdi-sword-cross</v-icon> {{ $filters.date(farmer.time) }}
					</router-link>
					<span v-else class="fight">{{ $filters.date(farmer.time) }}</span>
					<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
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
					<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
				</div>
			</panel>
		</div>
		<popup v-model="deleteDialog" :width="500" icon="mdi-delete">
			<template #title>Supprimer le trophée</template>
			<div v-if="deleteFarmer">Supprimer le trophée « {{ $t('trophy.' + code) }} » de <b>{{ deleteFarmer.name }}</b> ?</div>
			<template #actions>
				<div v-ripple @click="deleteDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="red" @click="deleteTrophy()">{{ $t('main.delete') }}</div>
			</template>
		</popup>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { mixins } from '@/model/i18n'
import { ItemType, ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED } from '@/model/item'
import { LeekWars } from '@/model/leekwars'
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
import Breadcrumb from '@/component/forum/breadcrumb.vue'
import LwTitle from '@/component/title/title.vue'

defineOptions({ name: 'trophy', i18n: {}, mixins: [...mixins], components: { 'lw-title': LwTitle } })

const { t, locale } = useI18n()
const route = useRoute()

const ITEM_CATEGORY_NAME: Record<number, string> = ITEM_CATEGORY_NAME_TYPED

const code = ref<any>(null)
const trophy = ref<any>(null)
const error = ref(false)
const deleteDialog = ref(false)
const deleteFarmer = ref<any>(null)

const items = computed(() => trophy.value ? trophy.value.items.map((i: number) => LeekWars.items[i]) : [])

function schemeLabel(item: any) {
	const scheme = LeekWars.schemes[item.params]
	if (!scheme) return ''
	const result = LeekWars.items[scheme.result]
	if (!result) return ''
	const category = ITEM_CATEGORY_NAME[result.type as ItemType]
	const name = result.name.replace(category + '_', '')
	return t('main.scheme_x', [t(category + '.' + name)])
}

function update() {
	code.value = route.params.code
	error.value = false
	trophy.value = null
	LeekWars.get('trophy-template/get/' + code.value + '/' + locale.value)
		.then(tr => {
			trophy.value = tr
			LeekWars.setTitle(t('trophy') + ' « ' + t('trophy.' + code.value) + ' »')
		})
		.catch(() => { error.value = true })
}

watch(() => route.params, update, { immediate: true })

function confirmDelete(f: any) {
	deleteFarmer.value = f
	deleteDialog.value = true
}

function deleteTrophy() {
	if (!deleteFarmer.value) return
	LeekWars.post('trophy/delete', { trophy_id: trophy.value.id, farmer_id: deleteFarmer.value.id })
		.then(() => {
			deleteDialog.value = false
			LeekWars.toast('Trophée supprimé !')
			update()
		})
		.catch((err: any) => LeekWars.toast(t('error_' + err.error, err.params) as string))
}
</script>

<style lang="scss" scoped>
	.image {
		width: 120px;
		height: 120px;
		object-fit: contain;
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
			height: 30px;
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
	.admin-delete {
		cursor: pointer;
		opacity: 0.5;
		font-size: 18px;
		align-self: center;
		&:hover {
			opacity: 1;
			color: red;
		}
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
		gap: 12px;
	}
</style>
