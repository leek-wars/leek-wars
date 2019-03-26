<template>
	<div>
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Services</h1>
			<div class="tabs">
				<div class="tab disabled">{{ services ? services.length : '...' }} services</div>
			</div>
		</div>
		<panel class="first">
			<loader v-if="!services" />
			<div v-else id="services">
				<div v-for="(service, s) of services" :key="s" class="service card">
					<span class="module">{{ service.module }}</span>/<span class="function">{{ service.function }}</span>
					<template v-for="(parameter, p) in service.parameters"><span :key="p + '_'">/</span><span :key="p" class="parameter">&lt;{{ parameter }} <span class="parameter-type">{{ service.parameters_types[p] }}</span>&gt;</span>
					</template>
					<template v-if="service.returns.length > 0">&nbsp;→ <span class="returns">{{ service.returns.join(", ") }}</span></template>
					<br>
					<span class="label">{{ service.method }}</span>
					<span v-if="service.admin" class="label admin">Admin</span>
					<span v-if="!service.implemented" class="label not-implemented">Non implémenté</span>
					<span v-else class="label implemented">Implémenté</span>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminServices extends Vue {
		services: any = null
		created() {
			LeekWars.setTitle("Services")
			LeekWars.get<any>('service/get-all-admin').then((data) => {
				this.services = data.services
			})
		}
	}
</script>

<style lang="scss" scoped>
	.service {
		padding: 10px;
		vertical-align: top;
		font-size: 20px;
		color: #ccc;
		margin-bottom: 10px
	}
	.service .module {
		color: #5fad1b;
	}
	.service .function, .service .returns {
		color: black;
	}
	.service .parameter {
		color: #777;
	}
	.service .parameter-type {
		font-size: 12px;
	}
	.service .label {
		color: white;
		background: #999;
		border-radius: 2px;
		padding: 2px 5px;
		font-size: 12px;
		font-weight: bold;
	}
	.service .not-implemented {
		background: red;
	}
	.service .implemented {
		background: #5fad1b;
	}
	.service .admin {
		background: #009aff;
	}
</style>