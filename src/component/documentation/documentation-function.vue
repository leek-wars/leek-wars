<template lang="html">
	<div v-if="fun" class="doc-function" :class="{deprecated: fun.deprecated}">
		<h2>
			{{ fun.name }}(<span v-for="(arg, i) in fun.arguments_names" :key="i"><span v-if="fun.arguments_types[i] != -1" class="argument">{{ $t('doc.arg_type_' + fun.arguments_types[i]) }}</span><span v-else class="argument">?</span>&nbsp;{{ arg }}<span v-if="i < fun.arguments_names.length - 1">, </span>
			</span>)
			<span v-if="fun.return_type != 0">
				<span class="arrow">→</span> <span v-if="fun.return_type != -1" class="argument"> {{ $t('doc.arg_type_' + fun.return_type) }}</span><span v-else class="argument">?</span>&nbsp;{{ fun.return_name }}
			</span>
		</h2>
		<div v-if="fun.deprecated" v-dochash class="deprecated-message">
			Cette fonction est dépréciée. <span v-if="fun.replacement">Elle est remplacée par la fonction #{{ LeekWars.functions[fun.replacement - 1].name }}.</span>
		</div>
		<div v-dochash v-code class="content" v-html="$t('doc.func_' + fun.real_name)"></div>

		<template v-if="fun.arguments_names.length > 0">
			<h4>{{ $t('doc.parameters') }}</h4>
			<ul>
				<li v-for="(arg, i) in fun.arguments_names" :key="i">{{ arg }} : <span v-dochash v-code v-html="$t('doc.func_' + fun.real_name + '_arg_' + (parseInt(i) + 1))"></span></li>
			</ul>
		</template>

		<div v-if="fun.return_type != 0">
			<h4>{{ $t('doc.return') }}</h4>
			<ul>
				<li>{{ fun.return_name }} : <span v-dochash v-code v-html="$t('doc.func_' + fun.real_name + '_return')"></span>
				</li>
			</ul>
		</div>
		<div class="operations">
			<b v-if="fun.operations == -1" v-html="$t('doc.variable_operations')"></b>
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
	h2 {
		margin-bottom: 12px;
		font-size: 17px;
		color: #111;
		font-family: monospace;
	}
	.content {
		color: #444;
	}
	h4 {
		font-weight: 500;
		margin: 0;
		color: #111;
		margin-top: 10px;
		margin-bottom: 8px;
		font-size: 15px;
	}
	.argument {
		color: #0000D0;
		font-weight: bold;
	}
	.operations {
		padding-top: 5px;
	}
	.arrow {
		font-size: 30px;
		line-height: 17px;
		vertical-align: top;
	}
	::v-deep a {
		color: #5fad1b;
		font-weight: 500;
		&:hover {
			text-decoration: underline;
		}
	}
	::v-deep ul {
		margin: 5px 0;
	}
</style>