<template lang="html">
	<div class="help">
		<div class="page-header page-bar">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
		</div>
		<panel class="first">
			<div slot="content" class="wrapper">
				<center>
					<img src="/image/help/AdvancedFightDescription.png">
					<br><br>
					<h2>{{ $t('main_title') }}</h2>
					<br>
				</center>

				<p>{{ $t('introduction') }}</p>
				<p>{{ $t('introduction2') }}</p>

				<div class="help-menu">
					<a href="#AttackOrder"><div class="item card">{{ $t('attack_order_title') }}</div></a>
					<a href="#Weapon"><div class="item card">{{ $t('weapon_title') }}</div></a>
					<a href="#Strength"><div class="item card">{{ $t('strength_title') }}</div></a>
					<a href="#Armor"><div class="item card">{{ $t('armor_title') }}</div></a>
					<a href="#Lifesteal"><div class="item card">{{ $t('lifesteal_title') }}</div></a>
					<a href="#DamageReturn"><div class="item card">{{ $t('damagereturn_smalltitle') }}</div></a>
					<a href="#Nova"><div class="item card">{{ $t('nova_title') }}</div></a>
					<a href="#Special"><div class="item card">{{ $t('special_smalltitle') }}</div></a>
				</div>
			</div>
		</panel>

		<panel id="AttackOrder" :title="$t('attack_order_title')">
			<div slot="content" class="wrapper">
				<p>{{ $t('attack_order_1') }}</p>
				<p>{{ $t('attack_order_2') }}</p>
				<ul>
					<li>{{ $t('attack_order_3') }}</li>
					<li>{{ $t('attack_order_4') }}</li>
					<li>{{ $t('attack_order_5') }}</li>
					<li>{{ $t('attack_order_6') }}</li>
					<li>{{ $t('attack_order_7') }}</li>
					<li>{{ $t('attack_order_8') }}</li>
				</ul>
				<p>{{ $t('attack_order_9') }}</p>
				<ul>
					<li>{{ $t('attack_order_10') }}</li>
					<li>{{ $t('attack_order_11') }}</li>
					<li>{{ $t('attack_order_12') }}</li>
				</ul>
			</div>
		</panel>

		<panel id="Weapon" :title="$t('weapon_title')">
			<div slot="content" class="wrapper">
				<p v-html="$t('weapon_1')"></p>
				<p>{{ $t('weapon_2') }}</p>
				<p>{{ $t('weapon_3') }}</p>
				<p>{{ $t('weapon_4') }}</p>
				<p>{{ $t('weapon_5') }}</p>
				<p>{{ $t('weapon_6') }}</p>
			</div>
		</panel>

		<panel id="Strength" :title="$t('strength_title')">
			<div slot="content" class="wrapper">
				<p v-html="$t('strength_1')"></p>
				<div class="formula">{{ $t('strength_2') }}</div>
				<p>{{ $t('strength_3') }}</p>
				<p>{{ $t('strength_4') }}</p>
				<p v-html="$t('strength_5')"></p>
			</div>
		</panel>

		<panel id="Armor" :title="$t('armor_title')">
			<div slot="content" class="wrapper">
				<p v-html="$t('ignoredForPoison')"></p>
				<p>{{ $t('armor_2') }}</p>
				<div class="formula">{{ $t('armor_3') }}</div>
				<p>{{ $t('armor_4') }}</p>
				<p>{{ $t('armor_5') }}</p>
				<p>{{ $t('armor_6') }}</p>
				<p>{{ $t('armor_7') }}</p>
				<p>{{ $t('armor_8') }}</p>
				<p>{{ $t('armor_9') }}</p>
				<h3>{{ $t('vulnerability_1') }}</h3>
				<p v-html="$t('vulnerability_2')"></p>
				<p>{{ $t('vulnerability_3') }}</p>
				<p>{{ $t('vulnerability_4') }}</p>
				<p>{{ $t('vulnerability_5') }}</p>
				<p>{{ $t('vulnerability_6') }}</p>
			</div>
		</panel>

		<panel id="Lifesteal" :title="$t('lifesteal_title')">
			<div slot="content" class="wrapper">
				<p v-html="$t('ignoredForPoison')"></p>
				<p v-html="$t('lifesteal_1')"></p>
				<div class="formula">{{ $t('lifesteal_2') }}</div>
				<p>{{ $t('lifesteal_3') }}</p>
				<p>{{ $t('lifesteal_4') }}</p>
				<ul>
					<li>{{ $t('lifesteal_5') }}</li>
					<li>{{ $t('lifesteal_6') }}</li>
					<li>{{ $t('lifesteal_7') }}</li>
				</ul>
			</div>
		</panel>

		<panel id="DamageReturn" :title="$t('damagereturn_title')">
			<div slot="content" class="wrapper">
				<p v-html="$t('ignoredForPoison')"></p>
				<p v-html="$t('damagereturn_1')"></p>
				<div class="formula">{{ $t('damagereturn_2') }}</div>
				<p>{{ $t('damagereturn_3') }}</p>
				<p>{{ $t('damagereturn_4') }}</p>
				<p>{{ $t('damagereturn_5') }}</p>
			</div>
		</panel>

		<panel id="Nova" :title="$t('nova_title')">
			<div slot="content" class="wrapper">
				<p>{{ $t('nova_1') }}</p>
				<p>{{ $t('nova_2') }}</p>
				<p>{{ $t('nova_3') }}</p>
				<p>{{ $t('nova_4') }}</p>
				<p>{{ $t('nova_5') }}</p>
			</div>
		</panel>

		<panel id="Special" :title="$t('special_title')">
			<div slot="content" class="wrapper">
				<h3>{{ $t('special_1') }}</h3>
				<p>{{ $t('special_2') }}</p>
				<h3>{{ $t('special_3') }}</h3>
				<p v-html="$t('special_4')"></p>
			</div>
		</panel>

		<panel class="last">
			<div slot="content" class="wrapper">
				<div class="credits" v-html="$t('credits')"></div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Component({ name: "general_help", i18n: {}, mixins, components: { Breadcrumb } })
	export default class GeneralHelp extends Vue {
		created() {
			LeekWars.setTitle(this.$t('title'))
			this.$root.$emit('loaded')
		}

		get breadcrumb_items() {
			return [
				{name: this.$t('main.help'), link: '/help'},
				{name: this.$t('main_title'), link: '/help/advanced-fight-description'}
			]
		}
	}</script>

<style lang="scss" scoped>
	h3 {
		margin-top: 10px;
		margin-bottom: 5px;
	}

	#app.app h3 {
		margin-left: 0;
	}

	p {
		margin-bottom: 10px;
		margin-left: 20px;
		margin-right: 20px;
		text-align: justify;
		font-size: 16px;
	}

	#app.app p {
		margin-left: 10px;
		margin-right: 10px;
		margin-top: 10px;
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
			margin: 6px;
			padding: 10px;
			text-align: center;
			width: 130px;
			border: 2px solid #0000;
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

	#app.app .formula {
		margin: 5px 0;
	}

	.credits {
		text-align: right;
		color: #999;
		font-style: italic;
	}

	.help .panel {
		background: #e3e3e3;
		padding: 0;
	}

	.panel .wrapper {
		max-width: 800px;
		margin: 0 auto;
		background: #f2f2f2;
		padding: 15px;
	}

	#app.app .panel .wrapper {
		padding: 8px 0;
	}
</style>