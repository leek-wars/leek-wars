<template lang="html">
	<!-- Toujours rendue, dans les trois onglets et meme sans piece posee : la colonne
	     garde sa place, sinon la forge se decale d'un onglet a l'autre (#622). -->
	<div class="forge-stats">
		<!-- Sans piece, la colonne garde sa largeur mais ne montre RIEN : un rectangle vide
		     donnait l'impression d'un panneau casse (#622). Pas de titre non plus : les
		     icones de carac disent deja ce que la carte contient (demande de Pierre). -->
		<template v-if="stats.length">
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
					<!-- Recette en cours : on affiche directement la charge qu'elle ferait
					     ATTEINDRE, c'est elle qui decide de la prochaine tentative. La couleur
					     suffit a dire que le chiffre est une projection (#622). -->
					<span v-if="pending" class="target" :class="{ over: charge + pending > capacity }">{{ charge + pending }}</span>
					<template v-else>{{ charge }}</template>
					/ {{ capacity }}
				</b>
				<span class="bonus"></span>
			</div>
		</div>
		<!-- La tentative en cours, SOUS les stats qu'elle vise : dosage et gains d'abord
		     (ce qu'elle apporte), puis le risque de casse et le cout (ce qu'elle coute).
		     Ces quatre lignes etaient au-dessus et en dessous de la forge (demande de Pierre).
		     La carte est TOUJOURS rendue des qu'une piece est posee, et seulement masquee
		     tant qu'aucune alteration ne l'est : sa place est ainsi reservee et la colonne
		     ne change pas de hauteur a la premiere alteration (demande de Pierre). Reserver
		     par la structure reelle et non par une hauteur en dur : les quatre lignes
		     portent le meme texte dans les deux etats, seuls les chiffres changent. -->
		<div class="card preview" :class="{ empty: !preview }">
			<div class="row dose-row">
				<span>{{ $t('main.alteration_dose') }}</span>
				<b class="chance">{{ preview ? preview.dose : 0 }}</b>
			</div>
			<div class="row gains">
				<!-- Les gains sont tronques par une ellipse plutot que renvoyes a la ligne :
				     une recette peut viser six caracs, et la colonne est etroite. -->
				<div class="gains-list">
					<template v-for="(roll, carac) in (preview ? preview.rolls : {})" :key="carac">
						<img class="ic" :src="'/image/charac/small/' + carac + '.png'">
						<span class="gain" :class="'color-' + carac">+{{ roll.points }}</span>
					</template>
				</div>
				<!-- Loader tant que le serveur calcule la vraie proba (gate inclus).
				     Le loader maison plutot que le disque Vuetify : c'est celui du reste du
				     site (carre en v3, cercle en v2) et il tient dans la hauteur de la
				     ligne, sans pousser ce qui suit vers le bas (retour de Pierre). -->
				<b class="chance">
					<loader v-if="preview && preview.loading" :size="12" />
					<template v-else>{{ percent(preview ? preview.probability : 0) }}</template>
				</b>
			</div>
			<!-- Toujours affichee, meme a 0 : « aucun risque » est une information en soi (#622). -->
			<div class="row risk">
				<v-icon size="16">mdi-alert</v-icon>
				<span>{{ $t('main.alteration_break_risk') }}</span>
				<b class="chance">{{ percent(preview ? preview.breakRisk : 0) }}</b>
			</div>
			<div class="row cost">
				<span>{{ $t('main.alteration_cost') }}</span>
				<b class="chance">{{ $filters.number(preview ? preview.habsCost : 0) }}<span class="hab"></span></b>
			</div>
		</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { forgeComponent, forgePendingPower, forgePreview } from '@/model/forge-state'
	import { LeekWars } from '@/model/leekwars'
	import { addedPower, mergeStats } from '@/model/alteration'
	import { t } from '@/model/i18n'

	defineOptions({ name: 'ForgeStats' })

	/** Tentative en cours, publiee par la forge (null tant qu'aucune alteration n'est posee). */
	const preview = forgePreview

	/**
	 * Pourcentage d'une chance, avec TOUJOURS deux chiffres significatifs (#622).
	 *
	 * Une chance minuscule n'est pas une chance nulle : le metabolisme peut laisser
	 * passer une tentative a 0,004 %, et l'afficher « 0 % » la faisait passer pour
	 * interdite. Deux chiffres et non un seul, parce que « 0,1 % » ne dit pas si l'on
	 * est a 0,12 ou a 0,19 : sur ces ordres de grandeur c'est un facteur deux sur le
	 * nombre de tentatives a prevoir. Zero, lui, est un vrai mur (gate du metabolisme ou
	 * plafond souple depasse) : il s'annonce en toutes lettres.
	 */
	function percent(p: number): string {
		if (p <= 0) return t('main.alteration_impossible')
		const v = p * 100
		// Espace INSECABLE avant le %, comme le veut l'usage : dans une colonne etroite,
		// « 0.33 % » se coupait en deux lignes et faisait grandir la carte (retour de Pierre).
		// 9,95 et non 10 : au-dela, une decimale afficherait « 10.0 % ».
		if (v >= 9.95) return Math.round(v) + '\u00a0%'
		const digits = Math.min(10, Math.max(0, Math.ceil(-Math.log10(v))) + 1)
		return v.toFixed(digits) + '\u00a0%'
	}

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
	.card {
		// Pas de marge horizontale : le liseré des caracs alterees doit toucher le bord
		// de la carte, sinon il flotte a 4 px et ne se lit plus comme un bord (#622).
		padding: 4px 0;
		border-radius: var(--radius-medium);
		background: var(--background-secondary);
		.row {
			display: flex;
			align-items: center;
			gap: 7px;
			padding: 4px 7px;
			font-size: 13px;
			& + .row { margin-top: 2px; }
			// Carac montee par le joueur : liseré vert a gauche, franc (pas de coin
			// arrondi), et la ligne entiere legerement teintee (demande de Pierre).
			&.altered {
				box-shadow: inset 3px 0 0 var(--primary);
				background: color-mix(in srgb, var(--primary) 9%, transparent);
			}
			// Carac creusee par la casse : meme repere, dans le ton du palier negatif (#622).
			&.broken { box-shadow: inset 3px 0 0 #7d5a5a; }
		}
		.ic { width: 17px; height: 17px; }
	// Icones de carac eclaircies en sombre, la recette du HUD de combat
	// (entity-details) : la science bleu nuit disparaissait sur le panneau.
	body.dark & .ic { filter: brightness(180%); }
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
			// Charge visee par la recette en cours : en vert tant qu'elle rentre, en rouge
			// des qu'elle deborde la capacite.
			.target { color: var(--primary); }
			.target.over { color: #c62828; }
		}
	}
	// Carte de la tentative en cours, juste sous celle des caracteristiques : meme fond
	// et meme trame de lignes, pour qu'elles se lisent comme deux blocs d'un meme panneau.
	.card.preview {
		margin-top: 8px;
		// Hauteurs figees : elles rendent chaque ligne independante de son contenu, donc
		// la carte fait exactement la meme hauteur vide (place reservee) que remplie, et
		// le loader de probabilite ne la fait pas respirer non plus.
		.row {
			padding: 3px 7px;
			min-height: 22px;
			// Meme boite de ligne pour le libelle, l'icone et la valeur. Sans elle, le
			// libelle prenait la hauteur naturelle de sa police pendant que .chance
			// etait cale sur ses 17 px : deux boites de hauteurs differentes, centrees
			// chacune de son cote, et les deux textes finissaient decales d'un pixel
			// (retour de Pierre).
			line-height: 17px;
		}
		// Liste des gains : une seule ligne, tronquee a l'ellipse, la colonne etant etroite.
		// Hauteur FIXE (avec overflow: hidden) et non minimale : une icone de carac en ligne
		// fabrique une boite de ligne de hauteur imprevisible, qui decalerait la carte d'un
		// ou deux pixels entre l'etat vide et l'etat rempli.
		.gains-list {
			flex: 1 1 auto;
			min-width: 0;
			height: 23px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			.ic { vertical-align: middle; }
			.gain { margin: 0 7px 0 3px; }
		}
		.gains .chance { flex: 0 0 auto; padding-left: 4px; }
		.chance {
			margin-left: auto;
			font-variant-numeric: tabular-nums;
			font-weight: bold;
			// Boite de hauteur figee, alignee au milieu : le loader et le pourcentage qui
			// le remplace n'occupent pas la meme boite en ligne, et la difference poussait
			// tout ce qui suit vers le bas (retour de Pierre).
			display: inline-flex;
			align-items: center;
			min-height: 17px;
			// Le loader maison est prevu pour une page vide : il porte 30 px de marge
			// interne et une boite de ligne. Ici il remplace un chiffre, il ne doit
			// mesurer QUE ses 12 px.
			:deep(.loader) {
				display: flex;
				padding: 0;
				margin: 0;
				line-height: 0;
			}
			// La valeur ne se coupe jamais : le libelle a gauche se replie, pas le chiffre.
			// (Le % tient a son nombre par un insecable ; ceci protege aussi le cout, dont
			// l'icone Habs est un element a part.)
			white-space: nowrap;
		}
		// Le dosage se detache du bloc de jets : c'est le reglage, pas un gain.
		.dose-row {
			border-bottom: 1px solid var(--border);
			margin-bottom: 3px;
			padding-bottom: 5px;
		}
		.risk {
			color: #c62828;
			background: rgba(198, 40, 40, 0.10);
		}
		// Le cout se detache du bloc de jets : c'est une depense, pas un gain.
		.row + .row.cost {
			color: var(--text-color-secondary);
			border-top: 1px solid var(--border);
			margin-top: 3px;
			padding-top: 5px;
		}
		// Icone habs a cote du cout : petite, calee sur le texte (#622).
		.hab {
			width: 14px;
			height: 14px;
			background-size: 14px;
			margin-left: 3px;
			vertical-align: -2px;
		}
		// Aucune alteration posee : la carte n'a rien a annoncer, mais elle garde sa place
		// (visibility et non display : c'est toute la reservation).
		&.empty { visibility: hidden; }
	}
</style>
