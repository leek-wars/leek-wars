<template lang="html">
	<div></div>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ name: 'resource-preview' })
	export default class ResourcePreview extends Vue {
		@Prop() resource!: any
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>