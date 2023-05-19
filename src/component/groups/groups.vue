<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
		</div>
		<panel class="first">

			<div class="intro">
				<h2>{{ $t('intro') }}</h2>

				<span v-html="$t('intro2')"></span>
			</div>

			<div class="targets">
				<div class="target card">
					<div class="image">
						<leek-image :leek="{level: 200, hat: 7, face: 1}" :scale="0.6" />
						<leek-image :leek="{level: 20, hat: 31, face: 1}" :scale="0.52" :invert="true" />
						<leek-image :leek="{level: 20, hat: 31, face: 1}" :scale="0.52" :invert="true" />
						<leek-image :leek="{level: 20, hat: 31, face: 1}" :scale="0.52" :invert="true" />
					</div>
					<div class="title">{{ $t('education') }}</div>
					{{ $t('education_desc') }}
				</div>
				<div class="target card">
					<div class="image">
						<leek-image :leek="{level: 300, hat: 2, skin: 12, face: 1}" :scale="0.43" />
						<leek-image :leek="{level: 200, hat: 7, skin: 43, face: 1}" :scale="0.42" />
						<leek-image :leek="{level: 250, hat: 35, skin: 17, face: 1}" :scale="0.43" :invert="true" />
						<leek-image :leek="{level: 200, hat: 7, skin: 20, face: 1}" :scale="0.42" :invert="true" />
					</div>
					<div class="title">{{ $t('enterprise') }}</div>
					{{ $t('enterprise_desc') }}
				</div>
				<div class="target card">
					<div class="image">
						<leek-image :leek="{level: 200, skin: 2, hat: 10, face: 1}" :scale="0.44" />
						<leek-image :leek="{level: 200, skin: 3, hat: 17, face: 1}" :scale="0.44" />
						<leek-image :leek="{level: 200, skin: 4, hat: 6, face: 1}" :scale="0.44" :invert="true" />
						<leek-image :leek="{level: 200, skin: 5, hat: 8, face: 1}" :scale="0.44" :invert="true" />
					</div>
					<div class="title">{{ $t('players') }}</div>
					{{ $t('players_desc') }}
				</div>
			</div>

			<h2>{{ $t('features') }}</h2>
			<div class="features">
				<div class="feature card">
					<v-icon>mdi-account-group</v-icon>
					<div>{{ $t('private_page') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-account-edit</v-icon>
					<div>{{ $t('create_members') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-chat</v-icon>
					<div>{{ $t('chat') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-sword</v-icon>
					<div>{{ $t('equipment') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-finance</v-icon>
					<div>{{ $t('stats') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-trophy</v-icon>
					<div>{{ $t('tournaments') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-sword-cross</v-icon>
					<div>{{ $t('br') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-cogs</v-icon>
					<div>{{ $t('options') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-security</v-icon>
					<div>{{ $t('data_safety') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-face-agent</v-icon>
					<div>{{ $t('support') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-help-circle-outline</v-icon>
					<div>{{ $t('training') }}</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-flash-outline</v-icon>
					<div>{{ $t('no_install') }}</div>
				</div>

			</div>

			<h2>{{ $t('offers') }}</h2>
			<div class="offers">
				<div class="offer card">
					<div class="title">🥈 {{ $t('platinum') }}</div>
					<div class="item"><v-icon>mdi-check</v-icon> {{ $t('offer_manage') }}</div>
					<div class="item"><v-icon>mdi-check</v-icon> {{ $t('offer_equipment') }}</div>
					<div class="item"><v-icon>mdi-check</v-icon> {{ $t('offer_tournament') }}</div>
					<div class="item"><v-icon>mdi-check</v-icon> <span v-html="$t('offer_money_10m')"></span></div>
					<div class="spacer"></div>
					<div class="price">299 €/{{ $t('per_group') }}</div>
					<a :href="'mailto:contact@leekwars.com?subject=' + $t('platinum_subject')" target="_blank">
						<v-btn color="primary">{{ $t('contact_us') }}</v-btn>
					</a>
				</div>
				<div class="offer card">
					<div class="title">💎 Diamant</div>
					<div class="item"><v-icon>mdi-check</v-icon> <span v-html="$t('offer_plus')"></span></div>
					<div class="plus">+</div>
					<div class="item"><v-icon>mdi-check</v-icon> <span v-html="$t('offer_money_100m')"></span></div>
					<div class="item"><v-icon>mdi-check</v-icon> {{ $t('offer_code') }}</div>
					<div class="item"><v-icon>mdi-check</v-icon> {{ $t('offer_custom') }}</div>
					<div class="item"><v-icon>mdi-check</v-icon> {{ $t('offer_support') }}</div>
					<div class="spacer"></div>
					<div class="price">799 €/{{ $t('per_group') }}</div>
					<a :href="'mailto:contact@leekwars.com?subject=' + $t('diamond_subject')" target="_blank">
						<v-btn color="primary">{{ $t('contact_us') }}</v-btn>
					</a>
				</div>
			</div>
			<!-- <div class="small">¹ Un jour de support offert, 49€ par jour supplémentaire</div> -->
		</panel>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Component({ name: 'groups', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })
	export default class Groups extends Vue {

		get breadcrumb_items() {
			return [
				{ name: 'Leek Wars', link: '/' },
				{ name: this.$t('title'), link: '/groups' },
			]
		}

		created() {
			LeekWars.setTitle(this.$t('title'))
		}
	}
</script>

<style lang="scss" scoped>
.panel {
	padding: 15px;
}
#app.app .panel {
	padding: 0;
}

.intro {
	font-size: 16px;
	line-height: 1.5;
}
h2 {
	font-weight: 500;
	font-size: 28px;
	margin-bottom: 10px;
	// color: #5fad1b;
}
.targets {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 30px;
	margin-top: 15px;
	margin-bottom: 30px;
	.target {
		padding: 20px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		.image {
			margin-bottom: 10px;
		}
		.title {
			font-size: 20px;
			font-weight: 500;
			margin-bottom: 5px;
			color: #5fad1b;
		}
	}
}

.features {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 15px;
	margin-top: 15px;
	margin-bottom: 30px;
	.feature {
		display: flex;
		gap: 12px;
		padding: 10px 15px;
		align-items: center;
		.v-icon {
			font-size: 28px;
			color: #555;
		}
	}
}

.offers {
	display: flex;
	gap: 30px;
	margin-top: 15px;
	flex-wrap: wrap;
	justify-content: center;
	.offer {
		max-width: 300px;
		padding: 20px;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		border: 1px solid #aaa;
		.title {
			font-size: 21px;
			font-weight: 500;
			margin-bottom: 15px;
		}
		.item {
			display: flex;
			align-items: center;
			gap: 5px;
			font-size: 15px;
			margin: 5px 0;
			.v-icon {
				color: #5fad1b;
			}
		}
		.price {
			text-align: right;
			font-size: 19px;
			margin-top: 10px;
			font-weight: 500;
		}
		.plus {
			font-size: 30px;
			text-align: center;
		}
		a {
			width: 100%;
		}
		.v-btn {
			width: 100%;
			margin-top: 30px;
		}
	}
}
</style>