<template lang="html">
	<div></div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class ResourcePreview extends Vue {
		@Prop() resource!: any
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>