<template lang="html">
	<!-- Toujours rendue, dans les trois onglets et meme sans piece posee : la colonne
	     garde sa place, sinon la forge se decale d'un onglet a l'autre (#622). -->
	<div class="forge-stats">
		<!-- Sans piece, la colonne garde sa largeur mais ne montre RIEN : un titre suivi
		     d'un rectangle vide donnait l'impression d'un panneau casse (#622). -->
		<template v-if="stats.length">
		<div class="title">{{ $t('characteristic.characteristics') }}</div>
		<div class="card">
			<div v-for="[carac, value] in stats" :key="carac" class="row" :class="{ altered: isAltered(carac), broken: delta(carac) < 0 }">
				<img class="ic" :src="'/image/charac/small/' + carac + '.png'">
				<span v-html="$t('characteristic.' + carac)"></span>
				<b class="value" :class="'color-' + carac">{{ value }}</b>
				<!-- Le delta pose par le joueur, signe comme dans l'infobulle de composant.
				     Toujours rendu, meme vide, pour que la colonne des totaux reste alignee. -->
				<span class="bonus" :class="{ ['color-' + carac]: delta(carac) > 0, negative: delta(carac) < 0 }">
					<template v-if="delta(carac)">{{ delta(carac) > 0 ? '+' : '−' }}{{ Math.abs(delta(carac)) }}</template>
				</span>
			</div>
			<!-- Charge investie sur capacite totale : c'est le budget d'alterations de la
			     piece, l'information qui decide de la prochaine tentative (#622). -->
			<div v-if="capacity > 0" class="row charge">
				<span>{{ $t('main.alteration_charge') }}</span>
				<b class="value" :class="{ deficit: charge < 0 }">
					<!-- Recette en cours : on annonce la charge qu'elle ferait ATTEINDRE, c'est
					     elle qui decide de la prochaine tentative, pas celle qu'on a (#622). -->
					<template v-if="pending">{{ charge }} <span class="arrow">&rarr;</span> <span class="target" :class="{ over: charge + pending > capacity }">{{ charge + pending }}</span></template>
					<template v-else>{{ charge }}</template>
					/ {{ capacity }}
				</b>
				<span class="bonus"></span>
			</div>
		</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { forgeComponent, forgePendingPower } from '@/model/forge-state'
	import { LeekWars } from '@/model/leekwars'
	import { addedPower, mergeStats } from '@/model/alteration'

	defineOptions({ name: 'ForgeStats' })

	// Stats a jour de la piece posee dans la forge : stats de base du component_template
	// fusionnees avec les alterations deja portees par l'instance (#622). forgeComponent.family
	// EST l'id de component_template (params), la cle de LeekWars.components.
	const stats = computed<[string, number][]>(() => {
		const c = forgeComponent.value
		if (!c) return []
		const base = (LeekWars.components[c.family]?.stats ?? []) as [string, number][]
		return mergeStats(base, c.stats) as [string, number][]
	})
	// Une carac que le joueur a lui-meme montee : il doit la reperer d'un coup d'oeil.
	const isAltered = (carac: string) => !!forgeComponent.value?.stats?.[carac]
	/** Delta porte par l'instance, signe : negatif si la casse a creuse la carac (#622). */
	const delta = (carac: string) => forgeComponent.value?.stats?.[carac] ?? 0

	// Capacite d'alteration de la piece, pre-calculee par le serveur (colonne ou formule).
	const capacity = computed(() => forgeComponent.value ? LeekWars.componentCapacity(forgeComponent.value.template) : 0)
	// Puissance de la recette posee dans la forge, arrondie comme la charge.
	const pending = computed(() => Math.round(forgePendingPower.value))
	// Charge investie, signee : negative sur une piece creusee par la casse (#622).
	const charge = computed(() => {
		const weights = LeekWars.alterations?.weights
		const stats = forgeComponent.value?.stats
		if (!weights || !stats) return 0
		return Math.round(addedPower(stats, weights))
	})
</script>

<style lang="scss" scoped>
	.forge-stats {
		width: 200px;
		flex-shrink: 0;
		// Rien a gauche : la forge est centree dans sa colonne et porte deja ses 10 px de
		// marge interne. Un padding ici doublait l'ecart a droite de la grille par rapport
		// a celui de gauche (#622).
		padding: 10px 10px 10px 0;
	}
	// Sur mobile les trois colonnes s'empilent : la carte n'a plus la forge a sa gauche
	// pour porter l'ecart, elle collait donc au bord de l'ecran (#622).
	#app.app .forge-stats {
		width: 100%;
		padding: 10px;
	}
	.title {
		font-size: 13px;
		font-weight: bold;
		color: var(--text-color-secondary);
		margin-bottom: 6px;
	}
	.card {
		// Pas de marge horizontale : le liseré des caracs alterees doit toucher le bord
		// de la carte, sinon il flotte a 4 px et ne se lit plus comme un bord (#622).
		padding: 4px 0;
		border-radius: 6px;
		background: var(--background-secondary);
		.row {
			display: flex;
			align-items: center;
			gap: 7px;
			padding: 4px 7px;
			font-size: 13px;
			& + .row { margin-top: 2px; }
			// Carac montee par le joueur : liseré vert a gauche, franc (pas de coin arrondi).
			&.altered { box-shadow: inset 3px 0 0 #5fad1b; }
			// Carac creusee par la casse : meme repere, dans le ton du palier negatif (#622).
			&.broken { box-shadow: inset 3px 0 0 #7d5a5a; }
		}
		.ic { width: 17px; height: 17px; }
		.value {
			margin-left: auto;
			font-variant-numeric: tabular-nums;
			font-weight: bold;
		}
		// Colonne de largeur fixe : elle reste vide sur les caracs natives, ce qui garde
		// les totaux alignes d'une ligne a l'autre.
		.bonus {
			flex: 0 0 36px;
			text-align: right;
			font-weight: bold;
			font-variant-numeric: tabular-nums;
			&.negative { color: #7d5a5a; }
		}
		// La charge se detache du bloc de caracs : c'est un budget, pas une stat.
		.charge {
			border-top: 1px solid var(--border);
			margin-top: 4px;
			padding-top: 7px;
			color: var(--text-color-secondary);
			.value { color: var(--text-color); }
			.value.deficit { color: #7d5a5a; }
			.arrow { color: var(--text-color-secondary); font-weight: normal; }
			// Charge visee par la recette en cours : en vert tant qu'elle rentre, en rouge
			// des qu'elle deborde la capacite.
			.target { color: #5fad1b; }
			.target.over { color: #c62828; }
		}
	}
</style>
