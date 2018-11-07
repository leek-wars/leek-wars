<template lang="html">
	<div v-if="constant">
		<h2 class="searchable">{{ constant.name }}</h2>
		<div v-if="constant.deprecated" class="deprecated-message">Cette constante est dépréciée.</div>
		<div class="content searchable" v-html="$t('documentation.const_' + constant.name)"></div>
		<h4>{{ $t('documentation.value') }}</h4>
		<ul>
			<li>{{ constant.name }} = {{ constant.value }}</li>
		</ul>
	</div>
</template>

<script lang="ts">
	import { Constant } from '@/model/constant'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'documentation-constant' })
	export default class DocumentationConstant extends Vue {
		@Prop() constant!: Constant
	}
</script>