<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div class="panel">
			<div class="content">
				<div class="wrapper">

					<center>
						<img src="/image/signup_illustration.png">
						<h2>{{ $t('welcome') }}</h2>
					</center>

					<i18n tag="p" path="intro">
						<router-link place="tutorial" to="/help/tutorial">{{ $t('intro_tuto') }}</router-link>
					</i18n>

					<div class="help-menu">
						<a href="#farmer"><div class="item">{{ $t('farmer') }}</div></a>
						<a href="#habs"><div class="item">{{ $t('habs') }}</div></a>
						<a href="#leeks"><div class="item">{{ $t('leeks') }}</div></a>
						<a href="#weapons"><div class="item">{{ $t('weapons') }}</div></a>
						<a href="#chips"><div class="item">{{ $t('chips') }}</div></a>
						<a href="#teams"><div class="item">{{ $t('teams') }}</div></a>
						<a href="#fights"><div class="item">{{ $t('fights') }}</div></a>
						<a href="#challenges"><div class="item">{{ $t('challenges') }}</div></a>
						<a href="#tournaments"><div class="item">{{ $t('tournaments') }}</div></a>
						<a href="#trophies"><div class="item">{{ $t('trophies') }}</div></a>
						<a href="#editor"><div class="item">{{ $t('editor') }}</div></a>
					</div>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="farmer">{{ $t('farmer') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('farmer_1') }}</p>

					<p>{{ $t('farmer_2') }}</p>

					<p>{{ $t('farmer_3') }}
						<ul>
							<li>{{ $t('farmer_4') }}</li>
							<li>{{ $t('farmer_5') }}</li>
							<li>{{ $t('farmer_6') }}</li>
							<li>{{ $t('farmer_7') }}</li>
						</ul>
					</p>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="header">
				<h2 id="habs">{{ $t('habs') }}</h2>
			</div>
			<div class="content">
				<div class="wrapper">
					<i18n tag="p" path="habs_1">
						<span place="icon" class='hab'></span>
					</i18n>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="leeks">{{ $t('leeks') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<!-- intro -->
					<p v-html="$t('leeks_1')"></p>
					<p>{{ $t('leeks_2') }}</p>
					<p>{{ $t('leeks_3') }}</p>
					<p>{{ $t('leeks_4') }}</p>

					<!-- life -->
					<h3>{{ $t('leeks_5') }}</h3>
					<p>{{ $t('leeks_6') }}</p>

					<!-- force -->
					<h3>{{ $t('leeks_11') }}</h3>
					<p>{{ $t('leeks_12') }}</p>
					<div class="formula">{{ $t('leeks_13') }}</div>

					<!-- wisdom -->
					<h3>{{ $t('leeks_7') }}</h3>
					<p>{{ $t('leeks_8') }}</p>
					<div class="formula">{{ $t('leeks_9') }}</div>
					<div class="formula">{{ $t('leeks_10') }}</div>

					<!-- agility -->
					<h3>{{ $t('leeks_14') }}</h3>
					<p>{{ $t('leeks_15') }}</p>
					<div class="formula">{{ $t('leeks_16') }}</div>
					<p>{{ $t('leeks_34') }}</p>
					<div class="formula">{{ $t('leeks_32') }}</div>

					<!-- resistance -->
					<h3>{{ $t('leeks_33') }}</h3>
					<p>{{ $t('leeks_36') }}</p>
					<p>{{ $t('leeks_17') }}</p>
					<div class="formula">{{ $t('leeks_18') }}</div>
					<div class="formula">{{ $t('leeks_19') }}</div>
					<p>{{ $t('leeks_35') }}</p>
					<div class="formula">{{ $t('leeks_21') }}</div>

					<!-- science -->
					<h3>{{ $t('leeks_28') }}</h3>
					<p>{{ $t('leeks_29') }}</p>
					<div class="formula">{{ $t('leeks_37') }}</div>

					<!-- magic -->
					<h3>{{ $t('leeks_30') }}</h3>
					<p>{{ $t('leeks_31') }}</p>
					<div class="formula">{{ $t('leeks_38') }}</div>
					<div class="formula">{{ $t('leeks_41') }}</div>

					<!-- frequency -->
					<h3>{{ $t('leeks_26') }}</h3>
					<p>{{ $t('leeks_27') }}</p>

					<!-- tp -->
					<h3>{{ $t('leeks_22') }}</h3>
					<p>{{ $t('leeks_23') }}</p>

					<!-- mp -->
					<h3>{{ $t('leeks_24') }}</h3>
					<p>{{ $t('leeks_25') }}</p>

				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="weapons">{{ $t('weapons') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('weapons_1') }}</p>

					<center>
						<img src="/image/weapon/pistol.png"> &nbsp; &nbsp;
						<img src="/image/weapon/laser.png"> &nbsp; &nbsp;
						<img src="/image/weapon/electrisor.png">
					</center>

					<p>{{ $t('weapons_2') }}</p>
					<p>{{ $t('weapons_3') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="chips">{{ $t('chips') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('chips_1') }}</p>

					<center>
						<img width="60" src="/image/chip/small/flash.png"> &nbsp;
						<img width="60" src="/image/chip/small/cure.png"> &nbsp;
						<img width="60" src="/image/chip/small/fortress.png"> &nbsp;
						<img width="60" src="/image/chip/small/doping.png">
					</center>

					<p>{{ $t('chips_2') }}</p>

					<p>{{ $t('chips_3') }}</p>
					<p>{{ $t('chips_4') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="teams">{{ $t('teams') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('teams_1') }}</p>

					<p v-html="$t('teams_2')"></p>

					<h3>{{ $t('teams_3') }}</h3>
					<p>{{ $t('teams_4') }}</p>

					<h3>{{ $t('teams_5') }}</h3>
					<p>{{ $t('teams_6') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="fights">{{ $t('fights') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('fights_1') }}</p>
					<ul>
						<li>{{ $t('fights_2') }}</li>
						<li>{{ $t('fights_3') }}</li>
						<li>{{ $t('fights_4') }}</li>
						<li>{{ $t('fights_5') }}</li>
					</ul>
					<p v-html="$t('fights_6')"></p>
					<p>{{ $t('fights_7') }}</p>

					<h3>{{ $t('fights_8') }}</h3>
					<p v-html="$t('fights_9')"></p>
					<p>{{ $t('fights_10') }}</p>

					<h3>{{ $t('fights_11') }}</h3>
					<p>{{ $t('fights_12') }}</p>
					<p>{{ $t('fights_13') }}</p>

					<h3>{{ $t('fights_14') }}</h3>
					<p v-html="$t('fights_15')"></p>
					<p>{{ $t('fights_16') }}</p>

					<h3>{{ $t('fights_17') }}</h3>
					<p>{{ $t('fights_18') }}</p>
					<p>{{ $t('fights_19') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="header">
				<h2 id="challenges">{{ $t('challenges') }}</h2>
			</div>
			<div class="content">
				<div class="wrapper">
					<p v-html="$t('challenges_1')"></p>
					<p>{{ $t('challenges_2') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="tournaments">{{ $t('tournaments') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('tournaments_1') }}</p>
					<ul>
						<li>{{ $t('tournaments_2') }}</li>
						<li>{{ $t('tournaments_3') }}</li>
						<li>{{ $t('tournaments_13') }}</li>
					</ul>

					<h3>{{ $t('tournaments_4') }}</h3>

					<p>{{ $t('tournaments_5') }}</p>
					<p>{{ $t('tournaments_6') }}</p>

					<h3>{{ $t('tournaments_7') }}</h3>

					<p>{{ $t('tournaments_8') }}</p>
					<p>{{ $t('tournaments_9') }}</p>

					<h3>{{ $t('tournaments_10') }}</h3>

					<p>{{ $t('tournaments_11') }}</p>
					<p>{{ $t('tournaments_12') }}</p>
				</div>
			</div>
		</div>


		<div class="panel">
			<div class="header">
				<h2 id="trophies">{{ $t('trophies') }}</h2>
			</div>
			<div class="content">
				<div class="wrapper">
					<p>{{ $t('trophies_1') }}</p>
					<p>{{ $t('trophies_2') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="header">
				<h2 id="editor">{{ $t('editor') }}</h2>
			</div>
			<div class="content">
				<div class="wrapper">
					<p>{{ $t('editor_1') }}</p>
					<p v-html="$t('editor_2')"></p>
					<i18n tag="p" path="editor_3">
						<router-link place="tutorial" to="/help/tutorial">{{ $t('editor_tuto') }}</router-link>
					</i18n>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="content">
				<div class="wrapper">
					<div class="credits" v-html="$t('credits')"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	
	@Component({ name: "general_help", i18n: {} })
	export default class GeneralHelp extends Vue {
		created() {
			LeekWars.setTitle(this.$t('title'))
		}
	}
</script>

<style lang="scss" scoped>
	h3 {
		margin-top: 10px;
		margin-bottom: 5px;
	}
	p {
		margin-bottom: 10px;
		margin-left: 20px;
		margin-right: 20px;
		text-align: justify;
		font-size: 16px;
	}
	ul {
		font-size: 16px;
	}
	.panel a {
		color: #5fad1b;
	}
	.help-menu {
		margin-top: 20px;
		text-align: center;
	}
	.help-menu .item {
		display: inline-block;
		vertical-align: bottom;
		margin: 10px;
		padding: 10px;
		text-align: center;
		width: 130px;
		border: 2px solid #ddd;
		background: white;
		font-weight: 300;
		color: #555;
		font-size: 18px;
		cursor: pointer;
	}
	.help-menu .item:hover {
		border: 2px solid #5fad1b;
		color: #5fad1b;
	}
	.formula {
		background: white;
		font-family: monospace;
		padding: 8px 10px;
		margin: 5px 15px;
		border-radius: 3px;
		display: block;
		border-bottom: 2px solid #ddd;
	}
	.credits {
		text-align: right;
		color: #999;
		font-style: italic;
	}
	.panel .content {
		background: rgba(100,100,100,0.1);
		padding: 0;
	}
	.panel .wrapper {
		max-width: 800px;
		margin: 0 auto;
		background: #f2f2f2;
		padding: 15px;
	}
</style>