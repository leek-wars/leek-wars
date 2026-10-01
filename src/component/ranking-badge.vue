<template lang="html">
	<span v-ripple class="badge" :class="{first: ranking === 1, second: ranking === 2, third: ranking === 3, ten: ranking <= 10, cent: ranking <= 100}" @click.stop.prevent="LeekWars.goToRanking(category, 'talent', id)">
		<v-icon>mdi-chevron-triple-up</v-icon>
		<span class="value">{{ ranking }}</span>
	</span>
</template>

<script setup lang="ts">
defineOptions({ name: 'RankingBadge' })

defineProps<{
	ranking: number
	id: number
	category: string
}>()
</script>

<style lang="scss" scoped>
	.badge {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		margin: 0 7px;
		font-size: 16px;
		padding: 3px 4px;
		font-weight: 500;
		border-radius: var(--radius-tiny);
		border: 1px solid var(--border);
		.v-icon {
			font-size: 21px;
		}
		.value {
			flex: 1;
			text-align: center;
			padding-left: 2px;
			padding-right: 5px;
		}
		&.cent {
			box-shadow: var(--elevation-1);
			background: var(--pure-white);
			font-size: 18px;
			border: none;
		}
		&.ten {
			background: linear-gradient(0deg, var(--black), var(--grey-9));
			color: var(--white);
			padding: 1px 2px;
		}
		&.first {
			background: linear-gradient(0deg, #ffb029, #ffdc3a);
			border: 1px solid #ffb430;
			color: var(--white);
			font-weight: bold;
			text-shadow: 1.5px 0 0 #ff9b29, -1.5px 0 0 #ffb029, 0 1.5px 0 #ffb029, 0 -1.5px 0 #ffb029;
		}
		&.second {
			background: linear-gradient(0deg, #b1b1b1, var(--grey-12));
			border: 1px solid #a0a0a0;
			color: var(--white);
			font-weight: bold;
			text-shadow: 1.5px 0 0 #909090, -1.5px 0 0 #909090, 0 1.5px 0 #909090, 0 -1.5px 0 #909090;
		}
		&.third {
			background: linear-gradient(0deg, #ae4e00, #ff7300);
			border: 1px solid #ae4e00;
			color: var(--white);
			font-weight: bold;
			text-shadow: 1.5px 0 0 #ae4e00, -1.5px 0 0 #ae4e00, 0 1.5px 0 #ae4e00, 0 -1.5px 0 #ae4e00;
		}
	}
	/* v3 : le badge suit partout la boîte de talent, qui mène au même
	   classement — même gabarit (24 px, chiffre en 14 px demi-gras) et même jeu
	   au survol et au clic, le ripple étant coupé.
	   Le palier 11-100 était un aplat `--pure-white` détaché par une ombre
	   Material ; en v3 ce blanc vaut la surface du panneau et l'ombre est
	   coupée : il ne restait que le texte, moins visible que le palier 101-1000
	   et son trait. Il prend la surface et le trait fort de la
	   boîte de talent, le 101-1000 garde son trait léger. Top 10 et podium
	   gardent leurs aplats.
	   Aligné comme la boîte de talent, sur la ligne de base : les infobulles
	   calaient l'ancien badge au bas de la ligne, ce qui décroche un badge
	   encadré de la boîte voisine.
	   Spécificité 0,3,1 (`:where` ne compte pas) : au-dessus de ces calages
	   d'infobulle (0,2,0 et 0,3,0), en dessous du widget « Mes poireaux » qui
	   resserre le badge à 13 px (0,4,0) et doit continuer de l'emporter. */
	body:not(.v2) .badge:where(:not(.ten)) {
		vertical-align: baseline;
		margin-bottom: 0;
		gap: 5px;
		padding: 1px 8px 1px 5px;
		font-size: 14px;
		font-weight: 600;
		line-height: 20px;
		font-variant-numeric: tabular-nums;
		transition: border-color .12s ease, color .12s ease;
		.v-icon {
			font-size: 20px;
		}
		.value {
			padding: 0;
		}
		&.cent {
			background: var(--background-header);
			border: 1px solid var(--border-strong);
		}
		&:hover {
			border-color: var(--text-color);
		}
		&:active {
			border-color: var(--primary);
			color: var(--primary);
		}
	}
</style>