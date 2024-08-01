<template lang="html">
	<div class="lw">
		<h2>
			<span v-if="keyword.type === 'user-static-method' || keyword.type === 'user-method' || keyword.type === 'user-function' || keyword.kind === KeywordKind.Function || keyword.kind === KeywordKind.Method">
				<span v-if="keyword.clazz">{{ keyword.clazz.label }}.</span>{{ javadoc.name }}(<span v-for="(arg, i) in args" :key="i">
					<type v-if="arg.lstype" :type="arg.lstype" /> {{ arg.name }}<span v-if="i < args.length - 1">,&nbsp;</span></span>)
				<span v-if="keyword.return_type" class="arrow">→</span> <type v-if="keyword.return_type" :type="keyword.return_type" /> <span v-if="return_"> {{ return_.name }}</span>
			</span>
			<span v-else-if="keyword.type === 'user-static-field' || keyword.kind === KeywordKind.Field"><type v-if="javadoc.lstype" :type="javadoc.lstype" /> {{ keyword.clazz.label }}.{{ javadoc.name }}</span>
			<span v-else>{{ javadoc.name }}</span>
		</h2>
		<div class="description" v-html="javadoc.description"></div>

		<template v-if="args.length > 0">
			<h4>{{ $t('doc.parameters') }}</h4>
			<ul>
				<li v-for="(arg, i) in args" :key="i"><type v-if="arg.lstype" :type="arg.lstype" /> {{ arg.name }} <span v-if="arg.name && arg.text">:</span> <span v-if="arg.text" v-dochash v-code v-html="arg.text"></span></li>
			</ul>
		</template>

		<h4 v-if="return_">{{ $t('doc.return') }}</h4>
		<ul v-if="return_">
			<li><type v-if="return_.lstype" :type="return_.lstype" /> {{ return_.name }} <span v-if="return_.name">:</span> <span v-dochash v-code v-html="return_.text"></span>
			</li>
		</ul>

		<div v-for="(item, i) in other" :key="i">
			<b>{{ item.type }}</b> {{ item.name }} <span v-if="item.name">:</span> <span v-dochash v-code v-html="item.text"></span>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import Type from '../type.vue'
	import { KeywordKind } from '@/model/keyword'

	@Component({ name: "javadoc", components: { Type } })
	export default class Javadoc extends Vue {
		
		KeywordKind = KeywordKind

		@Prop() javadoc!: any
		@Prop() keyword!: any


		get args() {
			return this.javadoc.items.filter((i: any) => i.type === 'param')
		}
		get return_() {
			const ret = this.javadoc.items.filter((i: any) => i.type === 'return')
			if (ret.length) { return ret[0] }
			return null
		}
		get other() {
			return this.javadoc.items.filter((i: any) => i.type !== 'param' && i.type !== 'return')
		}
	}
</script>

<style lang="scss" scoped>
	.description {
		white-space: pre-wrap;
		color: var(--text-color-secondary);
	}
	h2 {
		margin-bottom: 12px;
		font-size: 17px;
		font-family: monospace;
	}
	h4 {
		font-weight: 500;
		margin: 0;
		margin-top: 10px;
		margin-bottom: 8px;
		font-size: 15px;
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
	.arrow {
		font-size: 30px;
		line-height: 17px;
		vertical-align: top;
	}
</style>