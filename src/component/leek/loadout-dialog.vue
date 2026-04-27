<template>
	<popup v-model="shown" :width="editing ? 1300 : 900">
		<template #icon><v-icon>mdi-package-variant-closed</v-icon></template>
		<template #title>{{ editing ? (editing.id ? $t('main.loadout_edit') : $t('main.loadout_create')) : $t('main.loadouts') }}</template>

		<!-- VUE LISTE -->
		<template v-if="!editing">
			<div class="loadout-list">
				<loader v-if="loading" />
				<div v-else-if="loadouts.length === 0" class="empty">{{ $t('main.no_loadouts') }}</div>
				<div v-else ref="loadoutsEl" class="loadouts">
					<div v-for="loadout in loadouts" :key="loadout.id" :data-id="loadout.id" class="loadout-card">
						<div class="loadout-header">
							<v-icon class="drag-handle">mdi-drag-vertical</v-icon>
							<div class="loadout-icon">
								<img v-if="isCharac(loadout.icon)" :src="'/image/charac/' + loadout.icon + '.png'" width="24" height="24">
								<span v-else-if="loadout.icon" :key="loadout.icon" v-emojis class="emoji-icon">{{ loadout.icon }}</span>
								<v-icon v-else size="24">mdi-package-variant-closed</v-icon>
							</div>
							<div class="loadout-name">
								{{ loadout.name }}
								<v-tooltip v-if="warningsByLoadout[loadout.id] && warningsByLoadout[loadout.id].length > 0" location="bottom">
									<template #activator="{ props }">
										<v-icon v-bind="props" color="warning" size="18" class="loadout-warning-icon">mdi-alert</v-icon>
									</template>
									<div v-for="(w, i) in warningsByLoadout[loadout.id]" :key="i">{{ w }}</div>
								</v-tooltip>
							</div>
							<div class="loadout-actions">
								<div v-if="loadoutStatus[loadout.id]?.fullyApplied" class="already-equipped">
									<v-icon size="18" color="success">mdi-check-circle</v-icon>
									<span>{{ $t('main.loadout_already_applied') }}</span>
								</div>
								<v-btn v-else size="small" color="primary" :loading="applying === loadout.id" @click="apply(loadout)">{{ $t('main.loadout_apply') }}</v-btn>
								<v-btn size="x-small" variant="text" icon @click="startEdit(loadout)"><v-icon size="18">mdi-pencil</v-icon></v-btn>
								<v-btn size="x-small" variant="text" icon @click="remove(loadout)"><v-icon size="18">mdi-delete</v-icon></v-btn>
							</div>
						</div>
						<div class="loadout-preview">
							<div class="preview-col preview-col-stats">
								<div v-for="c in CHARACTERISTICS" :key="c" class="stat-badge" :class="c">
									<img :src="'/image/charac/' + c + '.png'" width="14" height="14">
									<span :class="'color-' + c">{{ statTotalFor(loadout, c) }}</span>
								</div>
							</div>
							<div class="preview-col preview-col-weapons">
								<template v-for="tpl in loadout.weapons" :key="'w' + tpl">
									<div v-if="LeekWars.items[tpl]" class="preview-slot">
										<item :item="LeekWars.items[tpl]" />
									</div>
								</template>
							</div>
							<div class="preview-col preview-col-chips">
								<template v-for="tpl in loadout.chips" :key="'c' + tpl">
									<div v-if="LeekWars.items[tpl]" class="preview-slot">
										<item :item="LeekWars.items[tpl]" />
									</div>
								</template>
							</div>
							<div class="preview-col preview-col-components">
								<template v-for="c in loadout.components" :key="'comp' + c.index">
								<div v-if="LeekWars.items[c.template]" class="preview-slot">
										<item :item="LeekWars.items[c.template]" />
									</div>
								</template>
							</div>
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
						<span v-else-if="editing.icon" :key="editing.icon" v-emojis class="emoji-display">{{ editing.icon }}</span>
						<v-icon v-else size="32">mdi-emoticon-outline</v-icon>
					</emoji-picker>
					<input v-model="editing.name" class="name-input" :placeholder="$t('main.loadout_name_placeholder')" maxlength="60" type="text">
					<v-btn @click="editing = null">{{ $t('main.cancel') }}</v-btn>
					<v-btn color="primary" :disabled="!editing.name.trim()" :loading="saving" @click="save">{{ $t('main.save') }}</v-btn>
				</div>

				<div class="import-row">
					<v-btn variant="text" size="small" prepend-icon="mdi-download" @click="importCurrent">{{ $t('main.loadout_import_current') }}</v-btn>
				</div>

				<div class="items-grid">
					<!-- Caractéristiques -->
					<div class="section">
						<div class="section-header">
							<h4>
								{{ $t('characteristic.characteristics') }}
								<span class="capital-used" :class="{warning: totalCapital() > softMaxCapital}">({{ totalCapital() }} / {{ softMaxCapital }})</span>
								<v-tooltip v-if="totalCapital() > softMaxCapital" location="bottom">
									<template #activator="{ props }">
										<v-icon v-bind="props" color="warning" size="18" class="capital-warning-icon">mdi-alert</v-icon>
									</template>
									<div>{{ $t('main.loadout_capital_exceeds_highest', [totalCapital(), softMaxCapital, highestLeekLevel]) }}</div>
								</v-tooltip>
							</h4>
							<v-btn :class="{'invisible-btn': Object.keys(editing.stats).length === 0}" size="x-small" variant="text" icon @click="editing.stats = {}"><v-icon>mdi-close-circle-outline</v-icon></v-btn>
						</div>
						<loadout-stats-picker v-model="editing.stats" :max="maxCapital" />
					</div>

					<!-- Armes -->
					<div class="section">
						<div class="section-header">
							<h4>{{ $t('weapons') }}</h4>
							<v-btn :class="{'invisible-btn': editing.weapons.length === 0}" size="x-small" variant="text" icon @click="editing.weapons = []"><v-icon>mdi-close-circle-outline</v-icon></v-btn>
						</div>
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
						<div class="section-header">
							<h4>{{ $t('main.chips') }}</h4>
							<v-btn :class="{'invisible-btn': editing.chips.length === 0}" size="x-small" variant="text" icon @click="editing.chips = []"><v-icon>mdi-close-circle-outline</v-icon></v-btn>
						</div>
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
						<div class="section-header">
							<h4>{{ $t('main.components') }}</h4>
							<v-btn :class="{'invisible-btn': editing.components.length === 0}" size="x-small" variant="text" icon @click="editing.components = []"><v-icon>mdi-close-circle-outline</v-icon></v-btn>
						</div>
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

				</div>

			</div>
		</template>
	</popup>

	<popup v-model="skippedDialogOpen" :width="520">
		<template #icon><v-icon color="warning">mdi-alert</v-icon></template>
		<template #title>{{ $t('main.loadout_skipped_title') }}</template>
		<div class="skipped-list">
			<div v-for="(s, i) in skippedItems" :key="i" class="skipped-item">
				<item v-if="LeekWars.items[s.template]" :item="LeekWars.items[s.template]" />
				<div class="skipped-info">
					<div class="skipped-name">{{ LeekWars.items[s.template] ? $t(skippedItemTKey(s)) : '#' + s.template }}</div>
					<div class="skipped-reason">{{ $t('main.loadout_skipped_reason_' + s.reason) }}</div>
				</div>
			</div>
		</div>
		<template #actions>
			<div v-ripple class="action" @click="skippedDialogOpen = false">{{ $t('main.close') }}</div>
		</template>
	</popup>

	<popup v-model="restatDialogOpen" :width="620" class="restat-popup">
		<template #icon><v-icon>mdi-flask</v-icon></template>
		<template #title>{{ $t('main.loadout_restat_title') }}</template>
		<div class="restat-confirm">
			<img src="/image/potion/restat.png" width="64" height="64">
			<div class="restat-message">
				<p>{{ $t('main.loadout_restat_message') }}</p>
				<p v-if="restatPotionCount !== null" class="restat-count">{{ $t('main.loadout_restat_you_have', [restatPotionCount]) }}</p>
				<p v-else-if="restatPotionCount === 0" class="restat-none">{{ $t('main.loadout_no_restat_potion') }}</p>
			</div>
		</div>
		<template #actions>
			<div v-ripple class="action compact" @click="cancelRestat">{{ $t('main.cancel') }}</div>
			<div v-if="pendingApply && loadoutStatus[pendingApply.id]?.itemsDiffer" v-ripple class="action compact" @click="applyWithoutStats">
				<v-icon>mdi-sword</v-icon>
				<span>{{ $t('main.loadout_apply_items_only') }}</span>
			</div>
			<div v-ripple class="action compact green" :class="{disabled: !restatPotionCount}" @click="restatPotionCount && confirmRestat()">
				<v-icon>mdi-check</v-icon>
				<span>{{ $t('main.loadout_restat_confirm') }}</span>
			</div>
		</template>
	</popup>
</template>

<script lang="ts">
	import { defineComponent, PropType } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { Leek } from '@/model/leek'
	import { Loadout, LoadoutComponent, LoadoutStats } from '@/model/loadout'
	import { capitalToStatBonus, statBonusToCapital, baseStatFor, totalCapitalForLevel } from '@/model/capital'
	import { store } from '@/model/store'
	import EmojiPicker from '@/component/chat/emoji-picker.vue'
	import Item from '@/component/item.vue'
	import LoadoutStatsPicker from '@/component/leek/loadout-stats-picker.vue'
	import Sortable from 'sortablejs'

	const CHARACTERISTICS = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'tp', 'mp', 'cores', 'ram']

	interface EditingLoadout {
		id: number | null
		name: string
		icon: string
		weapons: number[]
		chips: number[]
		components: LoadoutComponent[]
		stats: LoadoutStats
	}


	export default defineComponent({
		name: 'LoadoutDialog',
		components: { EmojiPicker, Item, LoadoutStatsPicker },
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
				applyingItemsOnly: null as number | null,
				saving: false,
				editing: null as EditingLoadout | null,
				restatDialogOpen: false,
				pendingApply: null as Loadout | null,
				sortable: null as Sortable | null,
				skippedDialogOpen: false,
				skippedItems: [] as any[],
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
			maxCapital(): number { return totalCapitalForLevel(301) },
			highestLeekLevel(): number {
				const leeks = store.state.farmer?.leeks
				if (!leeks) return 1
				let max = 1
				for (const id in leeks) if (leeks[id].level > max) max = leeks[id].level
				return max
			},
			softMaxCapital(): number { return totalCapitalForLevel(this.highestLeekLevel) },
			restatPotionCount(): number {
				const farmer = store.state.farmer as any
				if (!farmer || !farmer.potions) return 0
				const p = farmer.potions.find((p: any) => p.template === 49)
				return p ? p.quantity : 0
			},
			allWeapons() { return store.state.farmer?.weapons ?? [] },
			allChips() { return store.state.farmer?.chips ?? [] },
			allComponents() { return store.state.farmer?.components ?? [] },
			loadoutStatus(): { [id: number]: { itemsDiffer: boolean, statsDiffer: boolean, fullyApplied: boolean } } {
				const result: { [id: number]: { itemsDiffer: boolean, statsDiffer: boolean, fullyApplied: boolean } } = {}
				if (!this.leek) return result
				const leek = this.leek as any
				const leekWeapons = (leek.weapons || []).map((w: any) => w.template).sort((a: number, b: number) => a - b)
				const leekChips = (leek.chips || []).map((c: any) => c.template).sort((a: number, b: number) => a - b)
				const leekComps: { [idx: number]: number } = {}
				const lComps = leek.components || []
				for (let i = 0; i < lComps.length; i++) if (lComps[i]) leekComps[i] = lComps[i].template
				const leekCompKeys = Object.keys(leekComps)
				for (const loadout of this.loadouts) {
					const ldWeapons = [...loadout.weapons].sort((a, b) => a - b)
					const ldChips = [...loadout.chips].sort((a, b) => a - b)
					const ldComps: { [idx: number]: number } = {}
					for (const c of loadout.components) ldComps[c.index] = c.template
					let itemsDiffer = false
					if (leekWeapons.length !== ldWeapons.length) itemsDiffer = true
					else for (let i = 0; i < leekWeapons.length; i++) if (leekWeapons[i] !== ldWeapons[i]) { itemsDiffer = true; break }
					if (!itemsDiffer) {
						if (leekChips.length !== ldChips.length) itemsDiffer = true
						else for (let i = 0; i < leekChips.length; i++) if (leekChips[i] !== ldChips[i]) { itemsDiffer = true; break }
					}
					if (!itemsDiffer) {
						const ldCompKeys = Object.keys(ldComps)
						if (leekCompKeys.length !== ldCompKeys.length) itemsDiffer = true
						else for (const k of leekCompKeys) if (leekComps[+k] !== ldComps[+k]) { itemsDiffer = true; break }
					}
					const statsDiffer = this.statsDifferFromLeek(loadout)
					result[loadout.id] = { itemsDiffer, statsDiffer, fullyApplied: !itemsDiffer && !statsDiffer }
				}
				return result
			},
			warningsByLoadout(): { [id: number]: string[] } {
				const result: { [id: number]: string[] } = {}
				if (!this.leek) return result
				const level = this.leek.level
				const maxWeapons = this.leek.max_weapons
				const baseRam = this.leek.ram
				const leek = this.leek as any
				const baseBonuses: { [k: string]: number } = {}
				for (const s of CHARACTERISTICS) baseBonuses[s] = leek[s] - baseStatFor(leek.level, s)
				const totalCapital = totalCapitalForLevel(level)
				for (const loadout of this.loadouts) {
					const warnings: string[] = []
					let ram = baseRam
					for (const c of loadout.components) {
						const item = LeekWars.items[c.template]
						const comp = item && LeekWars.components[item.params]
						if (!comp) continue
						for (const [stat, value] of comp.stats) {
							if (stat === 'ram') ram += value
						}
					}
					const overLevel = [...loadout.weapons, ...loadout.chips, ...loadout.components.map(c => c.template)]
						.filter(tpl => LeekWars.items[tpl] && LeekWars.items[tpl].level > level)
					if (overLevel.length > 0) warnings.push(this.$t('main.loadout_warning_over_level', [overLevel.length]) as string)
					if (loadout.weapons.length > maxWeapons) warnings.push(this.$t('main.loadout_warning_too_many_weapons', [loadout.weapons.length, maxWeapons]) as string)
					if (loadout.chips.length > ram) warnings.push(this.$t('main.loadout_warning_too_many_chips', [loadout.chips.length, ram]) as string)
					const forgotten = loadout.weapons.filter(tpl => {
						const item = LeekWars.items[tpl]
						return item && LeekWars.weapons[item.params] && LeekWars.weapons[item.params].forgotten
					})
					if (forgotten.length > 1) warnings.push(this.$t('main.loadout_warning_two_forgotten') as string)

					// Stats-related warnings
					let statsDiffer = false
					let requestedCapital = 0
					for (const stat of CHARACTERISTICS) {
						const target = (loadout.stats && loadout.stats[stat]) || 0
						requestedCapital += target
						const current = statBonusToCapital(stat, baseBonuses[stat] || 0)
						if (target !== current) statsDiffer = true
					}
					if (requestedCapital > totalCapital) {
						warnings.push(this.$t('main.loadout_warning_not_enough_capital', [requestedCapital, totalCapital]) as string)
					}
					if (statsDiffer) {
						warnings.push(this.$t('main.loadout_warning_restat_needed') as string)
					}
					result[loadout.id] = warnings
				}
				return result
			},
		},
		watch: {
			modelValue(val: boolean) {
				if (val) {
					this.editing = null
					if (!store.state.farmer?.loadouts) this.loadAll()
					this.$nextTick(() => this.initSortable())
				} else {
					this.destroySortable()
				}
			},
			editing() {
				// Quand on sort du mode édition, on revient en liste → re-init
				if (!this.editing) this.$nextTick(() => this.initSortable())
				else this.destroySortable()
			},
			loadouts() {
				this.$nextTick(() => this.initSortable())
			},
		},
		beforeUnmount() {
			this.destroySortable()
		},
		methods: {
			isCharac(icon: string) { return CHARACTERISTICS.includes(icon) },
			skippedItemTKey(s: any): string {
				const item = LeekWars.items[s.template]
				if (!item) return ''
				if (s.type === 'weapon') {
					const w = LeekWars.weapons[item.params]
					if (w) return 'weapon.' + w.name
				} else if (s.type === 'chip') {
					const c = LeekWars.chips[item.params]
					if (c) return 'chip.' + c.name
				} else if (s.type === 'component') {
					const c = LeekWars.components[item.params]
					if (c) return 'component.' + c.name
				}
				return item.name
			},
			loadAll() {
				this.loading = true
				LeekWars.get('loadout/get-all').then((data: any) => {
					store.commit('set-loadouts', data.loadouts)
					this.loading = false
				}).error(() => { this.loading = false })
			},
			initSortable() {
				const el = this.$refs.loadoutsEl as HTMLElement | undefined
				if (!el) return
				this.destroySortable()
				this.sortable = Sortable.create(el, {
					handle: '.drag-handle',
					animation: 150,
					onEnd: (evt) => {
						if (evt.oldIndex === undefined || evt.newIndex === undefined) return
						if (evt.oldIndex === evt.newIndex) return
						const current = [...this.loadouts]
						const item = current.splice(evt.oldIndex, 1)[0]
						current.splice(evt.newIndex, 0, item)
						store.commit('set-loadouts', current)
						LeekWars.post('loadout/reorder', { order: JSON.stringify(current.map(l => l.id)) })
							.error((e: any) => LeekWars.toast(e))
					},
				})
			},
			destroySortable() {
				if (this.sortable) { this.sortable.destroy(); this.sortable = null }
			},
			startCreate() {
				this.editing = { id: null, name: '', icon: '', weapons: [], chips: [], components: [], stats: {} }
			},
			startEdit(loadout: Loadout) {
				this.editing = {
					id: loadout.id,
					name: loadout.name,
					icon: loadout.icon,
					weapons: [...loadout.weapons],
					chips: [...loadout.chips],
					components: loadout.components.map(c => ({ ...c })),
					stats: { ...(loadout.stats || {}) },
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
				// Import des stats depuis l'allocation actuelle du leek
				const stats: LoadoutStats = {}
				const leek = this.leek as any
				for (const stat of CHARACTERISTICS) {
					const bonus = leek[stat] - baseStatFor(leek.level, stat)
					const cap = statBonusToCapital(stat, bonus)
					if (cap > 0) stats[stat] = cap
				}
				this.editing.stats = stats
			},
			totalCapital(): number {
				if (!this.editing) return 0
				return Object.values(this.editing.stats).reduce((a, b) => a + b, 0)
			},
			statBonusFor(loadout: Loadout, stat: string): number {
				if (!loadout.stats) return 0
				const cap = loadout.stats[stat] || 0
				return cap > 0 ? capitalToStatBonus(stat, cap) : 0
			},
			statTotalFor(loadout: Loadout, stat: string): number {
				const level = this.leek?.level || 1
				let total = baseStatFor(level, stat) + this.statBonusFor(loadout, stat)
				for (const c of loadout.components || []) {
					const item = LeekWars.items[c.template]
					const comp = item && LeekWars.components[item.params]
					if (!comp) continue
					for (const [s, v] of comp.stats) {
						if (s === stat) total += v
					}
				}
				return total
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
					stats: JSON.stringify(this.editing.stats),
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
				// Détection locale d'un changement de stats → confirmation potion de restat
				if (this.statsDifferFromLeek(loadout)) {
					this.pendingApply = loadout
					this.restatDialogOpen = true
					return
				}
				this.doApply(loadout, false)
			},
			applyItemsOnly(loadout: Loadout) {
				if (!this.leek) return
				this.applyingItemsOnly = loadout.id
				LeekWars.post('loadout/apply', { set_id: loadout.id, leek_id: this.leek.id, use_restat: false }).then((data: any) => {
					this.leek!.weapons = data.leek.weapons
					this.leek!.chips = data.leek.chips
					this.leek!.components = data.leek.components
					this.$emit('applied')
					if (data.skipped && data.skipped.length > 0) {
						this.skippedItems = data.skipped
						this.skippedDialogOpen = true
					} else {
						LeekWars.toast(this.$t('main.loadout_apply_success', [this.leek!.name]))
					}
					this.applyingItemsOnly = null
				}).error((e: any) => {
					LeekWars.toast(e)
					this.applyingItemsOnly = null
				})
			},
			confirmRestat() {
				if (!this.pendingApply) return
				this.restatDialogOpen = false
				this.doApply(this.pendingApply, true)
				this.pendingApply = null
			},
			applyWithoutStats() {
				if (!this.pendingApply) return
				const loadout = this.pendingApply
				this.restatDialogOpen = false
				this.pendingApply = null
				this.applyItemsOnly(loadout)
			},
			cancelRestat() {
				this.restatDialogOpen = false
				this.pendingApply = null
			},
			doApply(loadout: Loadout, useRestat: boolean) {
				if (!this.leek) return
				this.applying = loadout.id
				LeekWars.post('loadout/apply', { set_id: loadout.id, leek_id: this.leek.id, use_restat: useRestat }).then((data: any) => {
					this.leek!.weapons = data.leek.weapons
					this.leek!.chips = data.leek.chips
					this.leek!.components = data.leek.components
					if (data.stats_changed) {
						// Mise à jour des stats du leek + décrément potion côté store
						this.applyStatsLocally(loadout)
						this.decrementRestatPotion()
					}
					this.$emit('applied')
					if (data.skipped && data.skipped.length > 0) {
						this.skippedItems = data.skipped
						this.skippedDialogOpen = true
					} else {
						LeekWars.toast(this.$t('main.loadout_apply_success', [this.leek!.name]))
					}
					this.applying = null
				}).error((e: any) => {
					if (e && e.error === 'no_restat_potion') LeekWars.toast(this.$t('main.loadout_no_restat_potion'))
					else if (e && e.error === 'not_enough_capital') LeekWars.toast(this.$t('main.loadout_not_enough_capital'))
					else LeekWars.toast(e)
					this.applying = null
				})
			},
			statsDifferFromLeek(loadout: Loadout): boolean {
				if (!this.leek) return false
				const leek = this.leek as any
				const baseBonuses: { [k: string]: number } = {}
				for (const s of CHARACTERISTICS) baseBonuses[s] = leek[s] - baseStatFor(leek.level, s)
				for (const stat of CHARACTERISTICS) {
					const target = (loadout.stats && loadout.stats[stat]) || 0
					const current = statBonusToCapital(stat, baseBonuses[stat] || 0)
					if (target !== current) return true
				}
				return false
			},
			applyStatsLocally(loadout: Loadout) {
				if (!this.leek) return
				const leek = this.leek as any
				for (const stat of CHARACTERISTICS) {
					leek[stat] = baseStatFor(leek.level, stat)
					const cap = (loadout.stats && loadout.stats[stat]) || 0
					if (cap > 0) leek[stat] += capitalToStatBonus(stat, cap)
				}
			},
			decrementRestatPotion() {
				const farmer = store.state.farmer as any
				if (!farmer || !farmer.potions) return
				const p = farmer.potions.find((p: any) => p.template === 49)
				if (p) {
					p.quantity = Math.max(0, p.quantity - 1)
					if (p.quantity === 0) {
						const i = farmer.potions.indexOf(p)
						if (i !== -1) farmer.potions.splice(i, 1)
					}
				}
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
	display: flex; flex-direction: column; gap: 6px;
	padding: 8px 10px; border-radius: 6px; background: #f5f5f5;
}
body.dark .loadout-card { background: #2a2a2a; }
.loadout-header { display: flex; align-items: center; gap: 10px; }
.drag-handle { cursor: grab; color: #999; flex-shrink: 0; }
.drag-handle:active { cursor: grabbing; }
.sortable-ghost { opacity: 0.4; }
.sortable-chosen { background: #eaeaea; }
body.dark .sortable-chosen { background: #333; }
.loadout-icon {
	width: 28px; flex-shrink: 0;
	display: flex; align-items: center; justify-content: center;
}
.emoji-icon { font-size: 22px; line-height: 1; }
.emoji-icon :deep(img) { width: 24px; height: 24px; vertical-align: middle; }
.loadout-name {
	flex: 1; min-width: 0;
	font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	display: flex; align-items: center; gap: 6px;
}
.loadout-warning-icon { flex-shrink: 0; }
.loadout-preview { display: flex; gap: 12px; align-items: flex-start; }
.preview-col {
	display: flex; flex-wrap: wrap; gap: 3px; align-content: flex-start;
	min-width: 0;
}
.preview-col-stats {
	flex: 3;
	display: grid; grid-template-columns: repeat(4, minmax(44px, auto)); gap: 8px 12px;
	font-size: 12px;
	padding: 2px 0;
}
.preview-col-weapons { flex: 1; }
.preview-col-chips { flex: 6; }
.preview-col-components { flex: 2; }
.stat-badge { display: flex; align-items: center; gap: 2px; font-weight: 500; min-width: 0; }
.stat-badge img { flex-shrink: 0; }
.stat-badge span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
body.dark .stat-badge.frequency img { filter: invert(1); }
.preview-slot {
	width: 30px; height: 30px; flex-shrink: 0;
	:deep(span) { display: block; }
	:deep(.item) { width: 30px !important; height: 30px !important; box-sizing: border-box !important; }
}
.loadout-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.loadout-actions .v-btn[variant="text"] { opacity: 0.55; }
.loadout-actions .v-btn[variant="text"]:hover { opacity: 1; }
.already-equipped {
	display: inline-flex; align-items: center; gap: 4px;
	padding: 0 8px; font-size: 13px; color: #2d8a2d; font-weight: 500;
}
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
.section h4 { margin: 0; font-size: 13px; text-transform: uppercase; color: #888; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; min-height: 24px; }
.capital-used { font-weight: 400; color: #666; font-size: 12px; margin-left: 4px; }
.capital-used.warning { color: #e67e22; font-weight: 600; }
.capital-warning-icon { vertical-align: middle; margin-left: 4px; }
.invisible-btn { visibility: hidden; pointer-events: none; }
.skipped-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 4px; max-height: 400px; overflow-y: auto; }
.skipped-item { display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: 4px; background: #f5f5f5; }
body.dark .skipped-item { background: #2a2a2a; }
.skipped-item :deep(.item) { flex-shrink: 0; }
.skipped-info { flex: 1; min-width: 0; }
.skipped-name { font-weight: 600; font-size: 14px; }
.skipped-reason { font-size: 12px; color: #c0392b; }
.restat-confirm { display: flex; gap: 16px; align-items: center; padding: 12px; }
.restat-message { flex: 1; }
.restat-message p { margin: 0 0 6px; }
.restat-count { color: #2d8a2d; font-weight: 600; }
.restat-none { color: #c0392b; font-weight: 600; }
.action.disabled { opacity: 0.4; pointer-events: none; }
.action.compact { font-size: 15px !important; line-height: 1.2 !important; padding: 0 8px; }
.action.compact :deep(.v-icon) { font-size: 18px; }
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

@media screen and (max-width: 599px) {
	.loadout-header { flex-wrap: wrap; }
	.loadout-actions { width: 100%; justify-content: flex-end; }
	.loadout-preview { flex-direction: column; gap: 6px; }
	.preview-col-stats { grid-template-columns: repeat(3, minmax(44px, 1fr)); gap: 4px 8px; }
	.items-grid { grid-template-columns: 1fr; }
	.row-name-icon { flex-wrap: wrap; }
	.name-input { flex-basis: 100%; order: -1; }
}
</style>
