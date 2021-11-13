<template lang="html">
	<div class="stats"></div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class FightPackPreview extends Vue {
		@Prop() pack!: any
	}
</script>