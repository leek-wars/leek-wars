<template>
	<div>
		<div class="page-header page-bar">
			<h1>API</h1>
		</div>
		<panel v-for="(service, s) in services" :key="s" class="service">
			<div class="title">
				<span class="module">{{ service.module }}</span>/<span class="function">{{ service.function }}</span>
				<template v-for="(parameter, p) in service.parameters">
					<span :key="p + '-'">/</span>
					<span :key="p" class="parameter">{{ parameter }}</span>
				</template>
				<template v-if="service.returns.length">&nbsp;→ <span class="returns">{{ service.returns.join(", ") }}</span></template>
			</div>
			<div class="label">{{ service.method }}</div>

			<div class="description">{{ $t('api.' + service.module + '_' + service.function) }}</div>

			<div class="parameters">
				<div v-for="(parameter, p) in service.parameters" :key="p" class="parameter">{{ parameter }} : {{ service.parameters_types[p] }}</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'api', i18n: {} })
	export default class Api extends Vue {
		services: any = null
		created() {
			LeekWars.get('service/get-all').then(data => {
				this.services = data.services
				LeekWars.setTitle('API')
			})
		}
	}
</script>

<style lang="scss" scoped>
	.title {
		font-size: 20px;
		color: #aaa;
	}
	.module {
		color: #009aff;
	}
	.function {
		color: #111;
	}
	.parameter {
		color: #888;
	}
	.description {
		margin-top: 5px;
	}
	.service .label {
		display: inline-block;
		color: white;
		background: #aaa;
		border-radius: 2px;
		padding: 2px 5px;
		font-size: 12px;
		font-weight: bold;
		margin-top: 4px;
	}
	.parameters {
		margin-top: 5px;
	}
</style>
