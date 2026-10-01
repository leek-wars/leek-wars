<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="inventory" fallback="mdi-gift-outline" />
				<div class="page-title-text">
					<h1>{{ $t('title') }}</h1>
				</div>
			</div>
		</div>
		<panel icon="mdi-gift-outline" :title="$t('distribute')">
			<template #content>
				<loader v-if="!loaded" />
				<div v-else-if="!reserves.length" class="empty">{{ $t('no_reserve') }}</div>
				<div v-else class="reserve">
					<div class="stocks">
						<div v-for="r in reserves" :key="r.template" v-ripple class="stock" :class="{selected: r.template === template}" @click="template = r.template">
							<img v-if="LeekWars.items[r.template]" :src="itemImageUrl(LeekWars.items[r.template])" class="stock-image">
							<div>
								<div class="stock-name">{{ itemName(r.template) }}</div>
								<div class="stock-count">{{ $t('remaining', [LeekWars.formatNumber(r.quantity)]) }}</div>
							</div>
						</div>
					</div>
					<p class="hint">{{ $t('hint') }}</p>
					<v-textarea v-model="list" :label="$t('list')" :placeholder="$t('list_placeholder')" rows="8" variant="outlined" hide-details class="list" />
					<v-text-field v-model="message" :label="$t('message')" :placeholder="$t('message_placeholder')" counter="200" maxlength="200" variant="outlined" class="message" />
					<div class="summary">
						<span v-if="parsed.errors.length" class="error">{{ $t('invalid_lines') }} {{ parsed.errors.join(', ') }}</span>
						<span v-else-if="parsed.gifts.length">{{ $t('summary', [parsed.gifts.length, total, available - total]) }}</span>
						<div class="spacer"></div>
						<v-btn color="primary" :disabled="!canGive" :loading="giving" @click="give">{{ $t('give') }}</v-btn>
					</div>
					<div v-if="error" class="error">{{ error }}</div>
					<!-- Distributions finies : l'organisateur garde tout le reste d'un coup, en
					     remerciement. Le don à soi-même reste refusé par la distribution. -->
					<div v-if="available > 0" class="keep">
						<span class="hint">{{ $t('keep_hint') }}</span>
						<v-btn variant="text" @click="keepDialog = true">{{ $t('keep') }}</v-btn>
					</div>
				</div>
			</template>
		</panel>
		<popup v-model="keepDialog" :width="460" icon="mdi-gift-outline" :title="$t('keep_title')">
			<div class="keep-confirm">{{ $t('keep_confirm', [LeekWars.formatNumber(available), itemName(template)]) }}</div>
			<template #actions>
				<div v-ripple class="action" @click="keepDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="action green" @click="keep">{{ $t('keep') }}</div>
			</template>
		</popup>
		<panel v-if="gifts.length" icon="mdi-history" :title="$t('history')">
			<template #content>
				<div class="history">
					<div v-for="(g, i) in gifts" :key="i" class="gift">
						<span class="date">{{ LeekWars.formatDateTime(g.date) }}</span>
						<router-link :to="'/farmer/' + g.farmer" class="name">{{ g.name }}</router-link>
						<span class="quantity">{{ itemName(g.template) }} × {{ g.quantity }}</span>
						<span class="gift-message">{{ g.message }}</span>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { itemImageUrl, itemTranslationKey } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { i18n, mixins, useNamespacedT } from '@/model/i18n'
	import { computed, ref } from 'vue'

	defineOptions({ name: 'Reserve', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('reserve')

	interface ReserveStock { template: number, quantity: number }
	interface Gift { farmer: number, name: string, template: number, quantity: number, message: string, date: number }

	const MAX_QUANTITY = 1000
	const MAX_RECIPIENTS = 100

	const loaded = ref(false)
	const reserves = ref<ReserveStock[]>([])
	const gifts = ref<Gift[]>([])
	const template = ref(0)
	const list = ref('')
	const message = ref('')
	const giving = ref(false)
	const error = ref('')
	const keepDialog = ref(false)
	const keeping = ref(false)

	LeekWars.setTitle(t('title'))

	function load() {
		LeekWars.get<{ reserves: ReserveStock[], gifts: Gift[] }>('resource-reserve/get').then(data => {
			reserves.value = data.reserves
			gifts.value = data.gifts
			if (!reserves.value.some(r => r.template === template.value) && reserves.value.length) {
				template.value = reserves.value[0].template
			}
			loaded.value = true
		})
	}
	load()

	function itemName(id: number) {
		const item = LeekWars.items[id]
		return item ? i18n.t(itemTranslationKey(item)) as string : '#' + id
	}

	// Une ligne par joueur : « pseudo quantité ». Sans quantité, une seule. Espaces, tabulations,
	// deux-points, points-virgules, virgules et « = » séparent indifféremment le pseudo du nombre.
	const parsed = computed(() => {
		const result: [string, number][] = []
		const errors: string[] = []
		for (const raw of list.value.split('\n')) {
			const line = raw.trim()
			if (!line) continue
			const match = line.match(/^(.+?)(?:[\s:;,=]+(\d+))?$/)
			const name = match ? match[1].replace(/[\s:;,=]+$/, '') : ''
			const quantity = match && match[2] !== undefined ? parseInt(match[2], 10) : 1
			if (!name || /\s/.test(name) || quantity < 1 || quantity > MAX_QUANTITY) {
				errors.push(line)
			} else {
				result.push([name, quantity])
			}
		}
		if (result.length > MAX_RECIPIENTS) errors.push(t('too_many', [MAX_RECIPIENTS]))
		return { gifts: result, errors }
	})

	const total = computed(() => parsed.value.gifts.reduce((sum, [, quantity]) => sum + quantity, 0))
	const available = computed(() => reserves.value.find(r => r.template === template.value)?.quantity ?? 0)
	const canGive = computed(() => !giving.value && parsed.value.gifts.length > 0 && !parsed.value.errors.length && total.value <= available.value)

	function give() {
		if (!canGive.value) return
		giving.value = true
		error.value = ''
		LeekWars.post<{ given: { name: string, quantity: number }[], remaining: number }>('resource-reserve/give', {
			template: template.value,
			gifts: parsed.value.gifts,
			message: message.value,
		}).then(data => {
			LeekWars.toast(t('given', [data.given.length, data.given.reduce((sum, g) => sum + g.quantity, 0)]))
			list.value = ''
			load()
		}).error((e: { error: string, names?: string[], name?: string, needed?: number, available?: number, max?: number }) => {
			if (e.error === 'unknown_farmers') error.value = t('error_unknown_farmers') + ' ' + (e.names ?? []).join(', ')
			else if (e.error === 'own_account' || e.error === 'invalid_gift') error.value = t('error_' + e.error) + ' ' + (e.name ?? '')
			else if (e.error === 'not_enough') error.value = t('error_not_enough', [e.needed ?? total.value, e.available ?? 0])
			else if (e.error === 'too_many_recipients') error.value = t('too_many', [e.max ?? MAX_RECIPIENTS])
			else error.value = t('error_other') + ' (' + e.error + ')'
		}).finally(() => { giving.value = false })
	}

	function keep() {
		if (keeping.value) return
		keeping.value = true
		error.value = ''
		LeekWars.post<{ kept: number }>('resource-reserve/keep', { template: template.value }).then(data => {
			LeekWars.toast(t('kept', [LeekWars.formatNumber(data.kept), itemName(template.value)]))
			load()
		}).error((e: { error: string }) => {
			error.value = e.error === 'empty_reserve' ? t('error_empty_reserve') : t('error_other') + ' (' + e.error + ')'
		}).finally(() => {
			keeping.value = false
			keepDialog.value = false
		})
	}
</script>

<style lang="scss" scoped>
	.empty, .hint {
		color: var(--text-color-secondary);
	}
	.empty {
		padding: 20px;
		text-align: center;
	}
	.reserve {
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.stocks {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.stock {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 14px 8px 8px;
		border: 1px solid var(--border);
		cursor: pointer;
		&.selected {
			border-color: var(--primary);
		}
	}
	.stock-image {
		width: 48px;
		height: 48px;
		object-fit: contain;
	}
	.stock-name {
		font-weight: 500;
	}
	.stock-count {
		color: var(--text-color-secondary);
	}
	.hint {
		margin: 0;
	}
	.summary {
		display: flex;
		align-items: center;
		gap: 10px;
		.spacer {
			flex: 1;
		}
	}
	.error {
		color: var(--error, #d32f2f);
		white-space: pre-wrap;
	}
	.keep {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px 10px;
		padding-top: 10px;
		border-top: 1px solid var(--border);
		.hint {
			flex: 1;
			min-width: 200px;
		}
	}
	.keep-confirm {
		line-height: 1.5;
	}
	.history {
		padding: 6px 10px;
	}
	.gift {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		padding: 5px 0;
		border-bottom: 1px solid var(--border);
		&:last-child {
			border-bottom: none;
		}
		.date {
			color: var(--text-color-secondary);
		}
		.name {
			font-weight: 500;
		}
		.gift-message {
			color: var(--text-color-secondary);
			font-style: italic;
		}
	}
</style>
