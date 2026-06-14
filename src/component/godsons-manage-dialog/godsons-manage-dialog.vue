<template lang="html">
	<popup :model-value="modelValue" :width="640" icon="mdi-account-supervisor" :title="t('title')" @update:model-value="$emit('update:modelValue', $event)">
		<loader v-if="godsons === null" />
		<div v-else-if="godsons.length === 0" class="empty grey">{{ t('empty') }}</div>
		<div v-else class="godsons-list">
			<div v-for="g in godsons" :key="g.id" class="godson-card">
				<avatar :farmer="(g as any)" class="g-avatar" />
				<div class="g-info">
					<router-link :to="'/farmer/' + g.id" class="g-name">{{ g.name }}</router-link>
					<div class="g-stats grey">{{ t('stats', [g.total_level, g.talent, g.godsons_level, formatDate(g.register_time)]) }}</div>
				</div>
				<div v-ripple class="g-disown" @click="confirmGodson = g">{{ t('disown') }}</div>
			</div>
		</div>

		<popup v-if="confirmGodson" :model-value="true" :width="500" icon="mdi-account-remove" :title="t('disown_confirm_title')" @update:model-value="confirmGodson = null">
			<i18n-t keypath="disown_confirm_message" tag="div">
				<template #name><b>{{ confirmGodson.name }}</b></template>
				<template #level><b>{{ $filters.number(confirmGodson.total_level + confirmGodson.godsons_level) }}</b></template>
			</i18n-t>
			<template #actions>
				<div v-ripple class="action dismiss" @click="confirmGodson = null">{{ t('cancel') }}</div>
				<div v-ripple class="action red" @click="disown(confirmGodson)">{{ t('disown') }}</div>
			</template>
		</popup>
	</popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import Popup from '@/component/popup.vue'
import Avatar from '@/component/avatar.vue'

interface Godson { id: number, name: string, avatar_changed: number, total_level: number, leek_count: number, godsons_level: number, register_time: number, talent: number }

defineOptions({ name: 'GodsonsManageDialog', i18n: {}, mixins: [...mixins] })
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void, (e: 'disowned', payload: { id: number, godsons_level_current: number }): void }>()
useI18n() // initialize local scope for <i18n-t>
const t = useNamespacedT('godsons-manage-dialog')

const godsons = ref<Godson[] | null>(null)
const confirmGodson = ref<Godson | null>(null)
const formatDate = LeekWars.formatDate

watch(() => props.modelValue, (open) => {
	if (open && godsons.value === null) {
		LeekWars.get('farmer/get-godsons').then((data: { godsons: Godson[] }) => {
			godsons.value = data.godsons
		})
	}
}, { immediate: true })

function disown(g: Godson) {
	LeekWars.post('farmer/remove-godson', { godson_id: g.id }).then((data: { godsons_level_current: number }) => {
		if (godsons.value) godsons.value = godsons.value.filter(x => x.id !== g.id)
		confirmGodson.value = null
		emit('disowned', { id: g.id, godsons_level_current: data.godsons_level_current })
	})
}
</script>

<style lang="scss" scoped>
.empty {
	padding: 20px;
	text-align: center;
}
.godsons-list {
	display: flex;
	flex-direction: column;
}
.godson-card {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 4px;
	border-bottom: 1px solid var(--border);
	&:last-child { border-bottom: none; }
}
.g-avatar {
	width: 44px;
	height: 44px;
	flex: 0 0 auto;
}
.g-info {
	flex: 1;
	min-width: 0;
}
.g-name {
	font-weight: 500;
}
.g-stats {
	font-size: 13px;
}
.g-disown {
	color: var(--error, #c0392b);
	cursor: pointer;
	padding: 6px 12px;
	border-radius: 4px;
	white-space: nowrap;
	&:hover { background: rgba(192, 57, 43, 0.1); }
}
</style>
