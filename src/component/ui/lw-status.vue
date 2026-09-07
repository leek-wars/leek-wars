<template>
	<span class="lw-status" :class="online ? 'online' : 'offline'" :title="title" role="img" :aria-label="title"></span>
</template>

<script setup lang="ts">
	// Témoin de présence (en ligne / hors ligne) à côté d'un nom. Remplace les
	// PNG `connected.png` / `disconnected.png`, un rond qui ne suivait ni le
	// thème ni la couleur de marque (demande de Pierre, 2026-09-07 : « remplacer
	// ce rond d'activité par un nouvel élément dans le thème »).
	defineOptions({ name: 'LWStatus' })

	defineProps<{
		online: boolean
		title?: string
	}>()
</script>

<style lang="scss" scoped>
	// v2 : le rond des PNG, à leurs couleurs exactes (#9bec00 / #cacaca mesurées
	// au centre des images), pour ne rien changer au design historique.
	.lw-status {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		vertical-align: middle;
		margin-right: 6px;
		background: #cacaca;
		&.online {
			background: #9bec00;
		}
	}
	// v3 : une LED carrée. En ligne, l'aplat de marque et son halo — une
	// émission de lumière, ce qu'un témoin allumé est précisément, pas une
	// ombre. Hors ligne, la case est creuse : le trait fort, rien dedans.
	body:not(.v2) .lw-status {
		width: 8px;
		height: 8px;
		border-radius: 0;
		box-sizing: border-box;
		background: transparent;
		border: 1px solid var(--border-strong);
		&.online {
			background: var(--primary-surface);
			border-color: var(--primary-surface);
			box-shadow: 0 0 6px color-mix(in srgb, var(--primary-surface) 70%, transparent);
		}
	}
</style>
