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
			Cette fonction est dépréciée. <span v-if="fun.replacement">Elle est remplacée par la fonction #{{ LeekWars.functionById[fun.replacement].name }}.</span>
		</div>

		<div v-if="new_fun">
			<router-link class="encyclo" :to="'/encyclopedia/' + fun.name" :title="'Encyclopédie > ' + fun.name + '()'">
				<v-icon class="book">mdi-book-open-page-variant</v-icon>
			</router-link>
			<!-- <div v-dochash v-code class="content" v-html="new_fun.description"></div> -->
			<markdown :content="new_fun.description" :pages="{}" mode="encyclopedia" />

			<div v-for="(section, s) in new_fun.primary" :key="s">
				<h4>{{ s }}</h4>
				<markdown v-if="s === 'Paramètres'" :content="new_arguments" :pages="{}" mode="encyclopedia" />
				<markdown v-else :content="section" :pages="{}" mode="encyclopedia" />
			</div>
			<div class="operations">
				<b v-if="fun.operations == -1" v-html="$t('doc.variable_operations')"></b>
				<span v-else><b>{{ fun.operations }}</b> opérations</span>
			</div>
			<div v-if="Object.values(new_fun.secondary).length" class="expand" @click="expanded = !expanded">Détails ({{ Object.values(new_fun.secondary).length }})<v-icon v-if="expanded">mdi-chevron-up</v-icon><v-icon v-else>mdi-chevron-down</v-icon></div>
			<div v-if="expanded" class="secondary">
				<div v-for="(section, s) in new_fun.secondary" :key="s">
					<h4>{{ s }}</h4>
					<markdown :content="section" :pages="{}" mode="encyclopedia" />
				</div>
			</div>
		</div>
		<div v-else>
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
	</div>
</template>

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { locale } from '@/locale'
	import { Function } from '@/model/function'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'documentation-function', components: { Markdown } })
	export default class DocumentationFunction extends Vue {
		@Prop() fun!: Function
		expanded: boolean = false
		new_fun: any = null

		@Watch('fun', {immediate: true})
		updateFun() {
			LeekWars.documentation(locale).then((functions) => {
				this.new_fun = functions[this.fun.name]
			})
		}

		get new_arguments() {
			if (this.new_fun) {
				const args = (this.new_fun.primary.Paramètres || '').split('\n')
				return args.filter((a: string) => {
					const name = a.match(/\*\*(\w+)\*\*/i)
					return name && this.fun.arguments_names.includes(name[1])
				}).join('\n')
			}
			return ''
		}
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
		padding-top: 8px;
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
	.md {
		padding: 0;
		::v-deep pre code {
			margin-bottom: 0;
		}
		::v-deep p {
			font-size: 15px;
			margin-bottom: 0;
		}
	}
	.expand {
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		padding-top: 8px;
		user-select: none;
	}
	.encyclo {
		position: absolute;
		right: 12px;
		top: 15px;
		color: #aaa;
		i {
			font-size: 18px;
		}
		&:hover {
			text-decoration: none;
			color: #000;
		}
	}
</style>