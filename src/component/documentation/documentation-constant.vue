<template lang="html">
	<div v-if="constant">
		<h2>{{ constant.name }}</h2>
		<div v-if="constant.deprecated" class="deprecated-message">Cette constante est dépréciée.</div>
		<chip-preview v-if="constant.name.startsWith('CHIP_')" :chip="LeekWars.chips[constant.value]" />
		<weapon-preview v-else-if="constant.name.startsWith('WEAPON_')" :weapon="LeekWars.weapons[constant.value]" />
		<div v-else v-dochash class="content" v-html="$t('documentation.const_' + constant.name)"></div>
		<h4>{{ $t('documentation.value') }}</h4>
		<ul>
			<li>{{ constant.name }} = {{ constant.value }}</li>
		</ul>
	</div>
</template>

<script lang="ts">
	import ChipPreview from '@/component/market/chip-preview.vue'
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { Constant } from '@/model/constant'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'documentation-constant', components: { WeaponPreview, ChipPreview }})
	export default class DocumentationConstant extends Vue {
		@Prop() constant!: Constant
	}
</script>