LW.pages.roadmap.init = function(params, $scope, $page) {

	$scope.milestones = [
		{
			title: "Janvier 1.94",
			changes: [
				{text: "Visualiser les anciens combats", ok: true},
				{text: "Dossiers dans l'éditeur", ok: true},
				{text: "Mail recap de toutes les mises à jour", ok: false},
				{text: "Fusion des compteurs de combats en un seul", ok: true}
			]
		},
		{
			title: "Février 1.95",
			changes: [
				{text: "Améliorer le profil éleveur (GitHub, site, description, ...)", ok: true},
				{text: "Plus d'options de test", ok: true},
				{text: "Page des statistiques", ok: true},
				{text: "Compteur de vues sur les combats", ok: true}
			]
		},
		{
			title: "Mars 1.96",
			changes: [
				{text: "Historiques de combat détaillés", ok: true},
				{text: "Codes LeekScript V2 dans l'éditeur + console LeekScript", ok: true},
				{text: "Outil de recherche d'aide globale", ok: false},
				{text: "Meilleure recherche dans le forum", ok: false}
			]
		},
		{
			title: "Avril 1.97",
			changes: [
				{text: "Rééquilibrage et système d'érosion", ok: true},
				{text: "Application mobile", ok: true},
				{text: "Refonte graphique du site et de l'affichage des combats", ok: false}
			]
		},
		{
			title: "Mai 1.98",
			changes: [
				{text: "Notifications push", ok: true},
				{text: "Authenfication en deux étapes", ok: false},
				{text: "[secret][important] lié au gameplay", ok: false}
			]
		},
		{
			title: "Juin 1.99",
			changes: [
				{text: "LeekScript V2 Bêta", ok: false},
				{text: "[secret][important] lié aux trophées", ok: false}
			]
		},
		{
			title: "Juillet 2.00",
			changes: [
				{text: "Sortie finale du LeekScript V2", ok: false},
				{text: "Support de Gravatar", ok: false},
				{text: "[secret][important] lié aux combats de team", ok: false},
			]
		},
		{
			title: "Août 2.01",
			changes: [
				{text: "1er boss", ok: false},
				{text: "[secret][important] lié au gameplay", ok: false},
				{text: "[secret][secondaire] lié à la page combat", ok: false}
			]
		},
		{
			title: "Septembre 2.02",
			changes: [
				{text: "Nouvelles puces tactiques", ok: false},
				{text: "1 ou 2 nouveaux boss (liés aux nouvelles puces)", ok: false}
			]
		},
		{
			title: "Octobre 2.03",
			changes: [
				{text: "[secret][important] lié au gameplay", ok: false}
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
