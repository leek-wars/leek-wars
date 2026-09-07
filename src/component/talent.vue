<template lang="html">
	<v-tooltip :disabled="!label && !max_talent">
		<template #activator="{ props: tp }">
			<span class="talent" v-bind="tp" @click.stop="LeekWars.goToRanking(category, 'talent', id)">
				<div v-ripple class="icon">
					<img src="/image/talent.png" alt="">
				</div>
				<div v-ripple class="value">{{ LeekWars.formatNumber(talent) }}</div>
			</span>
		</template>
		<div v-if="label">{{ label }}</div>
		<div v-if="max_talent">{{ $t('main.max_talent', [LeekWars.formatNumber(max_talent)]) }}</div>
	</v-tooltip>
</template>

<script setup lang="ts">
defineOptions({ name: 'Talent' })

defineProps<{
	talent: number | string
	max_talent?: number
	label?: string
	id: number
	category: string
	on?: Record<string, unknown>
}>()
</script>

<style lang="scss" scoped>
	span {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}
	.icon {
		z-index: 2;
		display: inline-block;
		width: 34px;
		height: 34px;
		padding: 5px;
		padding-top: 4px;
		padding-bottom: 6px;
		border-radius: 50%;
		background: var(--pure-white);
		box-shadow: var(--elevation-1);
	}
	/* v3 : UNE boîte, comme les compteurs de la barre du haut (« topstat » du
	   mockup) — le disque chevauchant une pilule était la silhouette du v2
	   traduite trait pour trait, deux boîtes accolées avec un chevauchement
	   négatif (Pierre, 2026-09-07 : « moderniser le composant talent »). L'icône
	   est un asset, pas une encre : elle garde ses couleurs ; c'est la coquille
	   qui substitue le SVG à plat au PNG (`img[src="/image/talent.png"]`).
	   Cliquable (il mène au classement) : le trait passe au vert de marque au
	   survol, comme les autres commandes. */
	body:not(.v2) {
		span.talent {
			gap: 6px;
			padding: 3px 10px 3px 6px;
			background: var(--background-header);
			border: 1px solid var(--border-strong);
			transition: border-color .12s ease;
			&:hover {
				border-color: var(--primary);
			}
		}
		.icon {
			width: auto;
			height: auto;
			padding: 0;
			border: none;
			border-radius: 0;
			background: none;
			box-shadow: none;
			display: flex;
		}
		.value {
			margin: 0;
			padding: 0;
			border: none;
			border-radius: 0;
			background: none;
			box-shadow: none;
			font-size: 16px;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}
		img {
			width: 20px;
			height: 20px;
		}
	}
	img {
		width: 24px;
		height: 24px;
	}
	.value {
		display: inline-block;
		margin-left: -8px;
		background: var(--pure-white);
		font-size: 18px;
		padding: 3px 10px;
		padding-left: 14px;
		font-weight: 500;
		box-shadow: var(--elevation-1);
		border-top-right-radius: 14px;
		border-bottom-right-radius: 14px;
	}
</style>