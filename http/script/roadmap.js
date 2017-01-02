LW.pages.roadmap.init = function(params, $scope, $page) {

	$scope.milestones = [
		{
			title: "Janvier 1.94",
			changes: [
				"Visualiser les anciens combats",
				"Dossiers dans l'éditeur",
				"Mail recap de toutes les mises à jour (mi-janvier)",
				"Fusion des compteurs de combats en un seul",
			]
		},
		{
			title: "Février 1.95",
			changes: [
				"Améliorer le profil éleveur (GitHub, site, description, ...)",
				"Plus d'options de test",
				"[secret][secondaire] nouvelle page sur le site",
				"[secret][secondaire] lié à la page combat"
			]
		},
		{
			title: "Mars 1.96",
			changes: [
				"Historiques de combat détaillés",
				"Codes LeekScript V2 dans l'éditeur + console LeekScript",
				"[secret][secondaire] lié à la page combat",
				"[secret][important] lié aux trophées"
			]
		},
		{
			title: "Avril 1.97",
			changes: [
				"Outil de recherche d'aide globale",
				"Meilleure recherche dans le forum",
				"[secret][important] lié au gameplay"
			]
		},
		{
			title: "Mai 1.98",
			changes: [
				"LeekScript V2 Bêta",
				"Refonte graphique légère (mobile en particulier)",
				"[secret][important] lié aux combats de team"
			]
		},
		{
			title: "Juin 1.99",
			changes: [
				"1er boss"
			]
		},
		{
			title: "Juillet 2.00",
			changes: [
				"Sortie finale du LeekScript V2"
			]
		},
		{
			title: "Août 2.01",
			changes: [
				"[secret][important] lié au gameplay"
			]
		},
		{
			title: "Septembre 2.02",
			changes: [
				"Nouvelles puces tactiques",
				"1 ou 2 nouveaux boss (liés aux nouvelles puces)"
			]
		},
		{
			title: "Octobre 2.03",
			changes: [
				"[secret][important] lié au gameplay"
			]
		},
		{
			title: "Novembre 2.04",
			changes: []
		},
		{
			title: "Décembre 2.05",
			changes: []
		}
	]

	LW.setTitle(_.lang.get('roadmap', 'title'))

	this.render()
}
