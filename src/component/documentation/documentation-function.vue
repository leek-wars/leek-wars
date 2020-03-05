<template lang="html">
	<div v-if="fun">
		<h2 class="content">
			{{ fun.name }}(<span v-for="(arg, i) in fun.arguments_names" :key="i"><span v-if="fun.arguments_types[i] != -1" class="argument">{{ $t('documentation.arg_type_' + fun.arguments_types[i]) }}</span><span v-else class="argument">?</span>&nbsp;{{ arg }}<span v-if="i < fun.arguments_names.length - 1">, </span>
			</span>)
			<span v-if="fun.return_type != 0">
				<span class="arrow">→</span> <span v-if="fun.return_type != -1" class="argument"> {{ $t('documentation.arg_type_' + fun.return_type) }}</span><span v-else>?</span>&nbsp;{{ fun.return_name }}
			</span>
		</h2>
		<div v-if="fun.deprecated" class="deprecated-message">Cette fonction est dépréciée.</div>
		<div v-dochash v-code class="content" v-html="$t('documentation.func_' + fun.real_name)"></div>

		<template v-if="fun.arguments_names.length > 0">
			<h4>{{ $t('documentation.parameters') }}</h4>
			<ul>
				<li v-for="(arg, i) in fun.arguments_names" :key="i">{{ arg }} : <span v-dochash v-code v-html="$t('documentation.func_' + fun.real_name + '_arg_' + (parseInt(i) + 1))"></span></li>
			</ul>
		</template>

		<div v-if="fun.return_type != 0">
			<h4>{{ $t('documentation.return') }}</h4>
			<ul>
				<li>{{ fun.return_name }} : <span v-dochash v-code v-html="$t('documentation.func_' + fun.real_name + '_return')"></span>
				</li>
			</ul>
		</div>
		<div class="min-stats">
			<b v-if="fun.operations == -1" v-html="$t('documentation.variable_operations')"></b>
			<span v-else><b>{{ fun.operations }}</b> opérations</span>
		</div>
	</div>
</template>

<script lang="ts">
	import { Function } from '@/model/function'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'documentation-function' })
	export default class DocumentationFunction extends Vue {
		@Prop() fun!: Function
	}
</script>

<style lang="scss" scoped>
	.argument {
		color: #5fad1b;
	}
	.min-stats {
		position: absolute;
		top: 10px;
		right: 10px;
		text-align: right;
		color: #777;
		max-width: 110px;
	}
	.content {
		padding-right: 100px;
	}
	.arrow {
		font-size: 30px;
		line-height: 18px;
		vertical-align: top;
	}
</style>