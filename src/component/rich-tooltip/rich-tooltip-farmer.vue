<template>
	<v-menu ref="menu" v-model="value" :close-on-content-click="false" offset-overflow :disabled="disabled || id <= 0" :nudge-width="expand_leeks ? 500 : 200" :nudge-top="-5" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" offset-y @update:model-value="open($event)">
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<loader v-if="!farmer" :size="30" />
			<template v-else>
				<div class="flex">
					<router-link :to="'/farmer/' + farmer.id">
						<avatar :farmer="farmer" />
					</router-link>
					<div class="info">
						<span class="name">
							<lw-status :online="!!farmer.connected" :title="$t(farmer.connected ? 'main.connected' : 'main.disconnected')" />
							<router-link :to="'/farmer/' + farmer.id" :class="farmer.color" class="text">{{ farmer.name }}</router-link>
							<router-link v-if="farmer.team" :to="'/team/' + farmer.team.id">
								<emblem :team="farmer.team" :title="farmer.team.name" />
							</router-link>
							<flag v-if="farmer.country" :code="farmer.country" class="country" />
							<lw-title v-if="farmer.title && farmer.title.length" :title="farmer.title" />
							<div class="spacer"></div>
							<v-btn v-if="!store.state.farmer || id != store.state.farmer.id" variant="text" icon="mdi-chat" size="small" @click="sendMessage()" />
						</span>
						<div class="stats">
							<router-link :to="'/trophies/' + farmer.id" class="stat">
								<!-- Glyphes mdi et non des PNG (règle ICONS.md) : le trophée gris
								     portait sa couleur en dur et s'éteignait sur le thème sombre,
								     le glyphe suit l'encre. -->
								<v-icon>mdi-trophy</v-icon>{{ LeekWars.formatNumber(farmer.points) }}
							</router-link>
							<router-link v-if="farmer.forum_messages" :to="'/search?farmer=' + farmer.name + '&order=date'" class="stat">
								<v-icon>mdi-forum</v-icon>{{ $t('main.n_messages', farmer.forum_messages) }}
							</router-link>
						</div>
						<!-- Dans la colonne de droite, comme dans les tooltips poireau, équipe
						     et composition : nom, compteurs et talent partagent alors un seul
						     bord gauche au lieu de deux. -->
						<div class="talent-line">
							<talent :id="farmer.id" :talent="farmer.talent" :max_talent="farmer.max_talent" category="farmer" />
							<span class="talent-more">({{ farmer.talent_more >= 0 ? '+' + farmer.talent_more : farmer.talent_more }})</span>
							<ranking-badge v-if="farmer && farmer.ranking && farmer.ranking <= 1000 && farmer.in_garden" :id="farmer.id" :ranking="farmer.ranking" category="farmer" />
							<span class="level">• {{ $t('main.level_n', [farmer.total_level]) }}</span>
							<v-btn class="expand" variant="text" size="x-small" :icon="expand_leeks ? 'mdi-chevron-up' : 'mdi-chevron-down'" @click="expand_leeks = !expand_leeks" />
						</div>
					</div>
				</div>
				<table v-if="expand_leeks" class="leeks">
					<thead>
						<tr>
							<th>{{ $t('main.name') }}</th>
							<th>{{ $t('main.level') }}</th>
							<th><img src="/image/talent.png"></th>
							<th v-for="c in LeekWars.characteristics" :key="c" class="c"><img :src="'/image/charac/small/' + c + '.png'" :class="{zero: sums[c] === 0}"></th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="leek in farmer.leeks" :key="leek.id">
							<td class="leek-name">
								<rich-tooltip-leek :id="leek.id" v-slot="{ props }" :bottom="true" @update:model-value="setParent">
									<router-link :to="'/leek/' + leek.id">
										<span v-bind="props">{{ leek.name }}</span>
									</router-link>
								</rich-tooltip-leek>
							</td>
							<td>{{ leek.level }}</td>
							<td><b>{{ leek.talent }}</b></td>
							<td v-for="c in LeekWars.characteristics" :key="c" :class="['color-' + c, leek['total_' + c] === 0 ? 'zero' : '']" class="c">{{ leek['total_' + c] }}</td>
						</tr>
					</tbody>
				</table>
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch, useTemplateRef, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

const LwTitle = defineAsyncComponent(() => import('@/component/title/title.vue'))

const props = defineProps<{
	id: number
	disabled?: boolean
	bottom?: boolean
	instant?: boolean
	openDelay?: number
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

interface RichFarmerLeek {
	id: number
	name: string
	level: number
	talent: number
	[key: string]: unknown
}

interface RichFarmerData {
	id: number
	name: string
	avatar_changed: number
	leeks: Record<string, RichFarmerLeek>
	title?: number[]
	talent: number
	max_talent: number
	talent_more: number
	ranking: number
	level: number
	total_level: number
	team?: { id: number, name: string, [key: string]: unknown } | null
	team_emblem_changed?: number
	points: number
	forum_messages?: number
	connected: boolean
	color?: string
	country?: string | null
	in_garden?: boolean
	[key: string]: unknown
}

const router = useRouter()
const menu = useTemplateRef<{ updateLocation?: () => void }>('menu')
const content_created = ref(false)
const farmer = ref<RichFarmerData | null>(null)
const expand_leeks = ref(false)
const sums = ref<{[key: string]: number}>({})
const locked = ref(false)
const mouse = ref(false)
const value = ref(false)

const _open_delay = computed(() => props.openDelay ?? (props.instant ? 1 : 500))
const _close_delay = computed(() => props.instant ? 1 : 1)

watch(() => props.id, () => {
	farmer.value = null
	content_created.value = false
})

function open(v: boolean) {
	emit('update:modelValue', v)
	expand_leeks.value = localStorage.getItem('richtooltipfarmer/expanded') === 'true'
	if (content_created.value) { return }
	content_created.value = true
	if (props.id > 0 && !farmer.value) {
		LeekWars.get<RichFarmerData>('farmer/rich-tooltip/' + props.id).then(f => {
			farmer.value = f
			for (const c of LeekWars.characteristics) {
				sums.value[c] = Object.values(f.leeks).reduce((sum: number, leek: RichFarmerLeek) => sum + (leek['total_' + c] as number), 0)
			}
			if (expand_leeks.value) {
				menu.value?.updateLocation?.()
			}
		}, () => {
			// Requête échouée : sans ça le tooltip reste bloqué sur son loader pour toute la
			// session, `content_created` empêchant toute nouvelle tentative à la réouverture.
			// Handler de rejet du MÊME then (et non un .error() chaîné), qui ne rattrape donc
			// pas ce que lèverait le callback de succès : une réponse mal formée doit rester
			// un vrai crash visible, pas une requête relancée à chaque survol.
			content_created.value = false
		})
	}
}

function sendMessage() {
	if (!farmer.value) { return }
	const f = farmer.value
	LeekWars.get('message/find-conversation/' + f.id).then(conversation => {
		store.commit('new-conversation', conversation)
		router.push('/messages/conversation/' + conversation.id)
	}).catch(() => {
		router.push('/messages/new/' + f.id + '/' + f.name + '/' + f.avatar_changed)
	})
}

watch(expand_leeks, () => {
	localStorage.setItem('richtooltipfarmer/expanded', expand_leeks.value ? 'true' : 'false')
})

function setParent(event: boolean) {
	locked.value = event
	if (!event && !mouse.value) {
		value.value = false
		emit('update:modelValue', false)
	}
}
</script>

<style lang="scss" scoped>
	.card {
		padding: 8px;
	}
	.avatar {
		width: 50px;
		height: 50px;
		flex-grow: 0;
		flex-basis: 50px;
	}
	.spacer {
		flex: 1;
	}
	/* Les trois lignes sont empilées en colonne et centrées chacune sur sa
	   ligne : c'est la boîte qui aligne, plus les `vertical-align` et les
	   `margin-top` à la main qui donnaient cinq hauteurs différentes sur la
	   seule ligne du talent. */
	.info {
		flex: 1;
		min-width: 0;
		padding-left: 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		.title {
			font-size: 14px;
		}
	}
	.name {
		display: flex;
		align-items: center;
		font-size: 16px;
		height: 25px;
		margin-right: -4px;
		img, .country {
			height: 17px;
			margin-right: 3px;
		}
		i {
			font-size: 18px;
		}
		.emblem, .country {
			margin-left: 5px;
		}
	}
	.stats {
		display: flex;
		align-items: center;
		gap: 12px;
		.stat {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 13px;
			.v-icon {
				font-size: 17px;
				opacity: 0.6;
			}
		}
	}
	.talent-line {
		display: flex;
		align-items: center;
		gap: 6px;
		.talent-more {
			font-size: 15px;
			color: var(--grey-7);
		}
		.badge {
			margin: 0;
		}
		.level {
			font-size: 15px;
			font-weight: 500;
			color: var(--text-color-secondary);
		}
		.expand {
			width: 24px;
			height: 24px;
			margin-left: 4px;
		}
	}
	.leeks {
		text-align: left;
		width: calc(100% + 16px);
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
		/* Colonnes de chiffres : centrées sous leur icône, et en chasse fixe pour
		   qu'une colonne ne change pas de largeur d'un poireau à l'autre. */
		td:not(:first-child), th:not(:first-child) {
			text-align: center;
		}
		td {
			font-variant-numeric: tabular-nums;
		}
		td:first-child, th:first-child {
			padding-left: 8px;
			padding-right: 10px;
		}
		img {
			width: 18px;
		}
		th img {
			display: block;
			margin: 0 auto;
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