<template>
	<!-- `notFound` et surtout pas `error` : un `const error` de <script setup> masquerait le
	     composant <error> ci-dessous et casserait la page (cf. leek.vue). -->
	<div class="page">
		<error v-if="notFound" :title="$t('trophy')" :message="$t('main.page_not_found')" />
		<template v-else>
		<div class="page-bar page-header">
			<div class="page-title">
				<page-icon name="trophies" fallback="mdi-trophy" />
				<div class="page-title-text">
					<h1>
						<breadcrumb :items="[{name: $t('trophies'), link: '/trophies'}, {name: $t('trophy.' + code), link: ''}]" :raw="true" />
					</h1>
				</div>
			</div>
		</div>
		<panel v-if="!trophy" class="first">
			<loader />
		</panel>
		<panel v-if="trophy" class="first">
			<div class="flex">
				<!-- Deux trophées cachent un bouton derrière leur icône : le joker tire
				     au sort, et « Rétro » allume ou éteint le thème Windows XP. -->
				<trophy-icon class="image" :code="code" :class="{clickable}" @click="iconClick" />
				<div class="right">
					<div class="name">
						{{ $t('trophy.' + code) }}
						<i18n-t v-if="trophy.points" tag="div" keypath="n_points" class="points">
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
						<div v-if="trophy.rarity < 0.002" class="in-fight"><v-icon>mdi-chat</v-icon> {{ $t('trophy.show_in_chat') }}</div>
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
									<div v-else-if="item.type === ItemType.SCHEME" v-bind="props">{{ itemDisplayName(item, t) }}</div>
								</rich-tooltip-item>
							</li>
						</ul>
					</div>
				</div>
				<div>
					<h4 v-if="trophy.variable && trophy.progression != null"><v-icon>mdi-chart-line-variant</v-icon> {{ $t('progress') }}</h4>
					<div v-if="trophy.variable && trophy.progression != null" class="bar-wrapper">
						{{ $filters.number(trophy.progression) }} / {{ $filters.number(trophy.threshold) }}
						<div class="trophy-bar" :class="{full: trophy.unlocked}">
							<div :style="{width: Math.floor(100 * Math.min(trophy.threshold, trophy.progression) / trophy.threshold) + '%'}" class="bar striked"></div>
						</div>
					</div>
					<i18n-t v-if="trophy.unlocked" keypath="unlocked_the_x" tag="div" class="rarity">
						<template #date>{{ $filters.datetime(trophy.date) }}</template>
					</i18n-t>
					<div v-else class="rarity">{{ $t('not_unlocked') }}</div>
					<router-link v-if="trophy.fight" class="rarity" :to="fightLink(trophy.fight, trophy.action)">{{ $t('see_fight') }}</router-link>
				</div>
				<div>
					<h4><v-icon>mdi-chart-line</v-icon> {{ $t('stats') }}</h4>
					<div class="rarity">{{ $t('created_the', [ LeekWars.formatDate(trophy.created_time) ]) }}</div>
					<div class="rarity">{{ (trophy.rarity * 100).toPrecision(2) }}% • {{ $t('n_pocessors', [$filters.number(trophy.total)], trophy.total) }}</div>
				</div>
			</div>
		</panel>
		<div v-if="trophy" class="grid">
			<panel v-if="trophy.first_farmers.length" :title="$t('first_farmers')" icon="mdi-sort-descending" class="last">
				<div class="farmers" :class="{deletable: $store.getters.admin}">
					<div v-for="(farmer, f) in trophy.first_farmers" :key="f" class="farmer">
						<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
							<avatar :farmer="farmer" />
							<span>{{ farmer.name }}</span>
						</router-link>
						<div class="duration">{{ LeekWars.formatLongDuration(farmer.time - trophy.created_time) }}</div>
						<router-link v-if="farmer.fight" v-ripple :to="fightLink(farmer.fight, farmer.action)" class="fight">
							<v-icon>mdi-sword-cross</v-icon> {{ shortDate(farmer.time) }}
						</router-link>
						<span v-else class="fight">{{ shortDate(farmer.time) }}</span>
						<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
					</div>
				</div>
			</panel>
			<panel v-if="trophy.last_farmers.length" :title="$t('last_farmers')" icon="mdi-sort-ascending" class="last">
				<div class="farmers" :class="{deletable: $store.getters.admin}">
					<div v-for="(farmer, f) in trophy.last_farmers" :key="f" class="farmer">
						<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
							<avatar :farmer="farmer" />
							<span>{{ farmer.name }}</span>
						</router-link>
						<div class="duration">{{ LeekWars.formatLongDuration(farmer.time - trophy.created_time) }}</div>
						<router-link v-if="farmer.fight" v-ripple :to="fightLink(farmer.fight, farmer.action)" class="fight">
							<v-icon>mdi-sword-cross</v-icon> {{ shortDate(farmer.time) }}
						</router-link>
						<span v-else class="fight">{{ shortDate(farmer.time) }}</span>
						<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
					</div>
				</div>
			</panel>
			<panel v-if="trophy.fastest_farmers?.length" :title="$t('fastest_farmers')" icon="mdi-flash" class="last">
				<div class="farmers" :class="{deletable: $store.getters.admin}">
					<div v-for="(farmer, f) in trophy.fastest_farmers" :key="f" class="farmer">
						<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
							<avatar :farmer="farmer" />
							<span>{{ farmer.name }}</span>
						</router-link>
						<div class="duration">{{ LeekWars.formatLongDuration(farmer.duration ?? 0) }}</div>
						<router-link v-if="farmer.fight" v-ripple :to="fightLink(farmer.fight, farmer.action)" class="fight">
							<v-icon>mdi-sword-cross</v-icon> {{ shortDate(farmer.time) }}
						</router-link>
						<span v-else class="fight">{{ shortDate(farmer.time) }}</span>
						<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
					</div>
				</div>
			</panel>
			<panel v-if="trophy.slowest_farmers?.length" :title="$t('slowest_farmers')" icon="mdi-sleep" class="last">
				<div class="farmers" :class="{deletable: $store.getters.admin}">
					<div v-for="(farmer, f) in trophy.slowest_farmers" :key="f" class="farmer">
						<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
							<avatar :farmer="farmer" />
							<span>{{ farmer.name }}</span>
						</router-link>
						<div class="duration">{{ LeekWars.formatLongDuration(farmer.duration ?? 0) }}</div>
						<router-link v-if="farmer.fight" v-ripple :to="fightLink(farmer.fight, farmer.action)" class="fight">
							<v-icon>mdi-sword-cross</v-icon> {{ shortDate(farmer.time) }}
						</router-link>
						<span v-else class="fight">{{ shortDate(farmer.time) }}</span>
						<v-icon v-if="$store.getters.admin" class="admin-delete" @click="confirmDelete(farmer)">mdi-delete</v-icon>
					</div>
				</div>
			</panel>
			<panel v-if="trophy.title_farmers?.length" :title="$t('title_farmers')" icon="mdi-format-letter-case" class="last">
				<div v-for="(farmer, f) in trophy.title_farmers" :key="f" v-ripple :to="'/farmer/' + farmer.id" class="farmer">
					<router-link v-ripple :to="'/farmer/' + farmer.id" class="name">
						<avatar :farmer="farmer" />
						<span>{{ farmer.name }}</span>
					</router-link>
					<div class="spacer"></div>
					<lw-title v-if="farmer.title" :title="farmer.title" />
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
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { mixins , useNamespacedT } from '@/model/i18n'
import { ItemTemplate, ItemType } from '@/model/item'
import { itemDisplayName } from '@/model/item-name'
import { LeekWars } from '@/model/leekwars'
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
import Breadcrumb from '@/component/forum/breadcrumb.vue'
import LwTitle from '@/component/title/title.vue'

interface TrophyFarmer {
	id: number
	name: string
	time: number
	fight?: number
	action?: number
	duration?: number
	title?: number[]
	muted?: boolean
	farmer?: { muted?: boolean }
}

interface TrophyTemplate {
	id: number
	code: string
	habs: number
	points: number
	category: number
	difficulty: number
	description: string
	in_fight: boolean
	secret: boolean
	unique: boolean
	variable: boolean
	progression: number
	threshold: number
	unlocked: boolean
	date: number
	fight?: number
	action?: number
	created_time: number
	rarity: number
	total: number
	items: number[]
	first_farmers: TrophyFarmer[]
	last_farmers: TrophyFarmer[]
	fastest_farmers?: TrophyFarmer[]
	slowest_farmers?: TrophyFarmer[]
	title_farmers?: TrophyFarmer[]
}

defineOptions({ name: 'Trophy', i18n: {}, mixins: [...mixins], components: { 'lw-title': LwTitle } })

const { locale } = useI18n()
	const t = useNamespacedT('trophy')
const route = useRoute()

const code = ref<string | null>(null)
const trophy = ref<TrophyTemplate | null>(null)
const notFound = ref(false)
const deleteDialog = ref(false)
const deleteFarmer = ref<TrophyFarmer | null>(null)

const items = computed(() => trophy.value ? trophy.value.items.map((i: number) => LeekWars.items[i]) : [])

const clickable = computed(() => trophy.value?.code === 'joker' || trophy.value?.code === 'retro')

function iconClick() {
	if (trophy.value?.code === 'joker') {
		LeekWars.lucky(true)
	} else if (trophy.value?.code === 'retro') {
		// On revient à `auto` et non au réglage d'avant : les deux vivent dans
		// la même clé du localStorage, l'ancien est donc perdu — et `auto` est
		// le défaut du site, qui suit le thème du système.
		LeekWars.applyThemeSetting(LeekWars.xpTheme ? 'auto' : 'xp')
	}
}

// Lien vers le combat où le trophée a été gagné, rembobiné de 15 actions pour
// le contexte. Si le trophée est gagné dans les 15 premières actions, on omet
// le paramètre (sinon action négative, ignorée par le player -> début du combat).
function fightLink(fight: number, action?: number) {
	const start = action ? action - 15 : 0
	return '/fight/' + fight + (start > 0 ? '?action=' + start : '')
}

function shortDate(time: number) {
	return new Date(time * 1000).toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })
}

function update() {
	code.value = route.params.code as string
	notFound.value = false
	trophy.value = null
	LeekWars.get('trophy-template/get/' + code.value + '/' + locale.value)
		.then(tr => {
			trophy.value = tr
			LeekWars.setTitle(t('trophy') + ' « ' + t('trophy.' + code.value) + ' »')
		})
		.catch(() => { notFound.value = true })
}

watch(() => route.params, update, { immediate: true })

function confirmDelete(f: TrophyFarmer) {
	deleteFarmer.value = f
	deleteDialog.value = true
}

function deleteTrophy() {
	if (!deleteFarmer.value || !trophy.value) return
	LeekWars.post('trophy/delete', { trophy_id: trophy.value.id, farmer_id: deleteFarmer.value.id })
		.then(() => {
			deleteDialog.value = false
			LeekWars.toast('Trophée supprimé !')
			update()
		})
		.catch((err: unknown) => LeekWars.toast(t('error_' + (err as { error: string }).error, (err as { params?: unknown[] }).params) as string))
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
			/* Une vague traverse l'icône de loin en loin : rien d'autre ne
			   distingue le bouton caché du joker et de « Rétro » d'une simple
			   illustration, et le curseur en main ne se voit qu'une fois la
			   souris dessus. Même idiome que le coffre de verify-banner : un
			   flottement de faible amplitude, que la préférence système
			   « réduire les animations » neutralise (global.scss). */
			animation: trophy-icon-wave 3s ease-in-out infinite;
			transition: scale .2s ease-out;
		}
		/* Au survol, l'icône grandit d'un cran SANS que la vague s'arrête.
		 *
		 * Les deux se composent parce qu'ils ne touchent pas à la même
		 * propriété : la vague anime `translate` et `rotate`, le survol pose
		 * `scale` — les propriétés individuelles, et non le `transform` qui
		 * porte les trois à la fois. Avec tout dans `transform`, une animation
		 * écrase la valeur déclarée : il fallait la couper au survol
		 * (`animation: none`), et l'icône retombait alors d'un coup à plat
		 * avant de grandir. Un `transition` n'y peut rien, il n'y a pas de
		 * transition entre une valeur animée et une valeur déclarée.
		 *
		 * Les trois propriétés s'appliquent dans l'ordre translate → rotate →
		 * scale, exactement ce que faisait le `transform` d'avant. */
		&.clickable:hover {
			scale: 1.06;
		}
	}
	/* La vague occupe le premier tiers du cycle, l'icône se repose ensuite : une
	   ondulation continue tirerait l'œil en permanence, alors qu'un signe
	   périodique se remarque puis s'oublie. */
	@keyframes trophy-icon-wave {
		0%, 45%, 100% { translate: 0 0; rotate: 0deg; }
		12% { translate: 0 -5px; rotate: -4deg; }
		28% { translate: 0 0; rotate: 4deg; }
		38% { translate: 0 -2px; rotate: -2deg; }
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
		border-radius: var(--radius);
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
		border-radius: var(--radius);
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
		color: var(--white);
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
		border-radius: var(--radius-medium);
		margin-top: 6px;
		border: 1px solid var(--border);
		margin: 10px 0;
		flex: 1;
		.bar {
			height: 8px;
			border-radius: var(--radius-medium);
			position: absolute;
			background: #30bb00;
		}
		&.full .bar {
			background: var(--grey-12);
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
	// Classements : une ligne par éleveur, colonnes alignées d'une ligne à l'autre.
	.farmers {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		column-gap: 14px;
		&.deletable {
			grid-template-columns: minmax(0, 1fr) auto auto auto;
		}
		.farmer {
			display: grid;
			grid-column: 1 / -1;
			grid-template-columns: subgrid;
			align-items: center;
		}
		.duration, .fight {
			font-variant-numeric: tabular-nums;
			white-space: nowrap;
		}
		.duration {
			justify-content: flex-end;
		}
		.fight {
			justify-content: flex-start;
		}
		span.fight {
			color: var(--text-color-secondary);
			padding-left: 22px;
		}
		.avatar {
			flex-shrink: 0;
		}
	}
	.grid > .panel {
		container-type: inline-size;
	}
	@container (width < 480px) {
		.farmers {
			column-gap: 10px;
			.duration, .fight {
				font-size: 13px;
			}
			.fight .v-icon {
				font-size: 15px;
			}
			span.fight {
				padding-left: 19px;
			}
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
		grid-template-columns: repeat(auto-fill, minmax(min(450px, 100%), 1fr));
		gap: 12px;
	}
</style>
