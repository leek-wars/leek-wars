<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('about') }}</h1>
			<div class="tabs">
				<div class="tab action">
					<a href="https://github.com/leek-wars/leek-wars-client" target="_blank" rel="noopener">
						<img src="image/github_white.png">
					</a>
				</div>
			</div>
		</div>
		
		<panel class="first">
			<div class="center">
				<img class="illustration" src="/image/about/illustration.png">
				<br>
				<h2 class="title">Leek Wars</h2>
				<h4>{{ $t('version_n', [LeekWars.version]) }}</h4>
				<br>
				<a href="https://www.facebook.com/LeekWars">
					<img height="28" src="image/about/facebook_like.png">
				</a>
				<span ref="github"></span>
				<span class="github-button"><a class="github-button" href="https://github.com/leek-wars/leek-wars-client" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star Leek Wars on GitHub">Star</a></span>
				<iframe class="twitter-button" allowtransparency="true" frameborder="0" scrolling="no" src="//platform.twitter.com/widgets/follow_button.html?screen_name=LeekWars&size=l" width="250" height="28"></iframe>
			</div>
		</panel>
		
		<panel :title="$t('leekwars')">
			<p v-html="$t('leekwars_content')"></p>
		</panel>
		
		<panel :title="$t('why')">
			<p v-html="$t('why_1')"></p>
			<br>
			<p v-html="$t('why_2')"></p>
		</panel>
		
		<panel :title="$t('team')">
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
		</panel>
		
		<panel :title="$t('we_talk_about_leeks')">
			<p>{{ $t('thanks_about_articles') }}</p>
			<div class="links">
				<div v-for="(link, l) in links" :key="l">
					<h4>{{ link[0] }}</h4>
					<a :href="link[1]" target="_blank" rel="noopener">{{ link[1] }}</a>
					<br>
				</div>
			</div>
		</panel>
		
		<panel :title="$t('social_networks')">
			<p>{{ $t('follow_on_social_networks') }}</p>
			<div class="social">
				<a href="https://twitter.com/LeekWars" target="_blank" rel="noopener">
					<div class="item">
						<img src="/image/about/twitter.png">
						<h4>Twitter</h4>
					</div>
				</a>
				<a href="https://www.facebook.com/LeekWars" target="_blank" rel="noopener">
					<div class="item">
						<img src="/image/about/facebook.png">
						<h4>Facebook</h4>
					</div>
				</a>
				<a href="https://github.com/leek-wars/leek-wars-client" target="_blank" rel="noopener">
					<div class="item">
						<img src="image/about/github.png">
						<h4>GitHub</h4>
					</div>
				</a>
			</div>
		</panel>
		
		<panel :title="$t('languages_libraries_tools')">
			<p>{{ $t('tools_list') }}</p>
			<div v-for="(category, c) in technologies" :key="c" class="techno">
				<div class="title">
					<h4>{{ $t('about.' + category.name) }}</h4>
				</div>
				<div class="languages">
					<a v-for="(techno, t) in category.items" :key="t" :href="techno.link" target="_blank" rel="noopener">
						<div class="item">
							<img :src="'/image/about/' + techno.image">
							<div class="name">{{ techno.name }}</div>
						</div>
					</a>
				</div>
			</div>
		</panel>
		
		<panel :title="$t('contact')">
			<i18n path="contact_text" tag="p">
				<a slot="contact" class="green" target="_blank" rel="noopener" href="mailto:contact@leekwars.com">contact@leekwars.com</a>
			</i18n>
		</panel>
		
		<panel :title="$t('links')" class="last">
			<router-link to="/statistics" class="green">{{ $t('main.statistics') }}</router-link>
			<br>
			<router-link to="/changelog" class="green">{{ $t('main.changelog') }}</router-link>
			<br>
			<router-link to="/conditions" class="green">{{ $t('main.conditions') }}</router-link>
			<br>
			<router-link to="/legal" class="green">{{ $t('main.legal') }}</router-link>
			<br>
			<router-link to="/app" class="green">{{ $t('main.app') }}</router-link>
		</panel>
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

		technologies = [
			{ name: "client", items: [
				{ name: "HTML 5", link: "http://www.w3schools.com/html/html5_intro.asp", image: "html5.png" },
				{ name: "CSS 3", link: "http://www.w3schools.com/css/css3_intro.asp", image: "css3.png" },
				{ name: "Sass", link: "https://sass-lang.com/", image: "sass.svg" },
				{ name: "JavaScript", link: "http://www.w3schools.com/js/DEFAULT.asp", image: "javascript.png" },
				{ name: "TypeScript", link: "https://www.typescriptlang.org/", image: "typescript.svg" },
				{ name: "Code Mirror", link: "http://www.java.com/fr/about/", image: "codemirror.png" },
				{ name: "Vue", link: "https://vuejs.org/", image: "vue.png" },
				{ name: "Chartist", link: "https://gionkunz.github.io/chartist-js/", image: "chartist.png" },
				{ name: "KaTeX", link: "https://katex.org/", image: "katex.png" },
				{ name: "webpack", link: "https://webpack.js.org/", image: "webpack.png" },
				{ name: "npm", link: "https://www.npmjs.com/", image: "npm.svg" },
				{ name: "Vuetify", link: "https://vuetifyjs.com/en/", image: "vuetify.png" },
			]},
			{ name: "server", items: [
				{ name: "Debian", link: "https://www.debian.org/", image: "debian.svg" },
				{ name: "NGINX", link: "https://www.nginx.com/", image: "nginx.svg" },
				{ name: "PostgreSQL", link: "https://www.postgresql.org/", image: "postgresql.svg" },
				{ name: "Java", link: "http://www.java.com/fr/about/", image: "java.png" },
				{ name: "PHP", link: "http://www.php.net/", image: "php.png" },
				{ name: "Memcached", link: "https://memcached.org/", image: "memcached.svg" },
				{ name: "Python", link: "https://www.python.org/", image: "python.svg" },
				{ name: "Swift Mailer", link: "https://swiftmailer.symfony.com/", image: "swiftmailer.png" },
			]},
			{ name: "leekscript", items: [
				{ name: "C++", link: "https://fr.cppreference.com/w/", image: "cpp.png" },
				{ name: "LLVM", link: "https://llvm.org/", image: "llvm.png" },
				{ name: "GCC", link: "https://gcc.gnu.org/", image: "gcc.svg" },
				{ name: "GMP", link: "https://gmplib.org/", image: "gmp.png" },
				{ name: "Valgrind", link: "https://valgrind.org/", image: "valgrind.png" },
				{ name: "gcov", link: "https://gcc.gnu.org/onlinedocs/gcc/Gcov.html", image: "gcov.png" },
			]},
			{ name: "tools", items: [
				{ name: "git", link: "http://git-scm.com/", image: "git.png" },
				{ name: "GitHub", link: "https://github.com/", image: "github.svg" },
				{ name: "VSCode", link: "https://code.visualstudio.com/", image: "vscode.svg" },
				{ name: "GIMP", link: "https://www.gimp.org/fr/", image: "gimp.svg" },
				{ name: "Inkscape", link: "https://inkscape.org/fr/", image: "inkscape.svg" },
				{ name: "Blender", link: "https://www.blender.org/", image: "blender.svg" },
				{ name: "Travis CI", link: "https://travis-ci.com/", image: "travis.svg" },
				{ name: "Codacy", link: "https://www.codacy.com/", image: "codacy.svg" },
				{ name: "FileZilla", link: "https://filezilla-project.org/", image: "filezilla.svg" },
			]},
		]

		created() {
			LeekWars.setTitle(this.$i18n.t('about.title'))
			LeekWars.setActions([{image: 'github_white.png', click: () => window.open('https://github.com/leek-wars/leek-wars-client', '_newtab')}])
		}
		mounted() {
			const github = document.createElement('script')
			github.src = 'https://buttons.github.io/buttons.js'
			github.async = true
			const block = this.$refs.github as HTMLElement
			if (block) { block.appendChild(github) }
		}
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
	.techno {
		display: flex;
		.title {
			flex: 100px 0 0;
			align-self: center;
			text-align: center;
		}
	}
	.languages {
		display: grid;
		flex: 1;
		grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		align-items: baseline;
		grid-gap: 10px;
		margin: 5px 10px;
		.item {
			display: inline-block;
			text-align: center;
			font-size: 17px;
			img {
				width: 80px;
				height: 80px;
				margin: 0 5px;
				object-fit: contain;
			}
		}
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
	.github-button {
		padding: 0 10px;
	}
</style>
