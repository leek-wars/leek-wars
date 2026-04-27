<template>
	<div class="loadout-list">
		<loader v-if="loading" />
		<div v-else-if="!loadouts || loadouts.length === 0" class="empty">{{ $t('main.no_loadouts') }}</div>
		<div v-else class="loadouts">
			<div v-for="loadout in loadouts" :key="loadout.id" class="loadout-card">
				<div class="loadout-icon">
					<img v-if="isCharac(loadout.icon)" :src="'/image/charac/' + loadout.icon + '.png'" width="28" height="28">
					<span v-else-if="loadout.icon" class="emoji-icon">{{ loadout.icon }}</span>
					<v-icon v-else size="28">mdi-package-variant-closed</v-icon>
				</div>
				<div class="loadout-info">
					<div class="loadout-name">{{ loadout.name }}</div>
					<div class="loadout-preview">
						<img v-for="tpl in loadout.weapons.slice(0, 4)" :key="'w' + tpl" :src="'/image/' + LeekWars.items[tpl].name.replace('_', '/') + '.png'" class="preview-weapon" :title="LeekWars.items[tpl].name">
						<img v-for="tpl in loadout.chips.slice(0, 6)" :key="'c' + tpl" :src="'/image/chip/' + CHIPS[tpl].name + '.png'" class="preview-chip" :title="CHIPS[tpl].name">
					</div>
				</div>
				<div class="loadout-actions">
					<v-btn size="small" color="primary" :loading="applying === loadout.id" @click="apply(loadout)">{{ $t('main.loadout_apply') }}</v-btn>
					<v-btn size="small" icon @click="$emit('edit', loadout)"><v-icon>mdi-pencil</v-icon></v-btn>
					<v-btn size="small" icon @click="remove(loadout)"><v-icon>mdi-delete</v-icon></v-btn>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { CHIPS as CHIPSImport } from '@/model/chips'
import { Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { Loadout } from '@/model/loadout'
import { store } from '@/model/store'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const CHARACTERISTICS = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'tp', 'mp', 'cores', 'ram']
const CHIPS: Record<number, any> = CHIPSImport

defineOptions({ name: 'LoadoutList' })

const props = defineProps<{
	leek: Leek
}>()

const emit = defineEmits<{
	'edit': [loadout: Loadout]
	'applied': []
}>()

const { t } = useI18n()

const loading = ref(false)
const applying = ref<number | null>(null)

const loadouts = computed<Loadout[]>(() => store.state.farmer?.loadouts || [])

onMounted(() => {
	if (!store.state.farmer?.loadouts) {
		loading.value = true
		;(LeekWars.get('loadout/get-all').then((data: any) => {
			store.commit('set-loadouts', data.loadouts)
			loading.value = false
		}) as any).error(() => {
			loading.value = false
		})
	}
})

function isCharac(icon: string) {
	return CHARACTERISTICS.includes(icon)
}

function apply(loadout: Loadout) {
	applying.value = loadout.id
	;(LeekWars.post('loadout/apply', { set_id: loadout.id, leek_id: props.leek.id }).then((data: any) => {
		props.leek.weapons = data.leek.weapons
		props.leek.chips = data.leek.chips
		props.leek.components = data.leek.components
		emit('applied')
		if (data.skipped && data.skipped.length > 0) {
			LeekWars.toast(t('main.loadout_skipped_n', [data.skipped.length]))
		} else {
			LeekWars.toast(t('main.loadout_apply_success', [props.leek.name]))
		}
		applying.value = null
	}) as any).error((e: any) => {
		LeekWars.toast(e)
		applying.value = null
	})
}

function remove(loadout: Loadout) {
	;(LeekWars.delete('loadout/delete', { set_id: loadout.id }).then(() => {
		store.commit('remove-loadout', loadout.id)
	}) as any).error((e: any) => {
		LeekWars.toast(e)
	})
}
</script>

<style lang="scss" scoped>
.loadout-list {
	padding: 4px 0;
}
.loadouts {
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.loadout-card {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 6px 10px;
	border-radius: 6px;
	background: #f5f5f5;
}
.loadout-icon {
	width: 32px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}
.emoji-icon {
	font-size: 24px;
	line-height: 1;
}
.loadout-info {
	flex: 1;
	min-width: 0;
}
.loadout-name {
	font-weight: 600;
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.loadout-preview {
	display: flex;
	align-items: center;
	gap: 3px;
	margin-top: 3px;
	flex-wrap: wrap;
}
.preview-weapon {
	height: 22px;
	object-fit: contain;
}
.preview-chip {
	width: 20px;
	height: 20px;
	object-fit: contain;
}
.loadout-actions {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
}
</style>
