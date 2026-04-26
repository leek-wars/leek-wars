<template>
	<v-menu ref="menu" v-model="value" :close-on-content-click="false" offset-overflow :disabled="disabled || id <= 0" :nudge-width="expand_leeks ? 500 : 200" :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" offset-y @update:model-value="open($event)">
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<loader v-if="!composition" :size="30" />
			<template v-else>
				<div class="flex">
					<router-link :to="'/team/' + composition.team.id">
						<emblem :team="composition.team" />
					</router-link>
					<div class="info">
						<span class="name">
							<router-link :to="'/team/' + composition.team.id" class="text">{{ composition.team.name }} • {{ composition.name }}</router-link>
							<!-- <router-link v-if="farmer.team" :to="'/team/' + farmer.team.id">
								<emblem :team="farmer.team" :title="farmer.team.name" />
							</router-link> -->
						</span>
						<talent :id="composition.id" :talent="composition.talent" :max_talent="composition.max_talent" category="team" />
						<ranking-badge v-if="composition && composition.ranking <= 1000 && composition.in_garden" :id="composition.id" :ranking="composition.ranking" category="team" />
						<span class="level">
							• {{ composition.leeks.length }} <img src="/image/icon/black/leek.png">
							• {{ $t('main.level_n', [composition.total_level]) }}
						</span>
						<v-btn class="expand" variant="text" size="x-small" @click="expand_leeks = !expand_leeks" :icon="expand_leeks ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
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
						<tr v-for="leek in composition.leeks" :key="leek.id">
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
import { ref, computed, watch, useTemplateRef } from 'vue'
import { LeekWars } from '@/model/leekwars'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

const props = defineProps<{
	id: number
	disabled?: boolean
	bottom?: boolean
	instant?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const menu = useTemplateRef<any>('menu')
const content_created = ref(false)
const composition = ref<any>(null)
const expand_leeks = ref(false)
const sums = ref<{[key: string]: number}>({})
const locked = ref(false)
const mouse = ref(false)
const value = ref(false)

const _open_delay = computed(() => props.instant ? 1 : 500)
const _close_delay = computed(() => props.instant ? 1 : 1)

watch(() => props.id, () => {
	composition.value = null
	content_created.value = false
})

function open(_v: boolean) {
	expand_leeks.value = localStorage.getItem('rich-tooltip-composition/expanded') === 'true'
	if (content_created.value) { return }
	content_created.value = true
	if (props.id > 0 && !composition.value) {
		LeekWars.get<any>('team/composition-rich-tooltip/' + props.id).then(c => {
			composition.value = c
			for (const ch of LeekWars.characteristics) {
				sums.value[ch] = Object.values(c.leeks).reduce((sum: number, leek: any) => sum + leek[ch], 0)
			}
			if (expand_leeks.value) {
				menu.value?.updateLocation?.()
			}
		})
	}
}

watch(expand_leeks, () => {
	localStorage.setItem('rich-tooltip-composition/expanded', expand_leeks.value ? 'true' : 'false')
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
	.emblem {
		width: 60px;
		height: 60px;
		flex-grow: 0;
		flex-basis: 60px;
		vertical-align: bottom;
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
		img {
			width: 17px;
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
		img {
			width: 16px;
			opacity: 0.5;
			margin: 0 3px;
			vertical-align: top;
		}
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