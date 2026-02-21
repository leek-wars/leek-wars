<template lang="html">
	<div class="leek-preview">
		<leek-image :leek="{level: 30, hat: hat.id}" :scale="0.55" />
		<leek-image :leek="{level: 90, hat: hat.id}" :scale="0.65" />
		<leek-image :leek="{level: 250, hat: hat.id}" :scale="0.7" />
	</div>
</template>

<script lang="ts">
	import { HatTemplate } from '@/model/hat'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	@Options({})
	export default class HatPreview extends Vue {
		@Prop() hat!: HatTemplate
	}
</script>

<style scoped lang="scss">
.leek-preview {
	background: var(--pure-white);
}
</style>