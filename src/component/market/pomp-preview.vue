<template lang="html">
	<div class="stats">
		<div v-if="pomp.template === 1">
			<leek-image :leek="{level: 30, weapon: 37}" :scale="0.53" />
			<leek-image :leek="{level: 90, weapon: 109}" :scale="0.63" />
			<leek-image :leek="{level: 250, weapon: 47}" :scale="0.65" />
		</div>
		<div v-else-if="pomp.template === 5">
			<leek-image :leek="{level: 90, face: 1}" :scale="0.6" />
			<leek-image :leek="{level: 150, face: 1}" :scale="0.7" />
			<leek-image :leek="{level: 300, face: 1}" :scale="0.8" />
		</div>
		<div v-else-if="pomp.template === 6">
			<leek-image :leek="{level: 90, face: 2}" :scale="0.6" />
			<leek-image :leek="{level: 150, face: 2}" :scale="0.7" />
			<leek-image :leek="{level: 300, face: 2}" :scale="0.8" />
		</div>
		<div v-else-if="pomp.template === 7">
			<leek-image :leek="{level: 90, metal: true}" :scale="0.6" />
			<leek-image :leek="{level: 150, metal: true}" :scale="0.7" />
			<leek-image :leek="{level: 300, metal: true}" :scale="0.8" />
		</div>
	</div>
</template>

<script lang="ts">
	import { PompTemplate } from '@/model/pomp'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ name: 'pomp-preview' })
	export default class PompPreview extends Vue {
		@Prop() pomp!: PompTemplate
	}
</script>
