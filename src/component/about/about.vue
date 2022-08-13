<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('about') }}</h1>
			<div class="tabs">
				<router-link to="/changelog">
					<div class="tab">
						<v-icon>mdi-format-list-bulleted-square</v-icon>
						<span>{{ $t('main.changelog') }}</span>
					</div>
				</router-link>
				<router-link to="/statistics">
					<div class="tab">
						<v-icon>mdi-chart-timeline-variant</v-icon>
						<span>{{ $t('main.stats') }}</span>
					</div>
				</router-link>
				<router-link to="/app">
					<div class="tab">
						<v-icon>mdi-cellphone-android</v-icon>
						<span>{{ $t('main.app') }}</span>
					</div>
				</router-link>
				<a href="https://github.com/leek-wars/leek-wars-client" target="_blank" rel="noopener">
					<div class="tab action">
						<img src="image/github_white.png">
						<span>GitHub <v-icon>mdi-open-in-new</v-icon></span>
					</div>
				</a>
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
			<div v-for="(part, p) of team" :key="p" class="devs">
				<rich-tooltip-farmer v-for="member of part" :key="member.id" :id="member.id" v-slot="{ on }">
					<router-link :key="member.id" :to="'/farmer/' + member.id">
						<div class="dev" :class="member.grade" v-on="on">
							<avatar :farmer="{id: member.id, avatar_changed: member.id === 11 ? 0 : 1}" />
							<h4 :class="member.grade">{{ member.name }}</h4>
							<div class="role" v-html="member.role"></div>
						</div>
					</router-link>
				</rich-tooltip-farmer>
			</div>
			<h4>{{ $t('contributors') }}</h4>
			<div class="devs contributors">
				<rich-tooltip-farmer v-for="member of contributors" :key="member.id" :id="member.id" v-slot="{ on }">
					<router-link :key="member.id" :to="'/farmer/' + member.id">
						<div class="contributor" :class="member.grade" v-on="on">
							<avatar :farmer="{id: member.id, avatar_changed: member.avatar_changed}" />
							<h4 class="contributor">{{ member.name }}</h4>
							<div class="role" v-html="member.role"></div>
						</div>
					</router-link>
				</rich-tooltip-farmer>
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
					<h4>{{ $t(category.name) }}</h4>
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

		<panel :title="$t('links')">
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

		<panel title="Licenses">
			<ul>
				<li>Angel_chorus2.mp3, Taira Komori, edited, CC-BY3 license.</li>
				<li>exp_obj_large03.wav, ggctuk, CC0 1.0 license.</li>
				<li>Rocket Launch, Jarusca, CC0 1.0 license.</li>
				<li>Electric current.ogg, vladat, CC BY 3.0 license.</li>
				<li>Headshot 1.wav, SilverIllusionist, CC BY 4.0 license.</li>
				<li>Cut Through Armor / Slice / Clang, SypherZent, CC BY 4.0 license.</li>
				<li>Explosion Power Central, Tritus, CC BY 3.0 license.</li>
				<li>Flamethrower, pugaeme, CC BY 3.0 license.</li>
			</ul>
		</panel>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Component({ name: 'about', i18n: {}, mixins: [...mixins], components: { RichTooltipFarmer } })
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
				{ name: "CodeMirror", link: "https://codemirror.net/", image: "codemirror.svg" },
				{ name: "Vue", link: "https://vuejs.org/", image: "vue.png" },
				{ name: "Chartist", link: "https://gionkunz.github.io/chartist-js/", image: "chartist.png" },
				{ name: "KaTeX", link: "https://katex.org/", image: "katex.png" },
				{ name: "webpack", link: "https://webpack.js.org/", image: "webpack.png" },
				{ name: "npm", link: "https://www.npmjs.com/", image: "npm.svg" },
				{ name: "Vuetify", link: "https://vuetifyjs.com/en/", image: "vuetify.png" },
				{ name: "Markdown it", link: "https://markdown-it.github.io/", image: "markdown-it.svg" },
			]},
			{ name: "server", items: [
				{ name: "Debian", link: "https://www.debian.org/", image: "debian.svg" },
				{ name: "NGINX", link: "https://www.nginx.com/", image: "nginx.svg" },
				{ name: "PostgreSQL", link: "https://www.postgresql.org/", image: "postgresql.svg" },
				{ name: "Java", link: "http://www.java.com/fr/about/", image: "java.png" },
				{ name: "PHP", link: "http://www.php.net/", image: "php.png" },
				{ name: "Memcached", link: "https://memcached.org/", image: "memcached.svg" },
				{ name: "Python", link: "https://www.python.org/", image: "python.svg" },
				{ name: "Docker", link: "https://www.docker.com/", image: "docker.webp" },
				{ name: "Traefik", link: "https://traefik.io/traefik/", image: "traefik.svg" },
			]},
			// { name: "leekscript", items: [
			// 	{ name: "C++", link: "https://fr.cppreference.com/w/", image: "cpp.png" },
			// 	{ name: "LLVM", link: "https://llvm.org/", image: "llvm.png" },
			// 	{ name: "GCC", link: "https://gcc.gnu.org/", image: "gcc.svg" },
			// 	{ name: "GMP", link: "https://gmplib.org/", image: "gmp.png" },
			// 	{ name: "Valgrind", link: "https://valgrind.org/", image: "valgrind.png" },
			// 	{ name: "gcov", link: "https://gcc.gnu.org/onlinedocs/gcc/Gcov.html", image: "gcov.png" },
			// ]},
			{ name: "tools", items: [
				{ name: "git", link: "http://git-scm.com/", image: "git.png" },
				{ name: "GitHub", link: "https://github.com/", image: "github.svg" },
				{ name: "VSCode", link: "https://code.visualstudio.com/", image: "vscode.svg" },
				{ name: "GIMP", link: "https://www.gimp.org/fr/", image: "gimp.svg" },
				{ name: "Inkscape", link: "https://inkscape.org/fr/", image: "inkscape.svg" },
				{ name: "Blender", link: "https://www.blender.org/", image: "blender.svg" },
				// { name: "Codacy", link: "https://www.codacy.com/", image: "codacy.svg" },
				// { name: "FileZilla", link: "https://filezilla-project.org/", image: "filezilla.svg" },
			]},
		]

		get team() {
			return [[
				{ name: 'Pilow', id: 1, grade: 'admin', role: this.$t('team_web_graphism') + '<br>' + this.$t('team_leekscript_fights') },
				{ name: 'SilentHunter', id: 11, grade: 'admin', role: this.$t('team_admin_server') },
				{ name: 'TheTintin', id: 38357, grade: 'moderator', role: this.$t('main.grade_moderator') },
				{ name: 'Ref', id: 43276, grade: 'moderator', role: this.$t('main.grade_moderator') },
			], [
				{ name: 'Dawyde', id: 2, grade: 'former admin', role: this.$t('former_dev') },
				{ name: 'mistigis', id: 100, grade: 'former moderator', role: this.$t('former_mod') },
				{ name: 'McNalYoo', id: 273, grade: 'former moderator', role: this.$t('former_mod') },
				{ name: 'jojo123', id: 8773, grade: 'former moderator', role: this.$t('former_mod') },
				{ name: 'Silosis', id: 27228, grade: 'former moderator', role: this.$t('former_mod') },
			]]
		}
		contributors = [] as Farmer[]

		created() {
			LeekWars.setTitle(this.$i18n.t('title'))
			LeekWars.setActions([{image: 'github_white.png', click: () => window.open('https://github.com/leek-wars/leek-wars-client', '_newtab')}])
		}

		mounted() {
			const github = document.createElement('script')
			github.src = 'https://buttons.github.io/buttons.js'
			github.async = true
			const block = this.$refs.github as HTMLElement
			if (block) { block.appendChild(github) }

			LeekWars.get<Farmer[]>('farmer/contributors').then(contributors => {
				this.contributors = contributors.filter(c => c.id !== 43276 && c.id !== 8773 && c.id !== 38357)
				this.contributors.sort((a, b) => Math.random() - 0.5)
			})
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
		flex-wrap: wrap;
		margin-bottom: 10px;
	}
	.dev, .mod, .contributor {
		display: inline-block;
		margin: 0 10px;
		text-align: center;
		.avatar {
			max-width: 140px;
			width: 100%;
		}
		&.former {
			max-width: 100px;
			width: 100%;
		}
		&.contributor {
			width: 100%;
			margin: 0;
			h4 {
				margin-top: 4px;
				font-size: 13px;
			}
		}
		h4 {
			margin-top: 4px;
			text-overflow: ellipsis;
			overflow: hidden;
		}
		.role {
			font-style: italic;
			color: #666;
			margin-top: 4px;
			font-weight: 500;
		}
		&.former .role {
			font-size: 14px;
		}
	}
	.contributors {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
		margin-top: 15px;
		gap: 10px;
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
