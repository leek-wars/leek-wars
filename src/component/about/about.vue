<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('about') }}</h1>
			<div class="tabs">
				<div class="tab action">
					<a href="https://github.com/leek-wars/leek-wars-client" target="_blank" rel="noreferrer">
						<img src="image/github_white.png">
					</a>
				</div>
			</div>
		</div>
		
		<div class="panel">
			<div class="content center">
				<img class="illustration" src="/image/about/illustration.png">
				<br>
				<h2 class="title">Leek Wars</h2>
				<h4>{{ $t('version_n', [LeekWars.version]) }}</h4>
				<br>
				<a href="https://www.facebook.com/LeekWars">
					<img height="28" src="image/about/facebook_like.png">
				</a>
				<gh-btns-star slug="leek-wars/leek-wars-client" show-count />
				<iframe class="twitter-button" allowtransparency="true" frameborder="0" scrolling="no" src="//platform.twitter.com/widgets/follow_button.html?screen_name=LeekWars&size=l" width="250" height="28"></iframe>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('leekwars') }}</h2>
			</div>
			<div class="content">
				<p v-html="$t('leekwars_content')"></p>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('why') }}</h2>
			</div>
			<div class="content">
				<p v-html="$t('why_1')"></p>
				<br>
				<p v-html="$t('why_2')"></p>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('team') }}</h2>
			</div>
			<div class="content center">
				<div class="devs">
					<router-link to="/farmer/1">
						<div class="dev">
							<avatar :farmer="{id: 1, avatar_changed: 1}" />
							<h4>Pilow</h4>
							<div class="role">{{ $t('team_web_graphism') }}</div>
							<div class="role">{{ $t('team_leekscript_fights') }}</div>
						</div>
					</router-link>
					<router-link to="/farmer/11">
						<div class="dev">
							<avatar :farmer="{}" />
							<h4>SilentHunter</h4>
							<div class="role">{{ $t('team_admin_server') }}</div>
						</div>
					</router-link>
				</div>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('we_talk_about_leeks') }}</h2>
			</div>
			<div class="content">
				<p>{{ $t('thanks_about_articles') }}</p>
				<div class="links">
					<div v-for="(link, l) in links" :key="l">
						<h4>{{ link[0] }}</h4>
						<a :href="link[1]" target="_blank">{{ link[1] }}</a>
						<br>
					</div>
				</div>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('social_networks') }}</h2>
			</div>
			<div class="content">
				<p>{{ $t('follow_on_social_networks') }}</p>
				<div class="social">
					<a href="https://twitter.com/LeekWars" target="_blank">
						<div class="item">
							<img src="/image/about/twitter.png">
							<h4>Twitter</h4>
						</div>
					</a>
					<a href="https://www.facebook.com/LeekWars" target="_blank">
						<div class="item">
							<img src="/image/about/facebook.png">
							<h4>Facebook</h4>
						</div>
					</a>
					<a href="https://plus.google.com/+LeekwarsGame" target="_blank">
						<div class="item">
							<img src="/image/about/googleplus.png">
							<h4>Google+</h4>
						</div>
					</a>
					<a href="https://github.com/leek-wars/leek-wars-client" target="_blank">
						<div class="item">
							<img src="image/about/github.png">
							<h4>GitHub</h4>
						</div>
					</a>
				</div>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('languages_libraries_tools') }}</h2>
			</div>
			<div class="content">
				<p>{{ $t('tools_list') }}</p>
				<div class="languages">
					<a href="http://www.java.com/fr/about/" target="_blank">
						<div class="item">
							<img src="/image/about/java.png">
							<h4>Java</h4>
						</div>
					</a>
					<a href="http://www.php.net/" target="_blank">
						<div class="item">
							<img src="/image/about/php.png">
							<h4>PHP</h4>
						</div>
					</a>
					<a href="http://www.w3schools.com/html/html5_intro.asp" target="_blank">
						<div class="item">
							<img src="/image/about/html5.png">
							<h4>HTML 5</h4>
						</div>
					</a>
					<a href="http://www.w3schools.com/css/css3_intro.asp" target="_blank">
						<div class="item">
							<img src="/image/about/css3.png">
							<h4>CSS 3</h4>
						</div>
					</a>
					<a href="http://www.w3schools.com/js/DEFAULT.asp" target="_blank">
						<div class="item">
							<img src="/image/about/javascript.png">
							<h4>JavaScript</h4>
						</div>
					</a>
					<a href="http://codemirror.net/" target="_blank">
						<div class="item">
							<img src="/image/about/codemirror.png">
							<h4>Code Mirror</h4>
						</div>
					</a>
					<a href="http://git-scm.com/" target="_blank">
						<div class="item">
							<img src="/image/about/git.png">
							<h4>git</h4>
						</div>
					</a>
				</div>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('contact') }}</h2>
			</div>
			<div class="content">
				<i18n path="contact_text" tag="p">
					<a place="contact" class="green" target="_blank" href="mailto:contact@leekwars.com">contact@leekwars.com</a>
				</i18n>
			</div>
		</div>
		
		<div class="panel">
			<div class="header">
				<h2>{{ $t('links') }}</h2>
			</div>
			<div class="content">
				<router-link to="/statistics" class="green">{{ $t('main.statistics') }}</router-link>
				<br>
				<router-link to="/changelog" class="green">{{ $t('main.changelog') }}</router-link>
				<br>
				<router-link to="/conditions" class="green">{{ $t('main.conditions') }}</router-link>
				<br>
				<router-link to="/legal" class="green">{{ $t('main.legal') }}</router-link>
				<br>
				<router-link to="/app" class="green">{{ $t('main.app') }}</router-link>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'about', i18n: {} })
	export default class About extends Vue {
		links = [
			["Korben", "http://korben.info/leek-wars.html"],
			["1001bricks", "http://blog.1001bricks.com/649-welcome-to-1001leeks"],
			["Millenium", "http://www.millenium.org/jeux-indes/accueil/actualites/leek-wars-programmez-l-intelligence-artificielle-de-votre-robot-poireau-et-faite-le-combattre-111885"],
			["Vidéo par BugQuest", "https://www.youtube.com/watch?v=UXhoZYZm2tk"],
			["Game Side Story", "http://www.gamesidestory.com/2014/09/02/gametest-leekwars-navigateur/"],
			['MacAttac', "http://www.macattac.fr/2014/09/28/test-du-jeu-leek-wars/"]
		]
	}
</script>

<style lang="scss" scoped>
	.title {
		font-size: 40px;
	}
	.illustration {
		width: 100%;
		max-width: 400px;
	}
	.languages {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
	}
	.languages .item {
		display: inline-block;
		margin: 7px;
		text-align: center;
	}
	.languages .item img {
		width: 85px;
	}
	p {
		text-align: justify;
		font-size: 17px;
		margin: 5px;
	}
	.devs {
		display: flex;
		justify-content: center;
	}
	.dev {
		display: inline-block;
		margin: 10px;
		text-align: center;
	}
	.dev .avatar {
		max-width: 140px;
		width: 100%;
	}
	.dev .role {
		font-style: italic;
		color: #666;
	}
	.modo {
		display: inline-block;
		margin: 10px;
		text-align: center;
	}
	.modo .avatar {
		width: 120px;
		border-radius: 2px;
	}
	.links {
		padding: 10px;
		word-break: break-all;
	}
	.links h3 {
		display: inline-block;
	}
	.links a {
		color: #5fad1b;
	}
	.green {
		color: #5fad1b;
	}
	a.green:visited {
		color: #5fad1b;
	}
	.social {
		display: flex;
		justify-content: center;
	}
	.social .item {
		text-align: center;
		margin: 10px;
	}
	.social img {
		width: 80px;
		max-width: 90px;
	}
	.fb-like {
		vertical-align: top;
	}
	.gh-button-container {
		float: none;
	}
</style>
