<template>
	<div class="item-history">
		<loader v-if="loading && !entries.length" />
		<div v-else-if="!entries.length" class="empty">{{ $t('main.history_empty') }}</div>
		<div v-else class="entries">
			<div v-for="entry in entries" :key="entry.id" class="entry">
				<div class="line">
					<img v-if="entry.template" class="thumb" :src="thumbUrl(entry.template)" :alt="itemName(entry.template)">
					<div class="body">
						<div class="head">
							<span class="name">{{ itemName(entry.template) }}</span>
							<span class="date">{{ formatDate(entry.date) }}</span>
						</div>

						<!-- Craft : ce qui a ete fabrique. -->
						<div v-if="entry.action === CRAFT && entry.details" class="detail">
							{{ $t('main.history_crafted', [entry.details.quantity || 1]) }}
						</div>

						<!-- Alteration : le resultat par carac, le dosage et la synergie. -->
						<template v-else-if="entry.action === ALTER && entry.details">
							<div class="rolls">
								<span v-for="r in entry.details.results" :key="r.carac" class="roll" :class="{ok: r.success}">
									<img class="ci" :src="'/image/charac/small/' + r.carac + '.png'">
									<template v-if="r.success">+{{ r.points }}</template>
									<template v-else>✕</template>
								</span>
							</div>
							<div class="detail sub">
								<span>{{ $t('main.alteration_dose') }} {{ entry.details.dose }}</span>
								<span v-if="entry.details.synergy > 1" class="synergy" :class="'s' + entry.details.synergy">
									{{ entry.details.synergy === 3 ? $t('main.synergy_perfect') : $t('main.synergy_good') }}
								</span>
								<span v-if="entry.details.broken" class="broken">
									<v-icon size="14">mdi-heart-broken</v-icon>
									-{{ entry.details.broken.lost }}
								</span>
							</div>
						</template>

						<!-- Destruction : ce que le recyclage a rendu. -->
						<div v-else-if="entry.action === DESTROY && entry.details" class="detail rendered">
							<template v-if="entry.details.count > 0">
								<span v-for="(count, id) in entry.details.alterations" :key="id" class="rendered-item">
									<img class="ci" :src="alterationThumb(Number(id))" :alt="alterationName(Number(id))">
									<template v-if="count > 1">×{{ count }}</template>
								</span>
							</template>
							<span v-else class="nothing">{{ $t('main.destroy_nothing') }}</span>
						</div>
					</div>
				</div>
			</div>
			<div v-if="entries.length < total" class="more">
				<v-btn variant="text" size="small" :loading="loading" @click="loadMore">{{ $t('main.load_more') }}</v-btn>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { t } from '@/model/i18n'

	/**
	 * Historique d'atelier (#622), filtre par type d'action. Lit item-history/get-all,
	 * pagine a la demande. Le serveur a depose dans `details` ce qui caracterise chaque
	 * action ; ce composant se contente de le mettre en forme.
	 */
	const CRAFT = 1
	const ALTER = 2
	const DESTROY = 3

	const props = defineProps<{
		/** 1 craft, 2 alteration, 3 destruction. */
		action: number
	}>()

	interface Entry {
		id: number
		action: number
		template: number | null
		item: number | null
		details: any
		date: number
	}

	const entries = ref<Entry[]>([])
	const total = ref(0)
	const page = ref(0)
	const loading = ref(false)

	function formatDate(ts: number): string {
		return LeekWars.formatDateTime(ts)
	}
	function itemName(template: number | null): string {
		if (!template) return ''
		const item = LeekWars.items[template]
		return item ? t('component.' + item.name) : '#' + template
	}
	function thumbUrl(template: number): string {
		const item = LeekWars.items[template]
		return item ? '/image/component/' + item.name + '.png' : ''
	}
	function alteration(id: number) {
		return LeekWars.alterations ? LeekWars.alterations.alterations[id] : null
	}
	function alterationThumb(id: number): string {
		const a = alteration(id)
		return a ? '/image/alteration/' + a.name + '.png' : ''
	}
	function alterationName(id: number): string {
		const a = alteration(id)
		return a ? t('alteration.' + a.name) : ''
	}

	function load(reset: boolean) {
		if (loading.value) return
		loading.value = true
		if (reset) {
			entries.value = []
			page.value = 0
		}
		const next = page.value + 1
		LeekWars.get<{ history: Entry[], total: number, page: number }>('item-history/get-all/' + props.action + '/' + next).then(data => {
			entries.value = reset ? data.history : entries.value.concat(data.history)
			total.value = data.total
			page.value = data.page
		}).finally(() => { loading.value = false })
	}
	function loadMore() {
		load(false)
	}

	onMounted(() => load(true))
	// Changer d'onglet recharge l'historique du bon type.
	watch(() => props.action, () => load(true))
</script>

<style lang="scss" scoped>
	.item-history {
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 20px;
		text-align: center;
		color: var(--text-color-secondary);
	}
	.entry {
		border-bottom: 1px solid var(--border);
	}
	.line {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
	}
	.thumb {
		width: 34px;
		height: 34px;
		flex: 0 0 auto;
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.name { font-weight: bold; }
	.date {
		font-size: 12px;
		color: var(--text-color-secondary);
		white-space: nowrap;
	}
	.detail {
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.detail.sub {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.rolls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 2px 0;
	}
	.roll {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.roll.ok { color: #2e7d32; font-weight: bold; }
	.ci { width: 15px; height: 15px; }
	.synergy { font-weight: bold; }
	.synergy.s2 { color: #0097a7; }
	.synergy.s3 { color: #f9a825; }
	.broken { color: #c62828; display: inline-flex; align-items: center; gap: 2px; }
	.rendered {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.rendered-item { display: inline-flex; align-items: center; gap: 1px; }
	.nothing { font-style: italic; }
	.more { text-align: center; padding: 6px; }
</style>
