<template lang="html">
	<div v-if="fun" class="doc-function lw" :class="{deprecated: fun.deprecated}">
		<h2>
			{{ fun.name }}(<span v-for="(arg, i) in fun.arguments_names" :key="i"><span v-if="fun.optional[i]">[</span><span class="argument">{{ $t('doc.arg_type_' + fun.arguments_types[i]) }}</span>&nbsp;{{ arg }}<span v-if="fun.optional[i]">]</span><span v-if="i < fun.arguments_names.length - 1">,&nbsp;</span>
			</span>)
			<span v-if="fun.return_type != 0">
				&nbsp;<span class="arrow">→</span> <span class="argument"> {{ $t('doc.arg_type_' + fun.return_type) }}</span>&nbsp;{{ fun.return_name }}
			</span>
			<div class="spacer"></div>
			<router-link class="encyclo" :to="'/encyclopedia/' + $i18n.locale + '/' + fun.name" :title="'Encyclopédie > ' + fun.name + '()'">
				<v-icon class="book">mdi-book-open-page-variant</v-icon>
			</router-link>
		</h2>
		<div v-if="fun.deprecated" v-dochash class="deprecated-message">
			{{ $t('doc.deprecated_function') }}
			<span v-if="fun.replacement">{{ $t('doc.replaced_by', ['#' + FUNCTION_BY_ID[fun.replacement].name]) }}</span>
		</div>


		<div v-if="new_fun">
			<markdown v-if="LeekWars.encyclopedia[$i18n.locale] && Object.keys(LeekWars.encyclopedia[$i18n.locale]).length" :content="new_fun.description" :pages="{}" mode="encyclopedia" />

			<div v-for="(section, s) in new_fun.primary" :key="s">
				<h4>{{ s }}</h4>
				<markdown :content="section" :pages="{}" mode="encyclopedia" />
			</div>
			<div class="operations">
				<i18n-t v-if="fun.complexity == 1" keypath="doc.operations"><b slot="o">{{ fun.operations }}</b></i18n-t>
				<i18n-t v-else keypath="doc.complexity">
					<b slot="c">{{ LeekWars.complexities[fun.complexity] }}</b>
				</i18n-t>
			</div>
			<div v-if="Object.values(new_fun.secondary).length" class="expand" @click.stop="expanded = !expanded">{{ $t('doc.details') }} ({{ Object.values(new_fun.secondary).length }})<v-icon v-if="expanded">mdi-chevron-up</v-icon><v-icon v-else>mdi-chevron-down</v-icon></div>
			<div v-if="expanded" class="secondary">
				<div v-for="(section, s) in new_fun.secondary" :key="s">
					<h4>{{ s }}</h4>
					<markdown :content="section" :pages="{}" mode="encyclopedia" />
				</div>
			</div>
		</div>
		<div v-else>
			<div v-dochash v-code class="content" v-html="$t('doc.func_' + fun.name)"></div>

			<template v-if="fun.arguments_names.length > 0">
				<h4>{{ $t('doc.parameters') }}</h4>
				<ul>
					<li v-for="(arg, i) in fun.arguments_names" :key="i">{{ arg }} <span v-if="fun.optional[i]">({{ $t('doc.optional') }})</span> : <span v-dochash v-code v-html="$t('doc.func_' + fun.name + '_arg_' + (parseInt(i) + 1))"></span></li>
				</ul>
			</template>

			<div v-if="fun.return_type != 0">
				<h4>{{ $t('doc.return') }}</h4>
				<ul>
					<li>{{ fun.return_name }} : <span v-dochash v-code v-html="$t('doc.func_' + fun.name + '_return')"></span>
					</li>
				</ul>
			</div>
			<div class="operations">
				<i18n-t v-if="fun.complexity == 1" keypath="doc.operations"><b slot="o">{{ fun.operations }}</b></i18n-t>
				<i18n-t v-else keypath="doc.complexity">
					<b slot="c">{{ LeekWars.complexities[fun.complexity] }}</b>
				</i18n-t>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { FUNCTION_BY_ID } from '@/model/function_by_id'
	import { locale } from '@/locale'
	import { LSFunction } from '@/model/function'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'documentation-function', components: { Markdown } })
	export default class DocumentationFunction extends Vue {

		@Prop() fun!: LSFunction

		FUNCTION_BY_ID = FUNCTION_BY_ID
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
		font-family: monospace;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}
	h4 {
		font-weight: 500;
		margin: 0;
		margin-top: 10px;
		margin-bottom: 8px;
		font-size: 15px;
		color: var(--text-color);
	}
	.argument {
		color: var(--type-color);
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
		color: #0645ad;
		font-weight: 500;
		&:hover {
			text-decoration: underline;
		}
	}
	::v-deep ul {
		margin: 5px 0;
	}
	.doc-function .md {
		padding: 0 !important;
		::v-deep pre code {
			margin-bottom: 0;
		}
		// ::v-deep p {
		// 	font-size: 15px;
		// }
	}
	.expand {
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		padding-top: 12px;
		user-select: none;
	}
	.encyclo {
		color: #aaa;
		margin-left: 12px;
		i {
			font-size: 18px;
		}
		&:hover {
			text-decoration: none;
			color: #000;
		}
	}
</style>