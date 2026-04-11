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

<script lang="ts">
	import { defineComponent, PropType } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { Leek } from '@/model/leek'
	import { Loadout } from '@/model/loadout'
	import { CHIPS } from '@/model/chips'

	const CHARACTERISTICS = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'tp', 'mp', 'cores', 'ram']

	export default defineComponent({
		name: 'LoadoutList',
		props: {
			leek: { type: Object as PropType<Leek>, required: true },
		},
		emits: ['edit', 'applied'],
		data() {
			return {
				LeekWars,
				CHIPS,
				loading: false,
				applying: null as number | null,
			}
		},
		computed: {
			loadouts(): Loadout[] {
				return this.$store.state.farmer?.loadouts || []
			},
		},
		mounted() {
			if (!this.$store.state.farmer?.loadouts) {
				this.loading = true
				LeekWars.get('loadout/get-all').then((data: any) => {
					this.$store.commit('set-loadouts', data.loadouts)
					this.loading = false
				}).error(() => {
					this.loading = false
				})
			}
		},
		methods: {
			isCharac(icon: string) {
				return CHARACTERISTICS.includes(icon)
			},
			apply(loadout: Loadout) {
				this.applying = loadout.id
				LeekWars.post('loadout/apply', { set_id: loadout.id, leek_id: this.leek.id }).then((data: any) => {
					this.leek.weapons = data.leek.weapons
					this.leek.chips = data.leek.chips
					this.leek.components = data.leek.components
					this.$emit('applied')
					if (data.skipped && data.skipped.length > 0) {
						LeekWars.toast(this.$t('main.loadout_skipped_n', [data.skipped.length]))
					} else {
						LeekWars.toast(this.$t('main.loadout_apply_success', [this.leek.name]))
					}
					this.applying = null
				}).error((e: any) => {
					LeekWars.toast(e)
					this.applying = null
				})
			},
			remove(loadout: Loadout) {
				LeekWars.delete('loadout/delete', { set_id: loadout.id }).then(() => {
					this.$store.commit('remove-loadout', loadout.id)
				}).error((e: any) => {
					LeekWars.toast(e)
				})
			},
		},
	})
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
