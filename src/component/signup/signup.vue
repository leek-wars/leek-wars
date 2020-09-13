<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div class="container grid large top">
			<panel class="first">
				<div class="desc introduction" v-html="$t('intro')"></div>
				<div class="leek-rect">
					<img class="leeks" src="/image/signup_illustration.png">
					<div v-if="leek_count" class="desc" v-html="$t('n_leeks_already', [LeekWars.formatNumber(leek_count)])"></div>
				</div>
			</panel>
			<panel v-if="env.SIGN_UP" title="Inscription">
				<form class="signup-form" method="post" @submit="submit">
					<table>
						<tr>
							<td class="align-right">{{ $t('your_farmer_name') }}</td>
							<td class="align-left">
								<input v-model="login" :status="status('login')" name="login" type="text" required>
								<div v-for="e in errors.login" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td class="align-right">{{ $t('your_leek_name') }}</td>
							<td class="align-left">
								<input v-model="leek" :status="status('leek')" name="leek" type="text" required>
								<div v-for="e in errors.leek" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td class="align-right"><i>{{ $t('godfather') }}</i></td>
							<td class="align-left">
								<input v-model="godfather" :status="status('godfather')" type="text">
								<div v-for="e in errors.godfather" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td><div class="space"></div></td>
						</tr>
						<tr>
							<td colspan="2">
								<v-radio-group v-model="signupMethod" class="radio" :row="true" :dense="true" :hide-details="true">
									<v-radio label="Email / mot de passe" :value="1" />
									<v-radio label="GitHub" :value="2" />
								</v-radio-group>
							</td>
						</tr>
						<tr v-if="signupMethod === 1">
							<td class="align-right">{{ $t('your_email') }}</td>
							<td class="align-left">
								<input v-model="email" :status="status('email')" name="email" type="text" required>
								<div v-for="e in errors.email" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr v-if="signupMethod === 1">
							<td class="align-right">{{ $t('password') }}</td>
							<td class="align-left">
								<input v-model="password1" :status="status('password1')" name="password" type="password" required>
								<div v-for="e in errors.password1" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td><div class="space"></div></td>
						</tr>
						<tr v-if="signupMethod === 2">
							<td><div class="space"></div></td>
						</tr>
					</table>
					<i18n class="cgu" tag="div" path="conditions">
						<router-link slot="link" to="/conditions">{{ $t('conditions_name') }}</router-link>
					</i18n>
					<center>
						<v-btn v-if="signupMethod === 2" color="black" type="submit" class="gh-button"> <img src="/image/github_black.png"> {{ $t('signup_gh') }}</v-btn>
						<v-btn v-if="signupMethod === 1" large color="primary" type="submit">{{ $t('signup') }}</v-btn>
					</center>
				</form>
			</panel>
		</div>

		<h1>{{ $t('ranking') }}</h1>

		<panel class="first">
			<div class="container">
				<div class="column4">
					<router-link to="/ranking/active">
						<h4>{{ $t('main.leek') }} <span class="arrow">▶</span></h4>
					</router-link>
					<table class="ranking">
						<tr class="header">
							<th class="p15">{{ $t('place') }}</th>
							<th class="p35">{{ $t('leek') }}</th>
							<th class="p25">{{ $t('talent') }}</th>
						</tr>
						<tr v-for="(leek, i) in leek_ranking" :key="i" :class="leek ? leek.style : ''">
							<td>{{ parseInt(i) + 1 }}</td>
							<td :class="leek ? leek.class : ''">
								<rich-tooltip-leek v-if="leek" :id="leek.id" v-slot="{ on }">
									<router-link :to="'/leek/' + leek.id">
										<span v-on="on">{{ leek.name }}</span>
									</router-link>
								</rich-tooltip-leek>
							</td>
							<td>{{ leek ? leek.talent : '' }}</td>
						</tr>
					</table>
				</div>
				<div class="column4">
					<router-link to="/ranking/farmer/active">
						<h4>{{ $t('main.farmer') }} <span class="arrow">▶</span></h4>
					</router-link>
					<table class="ranking">
						<tr class="header">
							<th class="p15">{{ $t('place') }}</th>
							<th class="p35">{{ $t('main.farmer') }}</th>
							<th class="p20">{{ $t('main.talent') }}</th>
							<th class="p5">{{ $t('country') }}</th>
						</tr>
						<tr v-for="(farmer, i) in farmer_ranking" :key="i" :class="farmer ? farmer.style : ''">
							<td>{{ parseInt(i) + 1 }}</td>
							<td :class="farmer ? farmer.class : ''">
								<rich-tooltip-farmer v-if="farmer" :id="farmer.id" v-slot="{ on }">
									<router-link :to="'/farmer/' + farmer.id">
										<span v-on="on">{{ farmer.name }}</span>
									</router-link>
								</rich-tooltip-farmer>
							</td>
							<td>{{ farmer ? farmer.talent : '' }}</td>
							<td>
								<div v-if="farmer" class="country-wrapper">
									<img v-if="farmer.country" :title="$t('country.' + farmer.country)" :src="'/image/flag/' + farmer.country + '.png'">
								</div>
							</td>
						</tr>
					</table>
				</div>
				<div class="column4">
					<router-link to="/ranking/team/active">
						<h4>{{ $t('main.team') }} <span class="arrow">▶</span></h4>
					</router-link>
					<table class="ranking">
						<tr class="header">
							<th class="p20">{{ $t('place') }}</th>
							<th class="p50">{{ $t('team') }}</th>
							<th class="p30">{{ $t('talent') }}</th>
						</tr>
						<tr v-for="(team, i) in team_ranking" :key="i" :class="team ? team.style : ''">
							<td>{{ parseInt(i) + 1 }}</td>
							<td :class="team ? team.class : ''">
								<router-link v-if="team" :to="'/team/' + team.id">{{ team.name }}</router-link>
							</td>
							<td>{{ team ? team.talent : '' }}</td>
						</tr>
					</table>
				</div>
			</div>
		</panel>

		<div class="tiles">
			<a href="https://play.google.com/store/apps/details?id=com.leekwars.app" target="_blank">
				<panel v-ripple class="android">
					<div slot="content">
						<img src="/image/android.png"> {{ $t('android_app') }}
					</div>
				</panel>
			</a>
			<a href="https://github.com/leek-wars" target="_blank">
				<panel v-ripple class="github">
					<div slot="content">
						<img src="/image/github_black.png"> GitHub
					</div>
				</panel>
			</a>
			<router-link to="/help">
				<panel v-ripple class="help">
					<div slot="content">
						<v-icon>mdi-help-circle-outline</v-icon> {{ $t('help_tutorial_doc') }}
					</div>
				</panel>
			</router-link>
			<a href="http://leekwarswiki.net/index.php?title=Accueil" target="_blank">
				<panel v-ripple class="github">
					<div slot="content">
						<img src="/image/wiki.png"> Leek Wars Wiki
					</div>
				</panel>
			</a>
		</div>

		<h1>{{ $t('screenshots') }}</h1>

		<panel class="first screenshots">
			<div slot="content" class="carousel">
				<signup-carousel />
			</div>
		</panel>

		<h1>{{ $t('last_update') }}</h1>
		<panel v-if="last_version" class="last" icon="mdi-star-outline">
			<template slot="title">{{ $t('changelog.version_n', [last_version.version_name]) }} ({{ last_version.date | date }}) {{ translations[last_version.version] && translations[last_version.version].title ? ' — ' + translations[last_version.version].title : '' }}</template>
			<div slot="content">
				<changelog-version :version="last_version" />
			</div>
		</panel>

		<div v-if="bigImage" class="bigscreen" @click="bigImage = null">
			<img :src="'/image/' + bigImage">
			<div class="biglegend">{{ $t(bigImageLegend) }}</div>
		</div>
	</div>
</template>

<script lang="ts">
	import ChangelogVersion from '@/component/changelog/changelog-version.vue'
	import { locale } from '@/locale'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	const SignupCarousel = () => import(/* webpackChunkName: "[request]" */ `@/component/signup/signup-carousel.${locale}.i18n`)

	import 'swiper/css/swiper.css'
	import VueAwesomeSwiper from 'vue-awesome-swiper'
	Vue.use(VueAwesomeSwiper)

	@Component({ name: 'signup', i18n: {}, mixins, components: { ChangelogVersion, SignupCarousel } })
	export default class Signup extends Vue {
		godfather: string = ''
		leek_count: number = 0
		farmer_ranking: any = new Array(10)
		leek_ranking: any = new Array(10)
		team_ranking: any = new Array(10)
		login: string = ''
		leek: string = ''
		email: string = ''
		password1: string = ''
		errors: {[key: string]: string[]} = {}
		bigImage: string | null = null
		bigImageLegend: string = ''
		signupMethod: number = 1
		last_version: any = null
		translations: any = {}

		created() {
			LeekWars.setTitle("Leek Wars : online leek programming game")
			this.godfather = 'godfather' in this.$route.params ? this.$route.params.godfather : ''
			LeekWars.get('leek/get-count').then(data => {
				this.leek_count = data.leeks
			})
			LeekWars.get('ranking/get-home-ranking').then(data => {
				data.leeks[0].style = data.farmers[0].style = 'first'
				data.leeks[1].style = data.farmers[1].style = 'second'
				data.leeks[2].style = data.farmers[2].style = 'third'
				this.farmer_ranking = data.farmers
				this.leek_ranking = data.leeks
				this.team_ranking = data.teams
			})
			import(/* webpackChunkName: "changelog-[request]" */ `json-loader!yaml-loader!@/component/changelog/changelog.${this.$i18n.locale}.yaml`).then((translations) => {
				this.translations = translations
			})
			LeekWars.get('changelog/get/' + this.$i18n.locale).then(data => {
				this.last_version = data.changelog[0]
			})
		}

		submit(e: Event) {
			e.preventDefault()
			this.errors = {}
			const service = this.signupMethod === 1 ? 'farmer/register' : 'farmer/register-github'
			const args = {
				login: this.login,
				leek_name: this.leek,
				godfather: this.godfather
			} as any
			if (this.signupMethod === 1) {
				args.password = this.password1,
				args.email = this.email
			}
			LeekWars.post(service, args).then(data => {
				if (this.signupMethod === 1) {
					localStorage.setItem('login-attempt', 'true')
					this.$router.push('/signup/success/' + this.login)
				} else {
					localStorage.setItem('login-attempt', 'true')
					const redirect_uri = document.location.origin + "/api/farmer/login-github"
					document.location.href = "https://github.com/login/oauth/authorize?client_id=0253d6b35d4db2a77a3b&scope=user:email&redirect_uri=" + redirect_uri + "&state=" + data.state
				}
			}).error(errors => {
				for (const error of errors) {
					const form = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][error[0]]
					this.addError(form, this.$t('error_' + error[1], error[2]) as string)
				}
			})
			return false
		}
		successConfirm() {
			this.$router.push('/login')
		}
		addError(form: string, error: string) {
			if (!(form in this.errors)) {
				Vue.set(this.$data.errors, form, [])
			}
			this.errors[form].push(error)
		}
		status(form: string) {
			if (form in this.errors) {
				if (Object.keys(this.errors[form]).length > 0) {
					return 'error'
				} else {
					return 'valid'
				}
			} else {
				return null
			}
		}
		enlarge(image: any) {
			if (LeekWars.mobile) { return }
			this.bigImage = image[0].replace('_small', '')
			this.bigImageLegend = image[1]
		}

	}
</script>

<style lang="scss" scoped>
	@media screen and (max-width: 900px) {
		.top .column6:nth-child(2) .panel {
			margin-top: 12px;
		}
	}
	@media screen and (min-width: 900px) {
		.top {
			display: flex;
		}
		.top .column6 .panel {
			width: 100%;
		}
		.top .column6 {
			display: flex;
		}
	}
	.introduction {
		text-align: justify;
	}
	.desc {
		font-size: 18px;
		font-weight: 300;
		padding: 5px;
		b {
			font-weight: 400;
		}
	}
	.leeks {
		height: 165px;
	}
	.leek-rect {
		text-align: center;
	}
	.align-right {
		text-align: right;
		padding: 10px;
		width: 50%;
	}
	.align-left {
		text-align: left;
		width: 50%;
	}
	.signup-form {
		width: 100%;
		margin: 0 auto;
	}
	table {
		width: 100%;
	}
	td.align-right {
		vertical-align: top;
	}
	input[type=text], input[type=password] {
		width: 170px;
		padding: 0 7px;
		background: white;
	}
	input[type=text]:focus, input[type=password]:focus {
		border: 2px solid #555;
	}
	input[status=error], input[status=error]:focus {
		border: 2px solid red;
	}
	.error-msg {
		color: red;
		font-size: 12px;
		margin: 5px 0;
	}
	input[status=valid], input[status=valid]:focus {
		border: 2px solid #5fad1b;
	}
	.space {
		height: 8px;
	}
	.signup-message {
		padding: 20px;
	}
	.cgu {
		font-size: 11px;
		text-align: center;
		margin-bottom: 10px;
		a {
			color: #5fad1b;
		}
	}
	.ranking {
		margin: 0 auto;
		width: calc(100% - 20px);
		height: 300px;
		td {
			border-bottom: 1px solid #ddd;
			border-right: 1px solid #ddd;
			text-align: center;
			padding: 3px 12px;
			background: white;
		}
		td:last-child {
			border-right: none;
		}
		tr.header {
			background: #e5e5e5;
			text-align: center;
		}
		th {
			padding: 5px 12px;
			font-weight: normal;
			color: #222;
			font-size: 16px;
			border-bottom: 1px solid #fff;
			border-right: 1px solid #fff;
		}
		th:last-child {
			border-right: none;
		}
		.first a {
			color: #ffa900;
			font-weight: bold;
		}
		.second a {
			color: #9c9c9c;
			font-weight: bold;
		}
		.third a {
			color: #ae4e00;
			font-weight: bold;
		}
		.p15 {
			width: 15%;
		}
		.p25 {
			width: 25%;
		}
		.p35 {
			width: 35%;
		}
		.p50 {
			width: 50%;
		}
	}
	#app.app .ranking {
		width: 100%;
	}
	h4 {
		margin: 10px;
		margin-top: 0;
		.arrow {
			padding-left: 2px;
		}
	}
	.tiles {
		display: grid;
		grid-gap: 12px;
		width: calc(100% - 12px);
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		margin-bottom: 12px;
		line-height: 44px;
		font-size: 19px;
		font-weight: 300;
		.panel {
			margin: 0;
		}
		.text {
			text-align: center;
		}
	}
	#app.app .tiles {
		width: 100%;
	}
	.android {
		img {
			height: 30px;
			margin-top: 10px;
			margin-left: 6px;
			margin-right: 8px;
			vertical-align: bottom;
		}
	}
	.github {
		img {
			height: 40px;
			margin: 2px;
			margin-left: 12px;
			margin-right: 12px;
			vertical-align: bottom;
		}
	}
	.help {
		i {
			font-size: 42px;
			vertical-align: bottom;
			margin-bottom: 1px;
			margin-left: 12px;
			margin-right: 10px;
		}
	}
	.slide {
		width: auto;
	}
	.country-wrapper {
		height: 20px;
		img {
			margin-top: -2px;
			width: 24px;
		}
	}
	.v-btn.gh-button {
		height: 40px;
		margin-right: 10px;
		img {
			height: 20px;
			margin-right: 5px;
		}
	}
	.radio {
		width: 100%;
		margin-bottom: 6px;
	}
</style>