<template>
	<popup v-model="shown" :width="editing ? 1300 : 900">
		<template #icon><v-icon>mdi-package-variant-closed</v-icon></template>
		<template #title>{{ editing ? (editing.id ? $t('main.loadout_edit') : $t('main.loadout_create')) : $t('main.loadouts') }}</template>

		<!-- VUE LISTE -->
		<template v-if="!editing">
			<div class="loadout-list">
				<loader v-if="loading" />
				<div v-else-if="loadouts.length === 0" class="empty">{{ $t('main.no_loadouts') }}</div>
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
								<div class="preview-col">
									<template v-for="tpl in loadout.weapons" :key="'w' + tpl">
										<div v-if="LeekWars.items[tpl]" class="preview-slot">
											<item :item="LeekWars.items[tpl]" />
										</div>
									</template>
								</div>
								<div class="preview-col">
									<template v-for="tpl in loadout.chips" :key="'c' + tpl">
										<div v-if="LeekWars.items[tpl]" class="preview-slot">
											<item :item="LeekWars.items[tpl]" />
										</div>
									</template>
								</div>
								<div class="preview-col">
									<template v-for="c in loadout.components" :key="'comp' + c.index">
										<div v-if="LeekWars.items[c.template]" class="preview-slot">
											<item :item="LeekWars.items[c.template]" />
										</div>
									</template>
								</div>
							</div>
						</div>
						<div class="loadout-actions">
							<v-btn size="small" color="primary" :loading="applying === loadout.id" @click="apply(loadout)">{{ $t('main.loadout_apply') }}</v-btn>
							<v-btn size="small" icon @click="startEdit(loadout)"><v-icon>mdi-pencil</v-icon></v-btn>
							<v-btn size="small" icon @click="remove(loadout)"><v-icon>mdi-delete</v-icon></v-btn>
						</div>
					</div>
				</div>
			</div>
			<div class="list-footer">
				<v-btn prepend-icon="mdi-plus" @click="startCreate">{{ $t('main.loadout_create') }}</v-btn>
			</div>
		</template>

		<!-- VUE ÉDITION -->
		<template v-else>
			<div class="loadout-form">

				<div class="row-name-icon">
					<emoji-picker class="icon-picker" @pick="pickEmoji">
						<img v-if="isCharac(editing.icon)" :src="'/image/charac/' + editing.icon + '.png'" width="32" height="32">
						<span v-else-if="editing.icon" v-emojis class="emoji-display">{{ editing.icon }}</span>
						<v-icon v-else size="32">mdi-emoticon-outline</v-icon>
					</emoji-picker>
					<input v-model="editing.name" class="name-input" :placeholder="$t('main.loadout_name_placeholder')" maxlength="60" type="text">
				</div>

				<div class="import-row">
					<v-btn variant="text" size="small" prepend-icon="mdi-download" @click="importCurrent">{{ $t('main.loadout_import_current') }}</v-btn>
				</div>

				<div class="items-grid">
					<!-- Armes -->
					<div class="section">
						<h4>{{ $t('weapons') }}</h4>
						<div class="selected-items">
							<div v-for="tpl in editing.weapons" :key="tpl" class="item-slot selected" @click="toggleWeapon(tpl)">
								<item v-if="LeekWars.items[tpl]" :item="LeekWars.items[tpl]" />
								<v-icon class="remove-icon" size="12">mdi-close</v-icon>
							</div>
							<span v-if="editing.weapons.length === 0" class="empty-hint">{{ $t('main.loadout_none') }}</span>
						</div>
						<div class="available-items">
							<div v-for="w in allWeapons" :key="w.template" class="item-slot"
								:class="{selected: editing.weapons.includes(w.template)}"
								@click="toggleWeapon(w.template)">
								<item v-if="LeekWars.items[w.template]" :item="LeekWars.items[w.template]" />
							</div>
						</div>
					</div>

					<!-- Puces -->
					<div class="section">
						<h4>{{ $t('main.chips') }}</h4>
						<div class="selected-items">
							<div v-for="tpl in editing.chips" :key="tpl" class="item-slot selected" @click="toggleChip(tpl)">
								<item v-if="LeekWars.items[tpl]" :item="LeekWars.items[tpl]" />
								<v-icon class="remove-icon" size="12">mdi-close</v-icon>
							</div>
							<span v-if="editing.chips.length === 0" class="empty-hint">{{ $t('main.loadout_none') }}</span>
						</div>
						<div class="available-items">
							<div v-for="c in allChips" :key="c.template" class="item-slot"
								:class="{selected: editing.chips.includes(c.template)}"
								@click="toggleChip(c.template)">
								<item v-if="LeekWars.items[c.template]" :item="LeekWars.items[c.template]" />
							</div>
						</div>
					</div>

					<!-- Composants -->
					<div class="section">
						<h4>{{ $t('main.components') }}</h4>
						<div class="components-grid">
							<div v-for="i in 8" :key="i" class="component-slot" @click="clearComponentSlot(i - 1)">
								<template v-if="componentAtSlot(i - 1)">
									<item v-if="LeekWars.items[componentAtSlot(i - 1)!]" :item="LeekWars.items[componentAtSlot(i - 1)!]" />
									<v-icon class="remove-icon" size="12">mdi-close</v-icon>
								</template>
								<div v-else class="slot-empty">{{ i }}</div>
							</div>
						</div>
						<div class="available-items">
							<div v-for="c in allComponents" :key="c.template" class="item-slot"
								:class="{selected: isComponentSelected(c.template)}"
								@click="addComponent(c.template)">
								<item v-if="LeekWars.items[c.template]" :item="LeekWars.items[c.template]" />
							</div>
						</div>
					</div>

					<!-- Caractéristiques (à venir) -->
					<div class="section section-placeholder">
					</div>
				</div>

			</div>
			<div class="form-footer">
				<v-btn @click="editing = null">{{ $t('cancel') }}</v-btn>
				<v-btn color="primary" :disabled="!editing.name.trim()" :loading="saving" @click="save">{{ $t('save') }}</v-btn>
			</div>
		</template>
	</popup>
</template>

<script lang="ts">
	import { defineComponent, PropType } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { Leek } from '@/model/leek'
	import { Loadout, LoadoutComponent } from '@/model/loadout'
	import { store } from '@/model/store'
	import EmojiPicker from '@/component/chat/emoji-picker.vue'
	import Item from '@/component/item.vue'

	const CHARACTERISTICS = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'tp', 'mp', 'cores', 'ram']

	interface EditingLoadout {
		id: number | null
		name: string
		icon: string
		weapons: number[]
		chips: number[]
		components: LoadoutComponent[]
	}

	export default defineComponent({
		name: 'LoadoutDialog',
		components: { EmojiPicker, Item },
		props: {
			modelValue: { type: Boolean, required: true },
			leek: { type: Object as PropType<Leek | null>, default: null },
		},
		emits: ['update:modelValue', 'applied'],
		data() {
			return {
				LeekWars,
				CHARACTERISTICS,
				loading: false,
				applying: null as number | null,
				saving: false,
				editing: null as EditingLoadout | null,
			}
		},
		computed: {
			shown: {
				get() { return this.modelValue },
				set(v: boolean) {
					if (!v && this.editing) { this.editing = null }
					else { this.$emit('update:modelValue', v) }
				},
			},
			loadouts(): Loadout[] { return store.state.farmer?.loadouts || [] },
			allWeapons() { return store.state.farmer?.weapons ?? [] },
			allChips() { return store.state.farmer?.chips ?? [] },
			allComponents() { return store.state.farmer?.components ?? [] },
		},
		watch: {
			modelValue(val: boolean) {
				if (val) {
					this.editing = null
					if (!store.state.farmer?.loadouts) this.loadAll()
				}
			},
		},
		methods: {
			isCharac(icon: string) { return CHARACTERISTICS.includes(icon) },
			loadAll() {
				this.loading = true
				LeekWars.get('loadout/get-all').then((data: any) => {
					store.commit('set-loadouts', data.loadouts)
					this.loading = false
				}).error(() => { this.loading = false })
			},
			startCreate() {
				this.editing = { id: null, name: '', icon: '', weapons: [], chips: [], components: [] }
			},
			startEdit(loadout: Loadout) {
				this.editing = {
					id: loadout.id,
					name: loadout.name,
					icon: loadout.icon,
					weapons: [...loadout.weapons],
					chips: [...loadout.chips],
					components: loadout.components.map(c => ({ ...c })),
				}
			},
			pickEmoji(emoji: string) {
				if (this.editing) this.editing.icon = emoji
			},
			importCurrent() {
				if (!this.leek || !this.editing) return
				this.editing.weapons = this.leek.weapons.map((w: any) => w.template)
				this.editing.chips = this.leek.chips.map((c: any) => c.template)
				this.editing.components = this.leek.components
					.map((c: any, i: number) => c ? { index: i, template: c.template } : null)
					.filter((c: any): c is LoadoutComponent => c !== null)
			},
			toggleWeapon(tpl: number) {
				if (!this.editing) return
				const i = this.editing.weapons.indexOf(tpl)
				if (i === -1) this.editing.weapons.push(tpl)
				else this.editing.weapons.splice(i, 1)
			},
			toggleChip(tpl: number) {
				if (!this.editing) return
				const i = this.editing.chips.indexOf(tpl)
				if (i === -1) this.editing.chips.push(tpl)
				else this.editing.chips.splice(i, 1)
			},
			componentAtSlot(idx: number): number | null {
				if (!this.editing) return null
				const c = this.editing.components.find(c => c.index === idx)
				return c ? c.template : null
			},
			isComponentSelected(tpl: number) {
				return this.editing?.components.some(c => c.template === tpl) ?? false
			},
			addComponent(tpl: number) {
				if (!this.editing) return
				const existing = this.editing.components.findIndex(c => c.template === tpl)
				if (existing !== -1) { this.editing.components.splice(existing, 1); return }
				for (let i = 0; i < 8; i++) {
					if (!this.editing.components.some(c => c.index === i)) {
						this.editing.components.push({ index: i, template: tpl })
						return
					}
				}
			},
			clearComponentSlot(idx: number) {
				if (!this.editing) return
				const i = this.editing.components.findIndex(c => c.index === idx)
				if (i !== -1) this.editing.components.splice(i, 1)
			},
			save() {
				if (!this.editing) return
				const payload = {
					name: this.editing.name.trim(),
					icon: this.editing.icon,
					weapons: JSON.stringify(this.editing.weapons),
					chips: JSON.stringify(this.editing.chips),
					components: JSON.stringify(this.editing.components),
				}
				this.saving = true
				if (this.editing.id) {
					LeekWars.put('loadout/update', { set_id: this.editing.id, ...payload }).then((data: any) => {
						store.commit('update-loadout', data.set)
						this.editing = null
						this.saving = false
					}).error((e: any) => { LeekWars.toast(e); this.saving = false })
				} else {
					LeekWars.post('loadout/create', payload).then((data: any) => {
						store.commit('add-loadout', data.set)
						this.editing = null
						this.saving = false
					}).error((e: any) => { LeekWars.toast(e); this.saving = false })
				}
			},
			apply(loadout: Loadout) {
				if (!this.leek) return
				this.applying = loadout.id
				LeekWars.post('loadout/apply', { set_id: loadout.id, leek_id: this.leek.id }).then((data: any) => {
					this.leek!.weapons = data.leek.weapons
					this.leek!.chips = data.leek.chips
					this.leek!.components = data.leek.components
					this.$emit('applied')
					if (data.skipped && data.skipped.length > 0) {
						LeekWars.toast(this.$t('main.loadout_skipped_n', [data.skipped.length]))
					} else {
						LeekWars.toast(this.$t('main.loadout_apply_success', [this.leek!.name]))
					}
					this.applying = null
				}).error((e: any) => { LeekWars.toast(e); this.applying = null })
			},
			remove(loadout: Loadout) {
				LeekWars.delete('loadout/delete', { set_id: loadout.id }).then(() => {
					store.commit('remove-loadout', loadout.id)
				}).error((e: any) => { LeekWars.toast(e) })
			},
		},
	})
</script>

<style lang="scss" scoped>
// Liste
.loadout-list { padding: 4px 0; }
.loadouts { display: flex; flex-direction: column; gap: 6px; }
.loadout-card {
	display: flex; align-items: center; gap: 10px;
	padding: 6px 10px; border-radius: 6px; background: #f5f5f5;
}
.loadout-icon {
	width: 32px; flex-shrink: 0;
	display: flex; align-items: center; justify-content: center;
}
.emoji-icon { font-size: 24px; line-height: 1; }
.loadout-info { flex: 1; min-width: 0; }
.loadout-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.loadout-preview { display: flex; gap: 6px; margin-top: 4px; }
.preview-col {
	flex: 1; display: flex; flex-wrap: wrap; gap: 3px; align-content: flex-start;
	max-height: calc(2 * 30px + 3px); overflow: hidden;
}
.preview-slot {
	width: 30px; height: 30px; flex-shrink: 0;
	:deep(span) { display: block; }
	:deep(.item) { width: 30px !important; height: 30px !important; box-sizing: border-box !important; }
}
.loadout-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.list-footer { margin-top: 12px; }

// Formulaire
.loadout-form { display: flex; flex-direction: column; gap: 12px; }
.items-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}
.section-placeholder { min-height: 100px; }
.row-name-icon { display: flex; align-items: center; gap: 10px; }
.icon-picker { flex-shrink: 0; }
.emoji-display { font-size: 26px; line-height: 1; }
:deep(.chat-input-emoji) {
	width: 48px; height: 48px;
	border: 2px solid #ddd; border-radius: 8px; padding: 6px;
	display: flex; align-items: center; justify-content: center;
	&:hover { border-color: #aaa; }
}
.name-input {
	flex: 1; border: 1px solid #ccc; border-radius: 6px;
	padding: 8px 12px; font-size: 15px; outline: none;
	&:focus { border-color: #1976d2; }
}
.import-row { margin-top: -6px; }
.section h4 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; color: #888; }
.selected-items {
	display: flex; flex-wrap: wrap; gap: 4px; min-height: 52px; margin-bottom: 6px;
	.empty-hint { color: #bbb; font-size: 13px; align-self: center; }
}
.available-items { display: flex; flex-wrap: wrap; gap: 4px; }
.item-slot {
	position: relative; cursor: pointer; flex-shrink: 0;
	border: 2px solid transparent; border-radius: 6px;
	width: 48px; height: 48px;
	:deep(span) { display: block; }
	:deep(.item) { width: 44px !important; height: 44px !important; box-sizing: border-box !important; }
	&:hover { border-color: #aaa; }
	.remove-icon {
		position: absolute; top: 1px; right: 1px; z-index: 1;
		background: rgba(0,0,0,.5); border-radius: 50%; color: white;
	}
}
.selected-items .item-slot { border-color: #1976d2; }
.available-items .item-slot.selected { opacity: 0.3; }
.available-items .item-slot.selected:hover { opacity: 0.6; }
.components-grid { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.component-slot {
	width: 48px; height: 48px; border: 2px dashed #ccc; border-radius: 6px;
	display: flex; align-items: center; justify-content: center;
	cursor: pointer; position: relative; flex-shrink: 0;
	&:hover { border-color: #888; }
	:deep(span) { display: block; }
	:deep(.item) { width: 44px !important; height: 44px !important; box-sizing: border-box !important; }
	.remove-icon {
		position: absolute; top: 1px; right: 1px; z-index: 1;
		background: rgba(0,0,0,.5); border-radius: 50%; color: white;
	}
}
.slot-empty { font-size: 12px; color: #ccc; }
.form-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
</style>
