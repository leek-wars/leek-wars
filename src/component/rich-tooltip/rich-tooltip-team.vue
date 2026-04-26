<template>
	<v-menu ref="menu" v-model="value" :close-on-content-click="false" offset-overflow :disabled="disabled || id <= 0" :max-width="600" :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" offset-y @update:model-value="open($event)">
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<loader v-if="!team" :size="30" />
			<template v-else>
				<div class="flex">
					<router-link :to="'/team/' + team.id">
						<emblem :team="team" />
					</router-link>
					<div class="info">
						<span class="name">
							<router-link :to="'/team/' + team.id" class="text">{{ team.name }}</router-link>
						</span>
						<talent :id="team.id" :talent="team.talent" :max_talent="team.max_talent" category="team" />
						<ranking-badge v-if="team && team.ranking <= 1000" :id="team.id" :ranking="team.ranking" category="team" />
						<span class="level">
							• {{ $t('main.n_farmers', [team.farmers.length]) }}
							• {{ team.leek_count }} <img src="/image/icon/black/leek.png">
							• {{ $t('main.level_n', [team.level]) }}</span>
						<v-btn class="expand" variant="text" size="x-small" @click="expand = !expand" :icon="expand ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
					</div>
				</div>
				<div v-if="expand" class="farmers">
					<template v-for="(farmer, f) in team.farmers" :key="farmer.id">
						<template v-if="(f as number) > 0">, </template>
						<rich-tooltip-farmer :id="farmer.id" v-slot="{ props }" :bottom="true" @update:model-value="setParent">
							<router-link :to="'/farmer/' + farmer.id">
								<span :class="farmer.class" v-bind="props">{{ farmer.name }}</span>
							</router-link>
						</rich-tooltip-farmer>
					</template>
				</div>
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { LeekWars } from '@/model/leekwars'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

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
const team = ref<any>(null)
const expand = ref(false)
const locked = ref(false)
const mouse = ref(false)
const value = ref(false)

const _open_delay = computed(() => props.instant ? 1 : 500)
const _close_delay = computed(() => props.instant ? 1 : 1)

watch(() => props.id, () => {
	team.value = null
	content_created.value = false
})

function open(_v: boolean) {
	expand.value = localStorage.getItem('rich-tooltip-team/expanded') === 'true'
	if (content_created.value) { return }
	content_created.value = true
	if (props.id > 0 && !team.value) {
		LeekWars.get<any>('team/rich-tooltip/' + props.id).then(t => {
			team.value = t
			if (expand.value) {
				menu.value?.updateLocation?.()
			}
		})
	}
}

watch(expand, () => {
	localStorage.setItem('rich-tooltip-team/expanded', expand.value ? 'true' : 'false')
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
		margin-right: -4px;
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
		margin-bottom: 4px;
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
		color: #555;
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
	.farmers {
		padding-top: 15px;
	}
</style>