<template lang="html">
	<div class="formating">
		<h4>Formatage</h4>
		<span class="rule">Code source ➤ </span> <b>[code]</b>mon code source<b>[/code]</b> <br>
		<span class="rule">Grand titre ➤ </span> <b>#</b> Titre, ou souligné par des <b>=</b> <br>
		<span class="rule">Sous-titre ➤ </span> <b>##</b> Sous-titre, ou souligné par des <b>-</b> <br>
		<span class="rule">Sous-sous-titre ➤ </span> <b>###</b> Sous-sous-titre <br>
		<span class="rule">Gras ➤ </span> <b>*</b>gras<b>*</b> <br>
		<span class="rule">Italique ➤ </span> <b>/</b>italique<b>/</b> <br>
		<span class="rule">Souligné ➤ </span> <b>_</b>souligné<b>_</b> <br>
		<span class="rule">Barré ➤ </span> <b>~</b>barré<b>~</b> <br>
		<span class="rule">lien ➤ </span> <b>&lt;</b>https://leekwars.com/<b>&gt;</b>
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
		color: #5FAD1B;
		font-size: 16px;
	}
</style>