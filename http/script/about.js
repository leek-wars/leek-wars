LW.pages.about.init = function(params, $scope, $page) {

	$scope.version = LW.version / 100
	$scope.links = [
		["Korben", "http://korben.info/leek-wars.html"],
		["Blog de Riik", "http://www.riiks.com/blog/chronique/leek-wars-ou-comment-programmer-des-poireaux/"],
		["1001bricks", "http://blog.1001bricks.com/649-welcome-to-1001leeks"],
		["Millenium", "http://www.millenium.org/jeux-indes/accueil/actualites/leek-wars-programmez-l-intelligence-artificielle-de-votre-robot-poireau-et-faite-le-combattre-111885"],
		["Écho du Geek", "http://www.echodugeek.com/leek-wars-les-poireaux-conquete-du-monde/"],
		["d6bels chronicles", "http://blog.d6bels.net/leek-wars-la-guerre-des-poireaux-preque-intelligents/"],
		["Mini Jeux Video", "http://www.mini-jeux-video.com/leekwars/"],
		["Vidéo par BugQuest", "https://www.youtube.com/watch?v=UXhoZYZm2tk"],
		["Game Side Story", "http://www.gamesidestory.com/2014/09/02/gametest-leekwars-navigateur/"],
		["Les Voyageurs Du Code", "http://www.voyageursducode.fr/liste-des-bagages/161-leek-war.html"],
		['MacAttac', "http://www.macattac.fr/2014/09/28/test-du-jeu-leek-wars/"]
	]
	$page.render()

	// Twitter button
	var twitter = function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],
		p=/^http:/.test(d.location)?'http':'https';
	if(!d.getElementById(id)){
		js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';
	fjs.parentNode.insertBefore(js,fjs);}}; twitter(document, 'script', 'twitter-wjs');
}
