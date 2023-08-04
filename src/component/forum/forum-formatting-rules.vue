<template lang="html">
	<div class="formating">
		<h4>Formatage</h4>
		<span class="rule">{{ $t('source_code') }} ➤ </span> <span class="example"><b>```</b>{{ $t('source_code_ex') }}<b>```</b></span> <br>
		<span class="rule">{{ $t('image') }} ➤ </span> <span class="example"><b><img src=\'</b>{{ $t('image_ex') }}<b>\'</b></span> <br>
		<span class="rule">{{ $t('big_title') }} ➤ </span> <span class="example"><b>#</b> {{ $t('big_title_ex') }}</span> <br>
		<span class="rule">{{ $t('sub_title') }} ➤ </span> <span class="example"><b>##</b> {{ $t('sub_title_ex') }}</span> <br>
		<span class="rule">{{ $t('sub_sub_title') }} ➤ </span> <span class="example"><b>###</b> {{ $t('sub_sub_title_ex') }}</span> <br>
		<span class="rule">{{ $t('bold') }} ➤ </span> <span class="example"><b>**</b>{{ $t('bold_ex') }}<b>**</b></span> <br>
		<span class="rule">{{ $t('italic') }} ➤ </span> <span class="example"><b>*</b>{{ $t('italic_ex') }}<b>*</b></span> <br>
		<span class="rule">{{ $t('underlined') }} ➤ </span> <span class="example"><b>&lt;u&gt;</b>{{ $t('underlined_ex') }}<b>&lt;/u&gt;</b></span> <br>
		<span class="rule">{{ $t('striked') }} ➤ </span> <span class="example"><b>~~</b>{{ $t('striked_ex') }}<b>~~</b></span> <br>
		<span class="rule">{{ $t('basic_html') }} ➤</span> <span class="example">div, center, table, style</span> <br>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator'
	@Component({})
	export default class FormattingRules extends Vue {}
</script>

<style lang="scss" scoped>
	.formating {
		color: #333;
	}
	.formating h4 {
		margin-bottom: 4px;
	}
	.formating .rule {
		color: #888;
		font-weight: bold;
		margin-right: 6px;
	}
	.formating b {
		color: #5fad1b;
		font-size: 16px;
	}
	.example {
		font-family: monospace;
	}
</style>
