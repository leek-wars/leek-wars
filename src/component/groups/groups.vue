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

			<div class="screenshots">
				<a href="/image/groups/members.png" target="_blank">
					<img src="/image/groups/members.png">
					<div>{{ $t('create_members') }}</div>
				</a>
				<a href="/image/groups/equipment.png" target="_blank">
					<img src="/image/groups/equipment.png">
					<div>{{ $t('equipment') }}</div>
				</a>
				<a href="/image/feature/tournament.webp" target="_blank">
					<img src="/image/feature/tournament.webp">
					<div>{{ $t('tournaments') }}</div>
				</a>
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

			<h2>{{ $t('customers') }}</h2>
			<div class="customers">
				<div>
					<img src="/image/partner/esiea.png">
				</div>
				<div>
					<img src="/image/partner/jsb.png">
				</div>
				<div>
					<img src="/image/partner/norauto.png">
				</div>
				<div>
					<img src="/image/partner/n-hitec.png">
				</div>
			</div>

			<div class="testimonies">
				<div class="testimony">
					<!-- <avatar :farmer="{id: -1, avatar_changed: 0}" /> -->
					<div class="card">
						« {{ $t('testimony_n_hitec') }} »
					</div>
					<img src="/image/partner/n-hitec.png">
				</div>

				<div class="testimony">
					<!-- <avatar :farmer="{id: -1, avatar_changed: 0}" /> -->
					<div class="card">
						« {{ $t('testimony_norauto') }} »
					</div>
					<img src="/image/partner/norauto.png">
				</div>
			</div>
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
	font-size: 25px;
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
	margin-bottom: 40px;
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
.customers {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	align-items: center;
	gap: 15px;
	margin-top: 15px;
	justify-content: center;
	text-align: center;
	img {
		max-width: 150px;
		max-height: 120px;
	}
}
.screenshots {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 15px;
	a {
		color: #555;
		font-size: 13px;
		text-align: center;
	}
	img {
		min-width: 200px;
		max-width: 100%;
		max-height: 180px;
		object-fit: contain;
		box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		margin-bottom: 6px;
	}
}
#app.app {
	.screenshots {
		flex-wrap: wrap;
	}
}
.testimonies {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
	margin-top: 40px;
	gap: 25px;
	.testimony {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 15px;
		img {
			width: 120px;
			max-height: 60px;
			object-fit: contain;
		}
		.card {
			padding: 20px;
			line-height: 1.5;
			font-size: 16px;
			font-style: italic;
			color: #555;
			text-align: justify;
		}
	}
}
#app.app {
	.testimonies {
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	}
}
</style>