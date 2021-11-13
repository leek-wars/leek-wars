<template lang="html">
	<div class="stats">
		<div v-if="pomp.template === 1">
			<leek-image :leek="{level: 30, weapon: 37}" :scale="0.53" />
			<leek-image :leek="{level: 90, weapon: 109}" :scale="0.63" />
			<leek-image :leek="{level: 250, weapon: 47}" :scale="0.67" />
		</div>
	</div>
</template>

<script lang="ts">
	import { PompTemplate } from '@/model/pomp'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class PompPreview extends Vue {
		@Prop() pomp!: PompTemplate
	}
</script>