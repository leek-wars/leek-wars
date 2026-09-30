<template>
	<span class="metabolism-badge">{{ dose }}</span>
</template>

<script lang="ts" setup>
	/**
	 * Métabolisme RÉSOLU d'un composant (#12146) : le dosage qui l'amène à 100 %.
	 *
	 * Le badge n'existe que sur les pièces résolues. Sans lui, un joueur qui met la pièce de
	 * côté pour d'autres crafts doit re-sonder dosage par dosage ce qu'il avait déjà trouvé.
	 *
	 * En HAUT À GAUCHE de la vignette, comme le numéro d'une altération (alteration-icon) :
	 * c'est le même genre de chiffre — un dosage — et le coin bas droit est pris par la
	 * quantité, celui du bas par la charge. En vert, la couleur d'une mesure à 100 % dans
	 * l'historique des tentatives : le chiffre dit une énigme résolue, pas un réglage en
	 * cours.
	 *
	 * Le chiffre reste NU (aucune infobulle native) : c'est la fiche du composant qui le
	 * nomme, en toutes lettres et sur toutes les surfaces qui portent ce badge. Un `title`
	 * ici viendrait doubler cette fiche, qui s'ouvre au survol de la même vignette.
	 */
	defineProps<{
		/** Dosage optimal de l'instance, tel que renvoyé par le serveur. */
		dose: number
	}>()
</script>

<style lang="scss" scoped>
	// Pastille pleine, exactement celle de la quantité au coin opposé de la même vignette
	// (fond noir translucide, coin intérieur arrondi) : un chiffre à liseré se perdait dans
	// le dessin de la pièce. Sur un fond noir, une seule couleur suffit
	// pour les deux thèmes — le vert vif du jeu, qui dit l'énigme résolue.
	.metabolism-badge {
		position: absolute;
		top: 0;
		left: 0;
		padding: 1.5px 4.5px;
		border-bottom-right-radius: var(--radius);
		background: #000b;
		color: #7cff6b;
		font-size: 12px;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
		pointer-events: none;
		z-index: 2;
	}
</style>
