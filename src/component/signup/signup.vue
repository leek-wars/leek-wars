<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div class="top">
			<div class="column6">
				<div class="panel">
					<div class="content">
						<div class="desc introduction" v-html="$t('intro')"></div>
						<div class="leek-rect">
							<img src="/image/signup_illustration.png">
							<div v-if="leek_count" class="desc" v-html="$t('n_leeks_already', [leek_count])"></div>
						</div>
					</div>
				</div>
			</div><div class="column6">
				<div class="panel">
					<div class="header">
						<h2>Inscription</h2>
					</div>
					<div class="content">
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
									<td><br></td>
								</tr>
								<tr>
									<td class="align-right">{{ $t('your_email') }}</td>
									<td class="align-left">
										<input v-model="email" :status="status('email')" name="email" type="text" required>
										<div v-for="e in errors.email" :key="e" class="error-msg">{{ e }}</div>
									</td>
								</tr>
								<tr>
									<td class="align-right">{{ $t('password') }}</td>
									<td class="align-left">
										<input v-model="password1" :status="status('password1')" name="password" type="password" required>
										<div v-for="e in errors.password1" :key="e" class="error-msg">{{ e }}</div>
									</td>
								</tr>
								<tr>
									<td class="align-right">{{ $t('confirm_password') }}</td>
									<td class="align-left">
										<input v-model="password2" :status="status('password2')" type="password" required>
										<div v-for="e in errors.password2" :key="e" class="error-msg">{{ e }}</div>
									</td>
								</tr>
								<tr>
									<td><br></td>
								</tr>
								<tr>
									<td class="align-right"><i>{{ $t('godfather') }}</i></td>
									<td class="align-left">
										<input v-model="godfather" :status="status('godfather')" type="text">
										<div v-for="e in errors.godfather" :key="e" class="error-msg">{{ e }}</div>
									</td>
								</tr>
							</table>

							<br>

							<i18n class="cgu" tag="div" path="conditions">
								<router-link place="link" to="/conditions">{{ $t('conditions_name') }}</router-link>
							</i18n>
							<br>
							<center><input :value="$t('signup')" class="button green large" type="submit"></center>
						</form>
					</div>
				</div>
			</div>
		</div>

		<h1>{{ $t('ranking') }}</h1>

		<div class="panel first">

			<div class="content">

				<div class="container">
					<div class="column6">
						<div class="ranking">
							<h4>{{ $t('leek') }}</h4>
							<table class="ranking">
								<tr class="header">
									<th>{{ $t('place') }}</th>
									<th>{{ $t('leek') }}</th>
									<th>{{ $t('talent') }}</th>
									<th>{{ $t('level') }}</th>
								</tr>
								<tr v-for="(leek, i) in leek_ranking" :key="i" :class="leek.style">
									<td>{{ parseInt(i) + 1 }}</td>
									<td :class="leek.class">
										<router-link :to="'/leek/' + leek.id">{{ leek.name }}</router-link>
									</td>
									<td>{{ leek.talent }}</td>
									<td>{{ leek.level }}</td>
								</tr>
							</table>
						</div>
					</div>
					<div class="column6">
						<div class="ranking">
							<h4>{{ $t('farmer') }}</h4>
							<table class="ranking">
								<tr class="header">
									<th>{{ $t('place') }}</th>
									<th>{{ $t('farmer') }}</th>
									<th>{{ $t('talent') }}</th>
									<th>{{ $t('total_level') }}</th>
								</tr>
								<tr v-for="(farmer, i) in farmer_ranking" :key="i" :class="farmer.style">
									<td>{{ parseInt(i) + 1 }}</td>
									<td :class="farmer.class">
										<router-link :to="'/farmer/' + farmer.id">{{ farmer.name }}</router-link>
									</td>
									<td>{{ farmer.talent }}</td>
									<td>{{ farmer.total_level }}</td>
								</tr>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>

		<h1>{{ $t('screenshots') }}</h1>

		<div class="panel first screenshots">
			<div class="content">
				<div class="container">
					<div v-for="image of images" :key="image[0]" class="column6">
						<div class="screenshot">
							<img :src="'/image/signup/' + image[0]" @click="enlarge(image)">
							<div class="legend">{{ $t(image[1]) }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div v-if="bigImage" class="bigscreen" @click="bigImage = null">
			<img :src="'/image/signup/' + bigImage">
			<div class="biglegend">{{ $t(bigImageLegend) }}</div>
		</div>

		<v-dialog v-model="successDialog" :max-width="600">
			<div class="title">
				{{ $t('signup_validated') }}
			</div>
			<div class="content">
				<center><img src="/image/map/nexus_block.png"></center>
				<h2 class="signup-message">{{ $t('signup_validated_message', [login]) }}</h2>
			</div>
			<div class="actions">
				<div class="action" @click="successConfirm">OK</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'signup', i18n: {} })
	export default class Signup extends Vue {
		godfather: string = ''
		leek_count: number = 0
		farmer_ranking: any = null
		leek_ranking: any = null
		login: string = ''
		leek: string = ''
		email: string = ''
		password1: string = ''
		password2: string = ''
		successDialog: boolean = false
		errors: {[key: string]: string[]} = {}
		bigImage: string | null = null
		bigImageLegend: string = ''
		images = [
			["factory_small.jpg", "fight_factory"],
			["leek_small.jpg", "leek_page"],
			["editor_small.jpg", "editor"],
			["desert_small.jpg", "fight_desert"],
			["ice_small.jpg", "fight_ice"],
			["market_small.jpg", "market"],
			["ranking_small.jpg", "ranking"],
			["forest_small.jpg", "fight_forest"],
			["beach_small.jpg", "fight_beach"],
			["nexus_small.jpg", "fight_test"]
		]

		created() {
			LeekWars.setTitle(null)
			this.godfather = 'godfather' in this.$route.params ? this.$route.params.godfather : ''
			LeekWars.get<any>('leek/get-count').then((data) => {
				if (data.data.success) {
					this.leek_count = data.data.leeks
				}
			})
			LeekWars.get<any>('ranking/get-home-ranking').then((data) => {
				data.data.leeks[0].style = data.data.farmers[0].style = 'first'
				data.data.leeks[1].style = data.data.farmers[1].style = 'second'
				data.data.leeks[2].style = data.data.farmers[2].style = 'third'
				this.farmer_ranking = data.data.farmers
				this.leek_ranking = data.data.leeks
			})
		}

		submit(e: Event) {
			e.preventDefault()
			this.errors = {}
			if (this.password1 !== this.password2) {
				this.addError('password2', i18n.t('farmer.error_not_same_password') as string)
				return false
			}
			LeekWars.post('farmer/register', {
				login: this.login,
				password: this.password1,
				email: this.email,
				leek_name: this.leek,
				godfather: this.godfather
			}).then((data) => {
				if (data.data.success) {
					this.successDialog = true
				} else {
					for (const error of data.data.errors) {
						const form = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][error[0]]
						this.addError(form, i18n.t('farmer.error_' + error[1], error[2]) as string)
					}
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
			this.bigImage = image[0].replace('_small', '')
			this.bigImageLegend = image[1]
		}
	}
</script>

<style lang="scss" scoped>
	.top .panel {
		margin-right: 15px;
	}
	@media screen and (max-width: 900px) {
		.top .column6:nth-child(2) .panel {
			margin-top: 15px;
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
		padding: 10px;
		b {
			font-weight: 400;
		}
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
		border: 2px solid #ddd;
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
	.signup-message {
		padding: 20px;
	}
	.screenshots {
		.screenshot {
			padding: 10px;
		}
		img {
			width: 100%;
			cursor: zoom-in;
			border-radius: 4px;
		}
		.legend {
			text-align: center;
			font-size: 18px;
			font-weight: 300;
			color: #333;
		}
	}
	.bigscreen {
		z-index: 1000;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 100px 0;
		text-align: center;
		background: rgba(0,0,0,0.7);
		img {
			max-width: 1000px;
			box-shadow: 0px 0px 80px black;
			cursor: zoom-out;
			border-radius: 10px;
			border: 10px solid white;
		}
	}
	.biglegend {
		padding-top: 10px;
		color: white;
		font-size: 20px;
		text-shadow: 0px 0px 20px black;
	}
	.cgu {
		font-size: 11px;
		text-align: center;
		a {
			color: #5fad1b;
		}
	}
	.ranking {
		margin: 0 auto;
		width: calc(100% - 20px);
		td {
			border-bottom: 1px solid #ddd;
			border-right: 1px solid #ddd;
			text-align: center;
			padding: 4px 12px;
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
	}
	h4 {
		margin: 10px;
	}
</style>