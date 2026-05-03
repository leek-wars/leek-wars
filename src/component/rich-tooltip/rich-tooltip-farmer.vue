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
							<img :src="farmer.connected ? '/image/connected.png' : '/image/disconnected.png'">
							<router-link :to="'/farmer/' + farmer.id" :class="farmer.color" class="text">{{ farmer.name }}</router-link>
							<router-link v-if="farmer.team" :to="'/team/' + farmer.team.id">
								<emblem :team="farmer.team" :title="farmer.team.name" />
							</router-link>
							<flag v-if="farmer.country" :code="farmer.country" class="country" />
							<lw-title v-if="farmer.title.length" :title="farmer.title" />
							<div class="spacer"></div>
							<v-btn v-if="!store.state.farmer || id != store.state.farmer.id" variant="text" icon="mdi-chat" size="small" @click="sendMessage()" />
						</span>
						<div>
							<router-link :to="'/trophies/' + farmer.id" class="stat">
								<img class="icon" src="/image/icon/grey/trophy.png">{{ LeekWars.formatNumber(farmer.points) }}
							</router-link>
							<router-link v-if="farmer.forum_messages" :to="'/search?farmer=' + farmer.name + '&order=date'" class="stat">
								<img class="icon" src="/image/forum.png">{{ $t('main.n_messages', farmer.forum_messages) }}
							</router-link>
						</div>
					</div>
				</div>
				<talent :id="farmer.id" :talent="farmer.talent" :max_talent="farmer.max_talent" category="farmer" />
				<span class="talent-more">({{ farmer.talent_more >= 0 ? '+' + farmer.talent_more : farmer.talent_more }})</span>
				<ranking-badge v-if="farmer && farmer.ranking && farmer.ranking <= 1000 && farmer.in_garden" :id="farmer.id" :ranking="farmer.ranking" category="farmer" />
				<span class="level">• {{ $t('main.level_n', [farmer.total_level]) }}</span>
				<v-btn class="expand" variant="text" size="x-small" @click="expand_leeks = !expand_leeks" :icon="expand_leeks ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
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
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const menu = useTemplateRef<any>('menu')
const content_created = ref(false)
const farmer = ref<any>(null)
const expand_leeks = ref(false)
const sums = ref<{[key: string]: number}>({})
const locked = ref(false)
const mouse = ref(false)
const value = ref(false)

const _open_delay = computed(() => props.instant ? 1 : 500)
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
		LeekWars.get<any>('farmer/rich-tooltip/' + props.id).then(f => {
			farmer.value = f
			for (const c of LeekWars.characteristics) {
				sums.value[c] = Object.values(f.leeks).reduce((sum: number, leek: any) => sum + leek['total_' + c], 0)
			}
			if (expand_leeks.value) {
				menu.value?.updateLocation?.()
			}
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
		margin-right: -4px;
		margin-bottom: 6px;
		img, .country {
			height: 17px;
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
		color: var(--text-color-secondary);
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
			border-bottom: 1px solid var(--border);
		}
		tr:nth-child(2n) {
			background: var(--background);
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