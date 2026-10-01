<template>
	<!-- Le menu reste ouvert quand on coche : on vient rarement n'en décocher
		qu'une seule, et le panneau se retrie derrière, sous les yeux. -->
	<v-menu :close-on-content-click="false" location="bottom end">
		<template #activator="{ props }">
			<div class="button flat" :title="t('filter')" v-bind="props">
				<v-icon>{{ hiddenList.length ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
			</div>
		</template>
		<div class="live-filter card">
			<div class="config-title">{{ t('filter') }}</div>
			<div v-for="category in LIVE_CATEGORIES" :key="category" v-ripple class="config-option" @click="toggle(category)">
				<v-icon class="check">{{ hiddenList.includes(category) ? 'mdi-checkbox-blank-outline' : 'mdi-checkbox-marked' }}</v-icon>
				<v-icon class="category-icon">{{ LIVE_CATEGORY_ICONS[category] }}</v-icon>
				{{ t('category_' + category) }}
			</div>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LIVE_CATEGORIES, LIVE_CATEGORY_ICONS, type LiveCategory, hiddenCategories, toggledCategories } from '@/component/live/live-filters'

	// Même namespace que le panneau qu'il filtre : le bouton est posé par la page
	// (accueil, équipe), mais les libellés appartiennent au panneau.
	defineOptions({ name: 'LiveFilterMenu', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('live')

	// Avec `hidden`, le menu règle le filtre d'UN panneau (un widget de l'accueil)
	// et le rend par `update:hidden` ; sans, il règle le filtre commun.
	const props = defineProps<{ hidden?: LiveCategory[] }>()
	const emit = defineEmits<{ 'update:hidden': [value: LiveCategory[]] }>()

	const hiddenList = computed(() => props.hidden ?? hiddenCategories.value)

	function toggle(category: LiveCategory) {
		const next = toggledCategories(hiddenList.value, category)
		if (props.hidden) emit('update:hidden', next)
		else hiddenCategories.value = next
	}
</script>

<style lang="scss" scoped>
	.live-filter {
		padding: 6px 0;
		min-width: 200px;
	}
	.config-title {
		padding: 6px 14px;
		font-weight: bold;
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.config-option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 14px;
		cursor: pointer;
	}
	.config-option:hover {
		background: var(--background-secondary);
	}
	.check {
		font-size: 20px;
		color: var(--primary);
	}
	.category-icon {
		font-size: 18px;
		color: var(--text-color-secondary);
	}
</style>
