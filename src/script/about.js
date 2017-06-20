LW.pages.about.init = function(params, $scope, $page) {

	$scope.version = LW.version / 100
	$scope.links = [
		["Korben", "http://korben.info/leek-wars.html"],
		["1001bricks", "http://blog.1001bricks.com/649-welcome-to-1001leeks"],
		["Millenium", "http://www.millenium.org/jeux-indes/accueil/actualites/leek-wars-programmez-l-intelligence-artificielle-de-votre-robot-poireau-et-faite-le-combattre-111885"],
		["Vidéo par BugQuest", "https://www.youtube.com/watch?v=UXhoZYZm2tk"],
		["Game Side Story", "http://www.gamesidestory.com/2014/09/02/gametest-leekwars-navigateur/"],
		['MacAttac', "http://www.macattac.fr/2014/09/28/test-du-jeu-leek-wars/"]
	]

	$page.render()

	LW.setTitle(_.lang.get('about', 'title'))
	LW.setMenuTab('about')

	// Twitter button
	var twitter = function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],
		p=/^http:/.test(d.location)?'http':'https';
	if(!d.getElementById(id)){
		js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';
	fjs.parentNode.insertBefore(js,fjs);}}; twitter(document, 'script', 'twitter-wjs');
}
