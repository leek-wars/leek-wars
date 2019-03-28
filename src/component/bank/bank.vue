<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first last">
			<div class="bank-description center" v-html="$t('description')"></div>
			<loader v-if="!packs" />
			<template v-else>
				<div v-for="(pack, p) in packs" :key="pack.crystals" class="pack card">
					<img src="/image/bank/crystal_big.png">
					<h2 v-html="$t('pack_of_n_crystals', [pack.crystals])"></h2>
					<br>
					<div class="buy">
						<router-link v-for="(offer, o) in pack.offers" :key="offer.type" :to="'/bank/buy/' + p + '/' + o">
							<div>
								<span class="price">{{ offer.price }}€</span>
								<img :src="'/image/bank/' + offer.type + '.png'">
							</div>
						</router-link>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'bank', i18n: {} })
	export default class Bank extends Vue {
		packs: any = null
		created() {
			LeekWars.get('bank/get-packs').then(data => {
				this.packs = data.packs
				LeekWars.setTitle(this.$i18n.t('bank.title'))
			})
		}
	}
</script>

<style lang="scss" scoped>
	.bank-description {
		padding: 20px;
		font-size: 17px;
	}
	#app.app .bank-description {
		padding: 5px 0;
	}
	.pack {
		padding: 10px;
		margin: 10px;
		min-height: 90px;
	}
	#app.app .pack {
		margin: 10px 0;
	}
	.pack > img {
		float: left;
		margin-right: 20px;
		margin-left: 10px;
		height: 70px;
		margin-top: 15px;
	}
	.pack .buy {
		margin-bottom: 10px;
	}
	.pack .buy div {
		border-radius: 2px;
		padding: 5px 15px;
		margin-right: 15px;
		display: inline-block;
	}
	.pack .buy div:hover {
		background: #eee;
	}
	.pack .price {
		font-weight: 400;
		font-size: 27px;
		color: #777;
	}
	.pack .buy img {
		margin-left: 5px;
		vertical-align: middle;
		margin-top: -10px;
	}
</style>